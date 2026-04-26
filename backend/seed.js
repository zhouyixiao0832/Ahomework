const bcrypt = require('bcrypt');
const { sequelize, User, Question } = require('./models');

async function seed() {
  await sequelize.sync({ force: true });

  const adminPassHash = await bcrypt.hash('admin-secret', 12); // 二次验证密码
  await User.create({
    username: 'teacher',
    password: await bcrypt.hash('teacher123', 12),
    role: 'admin',
    adminPassHash
  });

  await User.create({
    username: 'student1',
    password: await bcrypt.hash('student123', 12),
    role: 'student'
  });

  await Question.create({
    subject: '数学',
    title: '二次函数极值',
    content: '求函数 f(x) = x² - 4x + 5 的极小值。',
    hints: JSON.stringify([
      '提示1：二次函数开口向上。',
      '提示2：对称轴公式 x = -b/(2a)。',
      '提示3：将x代入原函数求y值。'
    ]),
    answer: '极小值为 1，当 x=2 时取得。'
  });

  console.log('数据库初始化完成');
  process.exit();
}

seed();