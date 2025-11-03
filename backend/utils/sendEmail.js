import axios from "axios";
import dotenv from "dotenv";
dotenv.config();


export const sendEmail = async (options) => {
  try {
    const payload = {
      sender: {
        name: "QuizNova Support",
        email: process.env.EMAIL_USER, // must be verified in Brevo
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    };

    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      payload,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log(`[MAIL] Brevo email sent to: ${options.to}`, res.data.messageId || "");
    return true;
  } catch (err) {
    console.error("[MAIL] Brevo API failed:", err.response?.data || err.message);
    throw new Error("Email sending failed via Brevo API");
  }
};
