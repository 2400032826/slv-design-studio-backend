require('dotenv').config();
const nodemailer = require('nodemailer');

const mailUser = process.env.MAIL_USER ? process.env.MAIL_USER.trim() : '';
const mailPass = process.env.MAIL_PASS ? process.env.MAIL_PASS.replace(/\s+/g, '') : '';

if (!mailUser || !mailPass) {
  console.warn('⚠️ WARNING: MAIL_USER or MAIL_PASS environment variable is missing in backend/.env!');
}

// 1. Primary Transporter: Gmail SSL (Port 465)
const primaryTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: mailUser,
    pass: mailPass,
  },
  connectionTimeout: 10000, // 10s timeout
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false,
  },
});

// 2. Fallback Transporter: Gmail TLS (Port 587)
const fallbackTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: mailUser,
    pass: mailPass,
  },
  connectionTimeout: 10000, // 10s timeout
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify primary connection on startup
primaryTransporter.verify((error) => {
  if (error) {
    console.warn('⚠️ Primary Gmail SMTP (Port 465) verification warning:', error.message);
    console.warn('🔄 System will automatically retry via Fallback Transporter (Port 587) when sending email.');
  } else {
    console.log(`✅ Primary Gmail SMTP Transporter (Port 465) ready for ${mailUser}`);
  }
});

module.exports = {
  primaryTransporter,
  fallbackTransporter,
  mailUser,
};
