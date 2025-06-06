// MenuPage.tsx
import React from 'react';
import { Card, Typography, Button } from 'antd';
import {
  DollarOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import GroupHeaderBar from './../../components/GroupHeadBar';
import BottomTabBar from './../../components/BottomTabBar'; // Import the BottomTabBar

const featureItems = [
  {
    title: 'Bill Management',
    icon: <DollarOutlined style={{ fontSize: 24, color: '#7D6DC2' }} />,
    path: '/bills',
  },
  {
    title: 'Calendar',
    icon: <CalendarOutlined style={{ fontSize: 24, color: '#7D6DC2' }} />,
    path: '/calendar',
  },
  {
    title: 'Grocery',
    icon: <ShoppingCartOutlined style={{ fontSize: 24, color: '#7D6DC2' }} />,
    path: '/grocery',
  },
];

const MenuPage: React.FC = () => {
  const { Text } = Typography;
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, groupId } = location.state || {};

  return (
    <div
      style={{
        backgroundColor: '#f9f8ff',
        minHeight: '100vh',
        paddingBottom: '80px',
      }}
    >
      {/* Full-width GroupHeaderBar */}
      <div style={{ padding: 0 }}>
        <GroupHeaderBar />
      </div>

      <div
        style={{
          marginTop: 24,
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {featureItems.map((item, index) => (
          <Card
            key={index}
            onClick={() => navigate(item.path, { state: { userId, groupId } })}
            hoverable
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: 12,
              padding: '12px 16px',
              backgroundColor: '#faf6ff',
              border: '1px solid #e5dcff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
              height: 72, // Thicker height
            }}
            bodyStyle={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 0,
              width: '100%',
            }}
          >
            <div
              style={{
                border: '2px solid #7D6DC2',
                borderRadius: 8,
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
              }}
            >
              {item.icon}
            </div>
            <Text strong style={{ fontSize: 16 }}>
              {item.title}
            </Text>
          </Card>
        ))}

        {/* Add Button */}
        <div style={{ marginTop: 12 }}>
          <Button
            type="dashed"
            icon={<PlusOutlined style={{ fontSize: 32 }} />}
            style={{
              width: '100%',
              height: 72,
              fontSize: 24,
              color: '#aaa',
              backgroundColor: '#f5f5f5',
              border: '2px dashed #ddd',
              borderRadius: 12,
            }}
          />
        </div>
      </div>

      {/* Add BottomTabBar (fixed at bottom) */}
      <BottomTabBar />
    </div>
  );
};

export default MenuPage;
