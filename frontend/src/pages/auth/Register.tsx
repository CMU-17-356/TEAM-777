import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import axios from 'axios';
import { API_BASE_URL } from '../../App';
import { message } from 'antd';

interface FormData {
  username: string;
  email: string;
  password: string;
}

interface Errors {
  username?: string;
  email?: string;
  password?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Errors>({});
  const [messageApi, contextHolder] = message.useMessage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(`The entered credentials are:\n 
      username: ${formData.username} \n
      email: ${formData.email} \n
      password: ${formData.password}`);

    let isValid = true;
    const newErrors: Errors = {};

    if (!formData.username) {
      isValid = false;
      newErrors.username = 'Username is required.';
    }
    if (!formData.email) {
      isValid = false;
      newErrors.email = 'Email is required.';
    } else if (!formData.email.includes('@')) {
      isValid = false;
      newErrors.email = 'Please enter a valid email.';
    }

    if (!formData.password) {
      isValid = false;
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      isValid = false;
      newErrors.password =
        'Invalid Password. Passwords must be 8 or more characters.';
    }

    if (isValid) {
      try {
        const bodyContent = JSON.stringify(formData);
        console.log(`Body payload: \n ${bodyContent}`);
        const response = await axios.post(
          `${API_BASE_URL}/auth/register`,
          {
            // backend route
            username: formData.username,
            email: formData.email,
            password: formData.password,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (response.data.success) {
          messageApi.success(
            response.data.message ||
              `Email verification link is sent to ${formData.email}`,
          );
          console.log(`Email verification link is sent to ${formData.email}`);
        } else {
          console.error('Registration failed:', response.data.message);
        }
      } catch (error: any) {
        const errMsg =
          error.response.data.message || 'Error submitting the form';
        messageApi.error(errMsg);
        console.error('Error submitting the form:', error);
      }
    } else {
      setErrors(newErrors);
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
        }}
      >
        <form className="register-form" onSubmit={handleSubmit}>
          <h2 style={{ fontSize: 28, marginBottom: 30 }}>Create an Account</h2>
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              className={errors.username ? 'input-error' : ''}
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
            {errors.username && (
              <span className="error-text">{errors.username}</span>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className={errors.email ? 'input-error' : ''}
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
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
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
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <button type="submit" className="register-button">
            Sign Up
          </button>
        </form>

        <div className="footer">
          <p className="footer-text">
            Already have an account?{' '}
            <span
              className="create-account-link"
              onClick={() => navigate('/auth/signin')}
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
