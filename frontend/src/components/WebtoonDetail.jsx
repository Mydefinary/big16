import React, { useState } from 'react';

const WebtoonDetail = () => {
  const [selectedTab, setSelectedTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '작품 개요' },
    { id: 'workflow', label: '워크플로우' },
    { id: 'features', label: '기능' },
    { id: 'analytics', label: '분석' }
  ];

  const renderOverview = () => (
    <div className="webtoon-overview">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">"Webtoon WorkFlow AX"</h1>
          <p className="hero-subtitle">Seamlessly connecting distribution and content expansion with AI.</p>
          <div className="hero-badge">KT AIVLE SCHOOL 6기 16조</div>
        </div>
      </div>

      <div className="content-sections">
        <section className="intro-section">
          <h2>🎯 프로젝트 소개</h2>
          <p>
            AI 기술을 활용한 혁신적인 웹툰 제작 워크플로우 시스템입니다. 
            콘텐츠 기획부터 배포까지의 전 과정을 AI가 지원하여, 
            창작자들이 더욱 창의적인 작업에 집중할 수 있도록 돕습니다.
          </p>
        </section>

        <section className="team-section">
          <h2>👥 팀 정보</h2>
          <div className="team-info">
            <div className="team-item">
              <span className="team-label">팀명:</span>
              <span>KT AIVLE SCHOOL 6기 16조</span>
            </div>
            <div className="team-item">
              <span className="team-label">프로젝트:</span>
              <span>Webtoon WorkFlow AX</span>
            </div>
            <div className="team-item">
              <span className="team-label">기간:</span>
              <span>2024년 1월 - 현재</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderWorkflow = () => (
    <div className="workflow-content">
      <h2>🔄 AI 워크플로우 시스템</h2>
      <div className="workflow-steps">
        <div className="workflow-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>🎨 콘셉트 기획</h3>
            <p>AI가 트렌드를 분석하여 인기 있는 스토리 요소와 캐릭터 설정을 제안합니다.</p>
          </div>
        </div>
        <div className="workflow-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>✏️ 캐릭터 생성</h3>
            <p>다양한 스타일의 캐릭터를 AI로 자동 생성하고 세밀한 커스터마이징이 가능합니다.</p>
          </div>
        </div>
        <div className="workflow-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>🖼️ 배경 및 소재 제작</h3>
            <p>상황에 맞는 배경과 소재를 AI가 생성하여 작업 시간을 획기적으로 단축합니다.</p>
          </div>
        </div>
        <div className="workflow-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>📱 자동 배포 및 관리</h3>
            <p>완성된 작품을 여러 플랫폼에 자동으로 배포하고 성과를 분석합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="features-content">
      <h2>⚡ 주요 기능</h2>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🎭</div>
          <h3>작품 질의하기</h3>
          <p>작품 질의하는 페이지입니다</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎭</div>
          <h3>하이라이트 제작</h3>
          <p>AI 기술로 개성있는 하이라이트를 자동 생성할 수 있습니다.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📚</div>
          <h3>웹툰 상세 분석</h3>
          <p>다양한 소재들을 AI가 분석하여 트렌드와 활용 방법을 제시합니다.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">✨</div>
          <h3>광고 초안 생성</h3>
          <p>창의적인 콘텐츠 소재를 키워드 기반으로 자동 생성합니다.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>광고 파트너십 문의</h3>
          <p>콘텐츠 관련 데이터를 분석하여 최적의 전략을 제공합니다.</p>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-content">
      <h2>📈 성과 분석</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">85%</div>
          <div className="stat-label">작업 시간 단축</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">120+</div>
          <div className="stat-label">생성된 캐릭터</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">95%</div>
          <div className="stat-label">사용자 만족도</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">50+</div>
          <div className="stat-label">분석된 소재</div>
        </div>
      </div>
      
      <div className="chart-placeholder">
        <div className="chart-icon">📊</div>
        <p>상세 분석 차트가 여기에 표시됩니다</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview': return renderOverview();
      case 'workflow': return renderWorkflow();
      case 'features': return renderFeatures();
      case 'analytics': return renderAnalytics();
      default: return renderOverview();
    }
  };

  return (
    <div className="webtoon-detail-container">
      <div className="tabs-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default WebtoonDetail;