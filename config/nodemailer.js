require('dotenv').config();
const nodemailer = require('nodemailer');

const mailUser = process.env.MAIL_USER ? process.env.MAIL_USER.trim() : '';
const mailPass = process.env.MAIL_PASS ? process.env.MAIL_PASS.replace(/\s+/g, '') : '';

if (!mailUser || !mailPass) {
  console.error('❌ FATAL: MAIL_USER or MAIL_PASS environment variable is missing in backend/.env!');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: mailUser,
    pass: mailPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify SMTP connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email Transporter Verification Failed:', error.message);
    console.error('💡 Ensure Gmail 2-Step Verification is active and MAIL_PASS is a valid 16-character App Password.');
  } else {
    console.log(`✅ Email Transporter Ready: Gmail SMTP authenticated for ${mailUser}`);
  }
});

module.exports = transporter;
