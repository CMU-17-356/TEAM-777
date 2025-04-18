import React, { useEffect, useState, useCallback } from 'react';
import { Badge, Button, Drawer, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../App';
import { Notification } from '../types';

const { Text } = Typography;

interface BellProps {
  userId: string;
  refreshGroups?: () => void;
}

const NotificationBell: React.FC<BellProps> = ({ userId, refreshGroups }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Notification[]>([]);

  const loadNotes = useCallback(async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/notifications`, {
        userId,
      });
      setNotes(res.data.notifications || []);
    } catch {
      // optionally handle load errors
    }
  }, [userId]);

  useEffect(() => {
    loadNotes();
    const id = setInterval(loadNotes, 15000);
    return () => clearInterval(id);
  }, [loadNotes]);

  const respondInvite = async (nid: string, action: 'accept' | 'decline') => {
    await axios.patch(`${API_BASE_URL}/api/notifications/${nid}`, {
      userId,
      action,
    });
    await loadNotes();
    refreshGroups?.();
  };

  const markRead = async (nid: string) => {
    await axios.patch(`${API_BASE_URL}/api/notifications/${nid}`, {
      userId,
      action: 'decline',
    });
    await loadNotes();
  };

  return (
    <>
      <Badge count={notes.length} size="small">
        <Button
          shape="circle"
          icon={<BellOutlined />}
          onClick={() => setOpen(true)}
        />
      </Badge>

      <Drawer
        open={open}
        title="Notifications"
        width={360}
        onClose={() => setOpen(false)}
      >
        {notes.length === 0 && <p>No unread notifications 🎉</p>}

        {notes.map((n) =>
          n.type === 'invite' ? (
            <div key={n.id} style={{ marginBottom: 12 }}>
              <Text>
                <Text strong>{n.senderName || 'Someone'}</Text>
                &nbsp;invited you to&nbsp;
                <Text strong>{n.groupName}</Text>
              </Text>
              <div style={{ marginTop: 4 }}>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => respondInvite(n.id, 'accept')}
                  style={{ marginRight: 8 }}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={() => respondInvite(n.id, 'decline')}
                >
                  Decline
                </Button>
              </div>
            </div>
          ) : (
            <div key={n.id} style={{ marginBottom: 12 }}>
              <Text>
                New chore&nbsp;
                <Text strong>{n.title}</Text>
                &nbsp;in&nbsp;
                <Text strong>{n.groupName}</Text>
                &nbsp;assigned to you
              </Text>
              <div style={{ marginTop: 4 }}>
                <Button size="small" onClick={() => markRead(n.id)}>
                  Mark read
                </Button>
              </div>
            </div>
          ),
        )}
      </Drawer>
    </>
  );
};

export default NotificationBell;
