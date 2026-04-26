import { useEffect, useState, useRef } from 'react';
import { Table, Card, Typography, Empty, Button, Modal, Form, Input, Tabs, message, Popconfirm, Space } from 'antd';
import { HistoryOutlined, FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LogoutOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const { Title } = Typography;
const { TextArea } = Input;

export default function AdminPanel() {
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form] = Form.useForm();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // refs for textarea (to insert image at cursor)
  const hintsRef = useRef(null);
  const answerRef = useRef(null);

  const fetchLogs = () => {
    setLogsLoading(true);
    api.get('/admin/logs')
      .then(res => setLogs(res.data))
      .finally(() => setLogsLoading(false));
  };

  const fetchQuestions = () => {
    setQuestionsLoading(true);
    api.get('/admin/questions')
      .then(res => setQuestions(res.data))
      .finally(() => setQuestionsLoading(false));
  };

  useEffect(() => {
    fetchLogs();
    fetchQuestions();
  }, []);

  const openModal = (question = null) => {
    setEditingQuestion(question);
    if (question) {
      form.setFieldsValue({
        subject: question.subject,
        title: question.title,
        content: question.content,
        hints: question.hints,
        answer: question.answer
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      hints: values.hints || '[]',
    };
    try {
      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion.id}`, payload);
        message.success('题目已更新');
      } else {
        await api.post('/admin/questions', payload);
        message.success('题目已创建');
      }
      setModalOpen(false);
      fetchQuestions();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/questions/${id}`);
      message.success('题目已删除');
      fetchQuestions();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ===== 图片转 Base64 并插入文本 =====
  const handleImageUpload = (fieldName) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result; // data:image/...;base64,...
        const imgTag = `[img]${base64}[/img]`;

        // 尝试获取对应 TextArea 的内部 textarea
        const ref = fieldName === 'hints' ? hintsRef : answerRef;
        let textarea = null;
        if (ref.current) {
          // Ant Design 4.x TextArea 内部结构
          textarea = ref.current.resizableTextArea?.textArea || ref.current.input || ref.current;
        }

        const currentValue = form.getFieldValue(fieldName) || '';
        let newValue = currentValue;

        if (textarea) {
          const start = textarea.selectionStart || currentValue.length;
          const end = textarea.selectionEnd || currentValue.length;
          newValue = currentValue.substring(0, start) + imgTag + currentValue.substring(end);
          form.setFieldsValue({ [fieldName]: newValue });
          setTimeout(() => {
            textarea.focus();
            const pos = start + imgTag.length;
            textarea.setSelectionRange(pos, pos);
          }, 0);
        } else {
          // fallback: 追加到末尾
          newValue = currentValue + imgTag;
          form.setFieldsValue({ [fieldName]: newValue });
        }
        message.success('图片已插入');
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const logColumns = [
    { title: '时间', dataIndex: 'accessTime', key: 'time', render: (t) => new Date(t).toLocaleString() },
    { title: '学生', dataIndex: ['User', 'username'], key: 'student' },
    { title: '题目', dataIndex: ['Question', 'title'], key: 'question' },
  ];

  const questionColumns = [
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openModal(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'logs',
      label: <span><HistoryOutlined /> 紧急访问日志</span>,
      children: (
        <Card>
          {logs.length === 0 ? (
            <Empty description="暂无日志记录" />
          ) : (
            <Table dataSource={logs} columns={logColumns} rowKey="id" loading={logsLoading} pagination={{ pageSize: 10 }} />
          )}
        </Card>
      )
    },
    {
      key: 'questions',
      label: <span><FileTextOutlined /> 题目管理</span>,
      children: (
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span>共 {questions.length} 道题目</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal(null)}>添加新题目</Button>
          </div>
          <Table dataSource={questions} columns={questionColumns} rowKey="id" loading={questionsLoading} pagination={{ pageSize: 10 }} />
        </Card>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>管理面板</Title>
        <Button icon={<LogoutOutlined />} onClick={handleLogout} danger>退出登录</Button>
      </div>
      <Tabs defaultActiveKey="logs" items={tabItems} />

      <Modal
        title={editingQuestion ? '编辑题目' : '添加新题目'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="subject" label="科目">
            <Input placeholder="例如：数学" />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="例如：二次函数极值" />
          </Form.Item>
          <Form.Item name="content" label="题目内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={4} placeholder="题目详细描述" />
          </Form.Item>

          {/* 分步提示 + 图片按钮 */}
          <Form.Item
            name="hints"
            label="分步提示（JSON数组）"
            extra={'例如：[\'提示1\',\'提示2\']，支持插图'}
          >
            <TextArea
              ref={hintsRef}
              rows={3}
              placeholder='["提示1","提示2","提示3"]'
            />
          </Form.Item>
          <div style={{ marginTop: -16, marginBottom: 16 }}>
            <Button icon={<UploadOutlined />} onClick={() => handleImageUpload('hints')}>
              插入图片到提示
            </Button>
          </div>

          {/* 完整答案 + 图片按钮 */}
          <Form.Item name="answer" label="完整答案">
            <TextArea
              ref={answerRef}
              rows={3}
              placeholder="最终答案，可插入图片"
            />
          </Form.Item>
          <div style={{ marginTop: -16, marginBottom: 16 }}>
            <Button icon={<UploadOutlined />} onClick={() => handleImageUpload('answer')}>
              插入图片到答案
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}