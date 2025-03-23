import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Typography,
  Space,
  Dropdown,
  Avatar,
  Tag,
  Modal,
  Card,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { API_BASE_URL } from '../../App';

const { Title } = Typography;

type User = {
  id: string;
  username: string;
  email: string;
};

const CreateGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = location.state || {};

  const [groupName, setGroupName] = useState('');
  const [address, setAddress] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [notes, setNotes] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [addedUsers, setAddedUsers] = useState<User[]>([]);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  // Debounced user search
  const handleSearch = debounce(async (query: string) => {
    if (!query.trim()) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/search-users`, {
        params: { q: query },
      });
      setSearchResults(response.data.users || []);
      console.log('Search results:', response.data.users);
    } catch (error) {
      console.error('Search error:', error);
    }
  }, 400);

  useEffect(() => {
    handleSearch(searchInput);
    return () => handleSearch.cancel(); // cleanup debounce
  }, [searchInput]);

  const handleAddUser = (user: User) => {
    if (!addedUsers.find((u) => u.id === user.id)) {
      setAddedUsers([...addedUsers, user]);
    }
    setSearchInput('');
    setSearchResults([]);
  };

  const handleRemoveUser = (id: string) => {
    setAddedUsers(addedUsers.filter((u) => u.id !== id));
  };

  const handleCreateGroup = async () => {
    if (!groupName || groupName.trim() === '' || groupName === 'Group Name') {
      Modal.warning({
        title: 'Missing Group Name',
        content: 'Please enter a valid group name.',
      });
      return;
    }

    if (!address || address.trim() === '' || address === 'House Address') {
      Modal.warning({
        title: 'Missing Address',
        content: 'Please enter a valid address.',
      });
      return;
    }

    if (addedUsers.length === 0) {
      Modal.warning({
        title: 'No Members Added',
        content: 'Please add at least one member to the group.',
      });
      return;
    }

    if (!userId) {
      Modal.error({
        title: 'Missing User ID',
        content: 'Could not find current user info. Please log in again.',
      });
      return;
    }

    const groupData = {
      groupName,
      address,
      notes,
      members: addedUsers,
      creatorId: userId,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/group-create`,
        groupData,
      );
      console.log('Group created successfully:', response.data);
      navigate('/groups', { state: { userId } });
    } catch (error) {
      console.error('Group creation failed:', error);
      Modal.error({
        title: 'Group Creation Failed',
        content: 'Please try again later.',
      });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '40px 16px',
        display: 'flex',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9f8ff 30%, #ece7fa 100%)',
      }}
    >
      <div style={{ width: '90%', maxWidth: 600 }}>
        <div style={{ marginBottom: 100 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            size="large"
            style={{
              color: '#7D6DC2',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => navigate(-1)}
          >
            <span style={{ marginLeft: 6 }}>Back</span>
          </Button>
        </div>
        <Card
          style={{
            borderRadius: 12,
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
            backgroundColor: '#ffffffee',
            padding: 24,
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Group Name (inline editable) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {editingGroupName ? (
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onPressEnter={() => setEditingGroupName(false)}
                  onBlur={() => setEditingGroupName(false)}
                  placeholder="Your Group Name"
                  autoFocus
                  style={{ color: '#7D6DC2', fontWeight: 'bold' }}
                />
              ) : (
                <>
                  <Title level={5} style={{ margin: 0, color: '#7D6DC2' }}>
                    {groupName ? `#${groupName}` : 'Your Group Name'}
                  </Title>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    style={{ color: '#7D6DC2' }}
                    onClick={() => setEditingGroupName(true)}
                  />
                </>
              )}
            </div>

            {/* Address (inline editable) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {editingAddress ? (
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onPressEnter={() => setEditingAddress(false)}
                  onBlur={() => setEditingAddress(false)}
                  placeholder="Your House Address"
                  autoFocus
                  style={{ color: '#7D6DC2', fontWeight: 'bold' }}
                />
              ) : (
                <>
                  <Title level={5} style={{ margin: 0, color: '#7D6DC2' }}>
                    {address ? `#${address}` : 'Your House Address'}
                  </Title>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    style={{ color: '#7D6DC2' }}
                    onClick={() => setEditingAddress(true)}
                  />
                </>
              )}
            </div>

            {/* Search Dropdown */}
            <Dropdown
              open={searchResults.length > 0 && searchInput.trim() !== ''}
              menu={{
                items: searchResults.map((user) => ({
                  key: user.id,
                  label: (
                    <div onClick={() => handleAddUser(user)}>
                      {user.username} ({user.email})
                    </div>
                  ),
                })),
              }}
              trigger={['click']}
            >
              <Input
                placeholder="Search by username or email"
                prefix={<SearchOutlined style={{ color: '#7D6DC2' }} />}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: 6,
                }}
              />
            </Dropdown>

            {/* Selected Users */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                width: '100%',
              }}
            >
              {addedUsers.map((user) => (
                <Tag
                  key={user.id}
                  closable
                  onClose={() => handleRemoveUser(user.id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#f0f0ff',
                    borderColor: '#7D6DC2',
                    color: '#7D6DC2',
                    borderRadius: 16,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                  }}
                >
                  <Avatar
                    size="small"
                    style={{
                      marginRight: 6,
                      backgroundColor: '#7D6DC2',
                      color: '#fff',
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <span>
                    {user.username} ({user.email})
                  </span>
                </Tag>
              ))}
            </div>

            {/* Notes */}
            <Input.TextArea
              placeholder="Add group description... (optional)"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                resize: 'vertical',
                borderRadius: 6,
              }}
            />

            {/* Create Group Button */}
            <Button
              type="primary"
              block
              size="large"
              style={{
                background: '#7D6DC2',
                borderColor: '#7D6DC2',
                color: 'white',
                borderRadius: 6,
                boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
              }}
              onClick={handleCreateGroup}
            >
              Create Group
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default CreateGroupPage;
