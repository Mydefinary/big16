import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
  const { logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 로그인한 유저 정보 불러오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await authAPI.me(); // 서버에서 쿠키 인증 후 유저 정보 반환
        setUserInfo(res.data);
      } catch (error) {
        console.error('사용자 정보 불러오기 실패:', error);
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
          position: "top-right",
          autoClose: 5000,
        });
        logout();
        navigate('/login');
      }
    };
    fetchUserInfo();
  }, [logout, navigate]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authAPI.logout(); // 서버에서 쿠키 삭제
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

  if (!userInfo) {
    return <p>사용자 정보를 불러오는 중...</p>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🎉 로그인 성공!</h1>
        <p>{userInfo.username}님 환영합니다!</p>
      </div>

      <div className="dashboard-content">
        <div className="user-info-section">
          <h2>👤 사용자 정보</h2>
          <div className="info-item">
            <strong>아이디:</strong> <span>{userInfo.userId}</span>
          </div>
          <div className="info-item">
            <strong>이메일:</strong> <span>{userInfo.email}</span>
          </div>
          <div className="info-item">
            <strong>가입일:</strong> <span>{new Date(userInfo.createdAt).toISOString().slice(0, 10)}</span>
          </div>
        </div>


        <div className="dashboard-actions">
          <h2>🛠️ 계정 관리</h2>
          <div className="action-buttons">
            <button 
              onClick={handleLogout}
              className="action-button logout"
              disabled={loading}
            >
              {loading ? '로그아웃 중...' : '🚪 로그아웃'}
            </button>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Dashboard;
