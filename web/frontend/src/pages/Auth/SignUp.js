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
  AuthSuccessNotice,
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
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        fullName: form.fullName,
        email: trimmedEmail,
        password: form.password,
        company: form.company
      });
      setFieldErrors({});
      setError('');
      setSuccessMessage(
        response.data?.message || 'Account created. Check your email to verify your account.'
      );
      setSubmitted(true);
      setForm(initialForm);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'An error occurred while creating your account. Please try again.'
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
            <AuthEyebrow>Create your account</AuthEyebrow>
            <AuthHeading>Start bookmarking important ChatGPT messages in one place.</AuthHeading>
            <AuthText>
              New accounts now require email verification before the first login. After sign-up, we send
              a verification link to the address you provide.
            </AuthText>
            <AuthText>
              Once the email is confirmed, the same credentials can be used to access the product.
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
              {successMessage ? <AuthSuccessNotice>{successMessage}</AuthSuccessNotice> : null}

              <AuthHelperText>
                {submitted
                  ? 'Your account is pending verification. Open the email we sent and follow the link.'
                  : 'Your account will stay locked until the verification link is completed.'}
              </AuthHelperText>

              <AuthFooter>
                Already have an account? <Link to='/log-in'>Log in</Link>
              </AuthFooter>
            </AuthForm>
          </AuthCard>
        </AuthGrid>
      </Container>
    </AuthSection>
  );
}

export default SignUp;
