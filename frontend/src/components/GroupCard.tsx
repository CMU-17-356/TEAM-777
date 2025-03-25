import React from 'react';
import { Card, Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Group } from '../types';

type Props = {
  group: Group;
};

const GroupCard: React.FC<Props> = ({ group }) => {
  const maxVisible = 3;
  const visibleMembers = group.members.slice(0, maxVisible);
  const extraCount = group.members.length - maxVisible;

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar style={{ marginRight: 16 }} icon={<UserOutlined />} />
        <div>
          <div style={{ fontWeight: 600 }}>{group.name}</div>
          {group.address && (
            <div style={{ color: 'gray', fontSize: 13 }}>{group.address}</div>
          )}
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            {visibleMembers.map((member) => (
              <Tooltip title={member.name} key={member.id}>
                <Avatar style={{ backgroundColor: '#95de64' }}>
                  {member.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
            {extraCount > 0 && (
              <Avatar style={{ backgroundColor: '#d9d9d9', color: '#595959' }}>
                +{extraCount}
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GroupCard;
