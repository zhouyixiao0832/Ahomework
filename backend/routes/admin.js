const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { EmergencyLog, User, Question } = require('../models');

// 管理员权限验证中间件
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权限' });
  next();
}

// ========== 紧急访问日志 ==========

router.get('/logs', authenticateToken, adminOnly, async (req, res) => {
  const logs = await EmergencyLog.findAll({
    include: [
      { model: User, attributes: ['username'] },
      { model: Question, attributes: ['title'] }
    ],
    order: [['accessTime', 'DESC']]
  });
  res.json(logs);
});

// ========== 题目管理 ==========

// 获取所有题目（含完整信息，供管理端编辑）
router.get('/questions', authenticateToken, adminOnly, async (req, res) => {
  const questions = await Question.findAll({ order: [['createdAt', 'DESC']] });
  res.json(questions);
});

// 创建新题目
router.post('/questions', authenticateToken, adminOnly, async (req, res) => {
  const { subject, title, content, hints, answer } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: '题目和内容不能为空' });
  }
  const question = await Question.create({
    subject: subject || '未分类',
    title,
    content,
    hints: hints || '[]',
    answer: answer || ''
  });
  res.status(201).json(question);
});

// 更新题目
router.put('/questions/:id', authenticateToken, adminOnly, async (req, res) => {
  const question = await Question.findByPk(req.params.id);
  if (!question) return res.status(404).json({ error: '题目不存在' });
  const { subject, title, content, hints, answer } = req.body;
  await question.update({
    subject: subject ?? question.subject,
    title: title ?? question.title,
    content: content ?? question.content,
    hints: hints ?? question.hints,
    answer: answer ?? question.answer
  });
  res.json(question);
});

// 删除题目
router.delete('/questions/:id', authenticateToken, adminOnly, async (req, res) => {
  const question = await Question.findByPk(req.params.id);
  if (!question) return res.status(404).json({ error: '题目不存在' });
  await question.destroy();
  res.json({ message: '题目已删除' });
});

module.exports = router;