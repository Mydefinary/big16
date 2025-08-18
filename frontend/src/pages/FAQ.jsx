import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FAQ = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqData = [
    {
      question: "🔐 로그인이 필요한 이유가 무엇인가요?",
      answer: "저희 서비스는 개인화된 AI 콘텐츠 제작 도구를 제공합니다. 로그인을 통해 사용자별 맞춤 설정, 작업 내용 저장, 고급 기능 이용이 가능합니다."
    },
    {
      question: "🎨 라이언캐릭터 제작은 어떤 기능인가요?",
      answer: "AI 기술을 활용하여 다양한 스타일의 라이언 캐릭터를 제작할 수 있는 도구입니다. 색상, 표정, 포즈 등을 자유롭게 커스터마이징할 수 있습니다."
    },
    {
      question: "📚 캔북 소재 본석 기능에 대해 설명해주세요.",
      answer: "다양한 캔북 소재들을 AI가 분석하여 트렌드, 패턴, 효과적인 활용 방법 등의 인사이트를 제공하는 분석 도구입니다."
    },
    {
      question: "✨ 콘코 소재 생성은 무엇인가요?",
      answer: "창의적인 콘텐츠 소재를 자동으로 생성하는 AI 도구입니다. 키워드나 테마를 입력하면 관련된 다양한 소재들을 생성해드립니다."
    },
    {
      question: "📊 콘고 매수식별 움직 기능은 무엇인가요?",
      answer: "콘텐츠와 관련된 매수 패턴을 분석하고 식별하는 전문 도구입니다. 데이터 기반의 정확한 분석 결과를 제공합니다."
    },
    {
      question: "🔒 회원가입은 무료인가요?",
      answer: "네, 회원가입은 완전 무료입니다. 기본적인 기능들을 무료로 이용하실 수 있으며, 고급 기능은 프리미엄 플랜으로 제공됩니다."
    },
    {
      question: "💾 제작한 콘텐츠는 어떻게 저장되나요?",
      answer: "로그인한 사용자의 모든 작업물은 클라우드에 자동으로 저장됩니다. 언제 어디서나 접속하여 이전 작업을 이어서 할 수 있습니다."
    },
    {
      question: "🔄 토큰이 만료되면 어떻게 하나요?",
      answer: "토큰이 만료되면 자동으로 갱신되거나, 다시 로그인하라는 안내가 표시됩니다. 작업 중인 내용은 자동 저장되므로 걱정하지 마세요."
    }
  ];

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>❓ 자주 묻는 질문</h1>
        <p>서비스 이용 중 궁금한 점들을 확인해보세요.</p>
      </div>

      <div className="faq-content">
        <div className="faq-list">
          {faqData.map((item, index) => (
            <div key={index} className="faq-item">
              <button 
                className="faq-question"
                onClick={() => toggleItem(index)}
              >
                <span>{item.question}</span>
                <span className={`faq-toggle ${openItems[index] ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
              
              {openItems[index] && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-actions">
          <div className="action-card">
            <h3>🚀 지금 시작하기</h3>
            <p>아직 계정이 없으시다면 무료로 회원가입하고 모든 기능을 체험해보세요!</p>
            <div className="action-buttons">
              <button 
                onClick={() => navigate('/register')}
                className="action-button primary"
              >
                회원가입
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="action-button secondary"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;