# Board-Lee API 명세서

## 개요
Board-Lee 시스템의 REST API 명세서입니다. 모든 API는 JSON 형식으로 데이터를 주고받으며, JWT 토큰을 통한 인증을 사용합니다.

## 기본 정보
- **Base URL**: `http://20.249.113.18:9000/board/api`
- **Content-Type**: `application/json` (파일 업로드 시: `multipart/form-data`)
- **인증 방식**: JWT Token (Cookie: `accessToken`)
- **응답 형식**: JSON

## 인증 API

### 사용자 정보 조회
```http
GET /auths/me
```

**Headers**
```
Cookie: accessToken={jwt_token}
```

**Response (200 OK)**
```json
{
  "userId": "test19",
  "nickName": "테스터19",
  "role": "user",
  "email": "test19@example.com"
}
```

**Response (401 Unauthorized)**
```json
{
  "error": "Unauthorized",
  "message": "로그인이 필요합니다."
}
```

## 게시글 API

### 게시글 목록 조회
```http
GET /posts?page={page}&size={size}
```

**Parameters**
- `page` (optional): 페이지 번호 (기본값: 0)
- `size` (optional): 페이지 크기 (기본값: 10, 최대: 100)

**Response (200 OK)**
```json
{
  "content": [
    {
      "id": 1,
      "title": "게시글 제목",
      "author": "작성자 닉네임",
      "createdAt": "2025-08-28T10:30:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalElements": 100,
  "totalPages": 10,
  "first": true,
  "last": false
}
```

### 게시글 검색
```http
GET /posts/search?q={keyword}&page={page}&size={size}
```

**Parameters**
- `q` (required): 검색 키워드 (제목, 작성자명에서 검색)
- `page` (optional): 페이지 번호 (기본값: 0)
- `size` (optional): 페이지 크기 (기본값: 10, 최대: 100)

**Response (200 OK)**
```json
{
  "content": [
    {
      "id": 1,
      "title": "검색된 게시글 제목",
      "author": "작성자 닉네임",
      "createdAt": "2025-08-28T10:30:00"
    }
  ],
  "totalElements": 5
}
```

### 게시글 상세 조회
```http
GET /posts/{id}
```

**Headers**
```
Cookie: accessToken={jwt_token}
```

**Response (200 OK)**
```json
{
  "id": 1,
  "title": "게시글 제목",
  "author": "작성자 닉네임",
  "content": "게시글 내용",
  "createdAt": "2025-08-28T10:30:00",
  "updatedAt": "2025-08-28T11:00:00",
  "hasAttachment": true,
  "attachmentName": "파일명.pdf"
}
```

**Response (403 Forbidden)**
```json
"이 글을 열람할 권한이 없습니다.(Request failed with status code 403)"
```

**Response (404 Not Found)**
```json
"게시글을 찾을 수 없습니다. ID=1"
```

### 게시글 생성
```http
POST /posts
```

**Headers**
```
Content-Type: multipart/form-data
Cookie: accessToken={jwt_token}
```

**Body (Form Data)**
- `title` (required): 게시글 제목 (최대 255자)
- `content` (required): 게시글 내용
- `files` (optional): 첨부파일들 (최대 20개, 각 10MB 이하, PDF/JPG/PNG만 허용)

**Response (201 Created)**
```json
{
  "id": 123,
  "title": "새 게시글 제목",
  "author": "작성자 닉네임",
  "content": "게시글 내용",
  "createdAt": "2025-08-28T12:00:00",
  "updatedAt": "2025-08-28T12:00:00",
  "hasAttachment": true,
  "attachmentName": "파일명.pdf"
}
```

**Response (401 Unauthorized)**
```json
"로그인이 필요합니다."
```

**Response (400 Bad Request)**
```json
"최대 20개까지 첨부파일을 업로드할 수 있습니다."
```

### 답글 생성
```http
POST /posts/{parentId}/reply
```

**Headers**
```
Content-Type: multipart/form-data
Cookie: accessToken={jwt_token}
```

**Body (Form Data)**
- `title` (required): 답글 제목 (최대 255자)
- `content` (required): 답글 내용
- `files` (optional): 첨부파일들

**Response (201 Created)**
```json
{
  "id": 124,
  "title": "Re: 답글 제목",
  "author": "답글 작성자",
  "content": "답글 내용",
  "createdAt": "2025-08-28T12:30:00",
  "updatedAt": "2025-08-28T12:30:00",
  "hasAttachment": false,
  "attachmentName": null
}
```

### 게시글 수정
```http
PUT /posts/{id}
```

**Headers**
```
Content-Type: multipart/form-data
Cookie: accessToken={jwt_token}
```

