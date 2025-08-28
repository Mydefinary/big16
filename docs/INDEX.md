# Board-Lee 문서 인덱스

## 📋 문서 개요
이 디렉토리는 Board-Lee 게시판 시스템의 모든 문서를 포함하고 있습니다. 각 문서는 특정 목적과 대상을 위해 작성되었으며, 시스템의 이해, 사용, 개발, 배포, 운영에 필요한 정보를 제공합니다.

---

## 📚 문서 목록

### 🏠 기본 문서
| 문서명 | 설명 | 대상 |
|-------|------|------|
| [README.md](../README.md) | 프로젝트 전체 개요 및 시작 가이드 | 모든 사용자 |
| [INDEX.md](INDEX.md) | 이 문서 - 전체 문서 가이드 | 모든 사용자 |

### 👥 사용자 문서  
| 문서명 | 설명 | 대상 |
|-------|------|------|
| [USER_MANUAL.md](USER_MANUAL.md) | 사용자를 위한 상세 이용 가이드 | 최종 사용자 |
| [FAQ.md](FAQ.md) | 자주 묻는 질문과 답변 | 최종 사용자, 지원팀 |

### 🛠️ 개발자 문서
| 문서명 | 설명 | 대상 |
|-------|------|------|
| [API_SPECIFICATION.md](API_SPECIFICATION.md) | REST API 명세서 | 개발자, QA |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 시스템 아키텍처 설계 문서 | 개발자, 아키텍트 |
| [CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md) | 코딩 컨벤션 및 스타일 가이드 | 개발자 |

### 🚀 배포 및 운영 문서
| 문서명 | 설명 | 대상 |
|-------|------|------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | 배포 가이드 및 런북 | 개발자, DevOps |
| [MONITORING_GUIDE.md](MONITORING_GUIDE.md) | 모니터링 및 알림 가이드 | 운영팀, DevOps |
| [INCIDENT_RESPONSE_PLAYBOOK.md](INCIDENT_RESPONSE_PLAYBOOK.md) | 장애 대응 가이드 및 플레이북 | 운영팀, 개발자 |

### 📊 관리 문서
| 문서명 | 설명 | 대상 |
|-------|------|------|
| [RELEASE_NOTES.md](RELEASE_NOTES.md) | 릴리스 노트 및 변경 사항 | 모든 이해관계자 |

---

## 🎯 역할별 추천 문서

### 새로운 사용자
1. 📖 [README.md](../README.md) - 프로젝트 전체 이해
2. 👤 [USER_MANUAL.md](USER_MANUAL.md) - 사용 방법 학습
3. ❓ [FAQ.md](FAQ.md) - 자주 묻는 질문 확인

### 새로운 개발자
1. 📖 [README.md](../README.md) - 프로젝트 개요
2. 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - 시스템 아키텍처 이해
3. 📝 [CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md) - 코딩 컨벤션 학습
4. 🔌 [API_SPECIFICATION.md](API_SPECIFICATION.md) - API 명세 숙지
5. 🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 배포 프로세스 학습

### 새로운 운영자
1. 📖 [README.md](../README.md) - 시스템 개요
2. 🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 배포 프로세스
3. 📊 [MONITORING_GUIDE.md](MONITORING_GUIDE.md) - 모니터링 방법
4. 🚨 [INCIDENT_RESPONSE_PLAYBOOK.md](INCIDENT_RESPONSE_PLAYBOOK.md) - 장애 대응
5. 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - 인프라 구조 이해

### 프로젝트 관리자
1. 📖 [README.md](../README.md) - 전체 프로젝트 상태
2. 📋 [RELEASE_NOTES.md](RELEASE_NOTES.md) - 릴리스 현황
3. 👤 [USER_MANUAL.md](USER_MANUAL.md) - 사용자 기능 파악
4. ❓ [FAQ.md](FAQ.md) - 사용자 이슈 현황

---

## 📖 문서 읽기 순서 가이드

### 빠른 시작 (15분)
```
README.md → USER_MANUAL.md → FAQ.md
```

### 개발 시작 (1시간)
```
README.md → ARCHITECTURE.md → CODE_STYLE_GUIDE.md → API_SPECIFICATION.md
```

