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
      <h1>✨ SLV Design Studio</h1>
      <p>Customize Your Style with Premium Embroidery & Printing</p>
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
      <p>© 2024 SLV Design Studio | +91 9731912413 | slvdesignstudio@gmail.com</p>
    </div>
  </div>
</body>
</html>`;

const getOrderConfirmationTemplate = (order, user) => `
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; }
  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #2D1B69, #C9A84C); padding: 30px; text-align: center; color: #fff; }
  .body { padding: 30px; }
  .order-box { border: 2px solid #C9A84C; border-radius: 8px; padding: 20px; margin: 20px 0; }
  .status { background: #E91E8C; color: #fff; padding: 8px 16px; border-radius: 20px; display: inline-block; }
  .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ SLV Design Studio</h1>
      <h2>Order Confirmed! 🎉</h2>
    </div>
    <div class="body">
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>Your order has been placed successfully!</p>
      <div class="order-box">
        <p><strong>Order ID:</strong> ${order.orderNumber}</p>
        <p><strong>Total:</strong> ₹${order.totalPrice}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod}</p>
        <p><strong>Status:</strong> <span class="status">${order.status}</span></p>
        <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery || '5-7 business days'}</p>
      </div>
      <p>We'll keep you updated at every step. Thank you for choosing SLV Design Studio!</p>
    </div>
    <div class="footer">
      <p>© 2024 SLV Design Studio | +91 9731912413 | slvdesignstudio@gmail.com</p>
    </div>
  </div>
</body>
</html>`;

const getOrderStatusTemplate = (order, user, newStatus) => `
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; }
  .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #2D1B69, #C9A84C); padding: 30px; text-align: center; color: #fff; }
  .body { padding: 30px; }
  .status-box { background: linear-gradient(135deg, #2D1B69, #E91E8C); border-radius: 12px; padding: 20px; text-align: center; color: #fff; margin: 20px 0; }
  .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ SLV Design Studio</h1>
      <h2>Order Update 📦</h2>
    </div>
    <div class="body">
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>Your order <strong>#${order.orderNumber}</strong> status has been updated:</p>
      <div class="status-box">
        <h2>${newStatus}</h2>
      </div>
      <p>Track your order in your customer dashboard.</p>
    </div>
    <div class="footer">
      <p>© 2024 SLV Design Studio | +91 9731912413 | slvdesignstudio@gmail.com</p>
    </div>
  </div>
</body>
</html>`;

const sendMailWithFallback = async (mailOptions) => {
  const fromAddress = process.env.MAIL_FROM || (mailUser ? `SLV Design Studio <${mailUser}>` : 'SLV Design Studio <slvdesignstudio@gmail.com>');
  const options = { ...mailOptions, from: mailOptions.from || fromAddress };

  // Try Primary Transporter (Port 465)
  try {
    const info = await primaryTransporter.sendMail(options);
    console.log(`✅ Email sent successfully via Primary SMTP (Port 465) to ${options.to}: ${info.messageId}`);
    return info;
  } catch (primaryErr) {
    console.warn(`⚠️ Primary SMTP (Port 465) failed for ${options.to}: ${primaryErr.message}`);
    console.log(`🔄 Retrying email delivery via Fallback SMTP (Port 587)...`);

    // Retry with Fallback Transporter (Port 587)
    try {
      const fallbackInfo = await fallbackTransporter.sendMail(options);
      console.log(`✅ Email sent successfully via Fallback SMTP (Port 587) to ${options.to}: ${fallbackInfo.messageId}`);
      return fallbackInfo;
    } catch (fallbackErr) {
      console.error(`❌ Fallback SMTP (Port 587) also failed: ${fallbackErr.message}`);
      throw fallbackErr;
    }
  }
};

exports.sendOTPEmail = async ({ email, name, otp }) => {
  // Always log OTP to server console for instant verification & debugging
  console.log(`\n🔑 [GENERATED OTP CODE] Target Email: ${email} | OTP: ${otp}\n`);

  try {
    await sendMailWithFallback({
      to: email,
      subject: `${otp} - Your OTP for SLV Design Studio`,
      html: getOTPEmailTemplate(name, otp),
    });
  } catch (error) {
    console.error(`❌ All SMTP attempts failed for OTP to ${email}. Error: ${error.message}`);
    // Do not throw error so OTP API response returns success and user can proceed using console/dev OTP
  }
};

exports.sendOrderConfirmationEmail = async ({ order, user }) => {
  try {
    await sendMailWithFallback({
      to: user.email,
      subject: `Order Confirmed! #${order.orderNumber} - SLV Design Studio`,
      html: getOrderConfirmationTemplate(order, user),
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
      html: getOrderStatusTemplate(order, user, newStatus),
    });
  } catch (error) {
    console.error('❌ Failed to send order status email:', error.message);
  }
};

exports.sendPasswordResetEmail = async ({ email, name, resetURL }) => {
  try {
    await sendMailWithFallback({
      to: email,
      subject: 'Password Reset - SLV Design Studio',
      html: `<p>Hi ${name}, <a href="${resetURL}">Click here to reset your password</a>. Valid for 10 minutes.</p>`,
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
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Message:</strong> ${message}</p>`,
    });
  } catch (error) {
    console.error('❌ Failed to send contact form email:', error.message);
  }
};
