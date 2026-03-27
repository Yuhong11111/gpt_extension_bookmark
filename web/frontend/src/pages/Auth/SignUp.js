import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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
  FieldRow,
  FieldLabel,
  FieldInput,
  FieldError,
  FieldCheckboxRow,
  FieldCheckboxLabel,
  AuthNotice,
  AuthHelperText,
  AuthFooter
} from './SignUp.elements';

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  company: '',
  agree: false
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignUp() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (submitted) {
      setSubmitted(false);
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextFieldErrors = {};
    const trimmedEmail = form.email.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextFieldErrors.email = 'Enter a valid email address.';
    }

    if (form.password.length < 8) {
      nextFieldErrors.password = 'Password must be at least 8 characters.';
    }

    if (form.password !== form.confirmPassword) {
      nextFieldErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitted(false);
      setError('Please fix the highlighted fields.');
      return;
    }

    try {
      axios.post(`${API_BASE_URL}/auth/signup`, {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        company: form.company,
        agree: form.agree
      });
    } catch (err) {
      setError('An error occurred while creating your account. Please try again.');
      setSubmitted(false);
      return;
    }

    setFieldErrors({});
    setError('');
    setSubmitted(true);
  };

  return (
    <AuthSection>
      <Container>
        <AuthGrid>
          <AuthIntro>
            <AuthEyebrow>Create your account</AuthEyebrow>
            <AuthHeading>Start bookmarking important ChatGPT messages in one place.</AuthHeading>
            <AuthText>
              This form is front-end only for now. It gives you a proper sign-up flow layout and can be
              connected to the backend later when account APIs exist.
            </AuthText>
            <AuthText>
              Use it as the entry point for onboarding, waitlist capture, or account creation once the
              backend is ready.
            </AuthText>
          </AuthIntro>

          <AuthCard>
            <AuthForm onSubmit={handleSubmit}>
              <FieldRow>
                <FieldGroup>
                  <FieldLabel htmlFor='fullName'>Full name</FieldLabel>
                  <FieldInput
                    id='fullName'
                    name='fullName'
                    type='text'
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder='Jane Doe'
                    required
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor='company'>Company</FieldLabel>
                  <FieldInput
                    id='company'
                    name='company'
                    type='text'
                    value={form.company}
                    onChange={handleChange}
                    placeholder='Optional'
                  />
                </FieldGroup>
              </FieldRow>

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

              <FieldRow>
                <FieldGroup>
                  <FieldLabel htmlFor='password'>Password</FieldLabel>
                  <FieldInput
                    id='password'
                    name='password'
                    type='password'
                    value={form.password}
                    onChange={handleChange}
                    placeholder='Create a password'
                    required
                  />
                  {fieldErrors.password ? <FieldError>{fieldErrors.password}</FieldError> : null}
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor='confirmPassword'>Confirm password</FieldLabel>
                  <FieldInput
                    id='confirmPassword'
                    name='confirmPassword'
                    type='password'
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder='Repeat password'
                    required
                  />
                  {fieldErrors.confirmPassword ? (
                    <FieldError>{fieldErrors.confirmPassword}</FieldError>
                  ) : null}
                </FieldGroup>
              </FieldRow>

              <FieldCheckboxRow>
                <input
                  id='agree'
                  name='agree'
                  type='checkbox'
                  checked={form.agree}
                  onChange={handleChange}
                  required
                />
                <FieldCheckboxLabel htmlFor='agree'>
                  I agree to the terms and want product updates by email.
                </FieldCheckboxLabel>
              </FieldCheckboxRow>

              <Button primary type='submit'>
                Create Account
              </Button>

              {error ? <AuthNotice>{error}</AuthNotice> : null}

              <AuthHelperText>
                {submitted
                  ? 'Form submitted locally. Connect this page to your backend to create real accounts.'
                  : 'Accounts are not persisted yet. This is the front-end form scaffold.'}
              </AuthHelperText>

              <AuthFooter>
                Already have an account? <Link to='/login'>Log in</Link>
              </AuthFooter>
            </AuthForm>
          </AuthCard>
        </AuthGrid>
      </Container>
    </AuthSection>
  );
}

export default SignUp;
