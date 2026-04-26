import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import api from '../api';

const { Title, Text } = Typography;

export default function Login() {
  const [adminStep, setAdminStep] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username: values.username, password: values.password });
      if (res.data.requireAdminPass) {
        setAdminStep(true);
        setUserId(res.data.userId);
      } else {
        login(res.data.token, 'student', values.username);
        navigate('/');
      }
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminVerify = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/admin-verify', { userId, adminPassword: values.adminPassword });
      login(res.data.token, 'admin', '管理员');
      navigate('/admin');
    } catch (err) {
      message.error(err.response?.data?.error || '管理密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>📚 作业辅助平台</Title>
        
        {!adminStep ? (
          <Form onFinish={handleLogin} size="large">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
            </Form.Item>
            <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
              测试账号：student1 / student123
            </Text>
          </Form>
        ) : (
          <Form onFinish={handleAdminVerify} size="large">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <SafetyOutlined style={{ fontSize: 32, color: '#1890ff' }} />
            </div>
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
              管理员二次验证
            </Text>
            <Form.Item name="adminPassword" rules={[{ required: true, message: '请输入管理安全密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="管理安全密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>验证</Button>
            </Form.Item>
            <Button type="link" onClick={() => setAdminStep(false)} block>返回普通登录</Button>
          </Form>
        )}
      </Card>
    </div>
  );
}