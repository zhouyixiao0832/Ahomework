import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, Typography, Space, Alert, Tag, message } from 'antd';
import { BulbOutlined, AlertOutlined, LockOutlined, ArrowLeftOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const { Title, Paragraph, Text } = Typography;

export default function QuestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [question, setQuestion] = useState(null);
  const [emergencyModal, setEmergencyModal] = useState(false);
  const [challengeId, setChallengeId] = useState(null);
  const [plainCode, setPlainCode] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    api.get(`/questions/${id}`).then(res => setQuestion(res.data));
  }, [id]);

  useEffect(() => {
    if (expiresIn <= 0 || answer) return;
    const timer = setTimeout(() => setExpiresIn(expiresIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [expiresIn, answer]);

  const startEmergency = async () => {
    try {
      const res = await api.post(`/questions/${id}/challenge`);
      setChallengeId(res.data.challengeId);
      setPlainCode(res.data.plainCode);
      setExpiresIn(res.data.expiresIn);
      setEmergencyModal(true);
      setError('');
      setUserInput('');
      setAnswer(null);
    } catch (err) {
      message.error('无法生成挑战');
    }
  };

  const handleVerify = async () => {
    if (!userInput) return;
    setVerifyLoading(true);
    try {
      const res = await api.post(`/questions/${id}/challenge/verify`, { challengeId, userInput });
      setAnswer(res.data.answer);
      setEmergencyModal(false);
      message.success('验证成功，答案已解锁');
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || '验证失败');
      if (data?.attemptsLeft !== undefined) {
        setAttemptsLeft(data.attemptsLeft);
        if (data.attemptsLeft <= 0) {
          setEmergencyModal(false);
          message.error('尝试次数用完，挑战已关闭');
        }
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const preventPaste = (e) => {
    e.preventDefault();
    message.warning('此输入框不支持粘贴，请手动输入显示的密码');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!question) return <div style={{ textAlign: 'center', marginTop: 100 }}>加载中...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回列表</Button>
        <Button icon={<LogoutOutlined />} onClick={handleLogout} danger>退出登录</Button>
      </div>
      
      <Card>
        <Tag color="blue">{question.subject}</Tag>
        <Title level={3}>{question.title}</Title>
        <Paragraph style={{ fontSize: 16 }}>{question.content}</Paragraph>
      </Card>

      <Card title={<><BulbOutlined /> 分步提示</>} style={{ marginTop: 16, background: '#fffbe6' }}>
        {JSON.parse(question.hints || '[]').map((hint, i) => (
          <Paragraph key={i} style={{ margin: '4px 0' }}>👉 {hint}</Paragraph>
        ))}
      </Card>

      {answer && (
        <Alert
          message="完整答案（仅供理解，请勿直接抄袭）"
          description={<Text style={{ fontSize: 16 }}>{answer}</Text>}
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {!answer && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button
            type="primary"
            danger
            size="large"
            icon={<AlertOutlined />}
            onClick={startEmergency}
          >
            紧急？查看完整答案
          </Button>
        </div>
      )}

      <Modal
        title={<><LockOutlined /> 紧急验证</>}
        open={emergencyModal}
        onCancel={() => setEmergencyModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setEmergencyModal(false)}>取消</Button>,
          <Button key="verify" type="primary" loading={verifyLoading} onClick={handleVerify}>验证</Button>
        ]}
        destroyOnClose
      >
        <Alert message="请手动输入下方显示的密码以解锁答案（不支持粘贴）" type="info" showIcon style={{ marginBottom: 16 }} />
        
        <Card style={{ background: '#f5f5f5', marginBottom: 16 }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 16, userSelect: 'none', wordBreak: 'break-all' }}>
            {plainCode}
          </Text>
        </Card>

        {expiresIn > 0 && !answer && (
          <Text type="danger">剩余有效时间：{Math.floor(expiresIn / 60)}分{expiresIn % 60}秒</Text>
        )}

        <Input
          placeholder="手动输入密码（禁止粘贴）"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onPaste={preventPaste}
          onDrop={preventPaste}
          style={{ marginTop: 12, fontFamily: 'monospace' }}
          size="large"
          autoFocus
        />

        {error && <Text type="danger" style={{ display: 'block', marginTop: 8 }}>{error}</Text>}
        {attemptsLeft !== null && attemptsLeft > 0 && (
          <Text type="warning" style={{ display: 'block', marginTop: 8 }}>剩余尝试次数：{attemptsLeft}</Text>
        )}
      </Modal>
    </div>
  );
}