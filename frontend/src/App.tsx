import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import SignIn from './pages/auth/SignIn';
import Register from './pages/auth/Register';
import GroupsPage from './pages/group/GroupsPage';
import GroupInvite from './pages/group/GroupInvite';
import { GroupSizeContext } from 'antd/es/button/button-group';

type ApiResponse = {
  message: string;
};

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
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    axios
      .get<ApiResponse>(`${API_BASE_URL}/api/get`)
      .then((response) => setMessage(response.data.message))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h1>Flask + React + TypeScript</h1>
              <p>{message}</p>
            </div>
          }
        />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/group-invite" element={<GroupInvite/>} />
      </Routes>
    </Router>
  );
};

export default App;
