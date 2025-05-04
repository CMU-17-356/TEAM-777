import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Button,
  List,
  Modal,
  Form,
  Input,
  message,
  Checkbox,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../App';
import GroupHeadBar from '../../components/GroupHeadBar';
import BottomTabBar from '../../components/BottomTabBar';

const { Text } = Typography;

interface GroceryItem {
  id: string; // for delete item
  item: string;
  quantity: string;
  place: string;
  requester: string;
  timestamp: string;
  acceptedBy?: string | null; // Optional: the user who accepted to buy the item
  purchaseTime?: string | null; // Optional: the planned time for the user to buy the item
  requester_username?: string | null; // Optional: the username of the requester
  accepter?: string | null; // Optional: the username of the accepter
}

const Grocery: React.FC = () => {
  const location = useLocation();
  const { groupId, userId } = location.state || {};
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editItem, setEditItem] = useState<GroceryItem | null>(null);
  const [isCheckModalVisible, setIsCheckModalVisible] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [currentItem, setCurrentItem] = useState<GroceryItem | null>(null);

  // Fetch grocery items from backend
  const fetchGroceryItems = useCallback(async () => {
    console.log('Fetching groceries for groupId:', groupId);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/groceries/${groupId}?t=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
          },
        },
      );
      console.log('Fetched groceries:', response.data); // 🔍 log response, debug

      if (Array.isArray(response.data)) {
        setGroceryList(response.data);
      } else {
        message.error('Unexpected data format when fetching groceries');
      }
    } catch (error) {
      console.error('Error fetching groceries:', error);
      message.error('Failed to fetch grocery items');
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      fetchGroceryItems();
    }
  }, [groupId, fetchGroceryItems]);
  console.log('Current groceryList state:', groceryList); // 👀 Watch state update. debug.

  // When editItem changes, update form values
  useEffect(() => {
    if (editItem) {
      form.setFieldsValue({
        item: editItem.item,
        quantity: editItem.quantity,
        place: editItem.place,
      });
    } else {
      form.resetFields();
    }
  }, [editItem, form]);

  const handleDeleteItem = async (itemId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/groceryDelete`, {
        data: { groupId, itemId },
      });
      message.success('Item deleted');
      fetchGroceryItems(); // refresh list
    } catch (err) {
      console.error('Delete failed:', err);
      message.error('Failed to delete item');
    }
  };

  // Reset editItem when the modal is closed
  const handleCloseModal = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditItem(null); // Reset edit item state when closing the modal
  };

  const handleEditItem = (item: GroceryItem) => {
    // console.log("Previous item is",item);
    form.resetFields();
    setEditItem(item);
    setIsModalVisible(true);
  };

  // Submit handler for editing an existing grocery item
  const handleEditItemSubmit = async () => {
    try {
      const updatedItem = {
        _id: groupId,
        itemId: editItem?.id,
        requester: userId || editItem?.requester,
        item: form.getFieldValue('item'),
        quantity: form.getFieldValue('quantity'),
        place: form.getFieldValue('place'),
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/groceryEdit`,
        updatedItem,
      );

      if (response.data.success) {
        message.success('Grocery item updated');
        handleCloseModal();
        fetchGroceryItems(); // refresh list
        console.log('Edit item is', editItem);
      } else {
        message.error(response.data.message || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating grocery item:', error);
      message.error('Server error when updating item');
    }
  };

  // Handle Checkbox Click
  const handleCheckboxClick = (item: GroceryItem) => {
    const isAccepted = item.acceptedBy === userId; // Check if the current user accepted the item
    setCurrentItem(item);
    setIsAccepted(isAccepted);
    if (isAccepted) {
      // If the item has been accepted by the current user, show a modal to remove acceptance
      setIsCheckModalVisible(true);
    } else {
      // If not accepted, show a modal to accept the item
      setIsCheckModalVisible(true);
    }
  };

  // Submit handler
  const handleAddGroceryItem = async (values: GroceryItem) => {
    console.log('Edit item is', editItem);
    try {
      const payload = {
        _id: groupId,
        requester: userId || values.requester,
        item: values.item,
        place: values.place,
        quantity: values.quantity,
      };
      const response = await axios.post(
        `${API_BASE_URL}/api/groceryAdd`,
        payload,
      );
      if (response.data.success) {
        message.success('Grocery item added');
        handleCloseModal();
        form.resetFields();
        fetchGroceryItems(); // refresh
        console.log('Edit item is', editItem);
      } else {
        message.error(response.data.message || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding grocery item:', error);
      message.error('Server error when adding item');
    }
  };

  // Handle acceptance or removal of acceptance
  const handleConfirmAcceptance = async () => {
    const item = currentItem;
    if (isAccepted) {
      // Remove acceptance
      try {
        await axios.put(`${API_BASE_URL}/api/groceryRemoveAcceptance`, {
          groupId,
          itemId: item?.id,
          userId,
        });
        message.success('Your acceptance has been removed.');
        fetchGroceryItems();
        setIsCheckModalVisible(false);
      } catch (error) {
        console.error('Error removing acceptance:', error);
        message.error('Failed to remove acceptance');
      }
    } else {
      // Accept the request
      try {
        await axios.post(`${API_BASE_URL}/api/groceryAccept`, {
          groupId,
          itemId: item?.id,
          userId,
          purchaseTime: form.getFieldValue('purchaseTime'),
        });
        message.success('Item accepted.');
        fetchGroceryItems();
        setIsCheckModalVisible(false);
      } catch (error) {
        console.error('Error accepting request:', error);
        message.error('Failed to accept item');
      }
    }
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
            <List.Item
              actions={[
                item.requester === userId && (
                  <Button
                    icon={<DeleteOutlined />}
                    type="link"
                    onClick={() => handleDeleteItem(item.id)}
                    style={{ padding: 0, color: '#7D6DC2' }}
                  />
                ),
                item.requester === userId && (
                  <Button
                    icon={<EditOutlined />}
                    type="link"
                    onClick={() => handleEditItem(item)}
                    style={{ padding: 0, color: '#7D6DC2' }}
                  />
                ),
                <Checkbox
                  checked={item.acceptedBy === userId}
                  onClick={() => handleCheckboxClick(item)}
                  disabled={!!(item.acceptedBy && item.acceptedBy !== userId)}
                />,
              ]}
            >
              <div>
                <Text strong>
                  {item.quantity} {item.item}
                </Text>
                <div style={{ color: '#888' }}>Place: {item.place}</div>
                <div style={{ color: '#888' }}>
                  Requested by: {item.requester_username}
                </div>
                {item.acceptedBy && (
                  <div style={{ color: '#888' }}>
                    Accepted by: {item.accepter}
                  </div>
                )}
              </div>
            </List.Item>
          )}
          locale={{ emptyText: 'No grocery items yet' }}
        />
      </Card>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setEditItem(null);
          form.resetFields();
          setIsModalVisible(true);
        }}
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

      {/* Modal for check actions */}
      <Modal
        title={
          isAccepted
            ? "Are you sure you don't want to help buy this item?"
            : 'Are you sure you want to help buy this item?'
        }
        open={isCheckModalVisible}
        onCancel={() => setIsCheckModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          {!isAccepted && (
            <Form.Item
              name="purchaseTime"
              label="Planned Purchase Time (Optional)"
            >
              <Input type="datetime-local" />
            </Form.Item>
          )}
          <Button type="primary" onClick={handleConfirmAcceptance} block>
            {isAccepted ? 'Remove Acceptance' : 'Accept Item'}
          </Button>
        </Form>
      </Modal>

      <Modal
        title={editItem ? 'Edit Grocery Item' : 'Add Grocery Item'}
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form
          form={form}
          onFinish={editItem ? handleEditItemSubmit : handleAddGroceryItem}
          layout="vertical"
          initialValues={
            editItem
              ? {
                  item: editItem.item,
                  quantity: editItem.quantity,
                  place: editItem.place,
                }
              : {
                  item: '',
                  quantity: '',
                  place: '',
                }
          }
        >
          <Form.Item
            name="item"
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
          {!userId && (
            <Form.Item
              name="requester"
              label="Requester"
              rules={[
                { required: true, message: 'Please enter requester name' },
              ]}
            >
              <Input />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editItem ? 'Save Changes' : 'Add Item'}
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

export default Grocery;
