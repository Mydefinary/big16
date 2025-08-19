// src/pages/Faq.js
import React from 'react';
import { Accordion, Container } from 'react-bootstrap';

export default function Faq() {
  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-5 text-center">자주 묻는 질문</h2>

      <Accordion defaultActiveKey="0" flush>
        <Accordion.Item eventKey="0" >
  <Accordion.Header>Q. AI 웹툰 하이라이트는 어떤 기준으로 제작되나요?</Accordion.Header>
  <Accordion.Body>
    사용자의 요청과 웹툰의 주요 장면, 대사, 전개 흐름 등을 AI가 분석하여 하이라이트를 자동으로 추출합니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="1">
  <Accordion.Header>Q. 하이라이트 제작에 걸리는 시간은 얼마나 되나요?</Accordion.Header>
  <Accordion.Body>
    평균적으로 1편 기준 10~30초 내외로 빠르게 생성됩니다. 작업량에 따라 시간이 달라질 수 있습니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="2">
  <Accordion.Header>Q. 하이라이트 결과물은 어떻게 제공되나요?</Accordion.Header>
  <Accordion.Body>
    이미지 슬라이드 또는 요약 텍스트 형태로 제공되며, 추후 영상 요약 기능도 추가될 예정입니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="3">
  <Accordion.Header>Q. 하이라이트 결과가 마음에 들지 않으면 수정할 수 있나요?</Accordion.Header>
  <Accordion.Body>
    예. 수동 수정 기능 또는 재생성 기능을 제공하여 원하는 결과를 얻을 수 있습니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="4">
  <Accordion.Header>Q. 웹툰 상세 분석은 어떤 정보를 포함하나요?</Accordion.Header>
  <Accordion.Body>
    캐릭터 등장 빈도, 감정 흐름, 스토리 구조, 대사 분석, 시청자 반응 분석 등을 포함합니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="5">
  <Accordion.Header>Q. 웹툰 분석 결과는 어떤 형식으로 제공되나요?</Accordion.Header>
  <Accordion.Body>
    PDF 리포트, 차트 이미지, 요약 표 형식 등 다양한 포맷으로 제공합니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="6">
  <Accordion.Header>Q. 상세 분석은 한 회차 단위로 가능한가요?</Accordion.Header>
  <Accordion.Body>
    네. 회차 단위, 시즌 단위, 전체 시리즈 단위로 분석이 가능합니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="7">
  <Accordion.Header>Q. 분석 정확도는 어느 정도인가요?</Accordion.Header>
  <Accordion.Body>
    최신 LLM 기반 분석 모델을 사용하여 약 90% 이상의 정확도를 보장합니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="8">
  <Accordion.Header>Q. 광고 초안은 어떤 방식으로 생성되나요?</Accordion.Header>
  <Accordion.Body>
    AI가 웹툰의 주요 특징과 타겟 독자층을 분석해 카피 문구, 배너 콘셉트, 키워드 중심으로 초안을 생성합니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="9">
  <Accordion.Header>Q. 광고 초안에 포함되는 항목은 어떤 게 있나요?</Accordion.Header>
  <Accordion.Body>
    광고 제목, 설명 문구, 관련 해시태그, 썸네일 문구, 클릭 유도 메시지 등이 포함됩니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="10">
  <Accordion.Header>Q. 광고 초안 결과물을 직접 편집할 수 있나요?</Accordion.Header>
  <Accordion.Body>
    네. 생성된 초안은 사용자가 자유롭게 수정 및 재작성할 수 있습니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="11">
  <Accordion.Header>Q. 광고 초안은 어떤 웹툰 플랫폼 기준으로 작성되나요?</Accordion.Header>
  <Accordion.Body>
    네이버웹툰, 카카오웹툰, 레진코믹스 등 주요 플랫폼의 트렌드를 반영하여 생성됩니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="12">
  <Accordion.Header>Q. 파트너십 문의는 어떻게 진행되나요?</Accordion.Header>
  <Accordion.Body>
    네비게이션 메뉴의 “광고 파트너십 문의”를 통해 양식을 작성하면 담당자가 연락을 드립니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="13">
  <Accordion.Header>Q. 기업/에이전시도 제휴가 가능한가요?</Accordion.Header>
  <Accordion.Body>
    네. 기업, 에이전시, 플랫폼 운영자 모두 제휴 신청이 가능합니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="14">
  <Accordion.Header>Q. 파트너십 제안 시 어떤 자료가 필요한가요?</Accordion.Header>
  <Accordion.Body>
    제휴 목적, 대상 콘텐츠, 예상 성과 등을 포함한 제안서를 준비해주시면 검토가 수월합니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="15">
  <Accordion.Header>Q. 광고 성과 측정도 지원되나요?</Accordion.Header>
  <Accordion.Body>
    네. 클릭률, 전환율, 콘텐츠 반응 등을 통계 기반으로 분석해드립니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="16">
  <Accordion.Header>Q. 광고는 어떤 위치에 노출되나요?</Accordion.Header>
  <Accordion.Body>
    웹툰 플랫폼 메인 배너, 연재 페이지 상단/하단, 검색 키워드 광고 등 위치별로 다양합니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="17">
  <Accordion.Header>Q. AI 분석 결과는 어디에 활용할 수 있나요?</Accordion.Header>
  <Accordion.Body>
    마케팅 기획, 출판 전략 수립, 작가 피드백, 리뷰 콘텐츠 제작 등 다방면으로 활용 가능합니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="18">
  <Accordion.Header>Q. 해당 서비스는 유료인가요?</Accordion.Header>
  <Accordion.Body>
    일부 기능은 무료로 제공되며, 고급 기능은 유료 플랜으로 제공됩니다.
  </Accordion.Body>
</Accordion.Item>

<Accordion.Item eventKey="19">
  <Accordion.Header>Q. 서비스 이용 시 개인정보는 안전한가요?</Accordion.Header>
  <Accordion.Body>
    네. 모든 정보는 암호화되어 처리되며, 외부 유출 없이 안전하게 관리됩니다.
  </Accordion.Body>
</Accordion.Item>

      </Accordion>
    </Container>
  );
}
