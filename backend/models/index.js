const { Sequelize, DataTypes } = require('sequelize');

// 从环境变量读取 Supabase 连接字符串
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('student', 'admin'), defaultValue: 'student' },
  adminPassHash: { type: DataTypes.STRING, allowNull: true } // 仅管理员有
});

const Question = sequelize.define('Question', {
  subject: DataTypes.STRING,
  title: DataTypes.STRING,
  content: DataTypes.TEXT,
  hints: DataTypes.TEXT,       // JSON string of step hints
  answer: DataTypes.TEXT       // 完整答案
});

const Challenge = sequelize.define('Challenge', {
  questionId: {
    type: DataTypes.INTEGER,
    references: { model: Question, key: 'id' }
  },
  codeHash: DataTypes.STRING,
  expiresAt: DataTypes.DATE,
  maxAttempts: { type: DataTypes.INTEGER, defaultValue: 5 },
  attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  isUsed: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const EmergencyLog = sequelize.define('EmergencyLog', {
  userId: DataTypes.INTEGER,
  questionId: DataTypes.INTEGER,
  accessTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// 模型关联（修复之前的 EagerLoadingError）
User.hasMany(EmergencyLog, { foreignKey: 'userId' });
EmergencyLog.belongsTo(User, { foreignKey: 'userId' });

Question.hasMany(EmergencyLog, { foreignKey: 'questionId' });
EmergencyLog.belongsTo(Question, { foreignKey: 'questionId' });

module.exports = { sequelize, User, Question, Challenge, EmergencyLog };
