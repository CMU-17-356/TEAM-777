import React, { useEffect, useState, useCallback } from 'react';
import { Button, Typography, Spin, message, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import GroupCard from '../../components/GroupCard';
import NotificationBell from '../../components/NotificationBell';
import { Group } from '../../types';
import { API_BASE_URL } from '../../App';

const { Title } = Typography;

const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = location.state || {};

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/groups-by-user`, {
        userId,
      });
      setGroups(res.data.groups || []);
    } catch (err) {
      message.error((err as Error).message);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchGroups().finally(() => setLoading(false));
  }, [fetchGroups, userId]);

  const handleAddGroup = () => navigate('/group-invite', { state: { userId } });

  const handleCardClick = (gid: string) =>
    navigate('/menu', { state: { userId, groupId: gid } });

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f9f8ff 0%, #ece7fa 100%)',
        minHeight: '100vh',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
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

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {userId && (
              <NotificationBell userId={userId} refreshGroups={fetchGroups} />
            )}
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
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <Spin size="large" />
          </div>
        ) : groups.length ? (
          groups.map((g) => (
            <Card
              key={g.id}
              onClick={() => handleCardClick(g.id)}
              style={{
                marginBottom: 16,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                backgroundColor: '#ffffffcc',
                border: 'none',
              }}
            >
              <GroupCard group={g} />
            </Card>
          ))
        ) : (
          <p style={{ color: '#7D6DC2', marginTop: 20, fontSize: 16 }}>
            No groups found. Click the <strong>+</strong> to create one.
          </p>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
