# Board-Lee 코드 컨벤션 및 스타일 가이드

## 목차
1. [일반 원칙](#일반-원칙)
2. [Java/Spring Boot 코딩 스타일](#javaspring-boot-코딩-스타일)
3. [JavaScript/React 코딩 스타일](#javascriptreact-코딩-스타일)
4. [데이터베이스 네이밍](#데이터베이스-네이밍)
5. [파일 및 디렉토리 구조](#파일-및-디렉토리-구조)
6. [Git 컨벤션](#git-컨벤션)
7. [문서화 가이드](#문서화-가이드)
8. [코드 리뷰 가이드라인](#코드-리뷰-가이드라인)

---

## 일반 원칙

### 코딩 철학
- **가독성 우선**: 코드는 작성하는 시간보다 읽는 시간이 더 많습니다
- **일관성 유지**: 기존 코드 스타일을 따라갑니다
- **단순함 추구**: 복잡한 로직보다는 단순하고 명확한 코드를 작성합니다
- **자동화 활용**: Formatter와 Linter를 적극 활용합니다

### 언어별 우선순위
1. **Java**: Google Java Style Guide 기반
2. **JavaScript/React**: Airbnb JavaScript Style Guide 기반
3. **SQL**: PostgreSQL/MySQL 표준 준수
4. **YAML**: Kubernetes 공식 가이드 준수

---

## Java/Spring Boot 코딩 스타일

### 네이밍 컨벤션

#### 클래스명
```java
// ✅ 좋은 예: PascalCase 사용
public class PostController { }
public class PostService { }
public class UserRepository { }

// ❌ 나쁜 예
public class postcontroller { }
public class post_service { }
```

#### 메서드명
```java
// ✅ 좋은 예: camelCase, 동사로 시작
public Post createPost(String title, String content) { }
public void deletePost(Long id) { }
public boolean hasReadPermission(Post post, User user) { }

// ❌ 나쁜 예
public Post CreatePost() { }  // PascalCase 사용하지 않음
public Post post_create() { }  // snake_case 사용하지 않음
```

#### 변수명
```java
// ✅ 좋은 예: camelCase, 명확한 의미
private Long postId;
private String authorNickName;
private boolean isReply;
private List<Attachment> attachments;

// ❌ 나쁜 예
private Long id;  // 너무 모호함
private String s;  // 의미를 알 수 없음
private boolean flag;  // 추상적임
```

#### 상수명
```java
// ✅ 좋은 예: UPPER_SNAKE_CASE
public static final int MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB
public static final String DEFAULT_ATTACHMENT_DIR = "uploads";
public static final List<String> ALLOWED_FILE_TYPES = Arrays.asList("pdf", "jpg", "png");

// ❌ 나쁜 예
public static final int maxFileSize = 10485760;
public static final String attachmentDir = "uploads";
```

### 클래스 구조
```java
@Entity
@Table(name = "posts")
public class Post {
    
    // 1. 상수 (static final)
    public static final int MAX_TITLE_LENGTH = 255;
    
    // 2. 인스턴스 필드
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    // 3. 생성자 (기본 생성자 → 파라미터 있는 생성자 순)
    public Post() {}
    
    public Post(String title, String content) {
        this.title = title;
        this.content = content;
    }
    
    // 4. Getter/Setter (getter 먼저, setter 나중)
    public Long getId() { return id; }
    public String getTitle() { return title; }
    
    public void setTitle(String title) { this.title = title; }
    
    // 5. 비즈니스 메서드
    public boolean isOwnedBy(String userId) {
        return this.author.equals(userId);
    }
    
    // 6. equals, hashCode, toString (필요시)
    @Override
    public boolean equals(Object obj) { /* ... */ }
}
```

### Spring 애노테이션 순서
```java
@RestController
@RequestMapping("/api/posts")
@Validated
@CrossOrigin(origins = "*")
@Slf4j  // Lombok 애노테이션은 마지막
public class PostController {
    
    @GetMapping("/{id}")
    @Operation(summary = "게시글 조회")  // Swagger 애노테이션
    public ResponseEntity<PostResponseDto> getPost(
            @PathVariable @Min(1) Long id,
            @CookieValue(value = "accessToken", required = false) String token) {
        // ...
    }
}
```

### 예외 처리
```java
// ✅ 좋은 예: 구체적인 예외 처리
@ExceptionHandler(IllegalArgumentException.class)
public ResponseEntity<String> handleNotFound(IllegalArgumentException e) {
    log.warn("Resource not found: {}", e.getMessage());
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
}

// ✅ 좋은 예: 체이닝 가능한 검증
public Post getPost(Long id) {
    return postRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. ID=" + id));
}

// ❌ 나쁜 예: 일반적인 Exception catch
try {
    // some operation
} catch (Exception e) {
    // 너무 포괄적
}
```

### 로깅
```java
@Slf4j
public class PostService {
    
    public Post createPost(String title, String author, String content) {
        log.info("Creating post: title={}, author={}", title, author);
        
        // 민감한 정보 로깅 금지
        log.debug("Post content length: {}", content.length());  // 내용은 로깅 안 함
        
        try {
            Post post = new Post(title, content);
            Post saved = postRepository.save(post);
            log.info("Post created successfully: id={}", saved.getId());
            return saved;
        } catch (DataIntegrityViolationException e) {
            log.error("Failed to create post: title={}, error={}", title, e.getMessage());
            throw new IllegalArgumentException("게시글 생성에 실패했습니다.", e);
        }
    }
}
```

---

## JavaScript/React 코딩 스타일

### 네이밍 컨벤션

#### 컴포넌트명
```javascript
// ✅ 좋은 예: PascalCase
export default function PostForm({ isEdit }) { }
export default function PostDetail() { }
export default function CommentSection({ postId }) { }

// ❌ 나쁜 예
export default function postForm() { }
export default function post_detail() { }
```

#### 변수 및 함수명
```javascript
// ✅ 좋은 예: camelCase
const [currentUser, setCurrentUser] = useState(null);
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = (e) => { };
const handleFileChange = (e) => { };

// ❌ 나쁜 예
const [current_user, setCurrentUser] = useState(null);
const [IsLoading, setIsLoading] = useState(false);
```

#### 상수명
```javascript
// ✅ 좋은 예: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const API_BASE_URL = '/board/api';

// ❌ 나쁜 예
const maxFileSize = 10485760;
const allowedFileTypes = ['pdf', 'jpg', 'png'];
```

### React 컴포넌트 구조
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPost, createPost } from '../api';

// ✅ 좋은 예: 구조화된 컴포넌트
export default function PostForm({ isEdit }) {
  // 1. Hooks (useState, useEffect 등)
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  // 2. useEffect
  useEffect(() => {
    if (isEdit && id) {
      fetchPost(id)
        .then(res => {
          setTitle(res.data.title);
          setContent(res.data.content);
        })
        .catch(err => setError(err.message));
    }
  }, [id, isEdit]);

  // 3. 이벤트 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력하세요.');
      return;
    }

    const postData = { title, content };
    
    createPost(postData)
      .then(() => navigate('/board'))
      .catch(err => setError(err.message));
  };

  // 4. 조기 리턴 (early return)
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // 5. JSX 렌더링
  return (
    <form onSubmit={handleSubmit}>
      {/* JSX 내용 */}
    </form>
  );
}
```

### JSX 스타일
```javascript
// ✅ 좋은 예: 명확한 구조와 가독성
return (
  <div className="container mt-4">
    <div className="p-4 border rounded shadow-sm bg-white">
      <h3 className="mb-4">
        {isEdit ? '✏️ 게시글 수정' : '📝 새 게시글 작성'}
      </h3>
      
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label className="form-label fw-semibold">제목</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            required
          />
        </div>
        
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary">
            {isEdit ? '수정' : '등록'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  </div>
);

// ❌ 나쁜 예: 모든 것이 한 줄에
return (<div className="container"><form onSubmit={handleSubmit}><input type="text" value={title} onChange={e=>setTitle(e.target.value)}/><button type="submit">등록</button></form></div>);
```

### API 호출
```javascript
// api.js
import axios from 'axios';

const API_BASE_URL = '/board/api';

// ✅ 좋은 예: 일관된 API 함수
export const fetchPosts = (page = 0, size = 10) => {
  return axios.get(`${API_BASE_URL}/posts?page=${page}&size=${size}`, {
    withCredentials: true
  });
};

export const createPost = (formData) => {
  return axios.post(`${API_BASE_URL}/posts`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true
  });
};

// 컴포넌트에서 사용
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    const response = await createPost(formData);
    navigate(`/posts/${response.data.id}`);
  } catch (error) {
    setError(error.response?.data || error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 데이터베이스 네이밍

### 테이블명
```sql
-- ✅ 좋은 예: 복수형, snake_case
CREATE TABLE posts ( ... );
CREATE TABLE attachments ( ... );
CREATE TABLE user_permissions ( ... );

-- ❌ 나쁜 예
CREATE TABLE Post ( ... );        -- 대문자, 단수형
CREATE TABLE userPermission ( ... ); -- camelCase
```

### 컬럼명
```sql
-- ✅ 좋은 예: snake_case, 명확한 의미
CREATE TABLE posts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  author_id VARCHAR(50) NOT NULL,
  author_nick_name VARCHAR(100),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  parent_id BIGINT,
  is_reply BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (parent_id) REFERENCES posts(id)
);

-- ❌ 나쁜 예
CREATE TABLE posts (
  ID BIGINT,           -- 대문자
  Title VARCHAR(255),  -- PascalCase
  authorId VARCHAR(50), -- camelCase
  createdDate TIMESTAMP -- 모호한 의미
);
```

### 인덱스명
```sql
-- ✅ 좋은 예: 규칙적인 명명
CREATE INDEX idx_posts_title ON posts(title);
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_attachments_post_id ON attachments(post_id);

-- ❌ 나쁜 예
CREATE INDEX post_title_index ON posts(title);
CREATE INDEX i1 ON posts(author_id);
```

---

## 파일 및 디렉토리 구조

### 백엔드 (Java/Spring Boot)
```
backend/
├── src/main/java/com/example/boardapp/
│   ├── controller/              # REST 컨트롤러
│   │   ├── PostController.java
│   │   └── CommentController.java
│   ├── service/                 # 비즈니스 로직
│   │   ├── PostService.java
│   │   └── FileService.java
│   ├── repository/              # 데이터 접근 계층
│   │   ├── PostRepository.java
│   │   └── AttachmentRepository.java
│   ├── domain/                  # 엔티티 클래스
│   │   ├── Post.java
│   │   └── Attachment.java
│   ├── dto/                     # 데이터 전송 객체
│   │   ├── PostRequestDto.java
│   │   └── PostResponseDto.java
│   ├── config/                  # 설정 클래스
│   │   ├── DatabaseConfig.java
│   │   └── SecurityConfig.java
│   └── exception/               # 예외 처리
│       ├── GlobalExceptionHandler.java
│       └── BusinessException.java
├── src/main/resources/
│   ├── application.yml
│   ├── application-local.yml
│   └── application-prod.yml
└── src/test/java/               # 테스트 코드
    └── com/example/boardapp/
        ├── controller/
        └── service/
```

### 프론트엔드 (React)
```
frontend/
├── src/
│   ├── components/              # React 컴포넌트
│   │   ├── PostForm.js         # 단일 파일 컴포넌트
│   │   ├── PostDetail.js
│   │   ├── PostList.js
│   │   └── common/             # 공통 컴포넌트
│   │       ├── Header.js
│   │       └── Pagination.js
│   ├── api/                    # API 호출 함수
│   │   ├── index.js           # API 함수들
│   │   └── endpoints.js       # API 엔드포인트 상수
│   ├── utils/                 # 유틸리티 함수
│   │   ├── validation.js
│   │   └── formatters.js
│   ├── styles/                # CSS 파일
│   │   ├── globals.css
│   │   └── components/
│   └── index.js               # 애플리케이션 진입점
├── public/
│   ├── index.html
│   └── favicon.ico
├── package.json
└── webpack.config.js
```

---

## Git 컨벤션

### 브랜치 네이밍
```bash
# ✅ 좋은 예
main                    # 메인 브랜치
develop                 # 개발 브랜치
feature/multi-file-upload    # 새 기능
bugfix/file-upload-error     # 버그 수정
hotfix/security-patch        # 핫픽스
release/v1.2.0              # 릴리스 준비

# ❌ 나쁜 예
master                  # main 사용 권장
dev                     # develop 사용 권장
feature-upload          # kebab-case 사용 권장
bug_fix                 # snake_case 사용 금지
```

### 커밋 메시지
```bash
# ✅ 좋은 예: 타입(스코프): 간결한 설명
feat(post): add multi-file upload functionality
fix(auth): resolve JWT token validation issue
docs(api): update API specification for file upload
style(frontend): improve UI for file selection
refactor(service): extract file handling logic
test(controller): add unit tests for PostController
chore(build): update Docker configuration

# ❌ 나쁜 예
Add files                    # 너무 모호함
Fixed bug                    # 어떤 버그인지 불명확
Updated code                 # 무엇을 업데이트했는지 불명확
WIP                         # Work In Progress는 임시만 사용
```

### 커밋 메시지 상세 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

**예시:**
```
feat(post): implement multi-file attachment support

- Add Attachment entity with OneToMany relationship
- Update PostService to handle multiple file uploads  
- Modify PostController to accept MultipartFile arrays
- Add file validation (PDF, JPG, PNG only, max 10MB each)

Closes #123
```

### Pull Request 템플릿
```markdown
## 변경 내용
- [ ] 새로운 기능 추가
- [ ] 버그 수정
- [ ] 문서 업데이트
- [ ] 리팩토링
- [ ] 테스트 추가

## 상세 설명
이 PR에서 구현한 내용을 자세히 설명하세요.

## 테스트
- [ ] 유닛 테스트 통과
- [ ] 통합 테스트 통과  
- [ ] 수동 테스트 완료

## 체크리스트
- [ ] 코드 스타일 가이드 준수
- [ ] 문서 업데이트 완료
- [ ] 브레이킹 체인지 없음 (있다면 명시)
- [ ] 보안 검토 완료

## 스크린샷 (해당 시)
UI 변경이 있다면 Before/After 스크린샷을 첨부하세요.

## 관련 이슈
Closes #123
```

---

## 문서화 가이드

### Javadoc
```java
/**
 * 게시글을 생성합니다.
 * 
 * @param title 게시글 제목 (필수, 최대 255자)
 * @param author 작성자 ID (필수)  
 * @param authorNickName 작성자 닉네임 (선택)
 * @param content 게시글 내용 (필수)
 * @param files 첨부 파일들 (선택, 최대 20개)
 * @return 생성된 게시글 엔티티
 * @throws IllegalArgumentException 파일 개수가 20개를 초과하는 경우
 * @throws IOException 파일 저장 중 오류가 발생한 경우
 */
public Post createPost(String title, String author, String authorNickName, 
                      String content, MultipartFile[] files) throws IOException {
    // ...
}
```

### JSDoc (JavaScript)
```javascript
/**
 * 파일 업로드 폼을 처리합니다.
 * @param {Event} e - 폼 제출 이벤트
 * @param {File[]} files - 업로드할 파일 배열 (최대 20개)
 * @returns {Promise<void>} 업로드 완료 Promise
 */
const handleFileUpload = async (e, files) => {
  // ...
};
```

### README 작성 원칙
1. **명확한 제목과 설명**: 프로젝트가 무엇인지 한 줄로 설명
2. **설치 및 실행 방법**: 누구나 따라할 수 있도록 단계별 설명
3. **사용 예시**: 코드 샘플이나 스크린샷 포함
4. **API 문서 링크**: 상세 문서로의 연결
5. **기여 가이드**: 컨트리뷰션 방법 안내

---

## 코드 리뷰 가이드라인

### 리뷰어를 위한 체크리스트

#### 📋 기본 사항
- [ ] 코드 스타일 가이드 준수
- [ ] 네이밍 컨벤션 일관성
- [ ] 불필요한 주석이나 코드 제거
- [ ] TODO/FIXME 주석 확인

#### 🔍 로직 검토
- [ ] 비즈니스 로직의 정확성
- [ ] 예외 상황 처리
- [ ] 성능상 문제점 확인
- [ ] 보안 취약점 검토

#### 🧪 테스트
- [ ] 단위 테스트 존재 여부
- [ ] 테스트 커버리지 적절성
- [ ] 경계값 테스트 포함 여부

#### 📚 문서화
- [ ] API 변경사항 문서 반영
- [ ] 복잡한 로직의 주석 설명
- [ ] README 업데이트 필요성

### 피드백 작성 가이드

#### ✅ 좋은 피드백
```markdown
**명확한 설명과 대안 제시:**
현재 파일 업로드 검증 로직에서 MIME 타입만 확인하고 있는데, 
파일 확장자도 함께 검증하는 것이 보안상 더 안전할 것 같습니다.

제안: 
```java
if (!isValidFileType(file.getContentType()) || 
    !isValidFileExtension(file.getOriginalFilename())) {
    throw new IllegalArgumentException("지원하지 않는 파일 형식입니다.");
}
```

**긍정적 피드백도 중요:**
파일 크기 제한 검증 로직이 깔끔하게 구현되어 있네요! 👍
```

#### ❌ 피하는 피드백
```markdown
이건 잘못됐어요.                    # 이유와 대안 없음
코드가 이상해요.                    # 구체적이지 않음
다시 해주세요.                      # 건설적이지 않음
```

### 코드 리뷰 우선순위
1. **기능적 정확성** (가장 중요)
2. **보안 취약점**
3. **성능 이슈**
4. **코드 스타일**
5. **문서화**

---

이 가이드를 통해 Board-Lee 프로젝트의 코드 품질과 일관성을 유지할 수 있습니다. 새로운 팀원이나 기여자는 이 문서를 참고하여 프로젝트 컨벤션에 맞는 코드를 작성해주세요.