import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import TokenRequiredPage from './components/TokenRequiredPage';
import ComingSoonPage from './components/ComingSoonPage';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import FindId from './pages/FindId';
import FindPassword from './pages/FindPassword';
import Dashboard from './pages/Dashboard';
import FAQ from './pages/FAQ';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
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
              
              {/* 토큰이 필요한 페이지들 */}
              <Route 
                path="/characters" 
                element={
                  <TokenRequiredPage 
                    pageName="라이언캐릭터 제작" 
                    description="AI 기술을 활용하여 개성 있는 라이언 캐릭터를 제작할 수 있습니다. 다양한 스타일과 옵션을 통해 나만의 특별한 캐릭터를 만들어보세요."
                  />
                } 
              />
              <Route 
                path="/gallery" 
                element={
                  <TokenRequiredPage 
                    pageName="캔북 소재 본석" 
                    description="풍부한 캔북 소재들을 분석하고 활용할 수 있는 전문 도구입니다. 효과적인 콘텐츠 제작을 위한 인사이트를 얻어보세요."
                  />
                } 
              />
              <Route 
                path="/community" 
                element={
                  <TokenRequiredPage 
                    pageName="콘코 소재 생성" 
                    description="창의적인 콘코 소재를 자동으로 생성하는 고급 기능입니다. 트렌드에 맞는 소재들을 빠르게 제작할 수 있습니다."
                  />
                } 
              />
              <Route 
                path="/board" 
                element={
                  <TokenRequiredPage 
                    pageName="콘고 매수식별 움직" 
                    description="콘고 관련 매수 패턴을 식별하고 분석하는 전문 도구입니다. 정확한 데이터 분석을 통해 인사이트를 제공합니다."
                  />
                } 
              />
              
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