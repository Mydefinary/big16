import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      isAuthenticated: () => false,
      token: null,
      refreshToken: null,
      logout: () => {}
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const value = {
    isAuthenticated: () => false,
    token: null,
    refreshToken: null,
    logout: () => {}
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};