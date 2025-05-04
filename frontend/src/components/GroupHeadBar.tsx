import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Avatar, Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import { API_BASE_URL } from '../App';
import NotificationBell from './NotificationBell';

const { Title } = Typography;

type GroupMember = { username: string };
type GroupData = { groupName: string; members: GroupMember[] };

const GroupHeaderBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { userId, groupId } =
    (location.state as { userId?: string; groupId?: string }) || {};

  const [groupData, setGroupData] = useState<GroupData | null>(null);

  useEffect(() => {
    if (!groupId) return;

    (async () => {
      try {
        const res = await axios.post(`${API_BASE_URL}/api/groups/${groupId}`);
        setGroupData(res.data);
      } catch (err) {
        console.error('Error fetching group data:', err);
      }
    })();
  }, [groupId]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0 24px 16px 24px',
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        height: 100,
        marginTop: 0,
      }}
    >
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ fontSize: 20, color: '#7D6DC2' }}
      />

      <div style={{ display: 'flex', gap: 8, marginLeft: 30 }}>
        {groupData?.members?.map((m, i) => (
          <Avatar
            key={i}
            size="large"
            style={{ backgroundColor: '#7D6DC2', color: '#fff' }}
          >
            {m.username.charAt(0).toUpperCase()}
          </Avatar>
        ))}
      </div>

      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {groupData?.groupName ? `#${groupData.groupName}` : 'Loading...'}
        </Title>

        {userId && <NotificationBell userId={userId} />}
      </div>
    </div>
  );
};

export default GroupHeaderBar;
