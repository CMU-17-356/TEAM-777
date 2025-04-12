import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  DollarOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';

const BottomTabBar: React.FC = () => {
  // Extract groupId/userId from location.state if needed
  const location = useLocation();
  const { userId, groupId } = location.state || {};

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0',
        zIndex: 1000, // ensure it appears above other elements
      }}
    >
      {/* Bill Management */}
      <NavLink
        to="/bills"
        state={{ userId, groupId }}
        style={{
          textAlign: 'center',
          color: '#7D6DC2',
          flex: 1,
        }}
      >
        <DollarOutlined style={{ fontSize: '24px' }} />
        <div style={{ fontSize: '12px' }}>Bills</div>
      </NavLink>

      {/* Calendar */}
      <NavLink
        to="/calendar"
        state={{ userId, groupId }}
        style={{
          textAlign: 'center',
          color: '#7D6DC2',
          flex: 1,
        }}
      >
        <CalendarOutlined style={{ fontSize: '24px' }} />
        <div style={{ fontSize: '12px' }}>Calendar</div>
      </NavLink>

      {/* Grocery */}
      <NavLink
        to="/grocery"
        state={{ userId, groupId }}
        style={{
          textAlign: 'center',
          color: '#7D6DC2',
          flex: 1,
        }}
      >
        <ShoppingCartOutlined style={{ fontSize: '24px' }} />
        <div style={{ fontSize: '12px' }}>Grocery</div>
      </NavLink>
    </div>
  );
};

export default BottomTabBar;
