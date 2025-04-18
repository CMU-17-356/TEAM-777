import React from 'react';
import { Card, Button, Typography } from 'antd';

const { Text } = Typography;

export interface InviteCardProps {
  groupName: string;
  invite: {
    id: string;
    groupId: string;
    senderId: string;
  };
  onRespond: (id: string, action: 'accept' | 'decline') => void;
}

const InviteCard: React.FC<InviteCardProps> = ({ groupName, invite, onRespond }) => (
  <Card
    style={{ marginBottom: 12, borderRadius: 12, background: '#fffefc' }}
    bodyStyle={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
  >
    <Text>
      Invitation to&nbsp;
      <Text strong style={{ color: '#7D6DC2' }}>
        {groupName || 'a group'}
      </Text>
    </Text>

    <span>
      <Button
        size="small"
        type="primary"
        style={{ marginRight: 8 }}
        onClick={() => onRespond(invite.id, 'accept')}
      >
        Accept
      </Button>
      <Button size="small" danger onClick={() => onRespond(invite.id, 'decline')}>
        Decline
      </Button>
    </span>
  </Card>
);

export default InviteCard;
