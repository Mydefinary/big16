// /src/components/GoodsGeneratorEmbed.jsx

import React, { useState } from 'react';

const GoodsGeneratorEmbed = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 쿠버네티스 내부 DNS를 사용한 서브서버 주소
  const goodsGeneratorUrl = 'http://20.249.113.18:9000/goods-gen/';

  const handleIframeLoad = () => {
    console.log('✅ 굿즈 생성기 iframe 로드 완료');
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    console.error('❌ 굿즈 생성기 iframe 로드 실패');
    setIsLoading(false);
    setHasError(true);
  };

  const retryLoad = () => {
    setIsLoading(true);
    setHasError(false);
    // iframe을 다시 로드하기 위해 src를 재설정
    const iframe = document.getElementById('goods-generator-iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="goods-generator-embed-container" style={{
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div className="dashboard-header" style={{
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
          🛍️ 굿즈 생성기
        </h2>
        <p style={{
          margin: '8px 0 0 0',
          color: '#666',
          fontSize: '14px'
        }}>
          AI를 활용한 굿즈 디자인을 생성하고 커스터마이징하세요
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
              borderTop: '4px solid #27ae60',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }}></div>
            <p style={{ margin: 0, color: '#666' }}>굿즈 생성기 로딩 중...</p>
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
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>
            굿즈 생성기를 로드할 수 없습니다
          </h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            서브서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.
          </p>
          <button 
            onClick={retryLoad}
            style={{
              padding: '10px 20px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            다시 시도
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
          id="goods-generator-iframe"
          src={goodsGeneratorUrl}
          width="100%"
          height="800px"
          frameBorder="0"
          title="굿즈 생성기"
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

      {/* CSS 애니메이션을 위한 스타일 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .goods-generator-embed-container iframe {
          transition: opacity 0.3s ease-in-out;
        }
        
        .goods-generator-embed-container iframe:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default GoodsGeneratorEmbed;