import React, { useState, useEffect, useMemo } from 'react';
import {
  Input,
  Button,
  Typography,
  Space,
  Dropdown,
  Avatar,
  Tag,
  Card,
  message,
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

interface Errors {
  groupName: string;
  address: string;
  addedUsers: string;
}

const CreateGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = location.state || {};

  const [errors, setErrors] = useState<Errors>({
    groupName: '',
    address: '',
    addedUsers: '',
  });
  const [groupName, setGroupName] = useState('');
  const [address, setAddress] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [notes, setNotes] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [addedUsers, setAddedUsers] = useState<User[]>([]);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);

  // Initialize Ant Design's message API
  const [messageApi, contextHolder] = message.useMessage();

  // Define the actual search logic
  const handleSearchRaw = async (query: string) => {
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
  };

  // Wrap with debounce only once using useMemo
  const debouncedSearch = useMemo(
    () => debounce(handleSearchRaw, 400),
    [], // empty dependency array so it's stable
  );

  // Run the effect when searchInput changes
  useEffect(() => {
    debouncedSearch(searchInput);
    return () => debouncedSearch.cancel();
  }, [searchInput, debouncedSearch]);

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
    setErrors({ groupName: '', address: '', addedUsers: '' });

    let newErrors: Errors = { groupName: '', address: '', addedUsers: '' };
    if (!groupName || groupName.trim() === '' || groupName === 'Group Name') {
      newErrors.groupName = 'Group Name is required.';
    }

    if (!address || address.trim() === '' || address === 'House Address') {
      newErrors.address = 'House Address is required.';
    }

    if (addedUsers.length === 0) {
      newErrors.addedUsers = 'Must add at least one user.';
    }

    if (newErrors.groupName || newErrors.address || newErrors.addedUsers) {
      setErrors(newErrors);
      return;
    }

    if (!userId) {
      messageApi.error(
        'Could not find current user info. Please log in again.',
      );
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

      // Show success popup
      messageApi.success('Group created successfully! Redirecting...');

      // Optionally delay navigation so the user can see the message
      setTimeout(() => {
        navigate('/groups', { state: { userId } });
      }, 2000);
    } catch (error: any) {
      console.error('Group creation failed:', error);
      const errMsg =
        error?.response?.data?.message ||
        'Group creation failed! Please try again later.';

      // Show error popup
      messageApi.error(errMsg);
    }
  };

  return (
    <>
      {/* Include contextHolder for the message notifications */}
      {contextHolder}
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
              {errors.groupName && (
                <p className="error-text">{errors.groupName}</p>
              )}

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
              {errors.address && <p className="error-text">{errors.address}</p>}

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
              {errors.addedUsers && (
                <p className="error-text">{errors.addedUsers}</p>
              )}

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
    </>
  );
};

export default CreateGroupPage;
