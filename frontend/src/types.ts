
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


export interface NotificationInvite {
  id: string;              
  groupId: string;          
  senderId: string;        
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;       
}
