# Board-Lee 릴리스 노트

## 버전 1.2.0 (2025-08-28) - 다중 첨부파일 지원 [CURRENT]

### 🚀 새로운 기능
- **다중 파일 첨부**: 게시글당 최대 20개 파일 첨부 가능
- **개선된 파일 관리**: Attachment 엔티티를 통한 체계적인 파일 관리
- **확장된 권한 시스템**: 답글 시스템과 통합된 세밀한 권한 제어

### 🔧 기술적 개선
- `Attachment` 엔티티 추가로 파일 메타데이터 관리 강화
- `Post` 엔티티에 `OneToMany` 관계로 다중 첨부파일 지원
- `PostService`에 파일 처리 로직 개선
- React 프론트엔드에 다중 파일 선택 UI 구현

### 🐛 버그 수정
- 파일 업로드 시 author 파라미터 불일치 문제 해결
- 권한 검증 로직에서 nickName 대신 userId 사용하도록 수정
- null 값 처리 개선 (authorNickName 필드)

### 📋 파일 업로드 제약사항
- 지원 파일 형식: PDF, JPG, PNG
- 개별 파일 크기: 최대 10MB
- 게시글당 파일 수: 최대 20개
- UUID 기반 파일명 암호화

### 🗂️ 데이터베이스 변경사항
```sql
-- 새로운 테이블 추가
CREATE TABLE attachments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

### ⚠️ 알려진 이슈
- 다중 파일 업로드 UI 개선 필요 (부분적 동작)
- 첨부파일 다운로드 API 개선 필요 (ID 기반 다운로드)

---

## 버전 1.1.0 (2025-08-20) - 답글 시스템 구현

### 🚀 새로운 기능
- **계층형 답글 시스템**: 무제한 깊이의 답글 구조 지원
- **역할 기반 접근 제어 (RBAC)**: admin, operator, user 권한 구분
- **답글 권한 관리**: user는 본인 게시글의 답글만 열람 가능

### 🔧 기술적 개선
- `Post` 엔티티에 답글 관련 필드 추가:
  - `parent`: 부모 게시글 참조
  - `depth`: 답글 깊이
  - `isReply`: 답글 여부 플래그
- 권한 검증 로직 구현 (`hasReadPermission`)
- 답글 생성 API 추가 (`POST /posts/{id}/reply`)

### 🎨 UI/UX 개선
- 답글 작성 버튼 추가
- 권한별 버튼 표시/숨김 처리
- 작성자 개인정보 보호 (첫글자+마지막글자만 표시)

### 🔐 보안 강화
- JWT 토큰 기반 인증 시스템 통합
- 쿠키 기반 세션 관리
- 사용자별 접근 권한 세분화

### 📊 권한 매트릭스
| 역할 | 읽기 | 쓰기 | 수정 | 삭제 | 답글 |
|------|------|------|------|------|------|
| admin | 전체 | ✅ | 전체 | 전체 | ✅ |
| operator | 전체 | ✅ | 본인 | 본인 | ✅ |
| user | 본인+답글 | ✅ | 본인 | 본인 | 본인글만 |

### 🗂️ 데이터베이스 변경사항
```sql
-- posts 테이블 컬럼 추가
ALTER TABLE posts ADD COLUMN parent_id BIGINT;
ALTER TABLE posts ADD COLUMN depth INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN is_reply BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN author_nick_name VARCHAR(100);
ALTER TABLE posts ADD FOREIGN KEY (parent_id) REFERENCES posts(id);
```

---

## 버전 1.0.0 (2025-08-15) - 초기 릴리스

### 🚀 핵심 기능
- **게시판 CRUD**: 게시글 생성, 조회, 수정, 삭제
- **파일 첨부**: 단일 파일 업로드 및 다운로드
- **검색 기능**: 제목, 작성자 기준 검색
- **페이지네이션**: 성능 최적화된 페이지 단위 조회

### 🏗️ 아키텍처
- **프론트엔드**: React 18 + Bootstrap 5
- **백엔드**: Spring Boot 2.7 + JPA
- **데이터베이스**: MySQL 8.0
- **배포**: Docker + Kubernetes (AKS)
- **이미지 저장소**: Azure Container Registry

### 🌐 네트워크 구성
- **Gateway**: ToonConnect (라우팅)
- **Frontend URL**: `http://20.249.113.18:9000/board`
- **Backend API**: `http://20.249.113.18:9000/board/api`

### 📁 프로젝트 구조
```
board-lee/
├── frontend/          # React 애플리케이션
├── backend/           # Spring Boot 애플리케이션
├── k8s/              # Kubernetes 배포 파일
└── docs/             # 문서
```

### 🔧 초기 기술 스택
- **Java**: OpenJDK 17
- **Spring Boot**: 2.7.x
- **React**: 18.x
- **MySQL**: 8.0
- **Docker**: Multi-stage 빌드
- **Kubernetes**: 1.20+

---

## 향후 계획 (Roadmap)

### 버전 1.3.0 (계획)
- [ ] 다중 첨부파일 UI/UX 개선
- [ ] 파일 미리보기 기능
- [ ] 이미지 썸네일 생성
- [ ] 대용량 파일 처리 최적화

### 버전 1.4.0 (계획)
- [ ] 게시글 카테고리 분류
- [ ] 태그 시스템
- [ ] 고급 검색 필터
- [ ] 즐겨찾기 기능

### 버전 2.0.0 (계획)
- [ ] 마크다운 에디터
- [ ] 실시간 알림 시스템
- [ ] 사용자 프로필 관리
- [ ] 모바일 앱 지원

---

## 지원 정보

### 시스템 요구사항
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **해상도**: 1024x768 이상 권장
- **네트워크**: 안정적인 인터넷 연결

### 호환성
- **Java**: OpenJDK 17+
- **Node.js**: 18+
- **Docker**: 20.10+
- **Kubernetes**: 1.20+

### 성능 벤치마크
- **응답 시간**: 평균 200ms 이하 (게시글 목록)
- **동시 사용자**: 100명 이상 지원
- **파일 업로드**: 10MB/파일, 20파일/게시글

### 보안 정책
- JWT 토큰 만료: 24시간
- 파일 업로드 검증: MIME 타입 + 확장자
- 권한 검증: 모든 API 요청 시 수행

---

## 문의 및 지원

### 버그 신고
- **GitHub Issues**: [프로젝트 이슈 트래커]
- **긴급 장애**: 시스템 관리자에게 직접 연락

### 기능 요청
- **GitHub Discussions**: 새로운 기능 제안
- **사용자 피드백**: 정기적인 사용자 설문조사

### 문서화
- **API 문서**: `/docs/API_SPECIFICATION.md`
- **사용자 가이드**: `/docs/USER_MANUAL.md`
- **배포 가이드**: `/docs/DEPLOYMENT_GUIDE.md`

---

**마지막 업데이트**: 2025년 8월 28일  
**다음 릴리스 예정**: 2025년 9월 (v1.3.0)