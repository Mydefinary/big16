import React, { useState } from "react";

export default function NavBar() {
  const [hover, setHover] = useState(false);

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
          flexWrap: "wrap", // ✅ 전체 nav 줄바꿈 허용
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          gap: "12px",
        }}
      >
        {/* 왼쪽 로고 */}
        <div
          style={{
            fontFamily: "Inter",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 32,
            lineHeight: "39px",
            color: "#000",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Service Name
        </div>

        {/* 중앙 네비게이션 링크들 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",        // ✅ 내부 링크도 줄바꿈 가능
            gap: 24,
            justifyContent: "center",
            alignItems: "center",
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <a style={{ fontWeight: 700, fontSize: 16, color: "#5B5B5B", whiteSpace: "nowrap" }}>작품 질의하기</a>
          <a style={{ fontWeight: 700, fontSize: 16, color: "#5B5B5B", whiteSpace: "nowrap" }}>하이라이트 제작</a>
          <a style={{ fontWeight: 700, fontSize: 16, color: "#5B5B5B", whiteSpace: "nowrap" }}>웹툰 상세 분석</a>

          {/* 드롭다운 포함 영역 */}
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <a
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: "#09AA5C",
                paddingBottom: 4,
                whiteSpace: "nowrap",
              }}
            >
              광고 초안 생성
            </a>

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
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#09AA5C",
                    whiteSpace: "nowrap",
                  }}
                >
                  웹툰 캐릭터 PPL
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#000",
                    marginTop: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  웹툰 캐릭터 굿즈
                </div>
              </div>
            )}
          </div>

          <a style={{ fontWeight: 700, fontSize: 16, color: "#5B5B5B", whiteSpace: "nowrap" }}>광고 파트너십 문의</a>
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
          <div
            style={{
              fontFamily: "Inter",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 20,
              whiteSpace: "nowrap",
            }}
          >
            Sign Up
          </div>
          <div
            style={{
              fontFamily: "Inter",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 20,
              whiteSpace: "nowrap",
            }}
          >
            Sign In
          </div>
          <div
            style={{
              fontFamily: "Inter",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 20,
              color: "#000",
              whiteSpace: "nowrap",
            }}
          >
            FAQ
          </div>
        </div>
      </div>
    </nav>
  );
}
