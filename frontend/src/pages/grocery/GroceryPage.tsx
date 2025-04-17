// GroceryPage.tsx

import React, { useState } from 'react';
import {
  Card,
  Typography,
  Button,
  List,
  Modal,
  Form,
  Input,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import GroupHeadBar from '../../components/GroupHeadBar';
import BottomTabBar from '../../components/BottomTabBar';

const { Text } = Typography;

interface GroceryItem {
  name: string;
  quantity: string;
  place: string;
  requester: string;
}

const GroceryPage: React.FC = () => {
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleAddGroceryItem = (values: GroceryItem) => {
    setGroceryList([...groceryList, values]);
    setIsModalVisible(false);
    form.resetFields();
    message.success('Grocery item added');
  };

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#f9f8ff',
        minHeight: '100vh',
        padding: '24px 16px',
        paddingBottom: '80px',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <GroupHeadBar />
      </div>

      <Card
        title="Grocery Requests"
        style={{
          marginBottom: 24,
          borderRadius: 12,
          backgroundColor: '#faf6ff',
          border: '1px solid #e5dcff',
        }}
      >
        <List
          dataSource={groceryList}
          renderItem={(item) => (
            <List.Item>
              <div>
                <Text strong>{item.quantity} {item.name}</Text>
                <div style={{ color: '#888' }}>Place: {item.place}</div>
                <div style={{ color: '#888' }}>Requested by: {item.requester}</div>
              </div>
            </List.Item>
          )}
          locale={{ emptyText: 'No grocery items yet' }}
        />
      </Card>

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
        Add Grocery Item
      </Button>

      <Modal
        title="Add Grocery Item"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddGroceryItem} layout="vertical">
          <Form.Item
            name="name"
            label="Item Name"
            rules={[{ required: true, message: 'Please enter item name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="place"
            label="Place to Buy"
            rules={[{ required: true, message: 'Please enter a place' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="requester"
            label="Requester"
            rules={[{ required: true, message: 'Please enter requester name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add Item
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <BottomTabBar />
      </div>
    </div>
  );
};

export default GroceryPage;
