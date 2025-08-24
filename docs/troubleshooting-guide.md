# 트러블슈팅 가이드
> PPL 이미지 생성 서비스 및 굿즈 이미지 생성 서비스 트러블슈팅 리포트

## 목차
- [일반적인 문제들](#일반적인-문제들)
- [PPL 생성기 관련 문제](#ppl-생성기-관련-문제)
- [굿즈 생성기 관련 문제](#굿즈-생성기-관련-문제)
- [인프라 관련 문제](#인프라-관련-문제)
- [모니터링 및 로그 분석](#모니터링-및-로그-분석)
- [장애 복구 절차](#장애-복구-절차)

---

## 일반적인 문제들

### 🔴 이미지 생성 타임아웃

**증상**
- 프론트엔드에서 "이미지 생성 시간이 초과되었습니다" 메시지 표시
- 백엔드 로그에 "이미지 생성이 2분 내에 완료되지 않았습니다" 출력

**원인**
1. AI 모델 처리 지연 (외부 API 과부하)
2. 네트워크 연결 문제
3. 입력 이미지 크기 과다

**해결 방법**
```bash
# 1. Pod 상태 확인
kubectl get pods -n lee | grep -E "(ppl-gen|goods-gen)"

# 2. 백엔드 로그 확인
kubectl logs -f deployment/ppl-gen-backend-deployment-lee-2 -n lee
kubectl logs -f deployment/goods-gen-backend-deployment-lee-2 -n lee

# 3. 서비스 재시작 (필요시)
kubectl rollout restart deployment/ppl-gen-backend-deployment-lee-2 -n lee
```

**예방 조치**
- 입력 이미지 크기를 5MB 이하로 제한
- 사용량 패턴 모니터링으로 피크 시간대 파악

---

### 🔴 ImagePullBackOff 오류

**증상**
- Pod가 `ImagePullBackOff` 또는 `ErrImagePull` 상태
- 컨테이너 이미지를 가져올 수 없음

**원인**
1. 이미지 태그가 존재하지 않음
2. Azure Container Registry 인증 문제
3. 네트워크 연결 문제

**해결 방법**
```bash
# 1. Pod 상세 정보 확인
kubectl describe pod <pod-name> -n lee

# 2. 이미지 존재 여부 확인
az acr repository show --name kt16big --image <image-name>:latest

# 3. 새 이미지로 업데이트
kubectl set image deployment/ppl-gen-backend-deployment-lee-2 \
  ppl-gen-backend-container-lee-2=kt16big.azurecr.io/ppl-gen-backend-lee-2:latest -n lee

# 4. 재배포 확인
kubectl rollout status deployment/ppl-gen-backend-deployment-lee-2 -n lee
```

---

### 🔴 API 키 관련 오류

**증상**
- "REPLICATE_API_TOKEN이 설정되어 있지 않습니다" 오류
- "BFL_API_KEY가 설정되어 있지 않습니다" 오류
- 401 Unauthorized 응답

**원인**
1. Kubernetes Secret이 생성되지 않음
2. API 키가 만료됨
3. Secret 키 이름 불일치

**해결 방법**
```bash
# 1. Secret 존재 여부 확인
kubectl get secret api-keys-secret -n lee

# 2. Secret 내용 확인
kubectl describe secret api-keys-secret -n lee

# 3. Secret 재생성 (필요시)
kubectl delete secret api-keys-secret -n lee
kubectl create secret generic api-keys-secret \
  --from-literal=REPLICATE_API_TOKEN=<your_token> \
  --from-literal=BFL_API_KEY=<your_key> \
  -n lee

# 4. 배포 재시작
kubectl rollout restart deployment/ppl-gen-backend-deployment-lee-2 -n lee
kubectl rollout restart deployment/goods-gen-backend-deployment-lee-2 -n lee
```

---

## PPL 생성기 관련 문제

### 🟡 두 이미지 합성 실패

**증상**
- "처리할 수 없는 결과 타입입니다" 오류
- 이미지 생성은 되지만 빈 결과 반환

**원인**
1. Replicate API 응답 형식 변경
2. 입력 이미지 형식 비호환성
3. 프롬프트 품질 문제

**진단 절차**
```bash
# 백엔드 로그에서 Replicate 응답 확인
kubectl logs deployment/ppl-gen-backend-deployment-lee-2 -n lee | grep "Replicate 응답"

# API 테스트
curl -X POST http://<backend-service>/api/ppl-gen/generate \
  -F "prompt=test prompt" \
  -F "input_image_1=@test1.jpg" \
  -F "input_image_2=@test2.jpg" \
  -F "aspect_ratio=1:1" \
  -F "output_format=png" \
  -F "safety_tolerance=2"
```

**해결 방법**
1. 이미지 형식을 PNG 또는 JPEG로 제한
2. 이미지 크기를 1024x1024 이하로 조정
3. 프롬프트를 영어로 명확하게 작성

---

### 🟡 safety_tolerance 관련 문제

**증상**
- 생성된 이미지가 예상과 다름
- "안전성 검사 실패" 관련 오류

**해결 방법**
- safety_tolerance 값을 0~2 사이에서 조정
- 프롬프트에서 부적절한 키워드 제거
- 더 구체적이고 명확한 프롬프트 사용

---

## 굿즈 생성기 관련 문제

### 🟡 BFL API 폴링 실패

**증상**
- "BFL.ai 모델 생성 실패" 오류
- 무한 폴링 상태

**원인**
1. BFL API 서버 문제
2. API 키 할당량 초과
3. 네트워크 타임아웃

**진단 절차**
```bash
# BFL API 상태 직접 확인
curl -H "x-key: $BFL_API_KEY" \
     -H "accept: application/json" \
     https://api.bfl.ai/v1/flux-kontext-max

# 백엔드 폴링 로그 확인
kubectl logs deployment/goods-gen-backend-deployment-lee-2 -n lee | grep "Polling"
```

**해결 방법**
1. API 키 갱신 또는 할당량 확인
2. 폴링 간격 조정 (현재 1초)
3. 최대 폴링 횟수 조정 (현재 120회)

---

### 🟡 단일 이미지 처리 문제

**증상**
- 캐릭터 이미지 인식 실패
- 생성된 굿즈가 부자연스러움

**해결 방법**
1. 배경이 깨끗한 캐릭터 이미지 사용
2. 고해상도 이미지 업로드
3. 굿즈별 특화된 프롬프트 사용

---

## 인프라 관련 문제

### 🔴 Pod OOMKilled (메모리 부족)

**증상**
- Pod가 `OOMKilled` 상태로 재시작
- 이미지 생성 도중 서비스 중단

**해결 방법**
```bash
# 1. Pod 리소스 사용량 확인
kubectl top pod -n lee | grep -E "(ppl-gen|goods-gen)"

# 2. 메모리 제한 증가
kubectl patch deployment ppl-gen-backend-deployment-lee-2 -n lee -p '
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "ppl-gen-backend-container-lee-2",
          "resources": {
            "limits": {
              "memory": "2Gi"
            },
            "requests": {
              "memory": "1Gi"
            }
          }
        }]
      }
    }
  }
}'
```

---

### 🔴 서비스 간 통신 실패

**증상**
- 프론트엔드에서 백엔드 API 호출 실패
- CORS 오류

**해결 방법**
```bash
# 1. 서비스 엔드포인트 확인
kubectl get endpoints -n lee | grep -E "(ppl-gen|goods-gen)"

# 2. 네트워크 정책 확인
kubectl get networkpolicies -n lee

# 3. 서비스 재시작
kubectl delete pod -l app=ppl-gen-frontend-lee-2 -n lee
```

---

### 🔴 노드 리소스 부족

**증상**
- Pod가 `Pending` 상태로 대기
- 스케줄링 실패

**해결 방법**
```bash
# 1. 노드 상태 확인
kubectl get nodes
kubectl describe nodes

# 2. 리소스 사용량 확인
kubectl top nodes

# 3. 불필요한 Pod 정리
kubectl get pods --all-namespaces --field-selector=status.phase=Failed
kubectl delete pods --field-selector=status.phase=Failed --all-namespaces
```

---

## 모니터링 및 로그 분석

### 로그 수집 방법

```bash
# 전체 서비스 로그 확인
kubectl logs -f deployment/ppl-gen-backend-deployment-lee-2 -n lee --tail=100
kubectl logs -f deployment/goods-gen-backend-deployment-lee-2 -n lee --tail=100

# 특정 시간 범위 로그
kubectl logs deployment/ppl-gen-backend-deployment-lee-2 -n lee \
  --since=1h --timestamps=true

# 에러 로그만 필터링
kubectl logs deployment/ppl-gen-backend-deployment-lee-2 -n lee | grep -i error
```

### 메트릭 모니터링

```bash
# 리소스 사용량 모니터링
kubectl top pods -n lee --sort-by=cpu
kubectl top pods -n lee --sort-by=memory

# 서비스 상태 확인
kubectl get pods -n lee -o wide --watch
```

---

## 장애 복구 절차

### 🚨 긴급 복구 절차

1. **서비스 중단 감지**
   ```bash
   kubectl get pods -n lee | grep -v Running
   ```

2. **즉시 복구 작업**
   ```bash
   # 전체 서비스 재시작
   kubectl rollout restart deployment/ppl-gen-backend-deployment-lee-2 -n lee
   kubectl rollout restart deployment/ppl-gen-frontend-deployment-lee-2 -n lee
   kubectl rollout restart deployment/goods-gen-backend-deployment-lee-2 -n lee
   kubectl rollout restart deployment/goods-gen-frontend-deployment-lee-2 -n lee
   ```

3. **복구 상태 확인**
   ```bash
   kubectl get pods -n lee --watch
   kubectl rollout status deployment/ppl-gen-backend-deployment-lee-2 -n lee
   ```

### 데이터 백업 및 복구

현재 시스템은 상태가 없는(stateless) 서비스이므로 별도의 데이터 백업이 필요하지 않습니다. 단, 다음 설정들의 백업을 권장합니다:

1. Kubernetes 배포 파일
2. Secret 설정
3. Ingress 규칙

---

## 성능 최적화

### 백엔드 최적화

1. **타임아웃 조정**
   - PPL: 2분 (현재 설정 유지)
   - 굿즈: 2분 (현재 설정 유지)

2. **리소스 할당**
   ```yaml
   resources:
     requests:
       memory: "512Mi"
       cpu: "500m"
     limits:
       memory: "1Gi"
       cpu: "1000m"
   ```

### 프론트엔드 최적화

1. **이미지 압축**
   - 업로드 전 클라이언트 사이드 압축
   - 최대 파일 크기 제한 (5MB)

2. **사용자 경험 개선**
   - 진행률 표시기 추가
   - 예상 대기 시간 안내

---

## 연락처 및 에스컬레이션

### 장애 단계별 대응

| 단계 | 설명 | 대응자 | 대응 시간 |
|------|------|--------|----------|
| P1 | 서비스 완전 중단 | 1차: 개발팀 | 15분 이내 |
| P2 | 기능 일부 장애 | 1차: 개발팀 | 1시간 이내 |
| P3 | 성능 저하 | 1차: 운영팀 | 4시간 이내 |

### 에스컬레이션 절차

1. **1차 대응**: 개발팀 (15분)
2. **2차 에스컬레이션**: 시스템 관리자 (30분)
3. **3차 에스컬레이션**: 서비스 매니저 (1시간)

---

## 변경 이력

| 날짜 | 변경사항 | 작성자 |
|------|----------|--------|
| 2024-08-19 | 초기 트러블슈팅 가이드 작성 | Lee Development Team |

---

## 참고자료

- [Architecture Decision Records](./architecture-decision-record.md)
- [운영 표준 절차](./operations-runbook.md)
- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [Replicate API 문서](https://replicate.com/docs)
- [Black Forest Labs API 문서](https://docs.bfl.ai/)