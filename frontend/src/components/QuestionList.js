import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, List, Tag, Typography, Spin, Button, Space } from 'antd';
import { BookOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const { Title, Paragraph } = Typography;

export default function QuestionList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/questions')
      .then(res => setQuestions(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>📝 题目列表</Title>
        <Button icon={<LogoutOutlined />} onClick={handleLogout} danger>退出登录</Button>
      </div>
      <List
        dataSource={questions}
        renderItem={q => (
          <List.Item style={{ padding: 0, marginBottom: 12 }}>
            <Link to={`/question/${q.id}`} style={{ width: '100%', textDecoration: 'none' }}>
              <Card hoverable>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Tag color="blue" icon={<BookOutlined />}>{q.subject}</Tag>
                    <Title level={4} style={{ margin: '8px 0' }}>{q.title}</Title>
                    <Paragraph type="secondary" ellipsis={{ rows: 1 }}>{q.content}</Paragraph>
                  </div>
                </div>
              </Card>
            </Link>
          </List.Item>
        )}
      />
    </div>
  );
}