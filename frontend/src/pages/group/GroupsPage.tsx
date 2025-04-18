

import React, { useEffect, useState } from 'react';
import { Button, Typography, Spin, message, Card, Badge, Drawer } from 'antd';
import { PlusOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import GroupCard from '../../components/GroupCard';
import InviteCard from '../../components/InviteCard';
import { Group, NotificationInvite } from '../../types';
import { API_BASE_URL } from '../../App';

const { Title } = Typography;

const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = location.state || {};

  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<NotificationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

 
  const fetchGroups = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/groups-by-user`, { userId });
      setGroups(res.data.groups || []);
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const fetchInvites = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/notifications`, { userId });
      setInvites(res.data.notifications || []);
    } catch (err) {
      message.error('Could not load invitations');
    }
  };

  const respondInvite = async (inviteId: string, action: 'accept' | 'decline') => {
    try {
      await axios.patch(`${API_BASE_URL}/api/notifications/${inviteId}`, {
        userId,
        action,
      });
      await Promise.all([fetchInvites(), fetchGroups()]); // refresh both lists
      message.success(`Invitation ${action}ed!`);
    } catch {
      message.error('Something went wrong');
    }
  };

  
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      await Promise.all([fetchGroups(), fetchInvites()]);
      setLoading(false);
    })();
  }, [userId]);

  
  const handleAddGroup = () => navigate('/group-invite', { state: { userId } });
  const handleCardClick = (gid: string) => navigate('/menu', { state: { userId, groupId: gid } });

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f9f8ff 0%, #ece7fa 100%)',
        minHeight: '100vh',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* header row */}
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

          <span style={{ display: 'flex', gap: 12 }}>
            {/* invite bell */}
            <Badge count={invites.length} offset={[0, 2]}>
              <Button
                shape="circle"
                icon={<BellOutlined />}
                onClick={() => setDrawerOpen(true)}
              />
            </Badge>

            {/* add group */}
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
          </span>
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

      {/* slide‑over with invitations */}
      <Drawer
        title="Group Invitations"
        placement="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={360}
      >
        {invites.length === 0 ? (
          <p>No pending invites 🎉</p>
        ) : (
          invites.map((inv) => {
            
            const g = groups.find((gr) => gr.id === inv.groupId);
            return (
              <InviteCard
                key={inv.id}
                groupName={g?.name || inv.groupId}
                invite={inv}
                onRespond={respondInvite}
              />
            );
          })
        )}
      </Drawer>
    </div>
  );
};

export default GroupsPage;
