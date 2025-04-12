// BottomTabBar.tsx
import React from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import {
  DollarOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';

const BottomTabBar: React.FC = () => {
  const location = useLocation();
  const { userId, groupId } = location.state || {};
  const currentPath = location.pathname;

  const activeStyle = { color: '#52c41a' }; // highlight color for current page
  const inactiveStyle = { color: '#7D6DC2' };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0',
        zIndex: 999, // ensure it's on top
      }}
    >
      {/* Bills */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        {currentPath === '/bills' ? (
          <div style={activeStyle}>
            <DollarOutlined style={{ fontSize: 24 }} />
            <div style={{ fontSize: 12 }}>Bills</div>
          </div>
        ) : (
          <NavLink
            to="/bills"
            state={{ userId, groupId }}
            style={{ textAlign: 'center', ...inactiveStyle }}
          >
            <DollarOutlined style={{ fontSize: 24 }} />
            <div style={{ fontSize: 12 }}>Bills</div>
          </NavLink>
        )}
      </div>

      {/* Calendar */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        {currentPath === '/calendar' ? (
          <div style={activeStyle}>
            <CalendarOutlined style={{ fontSize: 24 }} />
            <div style={{ fontSize: 12 }}>Calendar</div>
          </div>
        ) : (
          <NavLink
            to="/calendar"
            state={{ userId, groupId }}
            style={{ textAlign: 'center', ...inactiveStyle }}
          >
            <CalendarOutlined style={{ fontSize: 24 }} />
            <div style={{ fontSize: 12 }}>Calendar</div>
          </NavLink>
        )}
      </div>

      {/* Grocery */}
      <div style={{ flex: 1, textAlign: 'center' }}>
        {currentPath === '/grocery' ? (
          <div style={activeStyle}>
            <ShoppingCartOutlined style={{ fontSize: 24 }} />
            <div style={{ fontSize: 12 }}>Grocery</div>
          </div>
        ) : (
          <NavLink
            to="/grocery"
            state={{ userId, groupId }}
            style={{ textAlign: 'center', ...inactiveStyle }}
          >
            <ShoppingCartOutlined style={{ fontSize: 24 }} />
            <div style={{ fontSize: 12 }}>Grocery</div>
          </NavLink>
        )}
      </div>
    </div>
  );
};

export default BottomTabBar;
