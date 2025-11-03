// backend/utils/sendEmail.js
import axios from "axios";

export const sendEmail = async (options) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "QuizNova Support",
          email: process.env.EMAIL_USER, // Your registered Brevo email
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,  // ✅ MUST MATCH .env name
          "Content-Type": "application/json",
        },
      }
    );

    console.log("[MAIL] Brevo email sent:", response.data.messageId || "✅ Success");
  } catch (error) {
    console.error("[MAIL] Brevo API failed:", error.response?.data || error.message);
    throw new Error("Email sending failed via Brevo API");
  }
};
