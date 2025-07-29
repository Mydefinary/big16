import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PasswordResetRequest from '@/pages/PasswordResetRequest';
import PasswordResetConfirm from '@/pages/PasswordResetConfirm';

const Router = () => {
  const location = useLocation();

  return (
    <TransitionGroup>
      <CSSTransition
        key={location.pathname}
        classNames="page"
        timeout={300}
        unmountOnExit
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password-reset" element={<PasswordResetRequest />} />
          <Route path="/password-reset/confirm" element={<PasswordResetConfirm />} />
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
};

export default Router;
