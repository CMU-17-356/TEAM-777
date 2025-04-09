import React, { useEffect, useState } from 'react';
import GroupCard from '../../components/GroupCard';
import { Group } from '../../types';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Typography, Spin, message, Card } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../App';

const { Title } = Typography;

const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = location.state || {};

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

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
        padding: '40px 20px',
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
    </div>
  );
};

export default GroupsPage;