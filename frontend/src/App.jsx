import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import TokenRequiredPage from './components/TokenRequiredPage';
import ComingSoonPage from './components/ComingSoonPage';
import WebtoonDetail from './components/WebtoonDetail';
import Main from './pages/Main';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import FindId from './pages/FindId';
import FindPassword from './pages/FindPassword';
import Dashboard from './pages/Dashboard';
import MyPage from './pages/MyPage'; // MyPage 추가
import FAQ from './pages/FAQ';
import './App.css';
// redeploy trigger
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
                      
              <Route path="/" element={<Main />}/>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/email-verification" element={<EmailVerification />} />
              <Route path="/find-id" element={<FindId />} />
              <Route path="/find-password" element={<FindPassword />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* MyPage 추가 - 보호된 라우트 */}
              <Route
                path="/mypage"
                element={
                  <ProtectedRoute>
                    <MyPage />
                  </ProtectedRoute>
                }
              />
                                         
              {/* 서비스 라우트들은 Gateway에서 직접 처리 */}
                             
              {/* FAQ는 토큰 없이도 접근 가능 */}
              <Route
                 path="/faq"
                 element={<FAQ />}
               />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;