### 운영 준비 (2시간)
```
README.md → ARCHITECTURE.md → DEPLOYMENT_GUIDE.md → 
MONITORING_GUIDE.md → INCIDENT_RESPONSE_PLAYBOOK.md
```

### 전체 이해 (3시간)
```
모든 문서를 순차적으로 읽기
```

---

## 🔍 문서별 키워드

### 사용자 관련
- **로그인/인증**: USER_MANUAL.md, FAQ.md
- **게시글 작성**: USER_MANUAL.md, API_SPECIFICATION.md
- **파일 업로드**: USER_MANUAL.md, FAQ.md, API_SPECIFICATION.md
- **권한 관리**: USER_MANUAL.md, ARCHITECTURE.md

### 기술 관련
- **API**: API_SPECIFICATION.md
- **데이터베이스**: ARCHITECTURE.md, DEPLOYMENT_GUIDE.md
- **Docker**: DEPLOYMENT_GUIDE.md, README.md
- **Kubernetes**: DEPLOYMENT_GUIDE.md, MONITORING_GUIDE.md, INCIDENT_RESPONSE_PLAYBOOK.md
- **React**: CODE_STYLE_GUIDE.md, ARCHITECTURE.md
- **Spring Boot**: CODE_STYLE_GUIDE.md, ARCHITECTURE.md

### 운영 관련
- **배포**: DEPLOYMENT_GUIDE.md, RELEASE_NOTES.md
- **모니터링**: MONITORING_GUIDE.md
- **장애 대응**: INCIDENT_RESPONSE_PLAYBOOK.md
- **성능**: MONITORING_GUIDE.md, ARCHITECTURE.md

---

## 📅 문서 업데이트 일정

### 정기 업데이트
- **매월**: RELEASE_NOTES.md (릴리스 시마다)
- **분기별**: FAQ.md (신규 질문 추가)
- **반기별**: ARCHITECTURE.md (시스템 변경사항 반영)

### 이벤트 기반 업데이트
- **새 기능 추가 시**: USER_MANUAL.md, API_SPECIFICATION.md
- **배포 프로세스 변경 시**: DEPLOYMENT_GUIDE.md
- **장애 발생 후**: INCIDENT_RESPONSE_PLAYBOOK.md
- **코딩 컨벤션 변경 시**: CODE_STYLE_GUIDE.md

---

## 🤝 문서 기여하기

### 문서 개선 제안
1. GitHub Issues에 문서 개선 제안 등록
2. Pull Request로 직접 수정 제안
3. Slack #board-lee-general 채널에 의견 제시

### 새 문서 작성 요청
다음과 같은 경우 새 문서가 필요할 수 있습니다:
- 새로운 기능이나 모듈 추가
- 특정 프로세스나 절차 표준화 필요
- 자주 묻는 질문이 복잡해져 별도 가이드 필요

### 문서 작성 가이드라인
- **명확성**: 기술적 내용도 이해하기 쉽게 작성
- **구체성**: 추상적 설명보다 구체적 예시 포함
- **일관성**: 기존 문서와 일관된 형식과 톤 유지
- **최신성**: 코드 변경사항을 문서에 즉시 반영

---

## 🔗 외부 참조 링크

### 기술 문서
- [Spring Boot 공식 문서](https://spring.io/projects/spring-boot)
- [React 공식 문서](https://react.dev/)
- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [Docker 공식 문서](https://docs.docker.com/)

### 도구 및 서비스
- [Azure Kubernetes Service](https://docs.microsoft.com/azure/aks/)
- [Azure Container Registry](https://docs.microsoft.com/azure/container-registry/)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)

---

## 📞 문서 관련 문의

### 담당자
- **문서 총괄**: 프로젝트 관리자
- **기술 문서**: 리드 개발자
- **사용자 문서**: UX/기획 담당자
- **운영 문서**: DevOps 엔지니어

### 연락 방법
- **일반 문의**: GitHub Issues 생성
- **긴급 수정**: Slack #board-lee-docs 채널
- **개선 제안**: Pull Request 또는 토론

---

**마지막 업데이트**: 2025년 8월 28일  
**다음 리뷰 예정**: 2025년 9월 28일

이 인덱스를 통해 Board-Lee 프로젝트의 모든 문서를 효율적으로 탐색하고 활용할 수 있습니다.