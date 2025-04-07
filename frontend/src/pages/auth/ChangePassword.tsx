import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../App';

const ChangePassword: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [errorPassword, setErrorPassword] = useState<string>('');
  const [errorConfirmPassword, setErrorConfirmPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setErrorPassword('');
    setErrorConfirmPassword('');
    setMessage('');
    if (!password) {
      setErrorPassword('Password is required.');
    } else if (password.length < 8) {
      setErrorPassword(
        'Invalid Password. Passwords must be 8 or more characters.',
      );
    }

    if (!confirmPassword) {
      setErrorConfirmPassword('Confirm Password is required.');
    } else if (password !== confirmPassword) {
      setErrorConfirmPassword('Passwords do not match.');
    }
    if (errorPassword || errorConfirmPassword) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/change-password`,
        {
          token,
          password,
        },
      );
      setMessage(response.data.message);
      setTimeout(() => navigate('/auth/signin'), 3000); // Redirect to login after success
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  useEffect(() => {
    // Optionally verify the token here
  }, [token]);

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
          onClick={() => navigate('/auth/reset-password')}
        ></i>
        <h2 style={{ fontSize: 26 }}>Change Password</h2>
      </div>

      <form
        style={{
          position: 'fixed',
          top: '30vh',
          width: '80vw',
          backgroundColor: 'linear-gradient(135deg, #f9f8ff 0%, #ece7fa 100%)',
          marginLeft: '10vw',
          marginRight: '10vw',
        }}
      >
        <div className="container">
          <label className="label">Change Password</label>
          <p style={{ marginTop: 10 }}>Enter a new and strong password.</p>
          <div className="input-container">
            <input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder="New password"
              required
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
            {errorPassword && <p className="error-text">{errorPassword}</p>}
          </div>
          <div className="input-container">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Retype new password"
              required
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
            {errorConfirmPassword && (
              <p className="error-text">{errorConfirmPassword}</p>
            )}
          </div>
        </div>
        {message && <p className="error-text">{message}</p>}
      </form>
      <div
        style={{
          position: 'absolute',
          bottom: '0vh',
          width: '100vw',
          backgroundColor: 'linear-gradient(135deg, #f9f8ff 0%, #ece7fa 100%)',
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
          Confirm & Continue
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;
