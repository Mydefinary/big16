import React from "react";
import "../styles/Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="logo">Service Name</span>
        <ul>
          <li>작품 질의하기</li>
          <li className="active">하이라이트 제작</li>
          <li>웹툰 상세 분석</li>
          <li>광고 초안 생성</li>
          <li>광고 파트너십 문의</li>
        </ul>
      </div>
      <div className="navbar-right">
        <span>Sign Up</span>
        <span>Sign In</span>
        <span>FAQ</span>
      </div>
    </nav>
  );
};

export default Navbar;
