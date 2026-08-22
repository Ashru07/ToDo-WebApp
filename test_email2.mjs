import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log("Using EMAIL_USER:", process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function run() {
  try {
    const info = await transporter.sendMail({
      from: `"Todo App Test" <${process.env.EMAIL_USER}>`,
      to: "ashrusarker001@gmail.com",
      subject: "Test Email from Todo App!",
      text: "Hello! If you are seeing this, the email system is working perfectly.",
    });
    console.log("Email successfully sent! Message ID:", info.messageId);
  } catch (e) {
    console.error("Failed to send email:", e);
  }
}

run();
