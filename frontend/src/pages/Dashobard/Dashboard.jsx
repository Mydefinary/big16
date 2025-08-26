import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import OperatorDashboard from './OperatorDashboard';
import { useSecurity } from '../../components/SecurityProvider';

const Dashboard = () => {
  const { logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const { securePrint } = useSecurity();
  
  // 로그인한 유저 정보 불러오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await authAPI.me();
        securePrint('사용자 정보 로드 완료:', res.data);
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

  if (!userInfo) {
    return (
      <div className="loading">
        <div className="loading-spinner">사용자 정보를 불러오는 중...</div>
      </div>
    );
  }

  // 역할에 따라 다른 대시보드 컴포넌트 렌더링
  if (userInfo.role === 'admin') {
    return <AdminDashboard userInfo={userInfo} />;
  }
  
  if (userInfo.role === 'operator') {
    return <OperatorDashboard userInfo={userInfo} />;
  }

  return <UserDashboard userInfo={userInfo} />;
};

export default Dashboard;