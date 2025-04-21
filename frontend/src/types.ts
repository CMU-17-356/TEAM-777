export type User = {
  id: string;
  name: string;
};

export interface Group {
  id: string;
  name: string;
  address?: string;
  members: User[];
}

export interface Notification {
  id: string;
  groupId: string;
  senderId: string;
  status: 'pending' | 'unread' | 'accepted' | 'declined' | 'read';
  type: 'invite' | 'chore';
  title?: string;
  createdAt: string;

  senderName?: string;
  groupName?: string;
}
