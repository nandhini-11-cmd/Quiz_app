// utils/sendEmail.js
import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,          
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  
  try {
    await transporter.verify();
    console.log("[MAIL] SMTP verified OK");
  } catch (e) {
    console.error("[MAIL] SMTP verify failed:", e?.message || e);
  }

  const mailOptions = {
    from: `"QuizNova Support" <${process.env.EMAIL_USER}>`, 
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
