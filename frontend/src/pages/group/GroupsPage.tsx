import React, { useEffect, useState } from 'react';
import GroupCard from '../../components/GroupCard';
import { Group } from '../../types';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Typography, Spin, message, Card } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../App';

// Import icons
import {
  CalendarOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = location.state || {};

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Only include the 3 tabs shown in your MenuPage
  const bottomTabs = [
    { label: 'Bill Management', icon: <DollarOutlined />, path: '/bills' },
    { label: 'Calendar', icon: <CalendarOutlined />, path: '/calendar' },
    { label: 'Grocery', icon: <ShoppingCartOutlined />, path: '/grocery' },
  ];

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/groups-by-user`,
          { userId },
        );
        setGroups(response.data.groups || []);
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchGroups();
    }
  }, [userId]);

  const handleAddGroup = () => {
    navigate('/group-invite', { state: { userId } });
  };

  const handleCardClick = (groupId: string) => {
    navigate('/menu', { state: { userId, groupId } });
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f9f8ff 0%, #ece7fa 100%)',
        minHeight: '100vh',
        padding: '40px 20px 80px', // bottom padding for tab bar
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Title level={3} style={{ color: '#7D6DC2', margin: 0 }}>
            Your Groups
          </Title>
          <Button
            type="primary"
            shape="circle"
            icon={<PlusOutlined />}
            style={{
              backgroundColor: '#7D6DC2',
              borderColor: '#7D6DC2',
              boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
            }}
            onClick={handleAddGroup}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <Spin size="large" />
          </div>
        ) : groups.length > 0 ? (
          groups.map((group) => (
            <Card
              key={group.id}
              onClick={() => handleCardClick(group.id)}
              style={{
                marginBottom: 16,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                backgroundColor: '#ffffffcc',
                border: 'none',
              }}
            >
              <GroupCard group={group} />
            </Card>
          ))
        ) : (
          <p style={{ color: '#7D6DC2', marginTop: 20, fontSize: '16px' }}>
            No groups found. Click the{' '}
            <strong style={{ color: '#7D6DC2' }}>+</strong> to create one.
          </p>
        )}
      </div>

      {/* Bottom Navigation Tabs */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 60,
          backgroundColor: '#fff',
          borderTop: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        {bottomTabs.map((tab) => (
          <Button
            key={tab.label}
            type="text"
            icon={tab.icon}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#7D6DC2',
              fontSize: 12,
            }}
            onClick={() => navigate(tab.path, { state: { userId } })}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default GroupsPage;
