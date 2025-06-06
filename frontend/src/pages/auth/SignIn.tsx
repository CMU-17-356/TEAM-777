import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import axios from 'axios';
import { API_BASE_URL } from '../../App';
import { message } from 'antd'; // <--- 1) Import message from 'antd'

interface FormData {
  identifier: string;
  password: string;
}

interface Errors {
  identifier: string;
  password: string;
}

const SignIn: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    identifier: '',
    password: '',
  });

  const [errors, setErrors] = useState<Errors>({
    identifier: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 2) Destructure message useMessage hook
  const [messageApi, contextHolder] = message.useMessage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrors({ identifier: '', password: '' });

    let newErrors: Errors = { identifier: '', password: '' };

    if (!formData.identifier) {
      newErrors.identifier = 'Email is required.';
    } else if (!formData.identifier.includes('@')) {
      newErrors.identifier = 'Please enter a valid email.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password =
        'Invalid Password. Passwords must be 8 or more characters.';
    }

    // If there are validation errors, show them and stop
    if (newErrors.identifier || newErrors.password) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          identifier: formData.identifier,
          password: formData.password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      // Sign in successful
      console.log('Login successful:', response.data);

      // 3) Show success message
      messageApi.success('Login successful! Redirecting to your groups...');

      // Optionally navigate after a short delay so the user sees the message
      setTimeout(() => {
        navigate('/groups', { state: { userId: response.data.userId } });
      }, 2000);
    } catch (error: any) {
      // 4) Show error message
      const errMsg =
        error?.response?.data?.message || 'Login failed. Please try again.';
      messageApi.error(errMsg);

      setErrors((prev) => ({ ...prev, password: errMsg }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 5) contextHolder ensures messages render */}
      {contextHolder}

      <div
        style={{
          background: 'linear-gradient(135deg, #f9f8ff 0%, #ece7fa 100%)',
          minHeight: '100vh',
          padding: '40px 0px',
        }}
      >
        <div className="signin-form">
          <h2 style={{ fontSize: 28, marginBottom: 30 }}>
            Log in to your Account
          </h2>
          <div>
            <label className="label">Email</label>
            <input
              type="text"
              value={formData.identifier}
              onChange={handleInputChange}
              name="identifier"
              placeholder="Enter your email"
              required
              className={errors.identifier ? 'input-error' : ''}
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
          {errors.identifier && (
            <p className="error-text">{errors.identifier}</p>
          )}

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              name="password"
              placeholder="Enter your password"
              required
              className={errors.password ? 'input-error' : ''}
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
          {errors.password && <p className="error-text">{errors.password}</p>}

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" /> Remember me
            </label>
            <span
              style={{
                color: '#624a92',
                fontSize: 14,
                textDecoration: 'underline',
                alignItems: 'center',
              }}
              onClick={() => navigate('/auth/reset-password')}
            >
              Forgot Password?
            </span>
          </div>

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="signin-button"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>

        <div className="footer">
          <p className="footer-text">
            Don't have an account?{' '}
            <span
              className="create-account-link"
              onClick={() => navigate('/auth/register')}
            >
              Create new account
            </span>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignIn;
