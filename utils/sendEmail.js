const https = require('https');
const { primaryTransporter, fallbackTransporter, mailUser } = require('../config/nodemailer');

const getOTPEmailTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2D1B69, #C9A84C); padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.8); margin: 5px 0 0; }
    .body { padding: 40px; }
    .otp-box { background: linear-gradient(135deg, #2D1B69, #E91E8C); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
    .otp { font-size: 40px; font-weight: bold; color: #fff; letter-spacing: 8px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ SLV Women's Fashion Studio</h1>
      <p>Customize Your Style with Premium Women's Embroidery & Tailoring</p>
    </div>
    <div class="body">
      <h2>Hello, ${name || 'Valued Customer'}! 👋</h2>
      <p>Your One-Time Password (OTP) for login is:</p>
      <div class="otp-box">
        <div class="otp">${otp}</div>
      </div>
      <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© 2024 SLV Women's Fashion Studio | +91 9731912413 | slvdesignstudio@gmail.com</p>
    </div>
  </div>
</body>
</html>`;

const sendBrevoHTTPApi = (to, subject, html) => {
  const rawKey = process.env.BREVO_API_KEY;
  if (!rawKey) {
    console.log('📌 BREVO_API_KEY Status: NOT loaded (environment variable is empty)');
    return Promise.reject(new Error('BREVO_API_KEY missing'));
  }

  const brevoApiKey = rawKey.trim().replace(/^["']|["']$/g, '');
  console.log(`📌 BREVO_API_KEY Status: Loaded (Length: ${brevoApiKey.length}, Prefix: ${brevoApiKey.substring(0, 10)}...)`);

  const senderEmail = mailUser || 'harikasina50@gmail.com';

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      sender: { name: "SLV Women's Fashion Studio", email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ success: true, raw: body });
          }
        } else {
          console.error(`❌ Brevo HTTP API Error Response (${res.statusCode}):`, body);
          reject(new Error(`Brevo HTTP API ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Brevo HTTP API Request Error:', err.message);
      reject(err);
    });

    req.write(data);
    req.end();
  });
};

const sendMailWithFallback = async (mailOptions) => {
  const fromAddress = process.env.MAIL_FROM || (mailUser ? `SLV Women's Fashion Studio <${mailUser}>` : "SLV Women's Fashion Studio <slvdesignstudio@gmail.com>");
  const options = { ...mailOptions, from: mailOptions.from || fromAddress };

  // 1. Try Brevo HTTPS REST API (Port 443)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await sendBrevoHTTPApi(options.to, options.subject, options.html);
      console.log(`✅ Email delivered successfully via Brevo HTTPS API to ${options.to}`);
      return res;
    } catch (apiErr) {
      console.warn(`⚠️ Brevo HTTPS API failed: ${apiErr.message}`);
    }
  }

  // 2. Try Primary Gmail SMTP (Port 465)
  try {
    const info = await primaryTransporter.sendMail(options);
    console.log(`✅ Email delivered successfully via Primary Gmail SMTP (Port 465) to ${options.to}: ${info.messageId}`);
    return info;
  } catch (primaryErr) {
    console.warn(`⚠️ Primary Gmail SMTP (Port 465) failed: ${primaryErr.message}`);
    console.log(`🔄 Retrying email delivery via Fallback Gmail SMTP (Port 587)...`);

    // 3. Try Fallback Gmail SMTP (Port 587)
    try {
      const fallbackInfo = await fallbackTransporter.sendMail(options);
      console.log(`✅ Email delivered successfully via Fallback Gmail SMTP (Port 587) to ${options.to}: ${fallbackInfo.messageId}`);
      return fallbackInfo;
    } catch (fallbackErr) {
      console.error(`❌ Fallback Gmail SMTP (Port 587) failed: ${fallbackErr.message}`);
      throw fallbackErr;
    }
  }
};

exports.sendOTPEmail = async ({ email, name, otp }) => {
  console.log(`\n🔑 [GENERATED OTP CODE] Target Email: ${email} | OTP: ${otp}\n`);

  try {
    await sendMailWithFallback({
      to: email,
      subject: `${otp} - Your OTP for SLV Women's Fashion Studio`,
      html: getOTPEmailTemplate(name, otp),
    });
  } catch (error) {
    console.error(`❌ All email delivery attempts failed for OTP to ${email}. Error: ${error.message}`);
  }
};

exports.sendOrderConfirmationEmail = async ({ order, user }) => {
  try {
    await sendMailWithFallback({
      to: user.email,
      subject: `Order Confirmed! #${order.orderNumber} - SLV Women's Fashion Studio`,
      html: `<p>Dear ${user.name}, your order #${order.orderNumber} is confirmed!</p>`,
    });
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error.message);
  }
};

exports.sendOrderStatusEmail = async ({ order, user, newStatus }) => {
  try {
    await sendMailWithFallback({
      to: user.email,
      subject: `Order Update: ${newStatus} - #${order.orderNumber}`,
      html: `<p>Dear ${user.name}, your order status is now ${newStatus}.</p>`,
    });
  } catch (error) {
    console.error('❌ Failed to send order status email:', error.message);
  }
};

exports.sendPasswordResetEmail = async ({ email, name, resetURL }) => {
  try {
    await sendMailWithFallback({
      to: email,
      subject: "Password Reset - SLV Women's Fashion Studio",
      html: `<p>Hi ${name}, reset link: ${resetURL}</p>`,
    });
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
  }
};

exports.sendContactFormEmail = async ({ name, email, phone, message }) => {
  try {
    await sendMailWithFallback({
      to: process.env.BUSINESS_EMAIL || mailUser || 'slvdesignstudio@gmail.com',
      subject: `New Contact Form Submission from ${name}`,
      html: `<p>Name: ${name}, Email: ${email}, Phone: ${phone}, Message: ${message}</p>`,
    });
  } catch (error) {
    console.error('❌ Failed to send contact form email:', error.message);
  }
};
