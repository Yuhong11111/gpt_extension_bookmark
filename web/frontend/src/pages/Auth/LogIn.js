import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container } from '../../globalStyles';
import api from '../../api';
import useNavigate from '../../hooks/useNavigate';
import {
  AuthSection,
  AuthGrid,
  AuthIntro,
  AuthEyebrow,
  AuthHeading,
  AuthText,
  AuthCard,
  AuthForm,
  FieldGroup,
  FieldLabel,
  FieldInput,
  FieldError,
  AuthInlineAction,
  FieldCheckboxRow,
  FieldCheckboxLabel,
  AuthNotice,
  AuthSuccessNotice,
  AuthHelperText,
  AuthFooter
} from './SignUp.elements';

const initialForm = {
  email: '',
  password: '',
  rememberMe: false
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LogIn() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (submitted) {
      setSubmitted(false);
    }
    if (successMessage) {
      setSuccessMessage('');
    }
    if (error) {
      setError('');
    }
    if (fieldErrors[name]) {
      setFieldErrors((current) => ({ ...current, [name]: '' }));
    }
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextFieldErrors = {};
    const trimmedEmail = form.email.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextFieldErrors.email = 'Enter a valid email address.';
    }

    if (form.password.trim().length < 8) {
      nextFieldErrors.password = 'Password must be at least 8 characters.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitted(false);
      setError('Please fix the highlighted fields.');
      return;
    }
    try {
      const response = await api.post('/auth/login', {
        email: trimmedEmail,
        password: form.password,
        rememberMe: form.rememberMe
      });
      setFieldErrors({});
      setError('');
      setSuccessMessage(response.data?.message || 'Login successful.');
      setSubmitted(true);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 'An error occurred during login. Please try again.'
      );
      setSubmitted(false);
      return;
    }
  };

  return (
    <AuthSection>
      <Container>
        <AuthGrid>
          <AuthIntro>
            <AuthEyebrow>Welcome back</AuthEyebrow>
            <AuthHeading>Log in to manage your bookmarks and account settings.</AuthHeading>
            <AuthText>
              Email verification is enforced before login, so new accounts must confirm their inbox first.
            </AuthText>
            <AuthText>
              Once verified, this form submits directly to the backend auth endpoint.
            </AuthText>
          </AuthIntro>

          <AuthCard>
            <AuthForm onSubmit={handleSubmit}>
              <FieldGroup>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <FieldInput
                  id='email'
                  name='email'
                  type='email'
                  value={form.email}
                  onChange={handleChange}
                  placeholder='you@example.com'
                  required
                />
                {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : null}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor='password'>Password</FieldLabel>
                <FieldInput
                  id='password'
                  name='password'
                  type='password'
                  value={form.password}
                  onChange={handleChange}
                  placeholder='Enter your password'
                  required
                />
                {fieldErrors.password ? <FieldError>{fieldErrors.password}</FieldError> : null}
                <AuthInlineAction to='/forgot-password'>Forgot password?</AuthInlineAction>
              </FieldGroup>

              <FieldCheckboxRow>
                <input
                  id='rememberMe'
                  name='rememberMe'
                  type='checkbox'
                  checked={form.rememberMe}
                  onChange={handleChange}
                />
                <FieldCheckboxLabel htmlFor='rememberMe'>
                  Keep me signed in on this device.
                </FieldCheckboxLabel>
              </FieldCheckboxRow>

              <Button primary type='submit'>
                Log In
              </Button>

              {error ? <AuthNotice>{error}</AuthNotice> : null}
              {successMessage ? <AuthSuccessNotice>{successMessage}</AuthSuccessNotice> : null}

              <AuthHelperText>
                {submitted
                  ? 'Authentication cookie issued. Redirecting to your dashboard.'
                  : 'If login is rejected, confirm that the account email has already been verified.'}
              </AuthHelperText>

              <AuthFooter>
                Need an account? <Link to='/sign-up'>Create one</Link>
              </AuthFooter>
            </AuthForm>
          </AuthCard>
        </AuthGrid>
      </Container>
    </AuthSection>
  );
}

export default LogIn;
