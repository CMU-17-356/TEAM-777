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

  const [groupName, setGroupName] = useState('Group Name');
  const [address, setAddress] = useState('House Address');
  const [searchInput, setSearchInput] = useState('');
  const [notes, setNotes] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [addedUsers, setAddedUsers] = useState<User[]>([]);

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
      const response = await axios.post(`${API_BASE_URL}/api/group-create`, groupData);
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
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      padding: '16px', 
      backgroundColor: '#f9f8ff', 
      minHeight: '100vh' 
    }}>
      <div style={{ width: '80%', maxWidth: 500 }}>
        <div style={{ marginBottom: 100 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              size="large"
              style={{ color: '#7D6DC2' }}
              onClick={() => navigate(-1)}
            />
          </div>
        <Card 
          style={{ 
            borderRadius: 8, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', 
            backgroundColor: '#f3e8ff', 
            padding: 24 
          }}
        >
          {/* Back Button */}
          

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Group Name */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}
            >
              <Title level={5} style={{ margin: 0, color: '#7D6DC2' }}>
                #{groupName}
              </Title>
              <Button
                type="text"
                icon={<EditOutlined />}
                style={{ color: '#7D6DC2' }}
                onClick={() => {
                  const name = prompt('Edit Group Name', groupName);
                  if (name) setGroupName(name);
                }}
              />
            </div>

            {/* Address */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}
            >
              <Title level={5} style={{ margin: 0, color: '#7D6DC2' }}>
                #{address}
              </Title>
              <Button
                type="text"
                icon={<EditOutlined />}
                style={{ color: '#7D6DC2' }}
                onClick={() => {
                  const addr = prompt('Edit House Address', address);
                  if (addr) setAddress(addr);
                }}
              />
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
                style={{ width: '100%' }}
              />
            </Dropdown>

            {/* Selected Users */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
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
                  }}
                >
                  <Avatar 
                    size="small" 
                    style={{ 
                      marginRight: 6, 
                      backgroundColor: '#7D6DC2', 
                      color: '#fff' 
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <span>{user.username} ({user.email})</span>
                </Tag>
              ))}
            </div>

            {/* Notes */}
            <Input.TextArea
              placeholder="Add group description... (optional)"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />

            {/* Create Group Button */}
            <Button
              type="primary"
              block
              size="large"
              style={{ 
                backgroundColor: '#7D6DC2', 
                borderColor: '#7D6DC2', 
                color: 'white' 
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
