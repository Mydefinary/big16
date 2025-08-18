import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const MyPage = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // JWT 토큰에서 사용자 정보 추출
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // 실제 환경에서는 API로 사용자 정보를 가져와야 합니다
        const mockUserInfo = {
          userId: payload.sub,
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '010-1234-5678',
          bio: '웹툰을 사랑하는 크리에이터입니다.',
          joinDate: '2024-01-15',
          profileImage: null,
          stats: {
            totalProjects: 12,
            completedProjects: 8,
            inProgressProjects: 4,
            totalViews: 15420
          }
        };
        
        setUserInfo(mockUserInfo);
        setFormData({
          name: mockUserInfo.name,
          email: mockUserInfo.email,
          phone: mockUserInfo.phone,
          bio: mockUserInfo.bio
        });
      } catch (error) {
        console.error('Token parsing error:', error);
        toast.error('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      }
    }
    setLoading(false);
  }, [token, isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    // 실제 환경에서는 API 호출로 프로필 업데이트
    setUserInfo(prev => ({
      ...prev,
      ...formData
    }));
    setIsEditing(false);
    toast.success('프로필이 성공적으로 업데이트되었습니다!', {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const handleCancelEdit = () => {
    setFormData({
      name: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone,
      bio: userInfo.bio
    });
    setIsEditing(false);
  };

  const handlePasswordChange = () => {
    toast.info('비밀번호 변경 페이지로 이동합니다.', {
      position: "top-center",
      autoClose: 3000,
    });
    // 실제 환경에서는 비밀번호 변경 페이지로 이동
  };

  const handleAccountDelete = () => {
    const confirmed = window.confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (confirmed) {
      toast.warn('회원 탈퇴 기능은 추후 구현 예정입니다.', {
        position: "top-center",
        autoClose: 5000,
      });
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">로딩 중...</div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="error-container">
        <div className="error-message">사용자 정보를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <div className="mypage-header">
        <h1>👤 마이페이지</h1>
        <p>프로필 정보를 관리하고 활동 내역을 확인하세요.</p>
      </div>

      <div className="mypage-content">
        <div className="mypage-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            📝 프로필
          </button>
          <button 
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📊 활동 내역
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ 설정
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {userInfo.profileImage ? (
                      <img src={userInfo.profileImage} alt="Profile" />
                    ) : (
                      <div className="avatar-placeholder">
                        {userInfo.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <h2>{userInfo.name}</h2>
                    <p className="user-id">ID: {userInfo.userId}</p>
                    <p className="join-date">가입일: {userInfo.joinDate}</p>
                  </div>
                  <div className="profile-actions">
                    {!isEditing ? (
                      <button 
                        className="edit-btn"
                        onClick={() => setIsEditing(true)}
                      >
                        ✏️ 편집
                      </button>
                    ) : (
                      <div className="edit-actions">
                        <button 
                          className="save-btn"
                          onClick={handleSaveProfile}
                        >
                          💾 저장
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={handleCancelEdit}
                        >
                          ❌ 취소
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="profile-form">
                  <div className="form-group">
                    <label>이름</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="이름을 입력하세요"
                      />
                    ) : (
                      <div className="form-display">{userInfo.name}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>이메일</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="이메일을 입력하세요"
                      />
                    ) : (
                      <div className="form-display">{userInfo.email}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>전화번호</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="전화번호를 입력하세요"
                      />
                    ) : (
                      <div className="form-display">{userInfo.phone}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>자기소개</label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="자기소개를 입력하세요"
                        rows="4"
                      />
                    ) : (
                      <div className="form-display bio">{userInfo.bio}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📁</div>
                  <div className="stat-info">
                    <div className="stat-number">{userInfo.stats.totalProjects}</div>
                    <div className="stat-label">총 프로젝트</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <div className="stat-number">{userInfo.stats.completedProjects}</div>
                    <div className="stat-label">완료된 프로젝트</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔄</div>
                  <div className="stat-info">
                    <div className="stat-number">{userInfo.stats.inProgressProjects}</div>
                    <div className="stat-label">진행 중인 프로젝트</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👀</div>
                  <div className="stat-info">
                    <div className="stat-number">{userInfo.stats.totalViews.toLocaleString()}</div>
                    <div className="stat-label">총 조회수</div>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <h3>최근 활동</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-content">
                      <div className="activity-title">새로운 웹툰 프로젝트 생성</div>
                      <div className="activity-time">2024-08-07 14:30</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">🎨</div>
                    <div className="activity-content">
                      <div className="activity-title">캐릭터 디자인 업로드</div>
                      <div className="activity-time">2024-08-06 16:45</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">💬</div>
                    <div className="activity-content">
                      <div className="activity-title">작품 피드백 수신</div>
                      <div className="activity-time">2024-08-05 11:20</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <div className="settings-group">
                <h3>🔒 보안 설정</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-title">비밀번호 변경</div>
                    <div className="setting-description">계정의 비밀번호를 변경합니다</div>
                  </div>
                  <button 
                    className="setting-btn primary"
                    onClick={handlePasswordChange}
                  >
                    변경하기
                  </button>
                </div>
              </div>

              <div className="settings-group">
                <h3>🔔 알림 설정</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-title">이메일 알림</div>
                    <div className="setting-description">새로운 메시지 및 업데이트 알림을 받습니다</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-title">프로젝트 알림</div>
                    <div className="setting-description">프로젝트 상태 변경 시 알림을 받습니다</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-group danger">
                <h3>⚠️ 위험 영역</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-title">계정 삭제</div>
                    <div className="setting-description">계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.</div>
                  </div>
                  <button 
                    className="setting-btn danger"
                    onClick={handleAccountDelete}
                  >
                    계정 삭제
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPage;