import React, { useState, useEffect } from 'react';
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
  paidBy: string; // Email of the payer
  initiatorId: string; // ID of the payer
  date: string;
  splitBetween: string[];
}

const BillsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, groupId } = location.state || {};
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  const fetchTransactions = async () => {
    try {
      console.log('Fetching transactions for group:', groupId);
      const response = await axios.get(
        `${API_BASE_URL}/api/transactions/${groupId}`,
      );
      console.log('Transactions response:', response.data);

      if (Array.isArray(response.data)) {
        setTransactions(response.data);

        // Calculate balance
        const userTransactions = response.data.filter(
          (t: Transaction) =>
            t.initiatorId === userId || t.splitBetween.includes(userId),
        );

        const calculatedBalance = userTransactions.reduce(
          (acc: number, t: Transaction) => {
            const isGiver = t.initiatorId === userId;
            const isReceiver = t.splitBetween.includes(userId);
            const splitAmount = t.amount / t.splitBetween.length;

            if (isGiver) acc -= t.amount;
            if (isReceiver) acc += splitAmount;

            return acc;
          },
          0,
        );

        setBalance(calculatedBalance);
      } else {
        console.error('Invalid transactions data:', response.data);
        message.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Failed to fetch transactions');
    }
  };

  useEffect(() => {
    // Fetch group members
    const fetchGroupMembers = async () => {
      try {
        console.log('Fetching group members for group:', groupId);
        const response = await axios.get(
          `${API_BASE_URL}/api/users/${groupId}`,
        );
        console.log('Group members response:', response.data);

        if (response.data.success && response.data.users) {
          const members = response.data.users.map((user: any) => user.email);
          console.log('Setting group members:', members);
          setGroupMembers(members);
        } else {
          console.error('Failed to fetch group members:', response.data);
          message.error('Failed to fetch group members');
        }
      } catch (error) {
        console.error('Error fetching group members:', error);
        message.error('Failed to fetch group members');
      }
    };

    const fetchTransactions = async () => {
      try {
        console.log('Fetching transactions for group:', groupId);
        const response = await axios.get(
          `${API_BASE_URL}/api/transactions/${groupId}`,
        );
        console.log('Transactions response:', response.data);

        if (Array.isArray(response.data)) {
          setTransactions(response.data);
          const userTransactions = response.data.filter(
            (t: Transaction) =>
              t.initiatorId === userId || t.splitBetween.includes(userId),
          );

          const calculatedBalance = userTransactions.reduce(
            (acc: number, t: Transaction) => {
              const isGiver = t.initiatorId === userId;
              const isReceiver = t.splitBetween.includes(userId);
              const splitAmount = t.amount / t.splitBetween.length;

              if (isGiver) acc -= t.amount;
              if (isReceiver) acc += splitAmount;

              return acc;
            },
            0,
          );

          setBalance(calculatedBalance);
        } else {
          console.error('Invalid transactions data:', response.data);
          message.error('Failed to fetch transactions');
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        message.error('Failed to fetch transactions');
      }
    };

    if (groupId) {
      console.log('Initializing bills page with groupId:', groupId);
      fetchGroupMembers();
      fetchTransactions();
    } else {
      console.error('No groupId provided to bills page');
    }
  }, [groupId, userId]);

  const handleCreateTransaction = async (values: any) => {
    try {
      console.log('Creating transaction with values:', values);
      const payload = {
        _id: groupId,
        initiator: userId,
        splitters: [...values.splitBetween], // Include the initiator in the split
        amount: values.amount,
        description: values.description,
      };
      console.log('Sending payload:', payload);

      const response = await axios.post(
        `${API_BASE_URL}/auth/billSplit`,
        payload,
      );
      console.log('Transaction response:', response.data);

      if (response.data.success) {
        message.success('Transaction created successfully');
        setIsModalVisible(false);
        form.resetFields();

        // Update transactions if they were returned
        if (Array.isArray(response.data.transactions)) {
          console.log(
            'Updating transactions with:',
            response.data.transactions,
          );
          setTransactions(response.data.transactions);
        } else {
          console.log('No transactions in response, fetching fresh data');
          await fetchTransactions();
        }

        // Update balance if it was returned
        if (typeof response.data.balance === 'number') {
          console.log('Updating balance to:', response.data.balance);
          setBalance(response.data.balance);
        }
      } else {
        console.error('Failed to create transaction:', response.data.message);
        message.error(response.data.message || 'Failed to create transaction');
      }
    } catch (error: any) {
      console.error(
        'Error creating transaction:',
        error.response?.data || error,
      );
      message.error(
        error.response?.data?.message || 'Failed to create transaction',
      );
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#f9f8ff',
        minHeight: '100vh',
        padding: '24px 16px',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <GroupHeadBar />
      </div>

      {/* Balance Card - Commented out */}
      {/*
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          backgroundColor: '#faf6ff',
          border: '1px solid #e5dcff',
        }}
      >
        <Title level={4} style={{ marginBottom: 8 }}>
          Your Balance
        </Title>
        <Text
          style={{ fontSize: 24, color: balance >= 0 ? '#52c41a' : '#f5222d' }}
        >
          ${balance.toFixed(2)}
        </Text>
      </Card>
      */}

      {/* Transaction History */}
      <Card
        title="Transaction History"
        style={{
          marginBottom: 24,
          borderRadius: 12,
          backgroundColor: '#faf6ff',
          border: '1px solid #e5dcff',
        }}
      >
        <List
          dataSource={transactions.slice(0, 5)}
          renderItem={(transaction) => (
            <List.Item>
              <div style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <Text strong>{transaction.description}</Text>
                  <Text
                    style={{
                      color:
                        transaction.initiatorId === userId
                          ? '#52c41a'
                          : '#f5222d',
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
                  }}
                >
                  <Text>Paid by: {transaction.paidBy}</Text>
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
        onClick={() => setIsModalVisible(true)}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 12,
          backgroundColor: '#7D6DC2',
          border: 'none',
        }}
      >
        Add Transaction
      </Button>

      {/* Create Transaction Modal */}
      <Modal
        title="Create New Transaction"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateTransaction} layout="vertical">
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please enter an amount' }]}
          >
            <InputNumber<number>
              style={{ width: '100%' }}
              step={0.01}
              formatter={(value: number | undefined) =>
                `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={(value: string | undefined) =>
                value ? parseFloat(value.replace(/\$\s?|(,*)/g, '')) : 0
              }
            />
          </Form.Item>

          <Form.Item
            name="splitBetween"
            label="Split Between"
            rules={[
              { required: true, message: 'Please select who to split with' },
            ]}
          >
            <Select mode="multiple" placeholder="Select members">
              {groupMembers.map((member) => (
                <Option key={member} value={member}>
                  {member}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Transaction
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BillsPage;
