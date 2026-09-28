import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../api/api';

/**
 * Wrap any route that requires a signed-in user.
 * If the user is not authenticated, redirect them to /signin.
 * The original path is passed in `state.from` so we can send them
 * back after they log in.
 */
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <>{children}</>;
};

export default AuthGuard;