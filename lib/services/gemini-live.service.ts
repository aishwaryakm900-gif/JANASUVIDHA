"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface LiveVoiceOptions {
  apiKey: string;
  systemInstruction?: string;
  onAudioChunk?: (pcmBase64: string) => void;
  onTurnComplete?: () => void;
  onError?: (err: any) => void;
  onConnected?: () => void;
  onInputTranscript?: (text: string) => void;
}

export function useGemini38LiveVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingAudioRef = useRef(false);
  const setupReadyRef = useRef(false);
  const pendingTurnCompleteRef = useRef(false);
  const optionsRef = useRef<LiveVoiceOptions | null>(null);

  // Stop active audio playback immediately (barge-in / interruption)
  const stopPlayback = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch {}
      currentSourceRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
    pendingTurnCompleteRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Convert Float32Array to 16-bit PCM Linear Base64
  const floatTo16BitPCM = (input: Float32Array): string => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Play audio chunks streamed back by Gemini 3.8 Live (24kHz 1-channel PCM)
  const playPcmChunk = useCallback((base64Pcm: string, sampleRate = 24000) => {
    try {
      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      audioQueueRef.current.push(float32);
      if (!isPlayingAudioRef.current) {
        drainQueue(sampleRate);
      }
    } catch (e) {
      console.warn("[Gemini 3.8 Live Audio Decode Error]", e);
    }
  }, []);

  const drainQueue = (sampleRate: number) => {
    if (audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false;
      setIsSpeaking(false);
      if (pendingTurnCompleteRef.current) {
        pendingTurnCompleteRef.current = false;
        // Let the kiosk enable the microphone only after the greeting has finished playing.
        optionsRef.current?.onTurnComplete?.();
      }
      return;
    }

    isPlayingAudioRef.current = true;
    setIsSpeaking(true);
    const chunk = audioQueueRef.current.shift()!;
    const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const audioBuffer = ctx.createBuffer(1, chunk.length, sampleRate);
    audioBuffer.getChannelData(0).set(chunk);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    currentSourceRef.current = source;
    source.onended = () => {
      if (currentSourceRef.current === source) {
        currentSourceRef.current = null;
      }
      drainQueue(sampleRate);
    };
    source.start();
  };

  const connect = useCallback(async (options: LiveVoiceOptions) => {
    const apiKey = options.apiKey?.trim();
    if (!apiKey) {
      setError("No API key provided");
      return false;
    }

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(apiKey)}`;
    let resolveSetup!: () => void;
    let rejectSetup!: (error: Error) => void;
    const setupPromise = new Promise<void>((resolve, reject) => {
      resolveSetup = resolve;
      rejectSetup = reject;
    });
    // Attach a handler immediately; the promise is awaited after the audio graph is prepared.
    void setupPromise.catch(() => undefined);
    let ws: WebSocket | null = null;
    optionsRef.current = options;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioCtx;
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const socket = new WebSocket(wsUrl);
      ws = socket;
      wsRef.current = socket;

      socket.onopen = () => {
        console.log("[Gemini 3.8 Live] WebSocket Connected");
        setupReadyRef.current = false;

        // 1. Send the exact setup payload required by Gemini 3.8 Live
        const setupMessage = {
          setup: {
            model: "models/gemini-3.8-live",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Aoede" },
                },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text:
                    options.systemInstruction ||
                    "You are JanaSuvidha (ಜನಸುವಿಧಾ), an empathetic, warm, natural-sounding multilingual hospital assistant in an Indian government hospital. You speak and understand Kannada, Hindi, English, Tamil, Telugu natively. Greet the citizen and ask what complaint they want to register.",
                },
              ],
            },
            inputAudioTranscription: {},
          },
        };
        socket.send(JSON.stringify(setupMessage));
      };

      socket.onmessage = async (event) => {
        try {
          const rawText = event.data instanceof Blob ? await event.data.text() : event.data.toString();
          const response = JSON.parse(rawText);

          if (response.setupComplete && !setupReadyRef.current) {
            setupReadyRef.current = true;
            setIsConnected(true);
            setError(null);
            options.onConnected?.();
            resolveSetup();
          }

          // Handle server-side barge-in interruption (user spoke while model was responding)
          if (response.serverContent?.interrupted) {
            console.log("[Gemini 3.8 Live] User interrupted agent playback (barge-in detected)");
            stopPlayback();
          }

          if (response.error) {
            const message = response.error.message || "Gemini Live rejected the session setup.";
            setError(message);
            rejectSetup(new Error(message));
            options.onError?.(new Error(message));
            socket.close();
          }
          const inputTranscript = response.serverContent?.inputTranscription?.text;
          if (inputTranscript) options.onInputTranscript?.(inputTranscript);

          // Handle incoming audio stream from Gemini 3.8 Live
          if (response.serverContent?.modelTurn?.parts) {
            for (const part of response.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) {
                const sampleRate = part.inlineData.mimeType?.includes("rate=24000") ? 24000 : 24000;
                playPcmChunk(part.inlineData.data, sampleRate);
                if (options.onAudioChunk) {
                  options.onAudioChunk(part.inlineData.data);
                }
              }
            }
          }

          if (response.serverContent?.turnComplete && options.onTurnComplete) {
            if (isPlayingAudioRef.current || audioQueueRef.current.length > 0) {
              pendingTurnCompleteRef.current = true;
            } else {
              options.onTurnComplete();
            }
          }
        } catch (msgErr) {
          console.warn("[Gemini 3.8 Live Parse Error]", msgErr);
        }
      };

      socket.onerror = (err) => {
        console.error("[Gemini 3.8 Live Error]", err);
        setError("WebSocket error");
        rejectSetup(new Error("Gemini Live WebSocket connection failed."));
        if (options.onError) options.onError(err);
      };

      socket.onclose = (closeEvent) => {
        // Include the close code/reason; browsers otherwise hide useful setup errors.
        const closeDetails = closeEvent
          ? `code=${closeEvent.code}${closeEvent.reason ? ` reason=${closeEvent.reason}` : ""}`
          : "";
        console.warn(`[Gemini 3.8 Live] WebSocket Closed${closeDetails ? ` (${closeDetails})` : ""}`);
        setupReadyRef.current = false;
        setIsConnected(false);
        setIsListening(false);
        if (wsRef.current === socket) {
          wsRef.current = null;
          const message = closeEvent?.reason || `Gemini Live disconnected (code ${closeEvent?.code ?? "unknown"}).`;
          setError(message);
          if (!setupReadyRef.current) rejectSetup(new Error(message));
          options.onError?.(new Error(message));
        }
      };

      let timeoutId: number | undefined;
      try {
        await Promise.race([
          setupPromise,
          new Promise<void>((_, reject) => {
            timeoutId = window.setTimeout(
              () => reject(new Error("Gemini Live setup timed out. Check the connection and try again.")),
              15000
            );
          }),
        ]);
      } finally {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      }

      return true;
    } catch (err: any) {
      console.error("[Gemini 3.8 Live connect error]", err);
      setError(err?.message || "Failed to connect to Gemini 3.8 Live");
      if (ws && wsRef.current === ws) {
        wsRef.current = null;
        ws.close();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setupReadyRef.current = false;
      setIsConnected(false);
      setIsListening(false);
      if (options.onError) options.onError(err);
      return false;
    }
  }, [playPcmChunk]);

  const startListening = useCallback(async () => {
    const socket = wsRef.current;
    if (!setupReadyRef.current || !socket || socket.readyState !== WebSocket.OPEN) return false;
    if (processorRef.current) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (wsRef.current !== socket || socket.readyState !== WebSocket.OPEN) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }
      mediaStreamRef.current = stream;

      const audioCtx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      processor.onaudioprocess = (event) => {
        if (socket.readyState !== WebSocket.OPEN || !setupReadyRef.current) return;
        const channelData = event.inputBuffer.getChannelData(0);

        // Compute RMS volume for Voice Activity Detection (VAD)
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);

        // If the AI is currently playing audio output:
        if (isPlayingAudioRef.current) {
          // If citizen speaks into the microphone (RMS > 0.032):
          // Interrupt agent immediately like a real person listening!
          if (rms > 0.032) {
            console.log("[Gemini 3.8 Live] Citizen spoke -> interrupting AI playback");
            stopPlayback();

            const data = floatTo16BitPCM(channelData);
            socket.send(JSON.stringify({
              realtimeInput: {
                audio: { mimeType: "audio/pcm;rate=16000", data },
              },
            }));
          }
          // If RMS <= 0.032, mute chunk so kiosk speaker output doesn't echo into Gemini and cause endless monologues
          return;
        }

        // Citizen is speaking normally while AI is listening
        const data = floatTo16BitPCM(channelData);
        socket.send(JSON.stringify({
          realtimeInput: {
            audio: { mimeType: "audio/pcm;rate=16000", data },
          },
        }));
      };

      source.connect(processor);
      const silentOutput = audioCtx.createGain();
      silentOutput.gain.value = 0;
      processor.connect(silentOutput);
      silentOutput.connect(audioCtx.destination);
      setIsListening(true);
      return true;
    } catch (error: any) {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      processorRef.current?.disconnect();
      processorRef.current = null;
      const message = error?.message || "Microphone permission is required to start listening.";
      setError(message);
      setIsListening(false);
      optionsRef.current?.onError?.(new Error(message));
      return false;
    }
  }, []);

  const sendInitialPrompt = (promptText: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          realtimeInput: {
            text: promptText,
          },
        })
      );
    }
  };

  const disconnect = useCallback(() => {
    try {
      stopPlayback();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      audioQueueRef.current = [];
      setupReadyRef.current = false;
      pendingTurnCompleteRef.current = false;
      isPlayingAudioRef.current = false;
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
    } catch (e) {
      console.warn("Cleanup error:", e);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    error,
    connect,
    sendInitialPrompt,
    startListening,
    stopPlayback,
    disconnect,
  };
}
