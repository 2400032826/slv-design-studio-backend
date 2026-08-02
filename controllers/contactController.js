const ContactMessage = require('../models/ContactMessage');
const { sendContactFormEmail } = require('../utils/sendEmail');

// @desc Submit contact form
// @route POST /api/contact
exports.submitContact = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  const msg = await ContactMessage.create({
    name, email, phone, subject, message,
    ipAddress: req.ip,
  });

  try {
    await sendContactFormEmail({ name, email, phone, message });
  } catch (e) {
    console.error('Contact email error:', e.message);
  }

  res.status(201).json({ success: true, message: 'Message sent successfully! We will get back to you soon.' });
};

// @desc Admin: Get all contact messages
// @route GET /api/contact
exports.getMessages = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { status } : {};
  const total = await ContactMessage.countDocuments(query);
  const messages = await ContactMessage.find(query)
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  res.status(200).json({ success: true, total, messages });
};

// @desc Admin: Update message status
// @route PATCH /api/contact/:id
exports.updateMessageStatus = async (req, res) => {
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
  res.status(200).json({ success: true, message: msg });
};
