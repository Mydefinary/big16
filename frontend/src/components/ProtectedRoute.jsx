import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;