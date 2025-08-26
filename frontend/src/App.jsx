import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SecurityProvider from './components/SecurityProvider'; // 보안 컴포넌트 추가
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import TokenRequiredPage from './components/TokenRequiredPage';
import ComingSoonPage from './components/ComingSoonPage';
import WebtoonDetail from './components/WebtoonDetail';
import WebtoonDashboardEmbed from './components/WebtoonDashboardEmbed';
import PPLGeneratorEmbed from './components/PPLGeneratorEmbed';
import GoodsGeneratorEmbed from './components/GoodsGeneratorEmbed';
import WebtoonHighlightCreator from './components/WebtoonHighlightCreator';
import ChatbotPage from './components/ChatbotPage';
import Board from './components/Board';
import ScrollToTop from './components/ScrollToTop';
import Main from './pages/Main';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import FindId from './pages/FindId';
import FindPassword from './pages/FindPassword';
import Dashboard from './pages/Dashobard/Dashboard';
import MyPage from './pages/MyPage';
import FAQ from './pages/FAQ';
import TermsAgreement from './pages/TermsAgreement';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <SecurityProvider> {/* 보안 컴포넌트로 전체 앱을 감쌈 */}
          <div className="App">
            <ScrollToTop />
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Main />}/>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/email-verification" element={<EmailVerification />} />
                <Route path="/find-id" element={<FindId />} />
                <Route path="/find-password" element={<FindPassword />} />
                <Route path="/notice-board" element={<Board />} />
                <Route path="/terms" element={<TermsAgreement />} />
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
                   path="/chat-bot"
                   element={
                    <TokenRequiredPage
                       pageName="챗봇"
                       description="AI 기술을 활용한 챗봇 시스템입니다."
                      DetailComponent={ChatbotPage}
                    />
                  }
                 />
                <Route
                   path="/webtoon-highlight-creator"
                   element={
                    <TokenRequiredPage
                       pageName="하이라이트 제작"
                       description="AI 기술을 활용하여 하이라이트를 제작할 수 있습니다. 다양한 스타일과 옵션을 통해 나만의 특별한 캐릭터를 만들어보세요."
                       DetailComponent={WebtoonHighlightCreator}
                    />
                  }
                 />
                <Route
                   path="/webtoon-ppl-generator"
                   element={
                    <TokenRequiredPage
                       pageName="광고 생성기"
                       description="창의적인 광고 소재를 자동으로 생성하는 고급 기능입니다. 트렌드에 맞는 소재들을 빠르게 제작할 수 있습니다."
                       DetailComponent={PPLGeneratorEmbed}
                    />
                  }
                 />
                <Route
                   path="/webtoon-goods-generator"
                   element={
                    <TokenRequiredPage
                       pageName="굿즈 생성기"
                       description="굿즈 생성기 페이지입니다."
                       DetailComponent={GoodsGeneratorEmbed}
                    />
                  }
                 />
                <Route
                  path="/webtoon-dashboard"
                  element={
                    <TokenRequiredPage
                      pageName="웹툰 대시보드"
                      description="웹툰 대시보드 페이지입니다. 웹툰 관련 데이터와 분석 정보를 확인할 수 있습니다."
                      DetailComponent={WebtoonDashboardEmbed}
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
        </SecurityProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;