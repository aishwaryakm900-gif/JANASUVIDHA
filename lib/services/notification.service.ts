import { NotificationItem, PrivateAvailabilityRequest } from "@/types";
import { DBService } from "./db.service";

export class NotificationService {
  /**
   * Dispatches SMS notification when an unavailable resource becomes available
   */
  static async sendResourceAvailabilityAlert(params: {
    request: PrivateAvailabilityRequest;
    resourceName: string;
    hospitalName?: string;
    departmentName?: string;
  }): Promise<NotificationItem> {
    const { request, resourceName } = params;
    const phone = request.verifiedPhoneNumber;
    const hosp = params.hospitalName || request.hospitalName || "Victoria District Hospital";
    const dept = params.departmentName || request.departmentName || "Hospital Pharmacy";

    const message = `JANASUVIDHA UPDATE: The resource "${resourceName}" requested by you is now AVAILABLE at ${hosp} (${dept}). Please present Reference ID: ${request.requestNumber} at the counter.`;

    return this.dispatchSMS(phone, message, request.id);
  }

  /**
   * Dispatches SMS notification when an unavailable medicine is marked as available by hospital admin
   */
  static async sendMedicineAvailabilityAlert(params: {
    phone: string;
    medicineName: string;
    complaintId: string;
    hospitalName?: string;
  }): Promise<NotificationItem> {
    const { phone, medicineName, complaintId } = params;
    const hosp = params.hospitalName || "Victoria District Hospital";

    const message = `JANASUVIDHA UPDATE: The prescribed medicine "${medicineName}" is now AVAILABLE at ${hosp} Pharmacy. Reference Complaint ID: ${complaintId}. Please collect your medicine from Pharmacy Counter #2.`;

    return this.dispatchSMS(phone, message, complaintId);
  }

  /**
   * Sends acknowledgement SMS when a citizen registers a medicine availability request
   */
  static async sendMedicineRegistrationAck(params: {
    phone: string;
    medicineName: string;
    complaintId: string;
    hospitalName?: string;
  }): Promise<NotificationItem> {
    const { phone, medicineName, complaintId } = params;
    const hosp = params.hospitalName || "Victoria District Hospital";

    const message = `JANASUVIDHA: Your request for unavailable medicine "${medicineName}" has been registered at ${hosp} Pharmacy. Complaint ID: ${complaintId}. We will notify you via SMS when fresh stock arrives.`;

    return this.dispatchSMS(phone, message, complaintId);
  }

  private static async dispatchSMS(
    phone: string,
    message: string,
    referenceId: string
  ): Promise<NotificationItem> {
    const provider = (process.env.OTP_PROVIDER || "mock").toLowerCase();
    const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN?.trim();
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER?.trim();

    const isLiveTwilio = provider === "twilio" && !!twilioSid && !!twilioAuth && !!twilioFrom;

    let deliveryStatus: "SIMULATED" | "DELIVERED" | "SENT" | "FAILED" = "SIMULATED";

    if (isLiveTwilio) {
      try {
        const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

        const form = new URLSearchParams();
        form.append("To", phone.startsWith("+") ? phone : `+91${phone}`);
        form.append("From", twilioFrom);
        form.append("Body", message);

        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form.toString(),
        });

        if (res.ok) {
          deliveryStatus = "DELIVERED";
        } else {
          const err = await res.text();
          console.warn("[Twilio Notification Error]", err);
          deliveryStatus = "FAILED";
        }
      } catch (err) {
        console.error("[Twilio Notification Exception]", err);
        deliveryStatus = "FAILED";
      }
    }

    const notificationItem: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      availabilityRequestId: referenceId,
      recipient: phone,
      message,
      provider: isLiveTwilio ? "twilio" : "mock",
      deliveryStatus,
      sentAt: new Date().toISOString(),
    };

    // Save notification event to persistent database
    try {
      await DBService.saveNotification(notificationItem);
    } catch (saveErr) {
      console.warn("[NotificationService] saveNotification warning:", saveErr);
    }

    return notificationItem;
  }
}
