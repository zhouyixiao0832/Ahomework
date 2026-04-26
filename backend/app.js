require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const adminRoutes = require('./routes/admin');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 静态文件服务（支持图片上传后的访问，如果使用了 multer 本地存储）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/admin', adminRoutes);

// 数据库同步（生产环境下请谨慎使用 alter: true，首次部署可接受）
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
}).catch(err => {
  console.error('Database sync error:', err);
});

// 导出 app 供 Vercel Serverless 使用
module.exports = app;

// 如果直接运行 node app.js 则监听端口
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}