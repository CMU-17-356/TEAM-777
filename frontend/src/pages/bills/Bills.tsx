import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Button,
  List,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Radio,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../App';
import GroupHeadBar from '../../components/GroupHeadBar';

const { Title, Text } = Typography;
const { Option } = Select;

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'request' | 'pay';
  date: string;
  initiatorUsername: string;
  recipientUsername: string;
}

interface GroupMember {
  id: string;
  email: string;
  username: string;
}

interface MemberBalance {
  [key: string]: number;
}

const BillsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, groupId } = location.state || {};
  const [memberBalances, setMemberBalances] = useState<MemberBalance>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [transactionType, setTransactionType] = useState<'request' | 'pay'>(
    'request',
  );

  const fetchData = useCallback(async () => {
    try {
      // Fetch transactions and member balances
      const response = await axios.get(
        `${API_BASE_URL}/api/transactions/${groupId}`,
        { params: { user_id: userId } },
      );

      if (response.data.success) {
        setMemberBalances(response.data.member_balances);
        setTransactions(response.data.recent_transactions);
      } else {
        message.error('Failed to fetch transactions');
      }

      // Fetch group members
      const membersResponse = await axios.get(
        `${API_BASE_URL}/api/users/${groupId}`,
      );

      if (membersResponse.data.success) {
        setGroupMembers(membersResponse.data.users);
      } else {
        message.error('Failed to fetch group members');
      }
    } catch (error) {
      message.error('Failed to fetch data');
    }
  }, [groupId, userId]);

  useEffect(() => {
    if (groupId) {
      fetchData();
    }
  }, [groupId, userId, fetchData]);

  const handleCreateTransaction = async (values: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/transactions`, {
        group_id: groupId,
        initiator_id: userId,
        recipient_id: values.recipient,
        amount: values.amount,
        description: values.description,
        transaction_type: transactionType,
      });

      if (response.data.success) {
        message.success('Transaction created successfully');
        setIsModalVisible(false);
        form.resetFields();
        fetchData();
      } else {
        message.error(response.data.message || 'Failed to create transaction');
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.detail || 'Failed to create transaction',
      );
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <GroupHeadBar />

      {/* Member Balances */}
      <Card
        title="Member Balances"
        style={{
          marginBottom: 24,
          borderRadius: 12,
          backgroundColor: '#faf6ff',
          border: '1px solid #e5dcff',
        }}
      >
        {Object.entries(memberBalances).map(([memberId, balance]) => {
          const member = groupMembers.find((m) => m.id === memberId);
          if (!member) return null;

          return (
            <div
              key={memberId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <Text style={{ fontSize: '0.97em' }}>{member.username}</Text>
              <Text
                strong
                style={{
                  color:
                    balance > 0
                      ? '#52c41a'
                      : balance < 0
                        ? '#f5222d'
                        : '#000000',
                  fontSize: '0.97em',
                }}
              >
                {balance > 0
                  ? `You owe $${balance.toFixed(2)}`
                  : balance < 0
                    ? `Owes you $${Math.abs(balance).toFixed(2)}`
                    : 'Settled up'}
              </Text>
            </div>
          );
        })}
      </Card>

      {/* Transaction History */}
      <Card
        title="Recent Transactions"
        style={{
          marginBottom: 24,
          borderRadius: 12,
          backgroundColor: '#faf6ff',
          border: '1px solid #e5dcff',
        }}
      >
        <List
          dataSource={transactions}
          renderItem={(transaction) => (
            <List.Item style={{ padding: '8px 0' }}>
              <div style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  <Text strong style={{ fontSize: '1em' }}>
                    {transaction.description}
                  </Text>
                  <Text
                    strong
                    style={{
                      color:
                        transaction.type === 'request' ? '#f5222d' : '#52c41a',
                      fontSize: '1em',
                    }}
                  >
                    ${transaction.amount.toFixed(2)}
                  </Text>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#666',
                    fontSize: '0.92em',
                  }}
                >
                  <Text style={{ flexBasis: '60%' }}>
                    {transaction.type === 'request'
                      ? `${transaction.initiatorUsername} requested from ${transaction.recipientUsername}`
                      : `${transaction.initiatorUsername} paid ${transaction.recipientUsername}`}
                  </Text>
                  <Text>{new Date(transaction.date).toLocaleDateString()}</Text>
                </div>
              </div>
            </List.Item>
          )}
          locale={{ emptyText: 'No transactions yet' }}
        />
      </Card>

      {/* Add Transaction Button */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          form.resetFields();
          setTransactionType('request');
          setIsModalVisible(true);
        }}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 24,
          fontSize: '1.1em',
          backgroundColor: '#7D6DC2',
          borderColor: '#7D6DC2',
        }}
      >
        Add Transaction
      </Button>

      {/* Create Transaction Modal */}
      <Modal
        title="Create New Transaction"
        open={isModalVisible}
        onCancel={() => {
          form.resetFields();
          setIsModalVisible(false);
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateTransaction} layout="vertical">
          <Form.Item
            name="type"
            label="Transaction Type"
            initialValue="request"
          >
            <Radio.Group
              onChange={(e) => setTransactionType(e.target.value)}
              value={transactionType}
            >
              <Radio value="request">Request Money</Radio>
              <Radio value="pay">Pay Money</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input placeholder="What was this expense for?" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[
              { required: true, message: 'Please enter an amount' },
              { type: 'number', min: 0.01, message: 'Amount must be positive' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0.00"
              step={0.01}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="recipient"
            label={transactionType === 'request' ? 'Request From' : 'Pay To'}
            rules={[{ required: true, message: 'Please select a member' }]}
          >
            <Select placeholder="Select member">
              {groupMembers
                .filter((member) => member.id !== userId)
                .map((member) => (
                  <Option key={member.id} value={member.id}>
                    {member.username}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                width: '100%',
                height: 40,
                borderRadius: 20,
                backgroundColor: '#7D6DC2',
                borderColor: '#7D6DC2',
              }}
            >
              Create Transaction
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BillsPage;
