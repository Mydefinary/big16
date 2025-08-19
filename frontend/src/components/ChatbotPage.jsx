import React, { useState } from 'react';

const ChatbotPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 챗봇 서브서버 주소
  const chatbotUrl = 'http://20.249.113.18:9000/question';

  const handleIframeLoad = () => {
    console.log('✅ 챗봇 iframe 로드 완료');
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    console.error('❌ 챗봇 iframe 로드 실패');
    setIsLoading(false);
    setHasError(true);
  };

  const retryLoad = () => {
    setIsLoading(true);
    setHasError(false);
    // iframe을 다시 로드하기 위해 src를 재설정
    const iframe = document.getElementById('chatbot-iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="chatbot-embed-container" style={{
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div className="chatbot-header" style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{
          margin: '0',
          color: '#333',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          🤖 AI 챗봇 어시스턴트
        </h2>
        <p style={{
          margin: '8px 0 0 0',
          color: '#666',
          fontSize: '14px'
        }}>
          궁금한 것이 있으시면 언제든지 대화를 시작해보세요
        </p>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 10
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }}></div>
            <p style={{ margin: 0, color: '#666' }}>챗봇 시스템 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {hasError && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔧</div>
          <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>
            챗봇 시스템에 연결할 수 없습니다
          </h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.
          </p>
          <button 
            onClick={retryLoad}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            다시 연결하기
          </button>
        </div>
      )}

      {/* iframe */}
      <div style={{
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <iframe
          id="chatbot-iframe"
          src={chatbotUrl}
          width="100%"
          height="700px"
          frameBorder="0"
          title="🤖 AI 챗봇 어시스턴트"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            border: 'none',
            backgroundColor: '#fff',
            display: hasError ? 'none' : 'block'
          }}
          // 보안 관련 속성들
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      {/* 추가 정보 섹션 */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{
          margin: '0 0 10px 0',
          color: '#333',
          fontSize: '16px'
        }}>
          💡 이용 안내
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          marginTop: '10px'
        }}>
          <div style={{
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            border: '1px solid #e9ecef'
          }}>
            <strong style={{ color: '#495057' }}>📝 질문하기</strong>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#6c757d' }}>
              궁금한 것을 자유롭게 질문해보세요
            </p>
          </div>
          <div style={{
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            border: '1px solid #e9ecef'
          }}>
            <strong style={{ color: '#495057' }}>🔍 정보 검색</strong>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#6c757d' }}>
              다양한 주제의 정보를 찾아드립니다
            </p>
          </div>
          <div style={{
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '5px',
            border: '1px solid #e9ecef'
          }}>
            <strong style={{ color: '#495057' }}>🛠️ 문제 해결</strong>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#6c757d' }}>
              기술적인 문제나 업무 관련 도움을 받으세요
            </p>
          </div>
        </div>
      </div>

      {/* CSS 애니메이션을 위한 스타일 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .chatbot-embed-container iframe {
          transition: opacity 0.3s ease-in-out;
        }
        
        .chatbot-embed-container iframe:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        @media (max-width: 768px) {
          .chatbot-embed-container {
            padding: 10px;
          }
          
          .chatbot-header h2 {
            font-size: 20px;
          }
          
          iframe {
            height: 600px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatbotPage;