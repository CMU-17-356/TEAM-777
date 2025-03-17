import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import axios from 'axios';
import { API_BASE_URL } from '../../App';

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
          console.log('User registered successfully.');
          navigate('/auth/signin');
        } else {
          console.error('Registration failed:', response.data.message);
        }
      } catch (error) {
        console.error('Error submitting the form:', error);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="register-email-page">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Create an Account</h2>
        <label className="label">Username</label>
        <div className="register-group-email">
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Enter your username"
            className={errors.username ? 'input-error' : ''}
          />
        </div>
        {errors.username && (
          <span className="error-text">{errors.username}</span>
        )}

        <label className="label">Email</label>
        <div className="register-group-email">
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            className={errors.email ? 'input-error' : ''}
          />
        </div>
        {errors.email && <span className="error-text">{errors.email}</span>}

        <label className="label">Password</label>
        <div className="register-group-email">
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            className={errors.password ? 'input-error' : ''}
          />
        </div>
        {errors.password && (
          <span className="error-text">{errors.password}</span>
        )}

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
  );
};

export default Register;
