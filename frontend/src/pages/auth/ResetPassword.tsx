import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'font-awesome/css/font-awesome.min.css';
import { API_BASE_URL } from '../../App';
import { message } from 'antd';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const [messageApi, contextHolder] = message.useMessage();
  const handleSubmit = async () => {
    setError('');
    if (!email) {
      setError('Email is required.');
      return;
    } else if (!email.includes('@')) {
      setError('Invalid email format.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email,
      });
      messageApi.success(
        response.data.message || `Reset password link is sent to ${email}`,
      );
    } catch (error: any) {
      const errMsg =
        error.response.data.message ||
        'Request failed, please check your email.';
      messageApi.error(errMsg);
    }
  };

  return (
    <>
      {contextHolder}
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
            width: '80vw',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: '5vw',
            marginLeft: '10vw',
            marginRight: '10vw',
          }}
        >
          <i
            className="fa fa-angle-left"
            style={{ fontSize: 28, marginRight: 30, marginBottom: 15 }}
            onClick={() => navigate('/auth/signin')}
          ></i>
          <h2 style={{ fontSize: 26 }}>Reset Password</h2>
        </div>
        <form
          style={{
            position: 'fixed',
            top: '30vh',
            width: '80vw',
            backgroundColor:
              'linear-gradient(135deg, #f9f8ff 0%, #ece7fa 100%)',
            marginLeft: '10vw',
            marginRight: '10vw',
          }}
        >
          <div className="container">
            <label className="label">Email ID</label>
            <div className="input-container">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter associated account email ID"
                required
                className={error ? 'input-error' : ''}
                style={{
                  marginBottom: 10,
                  marginTop: 5,
                  backgroundColor: 'white',
                  borderColor: '#ddd',
                  borderRadius: 10,
                  fontSize: 16,
                  padding: 10,
                }}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
          </div>
        </form>
        <div
          style={{
            position: 'absolute',
            bottom: '0vh',
            width: '100vw',
            backgroundColor:
              'linear-gradient(135deg, #f9f8ff 0%, #ece7fa 100%)',
            borderTop: '0.2vh solid #624a92',
            textAlign: 'center',
          }}
        >
          <button
            style={{
              marginTop: 20,
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
            onClick={() => handleSubmit()}
          >
            Send Password Link
          </button>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
