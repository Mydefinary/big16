import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
  const { token, refreshToken, logout, updateTokens } = useAuth();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // JWT 토큰 파싱하여 정보 추출
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTokenInfo({
          userId: payload.sub,
          issuedAt: new Date(payload.iat * 1000).toLocaleString(),
          expiresAt: new Date(payload.exp * 1000).toLocaleString(),
          isExpired: payload.exp * 1000 < Date.now()
        });
      } catch (error) {
        console.error('Token parsing error:', error);
        toast.error('토큰 정보를 파싱하는 중 오류가 발생했습니다.', {
          position: "top-right",
          autoClose: 5000,
        });
      }
    }
  }, [token]);

  // 토큰 리프레시 이벤트 리스너
  useEffect(() => {
    const handleTokenRefresh = (event) => {
      const { accessToken, refreshToken: newRefreshToken } = event.detail;
      updateTokens(accessToken, newRefreshToken);
      toast.success('토큰이 자동으로 갱신되었습니다!', {
        position: "top-right",
        autoClose: 3000,
      });
    };

    const handleAuthRequired = () => {
      logout();
      navigate('/login');
      toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
        position: "top-right",
        autoClose: 5000,
      });
    };

    window.addEventListener('tokenRefreshed', handleTokenRefresh);
    window.addEventListener('authRequired', handleAuthRequired);

    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh);
      window.removeEventListener('authRequired', handleAuthRequired);
    };
  }, [updateTokens, logout, navigate]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
      toast.success('로그아웃이 완료되었습니다.', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('로그아웃 처리 중 오류가 발생했습니다.', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      logout();
      navigate('/login');
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    if (!refreshToken) {
      toast.error('리프레시 토큰이 없습니다.', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.refreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // updateTokens 함수로 새 토큰 저장
      const success = updateTokens(accessToken, newRefreshToken);
      
      if (success) {
        toast.success('토큰이 성공적으로 갱신되었습니다!', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        throw new Error('Invalid token received');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      const message = typeof error.response?.data === 'string' 
        ? error.response.data 
        : error.response?.data?.message || '토큰 갱신에 실패했습니다.';
      
      toast.error(message, {
        position: "top-right",
        autoClose: 5000,
      });
      
      logout();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = () => {
    toast.info('비밀번호 변경 기능은 추후 구현 예정입니다.', {
      position: "top-center",
      autoClose: 3000,
    });
  };

  const handleAccountDelete = () => {
    toast.warn('회원 탈퇴 기능은 추후 구현 예정입니다.', {
      position: "top-center",
      autoClose: 3000,
    });
  };

  // 토큰이 없는 경우 로그인으로 리다이렉트
  if (!token) {
    navigate('/login');
    return null;
  }

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
              <li><strong>새로고침 안전:</strong> 페이지 새로고침 시에도 유효한 토큰을 자동으로 확인합니다.</li>
            </ul>
          </div>
        </div>

        <div className="user-actions">
          <h2>👤 사용자 기능</h2>
          <div className="action-buttons">
            <button 
              onClick={handlePasswordChange}
              className="action-button secondary"
            >
              🔒 비밀번호 변경
            </button>
            
            <button 
              onClick={handleAccountDelete}
              className="action-button danger"
            >
              ❌ 회원 탈퇴
            </button>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Dashboard;