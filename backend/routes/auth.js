const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(401).json({ error: '账号或密码错误' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: '账号或密码错误' });

  // 如果是管理员，返回需要二次验证标志
  if (user.role === 'admin' && user.adminPassHash) {
    return res.json({ requireAdminPass: true, userId: user.id });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token, role: user.role, username: user.username });
});

router.post('/admin-verify', async (req, res) => {
  const { userId, adminPassword } = req.body;
  const user = await User.findByPk(userId);
  if (!user || user.role !== 'admin' || !user.adminPassHash) {
    return res.status(403).json({ error: '非法请求' });
  }
  const valid = await bcrypt.compare(adminPassword, user.adminPassHash);
  if (!valid) return res.status(403).json({ error: '管理密码错误' });

  const token = jwt.sign({ id: user.id, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

module.exports = router;