**Body (Form Data)**
- `title` (required): 수정된 제목
- `author` (required): 작성자명
- `content` (required): 수정된 내용
- `file` (optional): 새 첨부파일 (단일 파일, 이전 버전 호환성)
- `removeAttachment` (optional): 기존 첨부파일 삭제 여부 (기본값: false)

**Response (200 OK)**
```json
{
  "id": 123,
  "title": "수정된 게시글 제목",
  "author": "작성자 닉네임",
  "content": "수정된 내용",
  "createdAt": "2025-08-28T12:00:00",
  "updatedAt": "2025-08-28T13:00:00",
  "hasAttachment": true,
  "attachmentName": "새파일명.pdf"
}
```

### 게시글 삭제
```http
DELETE /posts/{id}
```

**Headers**
```
Cookie: accessToken={jwt_token}
```

**Response (204 No Content)**
```
(빈 응답)
```

**Response (404 Not Found)**
```json
"게시글을 찾을 수 없습니다. ID=1"
```

### 첨부파일 다운로드
```http
GET /posts/{id}/attachment
```

**Response (200 OK)**
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="파일명.pdf"

[파일 바이너리 데이터]
```

**Response (404 Not Found)**
```json
"첨부파일이 없습니다."
```

## 댓글 API

### 댓글 목록 조회
```http
GET /posts/{postId}/comments
```

**Response (200 OK)**
```json
[
  {
    "id": 1,
    "content": "댓글 내용",
    "author": "댓글 작성자",
    "createdAt": "2025-08-28T14:00:00",
    "updatedAt": "2025-08-28T14:00:00"
  }
]
```

### 댓글 작성
```http
POST /posts/{postId}/comments
```

**Headers**
```
Content-Type: application/json
Cookie: accessToken={jwt_token}
```

**Body**
```json
{
  "content": "댓글 내용"
}
```

**Response (201 Created)**
```json
{
  "id": 10,
  "content": "댓글 내용",
  "author": "작성자 닉네임",
  "createdAt": "2025-08-28T14:30:00",
  "updatedAt": "2025-08-28T14:30:00"
}
```

### 댓글 수정
```http
PUT /comments/{commentId}
```

**Headers**
```
Content-Type: application/json
Cookie: accessToken={jwt_token}
```

**Body**
```json
{
  "content": "수정된 댓글 내용"
}
```

**Response (200 OK)**
```json
{
  "id": 10,
  "content": "수정된 댓글 내용",
  "author": "작성자 닉네임",
  "createdAt": "2025-08-28T14:30:00",
  "updatedAt": "2025-08-28T15:00:00"
}
```

### 댓글 삭제
```http
DELETE /comments/{commentId}
```

**Headers**
```
Cookie: accessToken={jwt_token}
```

**Response (204 No Content)**
```
(빈 응답)
```

## 에러 코드

| HTTP 상태 코드 | 설명 |
|---------------|------|
| 200 OK | 요청 성공 |
| 201 Created | 리소스 생성 성공 |
| 204 No Content | 요청 성공, 응답 본문 없음 |
| 400 Bad Request | 잘못된 요청 (유효성 검사 실패) |
| 401 Unauthorized | 인증 실패 |
| 403 Forbidden | 권한 없음 |
| 404 Not Found | 리소스를 찾을 수 없음 |
| 413 Payload Too Large | 파일 크기 제한 초과 |
| 415 Unsupported Media Type | 지원하지 않는 파일 형식 |
| 500 Internal Server Error | 서버 내부 오류 |

## 권한별 API 접근 제한

### Admin 권한
- 모든 API 접근 가능
- 모든 게시글 조회/수정/삭제 가능

### Operator 권한  
- 모든 게시글 조회 가능
- 본인 게시글만 수정/삭제 가능
- 모든 게시글에 답글 작성 가능

### User 권한
- 본인 게시글 및 본인 게시글의 답글만 조회 가능
- 본인 게시글만 수정/삭제 가능
- 본인 게시글에만 답글 작성 가능

## 파일 업로드 제한

### 허용 파일 형식
- `application/pdf` (PDF)
- `image/jpeg` (JPG, JPEG)
- `image/png` (PNG)

### 크기 제한
- 개별 파일: 최대 10MB
- 게시글당 총 파일 개수: 최대 20개

### 보안 정책
- 파일명은 UUID로 암호화되어 저장
- 원본 파일명은 데이터베이스에 별도 보관
- 바이러스 검사 등 추가 보안 검사 권장

## 버전 정보
- **API 버전**: v1.2.0
- **최종 업데이트**: 2025년 8월
- **호환성**: 이전 버전과 호환 (deprecated API 제외)