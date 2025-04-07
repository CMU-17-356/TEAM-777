import React from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import SignIn from './pages/auth/SignIn';
import Register from './pages/auth/Register';
import GroupsPage from './pages/group/GroupsPage';
import GroupInvite from './pages/group/GroupInvite';
import Menu from './pages/group/menu';
import Calendar from './pages/calendar/CalendarPage';
import AcceptInvite from './pages/AcceptInvite'; 

const getApiBaseUrl = () => {
  const hostname = window.location.hostname;

  if (hostname.includes('pr-')) {
    return `https://${hostname}`;
  } else if (hostname.includes('team-777.onrender.com')) {
    return 'https://team-777.onrender.com';
  } else {
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
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/group-invite" element={<GroupInvite />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/accept-invite" element={<AcceptInvite />} /> 
      </Routes>
    </Router>
  );
};

export default App;

