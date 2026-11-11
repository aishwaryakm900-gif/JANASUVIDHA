require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Set GEMINI_API_KEY in your environment, .env.local, or .env before running this script.");
  process.exit(1);
}

const text = "ನನಗೆ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಇನ್ಸುಲಿನ್ ಇಂಜೆಕ್ಷನ್ ಸಿಗುತ್ತಿಲ್ಲ, ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ";

async function run() {
  const prompt = `Analyze this hospital complaint and return JSON with:
{
  "detectedLanguage": "Kannada",
  "languageCode": "kn",
  "category": "Pharmacy and Medicine Availability",
  "department": "Pharmacy and Medicine Availability",
  "requestType": "PRIVATE_AVAILABILITY",
  "requestedResource": "Insulin injection",
  "complaintSummary": "Insulin injection not available in hospital",
  "englishTranslation": "I am not getting insulin injection in the hospital, please help",
  "spokenConfirmation": "..."
}
Citizen input: "${text}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!response.ok) {
    console.error(`Gemini request failed with HTTP ${response.status}. Check GEMINI_API_KEY and model access.`);
    process.exitCode = 1;
    return;
  }

  const data = await response.json();
  console.log(data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini returned no response text.");
}

run().catch(() => {
  console.error("Gemini request failed. Check your environment variable and network connection.");
  process.exitCode = 1;
});
