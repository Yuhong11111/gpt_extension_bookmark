import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { Container } from '../../globalStyles';
import {
  AuthSection,
  AuthGrid,
  AuthIntro,
  AuthEyebrow,
  AuthHeading,
  AuthText,
  AuthCard,
  AuthNotice,
  AuthSuccessNotice,
  AuthFooter
} from './SignUp.elements';

function VerifyEmail() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const { search } = useLocation();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    // extract the token from the query parameters, if it doesn't exist, show an error message and return
    const token = new URLSearchParams(search).get('token');

    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }

    let active = true;

    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/verify-email`, {
          params: { token }
        });
        if (!active) {
          return;
        }
        setStatus('success');
        setMessage(response.data?.message || 'Email verified. You can now log in.');
      } catch (err) {
        if (!active) {
          return;
        }
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'The verification link is invalid or has expired.'
        );
      }
    };

    verifyEmail();

    return () => {
      active = false;
    };
  }, [API_BASE_URL, search]);

  return (
    <AuthSection>
      <Container>
        <AuthGrid>
          <AuthIntro>
            <AuthEyebrow>Email verification</AuthEyebrow>
            <AuthHeading>Confirm your inbox to unlock your account.</AuthHeading>
            <AuthText>
              Every new signup remains inactive until the verification link is completed.
            </AuthText>
            <AuthText>
              If this page fails, the token may have expired or the email may have been opened already.
            </AuthText>
          </AuthIntro>

          <AuthCard>
            {status === 'success' ? (
              <AuthSuccessNotice>{message}</AuthSuccessNotice>
            ) : (
              <AuthNotice>{message}</AuthNotice>
            )}

            <AuthFooter>
              <Link to='/log-in'>Go to login</Link>
            </AuthFooter>
          </AuthCard>
        </AuthGrid>
      </Container>
    </AuthSection>
  );
}

export default VerifyEmail;
