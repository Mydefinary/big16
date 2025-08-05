import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Dashboard = () => {
  const { token, refreshToken, logout } = useAuth();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // JWT 토큰 파싱하여 정보 추출
    if (token) {
      try {
        // JWT 토큰의 payload 부분 디코딩
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTokenInfo({
          userId: payload.sub,
          issuedAt: new Date(payload.iat * 1000).toLocaleString(),
          expiresAt: new Date(payload.exp * 1000).toLocaleString(),
          isExpired: payload.exp * 1000 < Date.now()
        });
      } catch (error) {
        console.error('Token parsing error:', error);
      }
    }
  }, [token]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // 서버에 로그아웃 요청
      await authAPI.logout(refreshToken);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 로컬 스토리지 정리 및 로그인 페이지로 이동
      logout();
      navigate('/login');
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    setLoading(true);
    try {
      const response = await authAPI.refreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // AuthContext의 login 함수로 새 토큰 저장
      const { login } = useAuth();
      login(accessToken, newRefreshToken);
      
      alert('토큰이 성공적으로 갱신되었습니다!');
    } catch (error) {
      console.error('Token refresh error:', error);
      alert('토큰 갱신에 실패했습니다. 다시 로그인해주세요.');
      logout();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🎉 로그인 성공!</h1>
        <p>JWT 토큰 정보를 확인할 수 있습니다.</p>
      </div>

      <div className="dashboard-content">
        <div className="token-info-section">
          <h2>🔑 JWT 토큰 정보</h2>
          
          {tokenInfo && (
            <div className="token-details">
              <div className="token-item">
                <strong>사용자 ID:</strong>
                <span>{tokenInfo.userId}</span>
              </div>
              
              <div className="token-item">
                <strong>발급 시간:</strong>
                <span>{tokenInfo.issuedAt}</span>
              </div>
              
              <div className="token-item">
                <strong>만료 시간:</strong>
                <span className={tokenInfo.isExpired ? 'expired' : 'valid'}>
                  {tokenInfo.expiresAt}
                  {tokenInfo.isExpired ? ' (만료됨)' : ' (유효함)'}
                </span>
              </div>
              
              <div className="token-item">
                <strong>토큰 상태:</strong>
                <span className={`status ${tokenInfo.isExpired ? 'expired' : 'valid'}`}>
                  {tokenInfo.isExpired ? '❌ 만료' : '✅ 유효'}
                </span>
              </div>
            </div>
          )}

          <div className="token-display">
            <h3>Access Token:</h3>
            <div className="token-value">
              <code>{token}</code>
            </div>
          </div>

          <div className="token-display">
            <h3>Refresh Token:</h3>
            <div className="token-value">
              <code>{refreshToken}</code>
            </div>
          </div>
        </div>

        <div className="dashboard-actions">
          <h2>🛠️ 토큰 관리</h2>
          
          <div className="action-buttons">
            <button 
              onClick={handleRefreshToken}
              className="action-button refresh"
              disabled={loading}
            >
              {loading ? '갱신 중...' : '🔄 토큰 갱신'}
            </button>
            
            <button 
              onClick={handleLogout}
              className="action-button logout"
              disabled={loading}
            >
              {loading ? '로그아웃 중...' : '🚪 로그아웃'}
            </button>
          </div>

          <div className="info-box">
            <h4>💡 기능 설명</h4>
            <ul>
              <li><strong>토큰 갱신:</strong> Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.</li>
              <li><strong>로그아웃:</strong> 서버에서 토큰을 무효화하고 로컬 스토리지를 정리합니다.</li>
              <li><strong>자동 갱신:</strong> API 요청 시 토큰이 만료되면 자동으로 갱신됩니다.</li>
            </ul>
          </div>
        </div>

        <div className="user-actions">
          <h2>👤 사용자 기능</h2>
          <div className="action-buttons">
            <button 
              onClick={() => alert('비밀번호 변경 기능은 추후 구현 예정입니다.')}
              className="action-button secondary"
            >
              🔒 비밀번호 변경
            </button>
            
            <button 
              onClick={() => alert('회원 탈퇴 기능은 추후 구현 예정입니다.')}
              className="action-button danger"
            >
              ❌ 회원 탈퇴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;