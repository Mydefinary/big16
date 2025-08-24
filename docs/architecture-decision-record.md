# Architecture Decision Records (ADR)
> PPL 이미지 생성 서비스 및 굿즈 이미지 생성 서비스 아키텍처 결정 기록

## 목차
- [ADR-001: 마이크로서비스 아키텍처 채택](#adr-001-마이크로서비스-아키텍처-채택)
- [ADR-002: AI 모델 서비스 분리](#adr-002-ai-모델-서비스-분리)
- [ADR-003: 이미지 데이터 처리 방식](#adr-003-이미지-데이터-처리-방식)
- [ADR-004: 컨테이너 오케스트레이션 플랫폼](#adr-004-컨테이너-오케스트레이션-플랫폼)
- [ADR-005: 프론트엔드 상태 관리](#adr-005-프론트엔드-상태-관리)

---

## ADR-001: 마이크로서비스 아키텍처 채택

### 상태: 승인됨
### 결정 날짜: 2024-08-19
### 태그: `architecture`, `microservices`

### 컨텍스트
웹툰 캐릭터를 활용한 이미지 생성 플랫폼에서 PPL 생성기와 굿즈 생성기라는 두 가지 서로 다른 기능을 제공해야 했습니다.

### 결정
각 기능을 독립적인 마이크로서비스로 분리하여 구현하기로 결정했습니다.
- PPL 생성기: `ppl-gen-react` 서비스
- 굿즈 생성기: `goods-gen-react` 서비스

### 이유
1. **기능별 독립성**: PPL 생성과 굿즈 생성은 서로 다른 AI 모델과 프로세스를 사용
2. **확장성**: 각 서비스별로 독립적인 스케일링이 가능
3. **유지보수성**: 한 서비스의 변경이 다른 서비스에 영향을 주지 않음
4. **기술 스택 유연성**: 필요에 따라 각 서비스별로 다른 기술 스택 적용 가능

### 결과
- 각 서비스는 별도의 Docker 컨테이너로 배포
- Kubernetes에서 독립적인 배포 및 스케일링
- 서비스 간 결합도 최소화

---

## ADR-002: AI 모델 서비스 분리

### 상태: 승인됨
### 결정 날짜: 2024-08-19
### 태그: `ai-models`, `external-api`

### 컨텍스트
PPL 생성과 굿즈 생성에 서로 다른 AI 모델을 사용해야 했습니다.

### 결정
외부 AI API 서비스를 각각 다르게 사용하기로 결정했습니다.
- PPL 생성: **Replicate API** (`flux-kontext-apps/multi-image-kontext-max` 모델)
- 굿즈 생성: **Black Forest Labs API** (`flux-kontext-max` 모델)

### 이유
1. **특화된 기능**: PPL은 두 이미지 합성에 특화, 굿즈는 단일 이미지 변환에 특화
2. **모델 성능**: 각 용도에 최적화된 모델 선택
3. **비용 효율성**: 작업 유형별 최적화된 API 사용
4. **리스크 분산**: 하나의 API 장애 시 다른 서비스는 정상 작동

### 결과
- PPL 서비스: 캐릭터 이미지 + 제품 이미지 → 합성된 PPL 이미지
- 굿즈 서비스: 캐릭터 이미지 → 굿즈 디자인 초안
- 각각의 API 키 관리 필요 (Kubernetes Secret 사용)

---

## ADR-003: 이미지 데이터 처리 방식

### 상태: 승인됨
### 결정 날짜: 2024-08-19
### 태그: `data-processing`, `performance`

### 컨텍스트
생성된 이미지를 사용자에게 제공하는 방식을 결정해야 했습니다.

### 결정
**Direct Binary Response** 방식을 채택했습니다.
- 백엔드에서 생성된 이미지를 직접 바이너리 데이터로 응답
- 프론트엔드에서 Blob 데이터로 수신하여 즉시 표시

### 고려한 대안
1. **임시 파일 저장**: 서버에 파일 저장 후 URL 반환
2. **Base64 인코딩**: JSON으로 Base64 문자열 반환

### 이유
1. **성능**: 파일 I/O 오버헤드 없음
2. **보안**: 임시 파일 노출 위험 없음
3. **스토리지 효율성**: 서버 디스크 사용량 최소화
4. **즉시성**: 생성 완료와 동시에 바로 표시 가능

### 구현 세부사항
```python
# 백엔드
return Response(content=image_bytes, media_type=f"image/{file_extension}")

# 프론트엔드
const response = await axios.post("/api/generate", formData, {
    responseType: 'blob'
});
const imageUrl = URL.createObjectURL(response.data);
```

---

## ADR-004: 컨테이너 오케스트레이션 플랫폼

### 상태: 승인됨
### 결정 날짜: 2024-08-19
### 태그: `infrastructure`, `kubernetes`

### 컨텍스트
마이크로서비스들을 안정적으로 배포하고 관리할 플랫폼이 필요했습니다.

### 결정
**Azure Kubernetes Service (AKS)**를 사용하기로 결정했습니다.

### 이유
1. **관리형 서비스**: 마스터 노드 관리 불필요
2. **Azure 생태계 통합**: Azure Container Registry와 연계
3. **자동 스케일링**: HPA(Horizontal Pod Autoscaler) 지원
4. **네트워크 정책**: 서비스 간 통신 보안 제어
5. **모니터링**: Azure Monitor 통합

### 구현 세부사항
- 네임스페이스: `lee`
- 노드 풀: `userpool` (전용 노드 풀 사용)
- 서비스 타입: ClusterIP (내부 통신)
- 이미지 레지스트리: `kt16big.azurecr.io`

---

## ADR-005: 프론트엔드 상태 관리

### 상태: 승인됨
### 결정 날짜: 2024-08-19
### 태그: `frontend`, `state-management`

### 컨텍스트
React 애플리케이션에서 이미지 생성 상태와 결과를 관리하는 방식을 결정해야 했습니다.

### 결정
**React Built-in State Hooks**를 사용하기로 결정했습니다.
- `useState`를 활용한 로컬 상태 관리
- 복잡한 상태 관리 라이브러리 없이 구현

### 고려한 대안
1. **Redux/Redux Toolkit**: 글로벌 상태 관리
2. **Zustand**: 경량 상태 관리
3. **Context API**: React 내장 글로벌 상태

### 이유
1. **단순성**: 각 서비스가 독립적이고 상태가 복잡하지 않음
2. **성능**: 불필요한 리렌더링 없음
3. **학습 곡선**: React 기본 API 사용으로 진입 장벽 낮음
4. **번들 크기**: 추가 라이브러리 불필요

### 구현 세부사항
```typescript
// 주요 상태들
const [prompt, setPrompt] = useState("");
const [image, setImage] = useState<File | null>(null);
const [outputUrl, setOutputUrl] = useState("");
const [loading, setLoading] = useState(false);
```

### 타임아웃 정책
- 백엔드: 2분 타임아웃
- 프론트엔드: 3분 타임아웃 (여유 시간 포함)

---

## 개정 이력

| 날짜 | 변경사항 | 작성자 |
|------|----------|--------|
| 2024-08-19 | 초기 ADR 문서 작성 | Lee Development Team |

---

## 참고자료
- [프로젝트 README](../README.md)
- [Kubernetes 배포 가이드](../kubernetes-service-guide.md)
- [Replicate API Documentation](https://replicate.com/docs)
- [Black Forest Labs API Documentation](https://docs.bfl.ai/)