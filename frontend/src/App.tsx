import React from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
//import axios from 'axios';
import SignIn from './pages/auth/SignIn';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';
import GroupsPage from './pages/group/GroupsPage';
import GroupInvite from './pages/group/GroupInvite';
import Menu from './pages/group/menu';
import Calendar from './pages/calendar/CalendarPage';
import BillsPage from './pages/bills/Bills';

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;

  if (hostname.includes('pr-')) {
    // PR Preview Environment (Modify the base URL format)
    return `https://${hostname}`;
  } else if (hostname.includes('team-777.onrender.com')) {
    // Production Environment
    return 'https://team-777.onrender.com';
  } else {
    // Local Development
    return 'http://127.0.0.1:5001';
  }
};

export const API_BASE_URL = getApiBaseUrl();

console.log('API BASE URL:', API_BASE_URL);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/auth/signin" replace />} />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route
          path="/auth/change-password/:token"
          element={<ChangePassword />}
        />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/group-invite" element={<GroupInvite />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/bills" element={<BillsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
