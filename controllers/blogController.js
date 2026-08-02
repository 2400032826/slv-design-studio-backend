const Blog = require('../models/Blog');

exports.getBlogs = async (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  const query = { isPublished: true };
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const total = await Blog.countDocuments(query);
  const blogs = await Blog.find(query)
    .sort('-publishedAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .select('title slug excerpt coverImage author category tags publishedAt readTime views');

  res.status(200).json({ success: true, total, blogs });
};

exports.getBlog = async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
  if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
  blog.views += 1;
  await blog.save();
  res.status(200).json({ success: true, blog });
};

exports.createBlog = async (req, res) => {
  const blogData = { ...req.body };
  if (req.file) blogData.coverImage = req.file.path;
  if (blogData.isPublished) blogData.publishedAt = new Date();
  const blog = await Blog.create(blogData);
  res.status(201).json({ success: true, blog });
};

exports.updateBlog = async (req, res) => {
  const updateData = { ...req.body };
  if (req.file) updateData.coverImage = req.file.path;
  if (updateData.isPublished && !updateData.publishedAt) updateData.publishedAt = new Date();
  const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
  res.status(200).json({ success: true, blog });
};

exports.deleteBlog = async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
  res.status(200).json({ success: true, message: 'Blog deleted' });
};
