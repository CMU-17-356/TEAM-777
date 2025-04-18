import React from 'react';
import { Card, Button, Typography } from 'antd';
import { Notification } from '../types';

const { Text } = Typography;

interface InviteCardProps {
  invite: Notification;
  onRespond: (_id: string, _action: 'accept' | 'decline') => void;
}

const InviteCard: React.FC<InviteCardProps> = ({ invite, onRespond }) => (
  <Card
    style={{ marginBottom: 12, borderRadius: 12 }}
    bodyStyle={{ display: 'flex', justifyContent: 'space-between' }}
  >
    <Text>
      <Text strong>{invite.senderName || 'Someone'}</Text>
      &nbsp;invited you to&nbsp;
      <Text strong>{invite.groupName || invite.groupId.slice(-6)}</Text>
    </Text>

    <div>
      <Button
        size="small"
        type="primary"
        onClick={() => onRespond(invite.id, 'accept')}
        style={{ marginRight: 8 }}
      >
        Accept
      </Button>
      <Button
        size="small"
        danger
        onClick={() => onRespond(invite.id, 'decline')}
      >
        Decline
      </Button>
    </div>
  </Card>
);

export default InviteCard;
