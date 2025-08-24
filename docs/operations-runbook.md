# 운영 런북 (Operations Runbook)
> PPL 이미지 생성 서비스 및 굿즈 이미지 생성 서비스 표준 운영 절차

## 목차
- [서비스 개요](#서비스-개요)
- [일일 운영 절차](#일일-운영-절차)
- [배포 프로세스](#배포-프로세스)
- [모니터링 및 알람](#모니터링-및-알람)
- [백업 및 복구](#백업-및-복구)
- [보안 관리](#보안-관리)
- [성능 관리](#성능-관리)
- [인시던트 대응](#인시던트-대응)
- [정기 유지보수](#정기-유지보수)

---

## 서비스 개요

### 서비스 구성요소

| 서비스 | 포트 | 배포명 | 네임스페이스 |
|--------|------|--------|--------------|
| PPL Frontend | 80 | ppl-gen-frontend-deployment-lee-2 | lee |
| PPL Backend | 8000 | ppl-gen-backend-deployment-lee-2 | lee |
| Goods Frontend | 80 | goods-gen-frontend-deployment-lee-2 | lee |
| Goods Backend | 8001 | goods-gen-backend-deployment-lee-2 | lee |

### 외부 의존성

| 서비스 | API | 용도 |
|--------|-----|------|
| PPL 백엔드 | Replicate API | 이미지 합성 AI 모델 |
| 굿즈 백엔드 | Black Forest Labs API | 굿즈 디자인 AI 모델 |

---

## 일일 운영 절차

### 🌅 오전 체크리스트 (09:00)

1. **서비스 상태 확인**
   ```bash
   # 모든 Pod 상태 확인
   kubectl get pods -n lee -o wide
   
   # 예상 출력: 모든 Pod가 Running 상태여야 함
   # NAME                                           READY   STATUS    RESTARTS
   # ppl-gen-backend-deployment-lee-2-xxx           1/1     Running   0
   # ppl-gen-frontend-deployment-lee-2-xxx          1/1     Running   0
   # goods-gen-backend-deployment-lee-2-xxx         1/1     Running   0
   # goods-gen-frontend-deployment-lee-2-xxx        1/1     Running   0
   ```

2. **서비스 엔드포인트 확인**
   ```bash
   # 서비스 상태 확인
   kubectl get svc -n lee
   
   # 엔드포인트 확인
   kubectl get endpoints -n lee
   ```

3. **리소스 사용량 확인**
   ```bash
   # CPU/Memory 사용량 확인
   kubectl top pods -n lee --sort-by=memory
   kubectl top nodes
   ```

4. **로그 확인**
   ```bash
   # 에러 로그 검색 (지난 1시간)
   kubectl logs deployment/ppl-gen-backend-deployment-lee-2 -n lee --since=1h | grep -i error
   kubectl logs deployment/goods-gen-backend-deployment-lee-2 -n lee --since=1h | grep -i error
   ```

### 🌆 저녁 체크리스트 (18:00)

1. **일일 사용량 검토**
   ```bash
   # 하루 동안의 로그 분석
   kubectl logs deployment/ppl-gen-backend-deployment-lee-2 -n lee --since=24h | grep "생성 요청" | wc -l
   kubectl logs deployment/goods-gen-backend-deployment-lee-2 -n lee --since=24h | grep "생성 요청" | wc -l
   ```

2. **성능 메트릭 수집**
   ```bash
   # 응답 시간 분석
   kubectl logs deployment/ppl-gen-backend-deployment-lee-2 -n lee --since=24h | grep "✅ 이미지 데이터 직접 반환"
   ```

3. **Secret 만료일 확인**
   ```bash
   # Secret 정보 확인
   kubectl describe secret api-keys-secret -n lee
   ```

---

## 배포 프로세스

### 🚀 표준 배포 절차

#### 1단계: 사전 준비

```bash
# 1. 현재 서비스 상태 백업
kubectl get deployment -n lee -o yaml > deployment-backup-$(date +%Y%m%d_%H%M%S).yaml

# 2. 이미지 빌드 및 푸시 (개발팀에서 수행)
# PPL Frontend
cd ppl-gen-react/frontend
docker build -t kt16big.azurecr.io/ppl-gen-frontend-lee-2:$(date +%Y%m%d_%H%M%S) .
docker push kt16big.azurecr.io/ppl-gen-frontend-lee-2:$(date +%Y%m%d_%H%M%S)

# PPL Backend
cd ../backend
docker build -t kt16big.azurecr.io/ppl-gen-backend-lee-2:$(date +%Y%m%d_%H%M%S) .
docker push kt16big.azurecr.io/ppl-gen-backend-lee-2:$(date +%Y%m%d_%H%M%S)

# 굿즈 Frontend
cd ../../goods-gen-react/frontend
docker build -t kt16big.azurecr.io/goods-gen-frontend-lee-2:$(date +%Y%m%d_%H%M%S) .
docker push kt16big.azurecr.io/goods-gen-frontend-lee-2:$(date +%Y%m%d_%H%M%S)

# 굿즈 Backend
cd ../backend
docker build -t kt16big.azurecr.io/goods-gen-backend-lee-2:$(date +%Y%m%d_%H%M%S) .
docker push kt16big.azurecr.io/goods-gen-backend-lee-2:$(date +%Y%m%d_%H%M%S)
```

#### 2단계: 배포 실행

```bash
# Azure Container Registry 로그인
az acr login --name kt16big

# 새 이미지로 업데이트 (예시: 날짜 태그 사용)
NEW_TAG=$(date +%Y%m%d_%H%M%S)

kubectl set image deployment/ppl-gen-frontend-deployment-lee-2 \
  ppl-gen-frontend-container-lee-2=kt16big.azurecr.io/ppl-gen-frontend-lee-2:$NEW_TAG -n lee

kubectl set image deployment/ppl-gen-backend-deployment-lee-2 \
  ppl-gen-backend-container-lee-2=kt16big.azurecr.io/ppl-gen-backend-lee-2:$NEW_TAG -n lee

kubectl set image deployment/goods-gen-frontend-deployment-lee-2 \
  goods-gen-frontend-container-lee-2=kt16big.azurecr.io/goods-gen-frontend-lee-2:$NEW_TAG -n lee

kubectl set image deployment/goods-gen-backend-deployment-lee-2 \
  goods-gen-backend-container-lee-2=kt16big.azurecr.io/goods-gen-backend-lee-2:$NEW_TAG -n lee
```

#### 3단계: 배포 검증

```bash
# 배포 상태 확인
kubectl rollout status deployment/ppl-gen-backend-deployment-lee-2 -n lee
kubectl rollout status deployment/ppl-gen-frontend-deployment-lee-2 -n lee
kubectl rollout status deployment/goods-gen-backend-deployment-lee-2 -n lee
kubectl rollout status deployment/goods-gen-frontend-deployment-lee-2 -n lee

# 서비스 기능 테스트
curl -f http://<frontend-service-ip>/api/ppl-gen/generate -X POST \
  -F "prompt=test" \
  -F "input_image_1=@test1.jpg" \
  -F "input_image_2=@test2.jpg" \
  -F "aspect_ratio=1:1" \
  -F "output_format=png" \
  -F "safety_tolerance=2" \
  -F "seed=11"
```

#### 4단계: 롤백 절차 (실패 시)

```bash
# 이전 버전으로 롤백
kubectl rollout undo deployment/ppl-gen-backend-deployment-lee-2 -n lee
kubectl rollout undo deployment/ppl-gen-frontend-deployment-lee-2 -n lee
kubectl rollout undo deployment/goods-gen-backend-deployment-lee-2 -n lee
kubectl rollout undo deployment/goods-gen-frontend-deployment-lee-2 -n lee

# 롤백 상태 확인
kubectl rollout status deployment/ppl-gen-backend-deployment-lee-2 -n lee
```

---

## 모니터링 및 알람

### 📊 핵심 메트릭

#### 서비스 가용성
- **Pod 상태**: 모든 Pod가 `Running` 상태
- **서비스 응답**: HTTP 200 응답률 > 95%
- **엔드포인트**: 모든 엔드포인트 `Ready` 상태

#### 성능 메트릭
- **응답 시간**: 
  - PPL 생성: 평균 90초, 최대 120초
  - 굿즈 생성: 평균 60초, 최대 120초
- **처리량**: 시간당 요청 수
- **오류율**: 5% 미만 유지

#### 리소스 사용량
- **CPU**: 80% 미만
- **메모리**: 90% 미만
- **디스크**: 해당 없음 (stateless)

### 🚨 알람 설정 (권장)

```bash
# Kubernetes 이벤트 모니터링
kubectl get events -n lee --sort-by='.lastTimestamp'

# Pod 재시작 감지
kubectl get pods -n lee --field-selector=status.phase=Failed

# 리소스 임계치 확인
kubectl top pods -n lee --sort-by=memory | awk 'NR>1 && $3+0 > 800 {print $1, $3}'
```

---

## 백업 및 복구

### 💾 백업 대상

#### 설정 파일 백업
```bash
# 배포 설정 백업
kubectl get deployment -n lee -o yaml > backups/deployments-$(date +%Y%m%d).yaml
kubectl get service -n lee -o yaml > backups/services-$(date +%Y%m%d).yaml
kubectl get secret api-keys-secret -n lee -o yaml > backups/secrets-$(date +%Y%m%d).yaml

# 중요: Secret 파일은 암호화하여 안전하게 저장
gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
    --s2k-digest-algo SHA512 --s2k-count 65536 --symmetric \
    backups/secrets-$(date +%Y%m%d).yaml
```

#### 이미지 백업
```bash
# 현재 사용 중인 이미지 태그 기록
kubectl get deployment -n lee -o jsonpath='{.items[*].spec.template.spec.containers[*].image}' > backups/image-tags-$(date +%Y%m%d).txt
```

### 🔄 복구 절차

#### 완전 복구
```bash
# 1. 네임스페이스 재생성 (필요시)
kubectl create namespace lee

# 2. Secret 복구
kubectl apply -f backups/secrets-YYYYMMDD.yaml

# 3. 서비스 복구
kubectl apply -f backups/services-YYYYMMDD.yaml

# 4. 배포 복구
kubectl apply -f backups/deployments-YYYYMMDD.yaml

# 5. 상태 확인
kubectl get all -n lee
```

---

## 보안 관리

### 🔐 API 키 관리

#### 정기 키 갱신 (월 1회)
```bash
# 1. 새 API 키 발급 (각 서비스 콘솔에서)
# 2. Secret 업데이트
kubectl create secret generic api-keys-secret-new \
  --from-literal=REPLICATE_API_TOKEN=<new_token> \
  --from-literal=BFL_API_KEY=<new_key> \
  -n lee

# 3. 배포 업데이트
kubectl patch deployment ppl-gen-backend-deployment-lee-2 -n lee \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"ppl-gen-backend-container-lee-2","env":[{"name":"REPLICATE_API_TOKEN","valueFrom":{"secretKeyRef":{"name":"api-keys-secret-new","key":"REPLICATE_API_TOKEN"}}}]}]}}}}'

# 4. 기존 Secret 삭제
kubectl delete secret api-keys-secret -n lee
kubectl create secret generic api-keys-secret \
  --from-literal=REPLICATE_API_TOKEN=<new_token> \
  --from-literal=BFL_API_KEY=<new_key> \
  -n lee
```

### 🛡️ 네트워크 보안

#### CORS 설정 검증
```bash
# 백엔드 CORS 설정 확인
kubectl logs deployment/ppl-gen-backend-deployment-lee-2 -n lee | grep -i cors
kubectl logs deployment/goods-gen-backend-deployment-lee-2 -n lee | grep -i cors
```

#### 불필요한 포트 차단
```bash
# 열린 포트 확인
kubectl get service -n lee -o yaml | grep -A 5 ports:
```

---

## 성능 관리

### ⚡ 성능 최적화

#### 리소스 조정
```bash
# CPU/메모리 사용률이 지속적으로 높은 경우
kubectl patch deployment ppl-gen-backend-deployment-lee-2 -n lee -p '
{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "ppl-gen-backend-container-lee-2",
          "resources": {
            "requests": {
              "memory": "1Gi",
              "cpu": "750m"
            },
            "limits": {
              "memory": "2Gi", 
              "cpu": "1500m"
            }
          }
        }]
      }
    }
  }
}'
```

#### 수평 확장 (HPA)
```bash
# HPA 설정 (CPU 기준 70% 사용률)
kubectl autoscale deployment ppl-gen-backend-deployment-lee-2 --cpu-percent=70 --min=1 --max=3 -n lee
kubectl autoscale deployment goods-gen-backend-deployment-lee-2 --cpu-percent=70 --min=1 --max=3 -n lee

# HPA 상태 확인
kubectl get hpa -n lee
```

### 📈 캐시 최적화

#### 프론트엔드 정적 파일 캐싱
```bash
# Nginx 설정 확인 (nginx.conf에서)
kubectl exec deployment/ppl-gen-frontend-deployment-lee-2 -n lee -- cat /etc/nginx/nginx.conf | grep -A 10 cache
```

---

## 인시던트 대응

### 🚨 심각도별 대응 시간

| 심각도 | 설명 | 목표 응답 시간 | 목표 해결 시간 |
|--------|------|----------------|----------------|
| P1 | 서비스 완전 중단 | 15분 | 2시간 |
| P2 | 주요 기능 장애 | 30분 | 4시간 |
| P3 | 부분적 성능 저하 | 2시간 | 1일 |
| P4 | 사소한 문제 | 1일 | 1주 |

### 📞 연락 체계

1. **1차 대응자**: 개발팀 (24시간 대기)
2. **2차 에스컬레이션**: 시스템 관리자
3. **최종 에스컬레이션**: 서비스 매니저

### 🔧 표준 대응 절차

#### P1 인시던트 (서비스 중단)
```bash
# 1단계: 즉시 상황 파악 (5분 이내)
kubectl get pods -n lee
kubectl get events -n lee --sort-by='.lastTimestamp' | tail -10

# 2단계: 긴급 복구 시도 (10분 이내)
kubectl rollout restart deployment/ppl-gen-backend-deployment-lee-2 -n lee
kubectl rollout restart deployment/goods-gen-backend-deployment-lee-2 -n lee

# 3단계: 상태 확인 및 보고
kubectl get pods -n lee --watch
```

#### P2 인시던트 (기능 장애)
```bash
# 상세 로그 분석
kubectl logs deployment/ppl-gen-backend-deployment-lee-2 -n lee --tail=100
kubectl describe pod <failing-pod> -n lee

# 특정 서비스만 재시작
kubectl rollout restart deployment/<affected-deployment> -n lee
```

---

## 정기 유지보수

### 📅 주간 유지보수 (매주 일요일 02:00)

1. **시스템 정리**
   ```bash
   # 완료된 Job 정리
   kubectl delete job --field-selector=status.successful=1 -n lee
   
   # 실패한 Pod 정리
   kubectl delete pod --field-selector=status.phase=Failed -n lee
   
   # 사용하지 않는 이미지 정리 (노드에서)
   kubectl get nodes -o jsonpath='{.items[*].metadata.name}' | xargs -I {} kubectl drain {} --ignore-daemonsets --delete-local-data
   ```

2. **백업 실행**
   ```bash
   # 주간 전체 백업
   mkdir -p backups/weekly/$(date +%Y%W)
   kubectl get all -n lee -o yaml > backups/weekly/$(date +%Y%W)/all-resources.yaml
   ```

3. **보안 업데이트 확인**
   ```bash
   # 컨테이너 이미지 보안 스캔 (수동)
   az acr task run --registry kt16big --name security-scan
   ```

### 📅 월간 유지보수 (매월 첫째 주 일요일)

1. **API 키 갱신**
   - Replicate API 토큰 갱신
   - Black Forest Labs API 키 갱신

2. **성능 리뷰**
   ```bash
   # 월간 성능 리포트 생성
   kubectl top pods -n lee --sort-by=memory > reports/monthly-$(date +%Y%m)-memory.txt
   kubectl top pods -n lee --sort-by=cpu > reports/monthly-$(date +%Y%m)-cpu.txt
   ```

3. **용량 계획**
   - 월간 사용량 분석
   - 리소스 사용 트렌드 검토
   - 필요시 리소스 확장 계획

---

## 체크리스트

### ✅ 배포 전 체크리스트
- [ ] 백업 완료
- [ ] 테스트 환경에서 검증 완료
- [ ] 롤백 계획 수립
- [ ] 모니터링 대시보드 준비
- [ ] 팀원 대기 상태 확인

### ✅ 배포 후 체크리스트
- [ ] 모든 Pod Running 상태 확인
- [ ] 서비스 기능 테스트 완료
- [ ] 에러 로그 없음 확인
- [ ] 성능 메트릭 정상 확인
- [ ] 사용자 접근 가능 확인

### ✅ 인시던트 후 체크리스트
- [ ] 근본 원인 분석 완료
- [ ] 예방책 수립
- [ ] 문서 업데이트
- [ ] 팀 공유 및 학습
- [ ] 모니터링 개선사항 적용

---

## 연락처

### 긴급 연락처
- **개발팀**: [개발팀 연락처]
- **인프라팀**: [인프라팀 연락처]
- **서비스 매니저**: [매니저 연락처]

### 외부 서비스 지원
- **Azure 지원**: [Azure 지원 연락처]
- **Replicate 지원**: support@replicate.com
- **BFL 지원**: support@bfl.ai

---

## 변경 이력

| 날짜 | 변경사항 | 승인자 | 작성자 |
|------|----------|--------|--------|
| 2024-08-19 | 초기 운영 런북 작성 | [승인자] | Lee Development Team |

---

## 참고자료

- [아키텍처 결정 기록](./architecture-decision-record.md)
- [트러블슈팅 가이드](./troubleshooting-guide.md)
- [프로젝트 README](../README.md)
- [Kubernetes 관리 가이드](../kubernetes-service-guide.md)