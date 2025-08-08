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
                                         
              {/* 토큰이 필요한 페이지들 */}
               <Route
                 path="/question"
                 element={
                  <TokenRequiredPage
                     pageName="작품 상세페이지"
                     description="AI 기술을 활용한 웹툰 제작 워크플로우 시스템입니다. 콘텐츠 기획부터 배포까지의 전 과정을 AI가 지원하여 효율적인 웹툰 제작을 가능하게 합니다."
                    DetailComponent={WebtoonDetail}
                  />
                }
               />
              <Route
                 path="/characters"
                 element={
                  <TokenRequiredPage
                     pageName="하이라이트 제작"
                     description="AI 기술을 활용하여 하이라이트를 제작할 수 있습니다. 다양한 스타일과 옵션을 통해 나만의 특별한 캐릭터를 만들어보세요."
                  />
                }
               />
              <Route
                 path="/gallery"
                 element={
                  <TokenRequiredPage
                     pageName="웹툰 상세 분석"
                     description="웹툰들을 분석하고 활용할 수 있는 전문 도구입니다. 효과적인 콘텐츠 제작을 위한 인사이트를 얻어보세요."
                  />
                }
               />
              <Route
                 path="/community"
                 element={
                  <TokenRequiredPage
                     pageName="광고 초안 생성"
                     description="창의적인 광고 소재를 자동으로 생성하는 고급 기능입니다. 트렌드에 맞는 소재들을 빠르게 제작할 수 있습니다."
                  />
                }
               />
              <Route
                 path="/board"
                 element={
                  <TokenRequiredPage
                     pageName="광고 파트너십 문의"
                     description="광고 파트너십과 관련하여 문의하는 페이지입니다."
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