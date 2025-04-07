import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../App';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>('');

  const hash = window.location.hash; // e.g., "#/auth/verify-email?token=..."
  const tokenParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
  const token = tokenParams.get('token');
  console.log(token);

  const handleConfirm = async (): Promise<void> => {
    try {
      const response = await axios.post<{ message: string }>(
        `${API_BASE_URL}/auth/verify-email`,
        {
          token: token,
        },
      );
      setMessage(response.data.message);
      navigate('/auth/signin');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f9f8ff 0%, #ece7fa 100%)',
        minHeight: '100vh',
        padding: '40px 0px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: '20vh',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80vw',
          marginLeft: '10vw',
          marginRight: '10vw',
        }}
      >
        <h2 style={{ fontSize: 26 }}>Email Verification</h2>
        <p>
          Please click the button below to complete the email verification and
          finish the registration.
        </p>
        <button
          style={{
            marginTop: '20vw',
            width: '80vw',
            padding: 10,
            marginBottom: '8vh',
            border: 'none',
            borderRadius: 10,
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            background: '#624a92',
          }}
          onClick={handleConfirm}
        >
          Validate
        </button>
        {message && <p className="error-text">{message}</p>}
      </div>
    </div>
  );
};

export default VerifyEmail;
