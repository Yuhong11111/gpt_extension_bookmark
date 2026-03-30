import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { search } = useLocation();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const requestedTokenRef = useRef(null);

  useEffect(() => {
    // extract the token from the query parameters, if it doesn't exist, show an error message and return
    const token = new URLSearchParams(search).get('token');

    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }

    if (requestedTokenRef.current === token) {
      return;
    }
    requestedTokenRef.current = token;

    let active = true;
    let redirectTimeout;

    const verifyEmail = async () => {
      try {
        const response = await api.get('/auth/verify-email', {
          params: { token }
        });
        if (!active) {
          return;
        }
        setStatus('success');
        setMessage(
          response.data?.message || 'Email verified. Redirecting you to the dashboard...'
        );
        redirectTimeout = window.setTimeout(() => {
          if (active) {
            navigate('/dashboard');
          }
        }, 1500);
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
      if (redirectTimeout) {
        window.clearTimeout(redirectTimeout);
      }
    };
  }, [navigate, search]);

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
              <Link to={status === 'success' ? '/dashboard' : '/log-in'}>
                {status === 'success' ? 'Go to dashboard' : 'Go to login'}
              </Link>
            </AuthFooter>
          </AuthCard>
        </AuthGrid>
      </Container>
    </AuthSection>
  );
}

export default VerifyEmail;
