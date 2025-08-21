import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

const FAQ = () => {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqData = [
    {
      question: "🤖 AI 챗봇 서비스는 어떤 기능을 제공하나요?",
      answer: "AI 기술을 활용한 스마트 챗봇으로 웹툰 관련 질문, 창작 아이디어 도출, 기술 지원 등 다양한 도움을 받을 수 있습니다. 자연스러운 대화를 통해 필요한 정보를 빠르게 얻을 수 있습니다."
    },
    {
      question: "🎨 하이라이트 제작 기능에 대해 설명해주세요.",
      answer: "웹툰의 핵심 장면들을 AI가 자동으로 분석하여 하이라이트 영상이나 이미지를 제작하는 서비스입니다. 웹툰 홍보나 SNS 콘텐츠 제작에 활용할 수 있습니다."
    },
    {
      question: "🎬 광고 생성기는 어떻게 사용하나요?",
      answer: "웹툰을 활용한 창의적인 광고 소재를 AI가 자동으로 생성합니다. 브랜드 컬래버레이션이나 PPL 광고 제작 시 효과적으로 활용할 수 있는 도구입니다."
    },
    {
      question: "🛍️ 굿즈 생성기의 주요 기능은 무엇인가요?",
      answer: "웹툰 캐릭터나 장면을 활용하여 다양한 굿즈 디자인을 자동 생성합니다. 티셔츠, 스티커, 키링 등 다양한 상품 형태로 디자인을 제작할 수 있습니다."
    },
    {
      question: "📊 웹툰 대시보드에서는 어떤 정보를 확인할 수 있나요?",
      answer: "웹툰의 조회수, 댓글 분석, 독자 반응, 트렌드 정보 등을 종합적으로 분석한 데이터를 시각화하여 제공합니다. 웹툰 운영 전략 수립에 도움이 됩니다."
    },
    {
      question: "📝 자유게시판은 어떤 용도로 사용하나요?",
      answer: "사용자들 간의 소통할 수 있는 커뮤니티 공간입니다. 창작 팁 공유, 피드백 교환, 협업 파트너 찾기 등 다양한 목적으로 활용할 수 있습니다."
    },
    {
      question: "🔒 회원가입은 무료인가요?",
      answer: "네, 회원가입은 완전 무료입니다. 기본적인 서비스들을 무료로 이용하실 수 있습니다."
    },
    // {
    //   question: "💾 제작한 콘텐츠는 어떻게 저장되나요?",
    //   answer: "로그인한 사용자의 모든 작업물은 클라우드에 자동으로 저장됩니다. 마이페이지에서 언제든지 이전 작업물들을 확인하고 다운로드할 수 있습니다."
    // },
    // {
    //   question: "🔄 세션이 만료되면 어떻게 하나요?",
    //   answer: "보안을 위해 일정 시간 후 세션이 만료됩니다. 세션 만료 시 자동으로 로그인 페이지로 이동되며, 작업 중인 내용은 가능한 범위에서 자동 저장됩니다."
    // },
    // {
    //   question: "📞 기술 지원이나 문의사항은 어디로 연락하나요?",
    //   answer: "서비스 이용 중 문제가 발생하거나 문의사항이 있으시면 자유게시판의 문의 게시판을 이용하시거나, 대시보드의 고객지원 메뉴를 통해 문의해주세요."
    // }
  ];

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>❓ 자주 묻는 질문</h1>
        <p>ToonConnect 서비스 이용 중 궁금한 점들을 확인해보세요.</p>
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

        {/* {!user && (
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
        )}

        {user && (
          <div className="faq-actions">
            <div className="action-card">
              <h3>🏠 대시보드로 돌아가기</h3>
              <p>더 많은 서비스를 이용하시려면 대시보드로 돌아가세요!</p>
              <div className="action-buttons">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="action-button primary"
                >
                  대시보드로 이동
                </button>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default FAQ;