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
  FieldRow,
  FieldLabel,
  FieldInput,
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

function SignUp() {
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
    if (form.password !== form.confirmPassword) {
      setSubmitted(false);
      setError('Passwords do not match.');
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
