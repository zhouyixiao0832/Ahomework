const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');
const { Question, Challenge, EmergencyLog } = require('../models');

// 获取题目列表（辅助提示预览）
router.get('/', authenticateToken, async (req, res) => {
  const questions = await Question.findAll({
    attributes: ['id', 'subject', 'title', 'content', 'hints'] // 不返回answer
  });
  res.json(questions);
});

// 获取单个题目（辅助内容，不含答案）
router.get('/:id', authenticateToken, async (req, res) => {
  const question = await Question.findByPk(req.params.id, {
    attributes: ['id', 'subject', 'title', 'content', 'hints']
  });
  if (!question) return res.status(404).json({ error: '题目不存在' });
  res.json(question);
});

// 请求紧急挑战（生成随机密码）
router.post('/:id/challenge', authenticateToken, async (req, res) => {
  const questionId = req.params.id;
  const question = await Question.findByPk(questionId);
  if (!question) return res.status(404).json({ error: '题目不存在' });

  // 生成随机复杂密码（28位）
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let plainCode = '';
  for (let i = 0; i < 28; i++) {
    plainCode += chars[Math.floor(Math.random() * chars.length)];
  }

  const codeHash = await bcrypt.hash(plainCode, 12);
  const challenge = await Challenge.create({
    questionId,
    codeHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分钟
    maxAttempts: 5
  });

  res.json({
    challengeId: challenge.id,
    plainCode,
    expiresIn: 300
  });
});

// 验证挑战
router.post('/:id/challenge/verify', authenticateToken, async (req, res) => {
  const { challengeId, userInput } = req.body;
  const challenge = await Challenge.findByPk(challengeId);

  if (!challenge || challenge.isUsed || challenge.expiresAt < new Date()) {
    return res.status(410).json({ error: '挑战已过期或无效' });
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    return res.status(429).json({ error: '尝试次数已达上限，请重新生成挑战' });
  }

  const match = await bcrypt.compare(userInput, challenge.codeHash);
  if (!match) {
    challenge.attempts += 1;
    await challenge.save();
    return res.status(401).json({ error: '密码错误', attemptsLeft: challenge.maxAttempts - challenge.attempts });
  }

  // 成功
  challenge.isUsed = true;
  await challenge.save();

  // 记录日志
  await EmergencyLog.create({
    userId: req.user.id,
    questionId: challenge.questionId
  });

  const question = await Question.findByPk(challenge.questionId);
  res.json({ answer: question.answer });
});

module.exports = router;