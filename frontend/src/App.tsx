import React, { useEffect, useState } from 'react';
import axios from 'axios';

type ApiResponse = {
  message: string;
};

const App: React.FC = () => {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    axios
      .get<ApiResponse>('http://127.0.0.1:5000/api/get')
      .then((response) => setMessage(response.data.message))
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  return (
    <div>
      <h1>Flask + React + TypeScript</h1>
      <p>{message}</p>
    </div>
  );
};

export default App;
