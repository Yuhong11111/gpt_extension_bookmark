import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container } from '../../globalStyles';
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
  AuthInlineAction,
  FieldCheckboxRow,
  FieldCheckboxLabel,
  AuthNotice,
  AuthHelperText,
  AuthFooter
} from './SignUp.elements';

const initialForm = {
  email: '',
  password: '',
  rememberMe: false
};

function LogIn() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (submitted) {
      setSubmitted(false);
    }
    if (error) {
      setError('');
    }
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setSubmitted(false);
      setError('Email and password are required.');
      return;
    }

    setError('');
    setSubmitted(true);
  };

  return (
    <AuthSection>
      <Container>
        <AuthGrid>
          <AuthIntro>
            <AuthEyebrow>Welcome back</AuthEyebrow>
            <AuthHeading>Log in to manage your bookmarks and account settings.</AuthHeading>
            <AuthText>
              This page is the front-end login flow. It is ready for real authentication once your backend
              exposes a login endpoint.
            </AuthText>
            <AuthText>
              For now, the UI handles input, basic validation, and a realistic auth layout that matches the
              signup page.
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

              <AuthHelperText>
                {submitted
                  ? 'Login submitted locally. Connect this page to your backend to authenticate users.'
                  : 'Authentication is not connected yet. This is the front-end login scaffold.'}
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
