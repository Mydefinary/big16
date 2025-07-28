// src/router/index.jsx
import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from '@/pages/Login'

const Router = () => {
  return (
    <Routes>
    <Route path="/" element={<Navigate to="/login" />} />
    <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default Router
