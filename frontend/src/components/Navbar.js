import React from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import './NavbarCustom.css'; // 추가 스타일
import { Link } from 'react-router-dom';


export default function CustomNavbar() {
  return (
    <Navbar bg="white" expand="lg" className="border-bottom shadow-sm py-2">
      <Container className="d-flex justify-content-between align-items-center">
        {/* 왼쪽 - 로고 */}
        <Navbar.Brand className="fw-bold fst-italic fs-4">
        <Link to="/" className="text-decoration-none text-dark">
            Toon Connect
        </Link>
        </Navbar.Brand>

        {/* 가운데 메뉴 */}
        <Nav className="gap-4 flex-grow-1 justify-content-center">
          <Nav.Link href="#" className="hover-success fw-semibold">작품 질의하기</Nav.Link>
            <Nav.Link href="#" className="hover-success fw-semibold">하이라이트 제작</Nav.Link>
            <Nav.Link href="#" className="hover-success fw-semibold">웹툰 상세 분석</Nav.Link>
            <Nav.Link href="#" className="hover-success fw-semibold">광고 초안 생성</Nav.Link>
            <Nav.Link href="#" as={Link} to="/partnership" className="hover-success fw-semibold">광고 파트너십 문의</Nav.Link>
        </Nav>

        {/* 오른쪽 메뉴 */}
        <Nav className="gap-3">
          <Nav.Link href="#" className="fw-bold fst-italic no-underline">LogOut</Nav.Link>
          <Nav.Link href="#" className="fw-bold fst-italic no-underline">MyPage</Nav.Link>
          <Nav.Link as={Link} to="/faq" className="fw-bold fst-italic">
            FAQ
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}
