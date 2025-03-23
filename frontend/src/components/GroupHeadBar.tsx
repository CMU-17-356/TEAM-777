import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Avatar, Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { API_BASE_URL } from '../App';

const { Title } = Typography;

type GroupMember = {
  username: string;
};

type GroupData = {
  groupName: string;
  members: GroupMember[];
};

const GroupHeaderBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { groupId } =
    (location.state as { userId?: string; groupId?: string }) || {};
  const [groupData, setGroupData] = useState<GroupData | null>(null);

  useEffect(() => {
    if (!groupId) return;

    const fetchGroupInfo = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/groups/${groupId}`,
        );
        setGroupData(response.data);
      } catch (error) {
        console.error('Error fetching group data:', error);
      }
    };

    fetchGroupInfo();
  }, [groupId]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end', // push content to bottom of bar
        padding: '0 24px 16px 24px', // more bottom padding
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        height: '100px', // total bar height
        marginTop: '0px', // align top
        position: 'relative', // optional if you want to pin this to top later
      }}
    >
      {/* Back Button */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ fontSize: '20px', color: '#7D6DC2' }}
      />

      {/* Avatars / Initials */}
      <div style={{ display: 'flex', gap: '8px', marginLeft: '30px' }}>
        {groupData?.members?.map((member, index) => {
          const initials = member.username.charAt(0).toUpperCase();
          return (
            <Avatar
              key={index}
              style={{ backgroundColor: '#7D6DC2', color: '#fff' }}
              size="large"
            >
              {initials}
            </Avatar>
          );
        })}
      </div>

      {/* Group Name */}
      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
        <Title level={4} style={{ margin: 0 }}>
          {groupData?.groupName ? `#${groupData.groupName}` : 'Loading...'}
        </Title>
      </div>
    </div>
  );
};

export default GroupHeaderBar;
