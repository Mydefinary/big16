// /src/pages/TermsAgreement.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './TermsAgreement.css';

const TermsAgreement = () => {
  const [agreements, setAgreements] = useState({
    all: false,
    required1: false,
    required2: false,
    optional1: false,
    optional2: false
  });
  
  const [expandedTerms, setExpandedTerms] = useState({});
  const navigate = useNavigate();

  // 전체 동의 처리
  const handleAllAgreement = (checked) => {
    if (checked) {
      // 전체 동의할 때 모든 약관 내용을 펼쳐서 보여줌
      const allExpanded = {};
      termsData.forEach(term => {
        allExpanded[term.id] = true;
      });
      setExpandedTerms(allExpanded);
    }
    
    setAgreements({
      all: checked,
      required1: checked,
      required2: checked,
      optional1: checked,
      optional2: checked
    });
  };

  // 개별 동의 처리
  const handleIndividualAgreement = (key, checked) => {
    if (checked) {
      // 체크할 때 해당 약관 내용을 자동으로 펼쳐줌
      setExpandedTerms(prev => ({
        ...prev,
        [key]: true
      }));
    }
    
    const newAgreements = {
      ...agreements,
      [key]: checked
    };
    
    // 전체 동의 체크박스 상태 업데이트
    const allChecked = Object.keys(newAgreements).filter(k => k !== 'all').every(k => newAgreements[k]);
    newAgreements.all = allChecked;
    
    setAgreements(newAgreements);
  };

  // 약관 내용 토글
  const toggleTermContent = (termId) => {
    setExpandedTerms(prev => ({
      ...prev,
      [termId]: !prev[termId]
    }));
  };

  // 필수 약관 동의 여부 확인
  const isRequiredAgreed = agreements.required1 && agreements.required2;

  // 다음 단계로 진행
  const handleNext = () => {
    if (isRequiredAgreed) {
      // 약관 동의 정보를 localStorage에 저장하지 않고 메모리에서만 처리
      localStorage.setItem('termsAgreed', 'true');
      // 실제 구현에서는 서버로 전송하거나 다른 상태 관리 방식 사용 권장
      navigate('/register');
    }
  };

  const termsData = [
    {
      id: 'required1',
      title: 'ToonConnect 이용약관 동의',
      type: 'required',
      summary: '서비스 이용을 위한 기본 약관에 동의합니다.',
      content: `
제1조 (목적)
이 약관은 ToonConnect(이하 "회사")가 제공하는 웹툰 관련 서비스의 이용과 관련하여 회사와 이용자간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 회사가 제공하는 웹툰 대시보드, AI 챗봇, 하이라이트 제작 등의 모든 서비스를 의미합니다.
2. "이용자"란 회사의 서비스를 이용하는 회원 및 비회원을 말합니다.
3. "회원"란 회사와 서비스 이용계약을 체결한 자를 말합니다.

제3조 (서비스의 제공)
1. 회사는 다음과 같은 서비스를 제공합니다:
   - 웹툰 대시보드 및 분석 서비스
   - AI 기반 챗봇 서비스
   - 웹툰 하이라이트 제작 도구
   - 광고 및 굿즈 생성 서비스
   - 커뮤니티 및 게시판 서비스

제4조 (서비스 이용계약의 성립)
1. 서비스 이용계약은 이용자가 본 약관에 동의하고 회원가입을 완료함으로써 성립됩니다.
2. 회사는 다음에 해당하는 경우 회원가입을 승인하지 않을 수 있습니다:
   - 타인의 명의를 도용한 경우
   - 허위 정보를 제공한 경우
   - 기타 회사가 정한 이용신청 요건을 충족하지 못한 경우

제5조 (회원의 의무)
1. 회원은 다음 행위를 하여서는 안됩니다:
   - 타인의 정보를 도용하는 행위
   - 서비스의 정상적인 운영을 방해하는 행위
   - 다른 이용자에게 피해를 주는 행위
   - 저작권을 침해하는 행위

제6조 (서비스의 변경 및 중단)
회사는 운영정책상 필요에 의해 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.

제7조 (면책조항)
회사는 천재지변, 전쟁, 기타 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.
      `
    },
    {
      id: 'required2',
      title: '개인정보 수집 및 이용 동의',
      type: 'required',
      summary: '서비스 제공을 위한 개인정보 수집 및 이용에 동의합니다.',
      content: `
개인정보 수집 및 이용에 관한 동의

1. 개인정보 수집 항목
필수항목: 아이디, 비밀번호, 이메일, 이름
선택항목: -

2. 개인정보 수집 및 이용목적
- 회원 식별 및 본인확인
- 서비스 제공 및 운영
- 고객상담 및 불만처리
- 새로운 서비스 개발 및 맞춤 서비스 제공
- 통계작성 및 학술연구

3. 개인정보 보유 및 이용기간
회원 탈퇴시까지 보유하며, 탈퇴 후 즉시 삭제합니다.
단, 관련 법령에 의한 보존 의무가 있는 경우 해당 기간 동안 보존합니다.

4. 개인정보 제공 거부권
귀하는 개인정보 수집 및 이용에 대해 거부할 권리가 있습니다.
단, 필수항목 수집에 거부하실 경우 서비스 이용이 제한될 수 있습니다.

5. 개인정보의 안전성 확보 조치
회사는 개인정보보호법에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.
- 개인정보 취급 직원의 최소화 및 교육
- 개인정보에 대한 접근 제한
- 접속기록의 보관 및 위변조 방지
- 개인정보의 암호화
- 보안프로그램의 설치 및 갱신
- 개인정보보호 전담기구의 운영

6. 개인정보 보호책임자
성명: ToonConnect 개인정보보호팀
이메일: privacy@toonconnect.com
전화: 02-1234-5678
      `
    }
  ];

  return (
    <div className="terms-container">
      <div className="terms-content">
        <div className="terms-header">
          <h1>약관 동의</h1>
          <p>ToonConnect 서비스 이용을 위해 약관 동의가 필요합니다.</p>
          <div className="terms-notice">
            <strong>💡 안내:</strong> 체크박스를 선택하면 해당 약관 내용이 자동으로 펼쳐집니다.
          </div>
        </div>

        <div className="agreement-section">
          {/* 전체 동의 */}
          <div className="agreement-item all-agreement">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreements.all}
                onChange={(e) => handleAllAgreement(e.target.checked)}
              />
              <span className="checkmark"></span>
              <span className="agreement-text">
                <strong>전체 동의하기</strong>
                <small>선택항목에 대한 동의 포함 (모든 약관 내용이 펼쳐집니다)</small>
              </span>
            </label>
          </div>

          <div className="divider"></div>

          {/* 개별 약관들 */}
          {termsData.map((term) => (
            <TermsItem
              key={term.id}
              term={term}
              checked={agreements[term.id]}
              expanded={expandedTerms[term.id] || false}
              onChange={(checked) => handleIndividualAgreement(term.id, checked)}
              onToggleContent={() => toggleTermContent(term.id)}
            />
          ))}
        </div>

        <div className="terms-actions">
          <Link to="/login" className="btn btn-secondary">
            이전
          </Link>
          <button
            className={`btn btn-primary ${!isRequiredAgreed ? 'disabled' : ''}`}
            onClick={handleNext}
            disabled={!isRequiredAgreed}
          >
            다음
          </button>
        </div>

        <div className="terms-note">
          <p>
            필수 약관에 동의하지 않으시면 회원가입이 불가능합니다.<br/>
            선택 약관은 동의하지 않아도 서비스를 이용하실 수 있습니다.<br/>
            <strong>약관 내용을 충분히 읽어보신 후 동의해 주세요.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

// 개별 약관 컴포넌트
const TermsItem = ({ term, checked, expanded, onChange, onToggleContent }) => {
  return (
    <div className="agreement-item">
      <div className="agreement-header">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="checkmark"></span>
          <span className="agreement-text">
            <span className="agreement-title">
              {term.type === 'required' && <span className="required-badge">필수</span>}
              {term.type === 'optional' && <span className="optional-badge">선택</span>}
              {term.title}
            </span>
            <span className="agreement-summary">{term.summary}</span>
          </span>
        </label>
        <button
          className={`expand-btn ${expanded ? 'expanded' : ''}`}
          onClick={onToggleContent}
        >
          {expanded ? '접기' : '내용보기'}
        </button>
      </div>
      
      {expanded && (
        <div className="agreement-content">
          <div className="content-header">
            <span className="content-title">{term.title}</span>
          </div>
          <pre>{term.content}</pre>
        </div>
      )}
    </div>
  );
};

export default TermsAgreement;