// src/App.jsx

import './App.css';
import Header from './components/Header';
import GoodsForm from './components/GoodsForm.tsx';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="App">
        <Header />
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>로딩 중...</h2>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="App">
        <Header />
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>⚠️ 로그인이 필요합니다</h2>
          <p>굿즈 생성기를 사용하려면 먼저 로그인해주세요.</p>
          <a href="http://20.249.113.18:9000/login" style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            backgroundColor: '#09AA5C', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '5px',
            marginTop: '20px'
          }}>
            로그인하러 가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <GoodsForm />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;