import React, { useState } from "react";

export default function NavBar() {
  const [hover, setHover] = useState(false);

  // 서비스로 이동하는 함수
  const handleServiceNavigation = (servicePath: string) => {
    window.location.href = `${window.location.origin}${servicePath}`;
  };

  const navButtonStyle = {
    fontWeight: 700,
    fontSize: 16,
    color: "#5B5B5B",
    whiteSpace: "nowrap" as const,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px 0",
  };

  const activeButtonStyle = {
    ...navButtonStyle,
    fontWeight: 800,
    color: "#09AA5C",
  };

  const rightButtonStyle = {
    fontFamily: "Inter",
    fontStyle: "italic" as const,
    fontWeight: 700,
    fontSize: 20,
    whiteSpace: "nowrap" as const,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px 12px",
  };

  return (
    <nav
      style={{
        width: "100%",
        background: "#FFFFFF",
        boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1440px",
          padding: "0 20px",
          minHeight: "77px",
          height: "auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          gap: "12px",
        }}
      >
        {/* 왼쪽 로고 */}
        <button
          onClick={() => handleServiceNavigation('/')}
          style={{
            fontFamily: "Inter",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 32,
            lineHeight: "39px",
            color: "#000",
            whiteSpace: "nowrap",
            flexShrink: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ToonConnect
        </button>

        {/* 중앙 네비게이션 링크들 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            justifyContent: "center",
            alignItems: "center",
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <button
            onClick={() => handleServiceNavigation('/ppl-gen')}
            style={navButtonStyle}
          >
            작품 질의하기
          </button>
          <button
            onClick={() => handleServiceNavigation('/webtoon-hl')}
            style={navButtonStyle}
          >
            하이라이트 제작
          </button>
          <button
            onClick={() => handleServiceNavigation('/webtoon-dashboard')}
            style={navButtonStyle}
          >
            웹툰 상세 분석
          </button>

          {/* 드롭다운 포함 영역 */}
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: "#09AA5C",
                paddingBottom: 4,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              광고 초안 생성
            </span>

            {hover && (
              <div
                style={{
                  position: "absolute",
                  top: 34,
                  left: -15,
                  background: "#fff",
                  boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
                  borderRadius: 3,
                  padding: 8,
                  width: 160,
                  zIndex: 10,
                }}
              >
                <button
                  onClick={() => handleServiceNavigation('/ppl-gen')}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#000",
                    whiteSpace: "nowrap",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 0",
                    display: "block",
                    width: "100%",
                    textAlign: "left" as const,
                  }}
                >
                  웹툰 캐릭터 PPL
                </button>
                <button
                  onClick={() => handleServiceNavigation('/goods-gen')}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#09AA5C",
                    marginTop: 8,
                    whiteSpace: "nowrap",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 0",
                    display: "block",
                    width: "100%",
                    textAlign: "left" as const,
                  }}
                >
                  웹툰 캐릭터 굿즈
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => handleServiceNavigation('/board')}
            style={navButtonStyle}
          >
            광고 파트너십 문의
          </button>
        </div>

        {/* 오른쪽 메뉴 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            flexShrink: 0,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => handleServiceNavigation('/register')}
            style={rightButtonStyle}
          >
            Sign Up
          </button>
          <button
            onClick={() => handleServiceNavigation('/login')}
            style={rightButtonStyle}
          >
            Sign In
          </button>
          <button
            onClick={() => handleServiceNavigation('/faq')}
            style={rightButtonStyle}
          >
            FAQ
          </button>
        </div>
      </div>
    </nav>
  );
}