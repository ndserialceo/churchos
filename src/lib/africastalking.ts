const AT_API_KEY = process.env.AFRICASTALKING_API_KEY || ""
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME || "sandbox"
const AT_BASE_URL = process.env.AFRICASTALKING_BASE_URL || "https://api.sandbox.africastalking.com"

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${AT_BASE_URL}/version1/messaging`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ApiKey": AT_API_KEY,
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to,
        message,
      }),
    })

    const data = await response.json()
    if (data.SMSMessageData?.Recipients?.[0]?.status === "Success") {
      return { success: true, messageId: data.SMSMessageData.Recipients[0].messageId }
    }
    return { success: false, error: data.SMSMessageData?.message || "SMS sending failed" }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function sendWhatsApp(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${AT_BASE_URL}/version1/messaging`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ApiKey": AT_API_KEY,
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to,
        message,
        channel: "whatsapp",
      }),
    })

    const data = await response.json()
    if (data.SMSMessageData?.Recipients?.[0]?.status === "Success") {
      return { success: true, messageId: data.SMSMessageData.Recipients[0].messageId }
    }
    return { success: false, error: data.SMSMessageData?.message || "WhatsApp sending failed" }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}