# Board-Lee 모니터링 및 알림 가이드

## 목차
1. [모니터링 개요](#모니터링-개요)
2. [Kubernetes 기본 모니터링](#kubernetes-기본-모니터링)
3. [애플리케이션 모니터링](#애플리케이션-모니터링)
4. [로그 모니터링](#로그-모니터링)
5. [성능 메트릭](#성능-메트릭)
6. [알림 시스템](#알림-시스템)
7. [대시보드 구성](#대시보드-구성)
8. [모니터링 자동화](#모니터링-자동화)

---

## 모니터링 개요

Board-Lee 시스템의 모니터링은 다음 계층으로 구성됩니다:

### 모니터링 스택
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │◄──►│     Grafana     │◄──►│  Alert Manager  │
│   (메트릭 수집) │    │   (시각화)      │    │   (알림 발송)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        │                        │
         │                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    모니터링 대상                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Kubernetes  │  │ Application │  │  Database   │           │
│  │  Metrics    │  │   Metrics   │  │   Metrics   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Logs      │  │  Network    │  │  Storage    │           │
│  │ (ELK/EFK)   │  │  Metrics    │  │  Metrics    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 모니터링 목표
- **가용성 보장**: 서비스 다운타임 최소화
- **성능 최적화**: 응답 시간 및 처리량 개선
- **장애 예방**: 이슈 발생 전 사전 감지
- **용량 계획**: 리소스 사용량 추이 파악

---

## Kubernetes 기본 모니터링

### 클러스터 상태 모니터링

#### Pod 상태 확인
```bash
# 실시간 Pod 상태 모니터링
kubectl get pods -n lee -w

# Pod 리소스 사용량 확인
kubectl top pods -n lee

# Pod 상세 정보 및 이벤트
kubectl describe pod <pod-name> -n lee

# 특정 라벨의 Pod만 모니터링
kubectl get pods -l app=board-backend-lee -n lee --watch
```

#### Deployment 상태 모니터링
```bash
# Deployment 상태 확인
kubectl get deployments -n lee

# Rolling Update 상태 모니터링
kubectl rollout status deployment/board-backend-deployment-lee -n lee

# Deployment 히스토리 확인
kubectl rollout history deployment/board-backend-deployment-lee -n lee
```

#### 서비스 및 네트워크 모니터링
```bash
# 서비스 엔드포인트 확인
kubectl get endpoints -n lee

# 서비스 연결 테스트
kubectl run test-pod --image=busybox --rm -it --restart=Never -- \
  wget -qO- http://board-backend-service-lee:8082/actuator/health

# 네트워크 정책 확인
kubectl get networkpolicies -n lee
```

### 리소스 사용량 모니터링

#### CPU 및 메모리 사용량
```bash
# 노드별 리소스 사용량
kubectl top nodes

# 네임스페이스별 리소스 사용량 합계
kubectl top pods -n lee --sort-by=cpu
kubectl top pods -n lee --sort-by=memory

# 리소스 제한 및 요청 확인
kubectl describe pod <pod-name> -n lee | grep -A 2 -B 2 "Limits\|Requests"
```

#### 스토리지 모니터링
```bash
# PV/PVC 상태 확인
kubectl get pv,pvc -n lee

# 스토리지 사용량 확인
kubectl exec -it deployment/board-backend-deployment-lee -n lee -- df -h /app/uploads
```

---

## 애플리케이션 모니터링

### Spring Boot Actuator 활용

#### Health Check 엔드포인트
```bash
# 기본 헬스 체크
curl http://20.249.113.18:9000/board/api/actuator/health

# 상세 헬스 정보 (설정 필요)
curl http://20.249.113.18:9000/board/api/actuator/health/db
curl http://20.249.113.18:9000/board/api/actuator/health/diskSpace
```

#### 메트릭 수집
```bash
# JVM 메모리 사용량
curl http://20.249.113.18:9000/board/api/actuator/metrics/jvm.memory.used

# HTTP 요청 통계
curl http://20.249.113.18:9000/board/api/actuator/metrics/http.server.requests

# 데이터베이스 연결 풀 상태
curl http://20.249.113.18:9000/board/api/actuator/metrics/hikaricp.connections
```

#### 애플리케이션 정보
```bash
# 애플리케이션 정보
curl http://20.249.113.18:9000/board/api/actuator/info

# 환경 설정 정보
curl http://20.249.113.18:9000/board/api/actuator/env
```

### 커스텀 메트릭 구현

#### Java 백엔드 메트릭
```java
@RestController
public class PostController {
    
    private final MeterRegistry meterRegistry;
    private final Counter postCreationCounter;
    private final Timer postCreationTimer;
    
    public PostController(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.postCreationCounter = Counter.builder("posts.created")
            .description("Number of posts created")
            .register(meterRegistry);
        this.postCreationTimer = Timer.builder("posts.creation.time")
            .description("Time taken to create a post")
            .register(meterRegistry);
    }
    
    @PostMapping
    public ResponseEntity<?> createPost(...) {
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            // 게시글 생성 로직
            Post post = postService.createPost(...);
            
            postCreationCounter.increment();
            sample.stop(postCreationTimer);
            
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            meterRegistry.counter("posts.creation.errors").increment();
            throw e;
        }
    }
}
```

#### React 프론트엔드 모니터링
```javascript
// 성능 메트릭 수집
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === 'navigation') {
      console.log(`Page Load Time: ${entry.loadEventEnd - entry.loadEventStart}ms`);
      // 메트릭을 백엔드로 전송
      sendMetric('page.load.time', entry.loadEventEnd - entry.loadEventStart);
    }
  });
});

performanceObserver.observe({ entryTypes: ['navigation'] });

// API 호출 모니터링
const monitoredAxios = axios.create();

monitoredAxios.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

monitoredAxios.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    sendMetric('api.request.duration', duration, {
      endpoint: response.config.url,
      method: response.config.method,
      status: response.status
    });
    return response;
  },
  (error) => {
    const duration = Date.now() - error.config.metadata.startTime;
    sendMetric('api.request.error', 1, {
      endpoint: error.config.url,
      method: error.config.method,
      status: error.response?.status
    });
    return Promise.reject(error);
  }
);
```

---

## 로그 모니터링

### 로그 수집 명령어

#### 실시간 로그 모니터링
```bash
# 백엔드 로그 실시간 확인
kubectl logs -f deployment/board-backend-deployment-lee -n lee

# 프론트엔드 Nginx 로그 확인
kubectl logs -f deployment/board-frontend-deployment-lee -n lee

# 특정 시간 범위 로그 확인
kubectl logs --since=1h deployment/board-backend-deployment-lee -n lee

# 여러 Pod의 로그 동시 모니터링
kubectl logs -f -l app=board-backend-lee -n lee --tail=100
```

#### 로그 필터링 및 분석
```bash
# 에러 로그만 필터링
kubectl logs deployment/board-backend-deployment-lee -n lee | grep -i "error\|exception"

# 특정 사용자의 활동 로그 추적
kubectl logs deployment/board-backend-deployment-lee -n lee | grep "userId=test19"

# HTTP 요청 로그 분석
kubectl logs deployment/board-backend-deployment-lee -n lee | grep "POST /api/posts"

# JSON 로그 파싱 (jq 도구 사용)
kubectl logs deployment/board-backend-deployment-lee -n lee | jq '.level="ERROR"'
```

### 로그 레벨별 모니터링

#### Spring Boot 로그 설정
```yaml
# application.yml
logging:
  level:
    com.example.boardapp: DEBUG
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: /var/log/board-app.log
    max-size: 100MB
    max-history: 30
```

#### 중요 로그 이벤트 모니터링
```bash
# 인증 실패 로그 모니터링
kubectl logs deployment/board-backend-deployment-lee -n lee | grep "Authentication failed"

# 파일 업로드 오류 모니터링
kubectl logs deployment/board-backend-deployment-lee -n lee | grep "File upload error"

# 데이터베이스 연결 오류 모니터링
kubectl logs deployment/board-backend-deployment-lee -n lee | grep "Connection refused\|Connection timeout"
```

---

## 성능 메트릭

### 주요 KPI (Key Performance Indicators)

#### 응답 시간 메트릭
```bash
# API 응답 시간 측정
curl -w "@curl-format.txt" -o /dev/null -s http://20.249.113.18:9000/board/api/posts

# curl-format.txt 파일 내용:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#           time_total:  %{time_total}\n
```

#### 처리량 메트릭
```bash
# Apache Benchmark를 이용한 부하 테스트
ab -n 1000 -c 10 http://20.249.113.18:9000/board/api/posts

# wrk를 이용한 부하 테스트
wrk -t4 -c100 -d30s --timeout 10s http://20.249.113.18:9000/board/api/posts
```

### 데이터베이스 성능 모니터링

#### MySQL 메트릭 수집
```sql
-- 현재 실행 중인 쿼리 확인
SHOW PROCESSLIST;

-- 느린 쿼리 로그 확인
SHOW VARIABLES LIKE 'slow_query_log%';
SHOW VARIABLES LIKE 'long_query_time';

-- 테이블 상태 정보
SHOW TABLE STATUS FROM boarddb;

-- 인덱스 사용률 확인
SELECT 
    TABLE_NAME, 
    INDEX_NAME, 
    CARDINALITY,
    SEQ_IN_INDEX,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'boarddb';
```

#### 연결 풀 모니터링
```java
// HikariCP 메트릭 확인
@Component
public class DatabaseMetrics {
    
    @Autowired
    private HikariDataSource dataSource;
    
    @EventListener
    @Scheduled(fixedRate = 30000) // 30초마다 실행
    public void logConnectionPoolStats() {
        HikariPoolMXBean poolBean = dataSource.getHikariPoolMXBean();
        
        log.info("Connection Pool Stats: " +
                "Active={}, Idle={}, Total={}, Waiting={}", 
                poolBean.getActiveConnections(),
                poolBean.getIdleConnections(), 
                poolBean.getTotalConnections(),
                poolBean.getThreadsAwaitingConnection());
    }
}
```

---

## 알림 시스템

### 알림 규칙 정의

#### 심각도별 알림 기준
```yaml
# Critical (즉시 대응 필요)
- 서비스 완전 다운 (HTTP 5xx 에러 > 50%)
- Pod 재시작 (5분 내 3회 이상)
- 메모리 사용률 > 90%
- 디스크 사용률 > 95%
- 데이터베이스 연결 실패

# Warning (모니터링 필요)
- API 응답 시간 > 5초 (5분간 지속)
- CPU 사용률 > 80% (10분간 지속)
- 메모리 사용률 > 75%
- 에러율 > 5%
- 파일 업로드 실패율 > 10%

# Info (참고 사항)
- 새로운 배포 완료
- 스케일링 이벤트 발생
- 정기 백업 완료
```

### 알림 채널 설정

#### Slack 알림 설정
```bash
# Slack Webhook URL 설정
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# 알림 전송 스크립트
send_slack_alert() {
    local message="$1"
    local severity="$2"
    local color="danger"
    
    case $severity in
        "info") color="good" ;;
        "warning") color="warning" ;;
        "critical") color="danger" ;;
    esac
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"Board-Lee Alert\",
                \"text\": \"$message\",
                \"ts\": $(date +%s)
            }]
        }" \
        $SLACK_WEBHOOK_URL
}

# 사용 예시
send_slack_alert "Backend pod is down in lee namespace" "critical"
```

#### 이메일 알림 설정
```bash
# 이메일 알림 스크립트
send_email_alert() {
    local subject="$1"
    local body="$2"
    local to="admin@company.com"
    
    echo "$body" | mail -s "Board-Lee Alert: $subject" "$to"
}
```

### 알림 자동화 스크립트

#### Pod 상태 모니터링 스크립트
```bash
#!/bin/bash
# monitor-pods.sh

NAMESPACE="lee"
ALERT_THRESHOLD=3  # 3번 연속 실패 시 알림

monitor_pod_health() {
    local deployment="$1"
    local failed_count=0
    
    while true; do
        if kubectl get pods -n $NAMESPACE -l app=$deployment | grep -q "0/1.*Running"; then
            failed_count=$((failed_count + 1))
            echo "$(date): $deployment pod health check failed ($failed_count/$ALERT_THRESHOLD)"
            
            if [ $failed_count -ge $ALERT_THRESHOLD ]; then
                send_slack_alert "$deployment pod is unhealthy in $NAMESPACE namespace" "critical"
                failed_count=0
            fi
        else
            failed_count=0
        fi
        
        sleep 60  # 1분마다 체크
    done
}

# 백그라운드에서 각 deployment 모니터링
monitor_pod_health "board-backend-lee" &
monitor_pod_health "board-frontend-lee" &

wait
```

#### API 응답 시간 모니터링 스크립트
```bash
#!/bin/bash
# monitor-api-response.sh

API_ENDPOINT="http://20.249.113.18:9000/board/api/posts"
MAX_RESPONSE_TIME=5000  # 5초

monitor_api_response() {
    while true; do
        response_time=$(curl -w "%{time_total}" -o /dev/null -s "$API_ENDPOINT")
        response_time_ms=$(echo "$response_time * 1000" | bc)
        
        if (( $(echo "$response_time_ms > $MAX_RESPONSE_TIME" | bc -l) )); then
            send_slack_alert "API response time is slow: ${response_time_ms}ms" "warning"
        fi
        
        echo "$(date): API response time: ${response_time_ms}ms"
        sleep 300  # 5분마다 체크
    done
}

monitor_api_response
```

---

## 대시보드 구성

### Grafana 대시보드 예시

#### 시스템 개요 대시보드
```json
{
  "dashboard": {
    "title": "Board-Lee System Overview",
    "panels": [
      {
        "title": "Service Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"board-backend\"}"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph", 
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

#### 애플리케이션 메트릭 대시보드
```json
{
  "dashboard": {
    "title": "Board-Lee Application Metrics",
    "panels": [
      {
        "title": "Posts Created",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(posts_created_total[1h])"
          }
        ]
      },
      {
        "title": "File Upload Success Rate", 
        "type": "stat",
        "targets": [
          {
            "expr": "rate(file_uploads_success[5m]) / rate(file_uploads_total[5m]) * 100"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "hikaricp_connections_active"
          }
        ]
      }
    ]
  }
}
```

### 모니터링 대시보드 URL 모음
```bash
# Kubernetes 대시보드
echo "Kubernetes Dashboard: https://kubernetes-dashboard.local"

# Grafana 대시보드  
echo "Grafana: http://grafana.local:3000"
echo "  - System Overview: /d/board-system"
echo "  - Application Metrics: /d/board-app"
echo "  - Database Metrics: /d/board-db"

# Prometheus 메트릭
echo "Prometheus: http://prometheus.local:9090"
echo "  - Targets: /targets"
echo "  - Rules: /rules"
```

---

## 모니터링 자동화

### 정기 점검 스크립트

#### 일일 시스템 점검
```bash
#!/bin/bash
# daily-health-check.sh

DATE=$(date +%Y-%m-%d)
REPORT_FILE="/tmp/board-lee-health-$DATE.txt"

{
    echo "Board-Lee Daily Health Check - $DATE"
    echo "============================================"
    echo ""
    
    echo "1. Pod Status:"
    kubectl get pods -n lee
    echo ""
    
    echo "2. Resource Usage:"
    kubectl top pods -n lee
    echo ""
    
    echo "3. Service Endpoints:"
    kubectl get endpoints -n lee
    echo ""
    
    echo "4. Recent Events:"
    kubectl get events -n lee --sort-by='.lastTimestamp' | tail -10
    echo ""
    
    echo "5. API Health Check:"
    curl -s http://20.249.113.18:9000/board/api/actuator/health | jq .
    echo ""
    
    echo "6. Database Connection Test:"
    kubectl exec deployment/board-backend-deployment-lee -n lee -- \
        curl -s http://localhost:8082/actuator/health/db | jq .
    echo ""
    
} > $REPORT_FILE

# 보고서 이메일 전송
send_email_alert "Daily Health Check Report - $DATE" "$(cat $REPORT_FILE)"

echo "Health check completed. Report saved to $REPORT_FILE"
```

#### 주간 성능 보고서
```bash
#!/bin/bash
# weekly-performance-report.sh

WEEK_START=$(date -d '7 days ago' +%Y-%m-%d)
WEEK_END=$(date +%Y-%m-%d)

{
    echo "Board-Lee Weekly Performance Report"
    echo "Period: $WEEK_START to $WEEK_END"
    echo "=================================="
    echo ""
    
    echo "1. Average Response Time:"
    # Prometheus 쿼리를 통해 주간 평균 응답 시간 수집
    # curl -s "http://prometheus:9090/api/v1/query_range?query=..."
    
    echo "2. Total Requests:"
    # 주간 총 요청 수
    
    echo "3. Error Rate:"
    # 주간 에러율
    
    echo "4. Resource Utilization:"
    # 주간 평균 CPU/메모리 사용률
    
    echo "5. Top Issues:"
    # 주간 주요 이슈 정리
    
} > "/tmp/board-lee-weekly-report-$WEEK_END.txt"
```

### 모니터링 체크리스트

#### ✅ 일일 점검 항목
- [ ] 모든 Pod가 Running 상태인가?
- [ ] API 응답 시간이 정상 범위인가?
- [ ] 에러율이 임계치 이하인가?
- [ ] 디스크 사용량이 안전한가?
- [ ] 데이터베이스 연결이 정상인가?

#### ✅ 주간 점검 항목
- [ ] 성능 추이 분석 완료
- [ ] 로그 파일 정리 및 아카이브
- [ ] 백업 상태 확인
- [ ] 보안 패치 적용 검토
- [ ] 용량 계획 업데이트

#### ✅ 월간 점검 항목
- [ ] 전체 시스템 성능 리뷰
- [ ] 모니터링 도구 업데이트
- [ ] 알림 규칙 재검토
- [ ] 장애 대응 시나리오 점검
- [ ] 모니터링 비용 최적화

이 가이드를 통해 Board-Lee 시스템의 안정적인 운영과 지속적인 성능 개선을 달성할 수 있습니다.