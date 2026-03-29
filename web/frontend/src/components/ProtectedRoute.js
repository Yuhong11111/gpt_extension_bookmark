import React, { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import api from '../api';

function ProtectedRoute({ component: Component, ...rest }) {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    user: null
  });

  useEffect(() => {
    let isMounted = true;

    // call the backend to check if the user is authenticated, if the request succeeds, set isAuthenticated to true and store the user info, if it fails, set isAuthenticated to false
    api.get('/auth/me')
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: response.data
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Route
      {...rest}
      render={(routeProps) => {
        if (authState.isLoading) {
          return <div>Checking authentication...</div>;
        }

        if (!authState.isAuthenticated) {
          return <Redirect to='/log-in' />;
        }

        return <Component {...routeProps} authenticatedUser={authState.user} />;
      }}
    />
  );
}

export default ProtectedRoute;
