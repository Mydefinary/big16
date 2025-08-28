# Board-Lee 아키텍처 설계 문서

## 목차
1. [시스템 개요](#시스템-개요)
2. [아키텍처 다이어그램](#아키텍처-다이어그램)
3. [마이크로서비스 구성](#마이크로서비스-구성)
4. [데이터 모델](#데이터-모델)
5. [보안 아키텍처](#보안-아키텍처)
6. [배포 아키텍처](#배포-아키텍처)
7. [성능 고려사항](#성능-고려사항)
8. [확장성 설계](#확장성-설계)

## 시스템 개요

Board-Lee는 마이크로서비스 아키텍처를 기반으로 한 현대적인 웹 게시판 시스템입니다. 컨테이너화된 서비스들이 Kubernetes 환경에서 운영되며, 각 서비스는 독립적으로 개발, 배포, 확장이 가능합니다.

### 핵심 설계 원칙
- **마이크로서비스 아키텍처**: 서비스별 독립성 확보
- **컨테이너 우선**: Docker 기반 컨테이너화
- **클라우드 네이티브**: Kubernetes 환경 최적화
- **API 우선**: RESTful API 중심 설계
- **보안 내장**: 다층 보안 모델 적용

## 아키텍처 다이어그램

### 전체 시스템 아키텍처
```
                    Internet
                        │
                        ▼
            ┌─────────────────────┐
            │   Azure Load       │
            │   Balancer         │
            │   (External IP)    │
            └─────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 Kubernetes Cluster (AKS)               │
│                                                         │
│   ┌─────────────────┐    ┌─────────────────┐          │
│   │  ToonConnect    │    │  Azure DNS      │          │
│   │  Gateway        │    │  (20.249.113.18)│          │
│   │  Port: 9000     │    │                 │          │
│   └─────────────────┘    └─────────────────┘          │
│            │                                           │
│            ▼                                           │
│   ┌─────────────────┐    ┌─────────────────┐          │
│   │ Auth Service    │    │ Board Service   │          │
│   │ (Spring Boot)   │    │ (Frontend +     │          │
│   │ Port: 9001      │◄──►│  Backend)       │          │
│   │ - JWT 인증      │    │ Port: 80, 8082  │          │
│   │ - 사용자 관리   │    │ - 게시판 CRUD   │          │
│   └─────────────────┘    │ - 파일 관리     │          │
│                          │ - 답글 시스템   │          │
│                          └─────────────────┘          │
│                                   │                    │
│                                   ▼                    │
│                          ┌─────────────────┐          │
│                          │  MySQL Database │          │
│                          │  (Azure DB)     │          │
│                          │  Port: 3306     │          │
│                          │  - 게시글 데이터│          │
│                          │  - 첨부파일 정보│          │
│                          │  - 댓글 데이터  │          │
│                          └─────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 서비스 간 통신
```
Frontend (React)
    │ HTTP/HTTPS
    ▼
Gateway (Spring Cloud Gateway)
    │ Internal routing
    ├─────────────────┬─────────────────┐
    ▼                 ▼                 ▼
Auth Service     Board Backend    File Storage
(Port: 9001)     (Port: 8082)     (Local FS)
    │                 │                 │
    ▼                 ▼                 ▼
User DB          Board DB          Uploaded Files
```

## 마이크로서비스 구성

### 1. Gateway Service (ToonConnect)
**책임 영역**:
- 라우팅 및 로드 밸런싱
- API 게이트웨이 역할
- Rate Limiting
- CORS 처리

**기술 스택**:
- Spring Cloud Gateway
- JWT 필터링
- Kubernetes Service Mesh

**라우팅 규칙**:
```yaml
# Frontend 정적 파일
/board/** → board-frontend-service:80

# Backend API
/board/api/** → board-backend-service:8082

# 인증 API  
/auths/** → auth-backend-service:9001
```

### 2. Auth Service
**책임 영역**:
- 사용자 인증 및 권한 관리
- JWT 토큰 발급/검증
- 사용자 정보 관리

**기술 스택**:
- Spring Boot 2.7+
- Spring Security
- JWT (JSON Web Token)
- MySQL/PostgreSQL

**API 엔드포인트**:
- `POST /auths/login` - 로그인
- `POST /auths/logout` - 로그아웃  
- `GET /auths/me` - 사용자 정보 조회
- `POST /auths/refresh` - 토큰 갱신

### 3. Board Service

#### Frontend (React)
**책임 영역**:
- 사용자 인터페이스 제공
- 클라이언트 사이드 라우팅
- API 호출 및 데이터 바인딩

**기술 스택**:
- React 18+
- React Router DOM
- Axios (HTTP 클라이언트)
- Bootstrap 5 (UI 프레임워크)
- Nginx (정적 파일 서버)

#### Backend (Spring Boot)
**책임 영역**:
- 게시판 비즈니스 로직
- 파일 업로드/다운로드
- 데이터베이스 연동

**기술 스택**:
- Spring Boot 2.7+
- Spring Data JPA
- MySQL Connector
- Hibernate ORM
- Spring Validation

### 4. File Storage Service
**책임 영역**:
- 파일 업로드/다운로드
- 파일 메타데이터 관리
- 보안 검증

**구현 방식**:
- 로컬 파일시스템 (현재)
- Azure Blob Storage (향후)
- AWS S3 (대안)

## 데이터 모델

### ERD (Entity Relationship Diagram)
```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │      Post       │       │   Attachment    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ username        │◄─────┐│ title           │┌─────►│ post_id (FK)    │
│ password        │      ││ author (FK)     ││      │ original_name   │
│ nickname        │      ││ author_nickname │      │ stored_name     │
│ email           │      ││ content         │      │ file_path       │
│ role            │      ││ created_at      │      │ file_size       │
│ created_at      │      ││ updated_at      │      │ content_type    │
└─────────────────┘      ││ parent_id (FK)  │      │ created_at      │
                         ││ depth           │      └─────────────────┘
                         ││ is_reply        │
┌─────────────────┐      ││ attachment_path │      ┌─────────────────┐
│    Comment      │      ││ attachment_name │      │   Permission    │
├─────────────────┤      │└─────────────────┘      ├─────────────────┤
│ id (PK)         │      │         ▲               │ user_id (FK)    │
│ post_id (FK)    │──────┘         │               │ resource_type   │
│ author (FK)     │                │               │ resource_id     │
│ content         │                │               │ permission      │
│ created_at      │                │               │ granted_at      │
│ updated_at      │                └───────────────┤ granted_by      │
└─────────────────┘                                └─────────────────┘
```

### 핵심 엔티티 설명

#### Post (게시글)
```java
@Entity
public class Post {
    @Id @GeneratedValue
    private Long id;
    
    @Column(nullable = false)
    private String title;           // 제목
    
    private String author;          // 작성자 ID
    private String authorNickName;  // 작성자 닉네임
    
    @Lob
    private String content;         // 내용
    
    @ManyToOne(fetch = LAZY)
    private Post parent;            // 부모 게시글 (답글용)
    
    private int depth;              // 답글 깊이
    private boolean isReply;        // 답글 여부
    
    @OneToMany(mappedBy = "post", cascade = ALL)
    private List<Attachment> attachments;  // 첨부파일 목록
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### Attachment (첨부파일)
```java
@Entity
public class Attachment {
    @Id @GeneratedValue
    private Long id;
    
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "post_id")
    private Post post;              // 연관 게시글
    
    private String originalName;     // 원본 파일명
    private String storedName;       // 저장된 파일명 (UUID)
    private String filePath;         // 파일 저장 경로
    private Long fileSize;           // 파일 크기
    private String contentType;      // MIME 타입
    
    private LocalDateTime createdAt;
}
```

## 보안 아키텍처

### 인증 흐름
```
1. 사용자 로그인 요청
   Frontend → Gateway → Auth Service

2. JWT 토큰 발급
   Auth Service → Cookie 설정 → Frontend

3. API 요청 시 인증
   Frontend → Gateway → JWT 필터 → Board Service

4. 권한 검증
   Board Service → 사용자 권한 확인 → 응답
```

### 권한 모델 (RBAC)
```
Role: admin
├── 모든 게시글 읽기
├── 모든 게시글 쓰기
├── 모든 게시글 수정
└── 모든 게시글 삭제

Role: operator  
├── 모든 게시글 읽기
├── 게시글 쓰기
├── 본인 게시글 수정
└── 본인 게시글 삭제

Role: user
├── 본인 게시글 읽기
├── 본인 게시글의 답글 읽기
├── 게시글 쓰기
├── 본인 게시글 수정
└── 본인 게시글 삭제
```

### 파일 업로드 보안
```
1. 파일 타입 검증 (MIME Type)
   - 허용: PDF, JPG, PNG
   - 차단: 실행 파일, 스크립트 등

2. 파일 크기 제한
   - 개별 파일: 10MB
   - 총 파일 수: 20개

3. 파일명 보안
   - UUID 기반 파일명 생성
   - 원본 파일명은 DB에 별도 저장

4. 저장 경로 보안
   - 웹 접근 불가한 디렉토리
   - 권한 기반 다운로드 제어
```

## 배포 아키텍처

### Kubernetes 리소스 구성
```yaml
# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: lee

---
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: board-config
  namespace: lee
data:
  DB_HOST: "mysql-service"
  DB_PORT: "3306"
  APP_ATTACHMENT_DIR: "/app/uploads"

---
# Secret
apiVersion: v1
kind: Secret
metadata:
  name: board-secrets
  namespace: lee
type: Opaque
data:
  DB_PASSWORD: <base64-encoded>
  JWT_SECRET: <base64-encoded>

---
# PersistentVolumeClaim (파일 저장용)
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: board-files-pvc
  namespace: lee
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### 서비스 배포 구성

#### Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: board-frontend-deployment-lee
  namespace: lee
spec:
  replicas: 1
  selector:
    matchLabels:
      app: board-frontend-lee
  template:
    spec:
      containers:
      - name: board-frontend-container
        image: kt16big.azurecr.io/board-frontend-lee:latest
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "128Mi"
            cpu: "100m"
```

#### Backend Deployment  
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: board-backend-deployment-lee
  namespace: lee
spec:
  replicas: 1
  selector:
    matchLabels:
      app: board-backend-lee
  template:
    spec:
      containers:
      - name: board-backend-container
        image: kt16big.azurecr.io/board-backend-lee:latest
        ports:
        - containerPort: 8082
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: board-secrets
              key: DB_PASSWORD
        volumeMounts:
        - name: file-storage
          mountPath: /app/uploads
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: file-storage
        persistentVolumeClaim:
          claimName: board-files-pvc
```

### 네트워크 구성
```
External Traffic
    │
    ▼
Azure Load Balancer (20.249.113.18)
    │
    ▼
Kubernetes Ingress Controller
    │
    ▼
Gateway Service (ClusterIP: 9000)
    │
    ├── /board/** → Frontend Service (ClusterIP: 80)
    ├── /board/api/** → Backend Service (ClusterIP: 8082)
    └── /auths/** → Auth Service (ClusterIP: 9001)
```

## 성능 고려사항

### 데이터베이스 최적화
1. **인덱스 전략**
   ```sql
   -- 게시글 검색 최적화
   CREATE INDEX idx_post_title ON posts(title);
   CREATE INDEX idx_post_author ON posts(author_nick_name);
   CREATE INDEX idx_post_created_at ON posts(created_at DESC);
   
   -- 답글 조회 최적화
   CREATE INDEX idx_post_parent_depth ON posts(parent_id, depth);
   ```

2. **페이지네이션**
   - Spring Data JPA의 Pageable 인터페이스 활용
   - 기본 페이지 크기: 10개
   - 최대 페이지 크기: 100개

3. **지연 로딩 (Lazy Loading)**
   ```java
   @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
   private List<Attachment> attachments;
   ```

### 캐싱 전략
1. **HTTP 캐싱**
   - 정적 리소스: 1년 캐시
   - API 응답: 조건부 캐시

2. **애플리케이션 캐싱**
   - Spring Cache 활용 (향후)
   - Redis 도입 고려 (향후)

### 파일 처리 최적화
1. **스트리밍 업로드**
   - MultipartFile 스트리밍 처리
   - 메모리 효율성 확보

2. **비동기 처리**
   - 파일 업로드 후 별도 스레드에서 처리
   - 썸네일 생성 등 부가 작업 비동기화

## 확장성 설계

### 수평 확장 (Scale Out)
```yaml
# HorizontalPodAutoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: board-backend-hpa
  namespace: lee
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: board-backend-deployment-lee
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 데이터베이스 확장
1. **읽기 전용 복제본**
   - Master-Slave 구성
   - 읽기 쿼리 분산

2. **샤딩 전략** (향후)
   - 사용자 ID 기반 샤딩
   - 시간 기반 파티셔닝

### 파일 저장소 확장
1. **현재**: 로컬 파일시스템 + PV/PVC
2. **향후**: 
   - Azure Blob Storage 연동
   - CDN 캐싱 적용
   - 다중 리전 복제

### 모니터링 및 관찰성
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │    │     Grafana     │    │  Alert Manager  │
│   (메트릭 수집) │◄──►│   (시각화)      │◄──►│   (알림 발송)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Metrics                         │
│  - HTTP 요청/응답 시간                                        │
│  - 데이터베이스 연결 풀 상태                                  │
│  - 파일 업로드/다운로드 처리량                                │
│  - JVM 메모리/GC 통계                                         │
│  - 에러율 및 예외 발생 빈도                                   │
└─────────────────────────────────────────────────────────────────┘
```

이 아키텍처는 현재 요구사항을 만족하면서도 향후 확장과 개선을 고려한 유연한 설계를 제공합니다.