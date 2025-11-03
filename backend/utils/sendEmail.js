import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// ✅ Create transporter for Brevo (Sendinblue)
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.BREVO_API_KEY, 
  },
});

export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"QuizNova Support" <${process.env.EMAIL_USER}>`, 
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Sent successfully to: ${options.to}`);
    return info;
  } catch (error) {
    console.error("[MAIL] Brevo Error:", error.message);
    throw new Error("Email sending failed via Brevo");
  }
};
