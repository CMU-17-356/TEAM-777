import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignIn.css';
import axios from 'axios';
import { API_BASE_URL } from '../../App';

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

    if (newErrors.identifier || newErrors.password) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          // backend route
          identifier: formData.identifier,
          password: formData.password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      console.log('Login successful:', response.data);

      navigate('/groups', { state: { userId: response.data.userId } });
    } catch (error) {
      setErrors((prev) => ({ ...prev, password: (error as Error).message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-email-page">
      <div className="signin-form">
        <h2>Log in to your Account</h2>
        <label className="label">Email</label>
        <div className="signin-group-email">
          <input
            type="text"
            value={formData.identifier}
            onChange={handleInputChange}
            name="identifier"
            placeholder="Enter your email"
            required
            className={errors.identifier ? 'input-error' : ''}
          />
        </div>
        {errors.identifier && <p className="error-text">{errors.identifier}</p>}

        <label className="label">Password</label>
        <div className="signin-group-email">
          <input
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            name="password"
            placeholder="Enter your password"
            required
            className={errors.password ? 'input-error' : ''}
          />
        </div>
        {errors.password && <p className="error-text">{errors.password}</p>}

        <div className="form-options">
          <label className="checkbox-label">
            <input type="checkbox" /> Remember me
          </label>
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
  );
};

export default SignIn;
