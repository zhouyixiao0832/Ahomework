const { Sequelize, DataTypes } = require('sequelize');

// 从环境变量 DATABASE_URL 读取 Supabase 连接字符串
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // 允许 Supabase 自签名证书
    }
  },
  logging: false // 生产环境关闭 SQL 日志，减少干扰
});

// 用户表
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('student', 'admin'),
    defaultValue: 'student'
  },
  adminPassHash: {
    type: DataTypes.STRING,
    allowNull: true // 仅管理员有二次验证密码哈希
  }
});

// 题目表
const Question = sequelize.define('Question', {
  subject: DataTypes.STRING,
  title: DataTypes.STRING,
  content: DataTypes.TEXT,
  hints: DataTypes.TEXT,   // JSON 字符串，存储分步提示数组
  answer: DataTypes.TEXT   // 完整答案（可包含 [img] 标签）
});

// 紧急挑战表
const Challenge = sequelize.define('Challenge', {
  questionId: {
    type: DataTypes.INTEGER,
    references: {
      model: Question,
      key: 'id'
    }
  },
  codeHash: DataTypes.STRING,       // 随机密码的 bcrypt 哈希
  expiresAt: DataTypes.DATE,        // 过期时间
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// 紧急访问日志表
const EmergencyLog = sequelize.define('EmergencyLog', {
  userId: DataTypes.INTEGER,
  questionId: DataTypes.INTEGER,
  accessTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 模型关联
User.hasMany(EmergencyLog, { foreignKey: 'userId' });
EmergencyLog.belongsTo(User, { foreignKey: 'userId' });

Question.hasMany(EmergencyLog, { foreignKey: 'questionId' });
EmergencyLog.belongsTo(Question, { foreignKey: 'questionId' });

module.exports = { sequelize, User, Question, Challenge, EmergencyLog };
