package com.example.boardapp.controller;

import com.example.boardapp.domain.Post;
import com.example.boardapp.dto.PostListDto;
import com.example.boardapp.dto.PostResponseDto;
import com.example.boardapp.service.PostService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller exposing CRUD operations for posts, along with attachment download.
 */
@RestController
@RequestMapping("/api/posts")
@Validated
@CrossOrigin(origins = "*")
public class PostController {

    private final PostService postService;
    private final RestTemplate restTemplate;

    public PostController(PostService postService, RestTemplate restTemplate) {
        this.postService = postService;
        this.restTemplate = restTemplate;
    }

    // 사용자 인증 및 권한 확인 메서드
    private Map<String, Object> getUserFromAuth(String cookie) {
        try {
            String authUrl = "http://auth-backend-lee-service:9001/auths/me";
            
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            if (cookie != null) {
                headers.set("Cookie", cookie);
            }
            
            System.out.println("DEBUG: 인증 요청 쿠키: " + cookie);
            
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(authUrl, org.springframework.http.HttpMethod.GET, entity, Map.class);
            
            Map<String, Object> userInfo = response.getBody();
            System.out.println("DEBUG: 인증 서비스 응답: " + userInfo);
            
            return userInfo;
        } catch (Exception e) {
            System.out.println("DEBUG: 인증 실패: " + e.getMessage());
            return null;
        }
    }

    // 최상위 원글 작성자 찾기
    private String findRootPostAuthor(Post post) {
        Post current = post;
        while (current.getParent() != null) {
            current = current.getParent();
        }
        return current.getAuthor();
    }


    // 게시글 열람 권한 확인
    private boolean hasReadPermission(Post post, Map<String, Object> user) {
        if (user == null) {
            System.out.println("DEBUG: 비회원 접근, post ID: " + post.getId());
            return false; // 비회원은 열람 불가
        }

        String userId = String.valueOf(user.get("userId"));
        String userRole = (String) user.get("role");
        
        System.out.println("DEBUG: 권한 검사 - postId: " + post.getId() + ", postAuthor: " + post.getAuthor() + 
                          ", userId: " + userId + ", userRole: " + userRole + 
                          ", isReply: " + post.isReply() + ", parentId: " + (post.getParent() != null ? post.getParent().getId() : "null"));

        // admin, operator는 모든 글 열람 가능
        if ("admin".equals(userRole) || "operator".equals(userRole)) {
            System.out.println("DEBUG: admin/operator 권한으로 허용");
            return true;
        }

        // user 권한인 경우: 자기가 작성한 글만 열람 가능
        if ("user".equals(userRole)) {
            // 본인이 작성한 글인지 확인 (author 필드를 ID로 비교)
            if (post.getAuthor().equals(userId)) {
                System.out.println("DEBUG: 본인 작성 글로 허용");
                return true;
            }
            
            // 답글의 경우, 자기가 작성한 원글에 대한 답글만 열람 가능
            if (post.isReply()) {
                String rootAuthor = findRootPostAuthor(post);
                System.out.println("DEBUG: 답글 검사 - rootAuthor: " + rootAuthor + ", userId: " + userId);
                // 원글 작성자가 본인인 경우에만 답글 열람 가능
                if (rootAuthor.equals(userId)) {
                    System.out.println("DEBUG: 본인 원글의 답글로 허용");
                    return true;
                }
                System.out.println("DEBUG: 다른 사용자 원글의 답글로 거부");
                return false;
            }
            
            System.out.println("DEBUG: user 권한 - 본인 글 아니고 답글도 아님으로 거부");
            return false; // user는 본인 글과 본인 글에 대한 답글이 아니면 열람 불가
        }

        System.out.println("DEBUG: 기타 권한으로 거부");
        return false; // 그 외는 열람 불가
    }

    /**
     * Returns a paginated list of posts. Accepts optional page and size parameters.
     */
    @GetMapping
    public ResponseEntity<Page<PostListDto>> listPosts(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> postsPage = postService.getPosts(pageable);
        Page<PostListDto> dtoPage = postsPage.map(post -> new PostListDto(
                post.getId(), post.getTitle(), 
                post.getAuthorNickName() != null ? post.getAuthorNickName() : "작성자", 
                post.getCreatedAt()
        ));
        return ResponseEntity.ok(dtoPage);
    }

    /**
 * Returns a paginated list of posts filtered by keyword in title or author.
 */
    @GetMapping("/search")
    public ResponseEntity<Page<PostListDto>> searchPosts(
            @RequestParam("q") String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> postsPage = postService.searchPosts(keyword, pageable);
        Page<PostListDto> dtoPage = postsPage.map(post -> new PostListDto(
                post.getId(), post.getTitle(), 
                post.getAuthorNickName() != null ? post.getAuthorNickName() : "작성자", 
                post.getCreatedAt()
        ));
        return ResponseEntity.ok(dtoPage);
    }


    /**
     * Returns a single post with full details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPost(
            @PathVariable Long id,
            @CookieValue(value = "accessToken", required = false) String accessToken) {
        Post post = postService.getPost(id);
        
        // 사용자 인증 정보 조회
        String cookieHeader = accessToken != null ? "accessToken=" + accessToken : null;
        Map<String, Object> user = getUserFromAuth(cookieHeader);
        
        // 열람 권한 확인
        if (!hasReadPermission(post, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("이 글을 열람할 권한이 없습니다.(Request failed with status code 403)");
        }
        
        PostResponseDto dto = new PostResponseDto(
                post.getId(),
                post.getTitle(),
                post.getAuthorNickName() != null ? post.getAuthorNickName() : "작성자",
                post.getContent(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                post.getAttachmentPath() != null,
                post.getAttachmentName()
        );
        return ResponseEntity.ok(dto);
    }

    /**
     * Creates a new post. Accepts multipart form data with optional file under the name "file".
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createPost(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestPart(value = "files", required = false) MultipartFile[] files,
            @CookieValue(value = "accessToken", required = false) String accessToken) throws IOException {
        
        // 사용자 인증 정보 조회
        String cookieHeader = accessToken != null ? "accessToken=" + accessToken : null;
        Map<String, Object> user = getUserFromAuth(cookieHeader);
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        
        String userId = String.valueOf(user.get("userId"));
        String nickName = (String) user.get("nickName");
        Post post = postService.createPost(title, userId, nickName, content, files);
        PostResponseDto dto = new PostResponseDto(
                post.getId(), post.getTitle(), 
                post.getAuthorNickName() != null ? post.getAuthorNickName() : nickName, 
                post.getContent(), post.getCreatedAt(), post.getUpdatedAt(), post.getAttachmentPath() != null, post.getAttachmentName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * Creates a reply to an existing post. Accepts multipart form data with optional file.
     */
    @PostMapping(value = "/{parentId}/reply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createReply(
            @PathVariable Long parentId,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestPart(value = "files", required = false) MultipartFile[] files,
            @CookieValue(value = "accessToken", required = false) String accessToken) throws IOException {
        
        // 사용자 인증 정보 조회
        String cookieHeader = accessToken != null ? "accessToken=" + accessToken : null;
        Map<String, Object> user = getUserFromAuth(cookieHeader);
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }
        
        String userId = String.valueOf(user.get("userId"));
        String nickName = (String) user.get("nickName");
        Post reply = postService.createReply(parentId, title, userId, nickName, content, files);
        PostResponseDto dto = new PostResponseDto(
                reply.getId(), reply.getTitle(), 
                reply.getAuthorNickName() != null ? reply.getAuthorNickName() : nickName, 
                reply.getContent(), reply.getCreatedAt(), reply.getUpdatedAt(), 
                reply.getAttachmentPath() != null, reply.getAttachmentName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * Updates an existing post. Accepts multipart form data with optional file. To remove existing attachment without replacing it,
     * include removeAttachment=true.
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponseDto> updatePost(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("author") String author,
            @RequestParam("content") String content,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "removeAttachment", defaultValue = "false") boolean removeAttachment) throws IOException {
        Post post = postService.updatePost(id, title, author, content, file, removeAttachment);
        PostResponseDto dto = new PostResponseDto(
                post.getId(), post.getTitle(), 
                post.getAuthorNickName() != null ? post.getAuthorNickName() : "작성자", 
                post.getContent(), post.getCreatedAt(), post.getUpdatedAt(), post.getAttachmentPath() != null, post.getAttachmentName()
        );
        return ResponseEntity.ok(dto);
    }

    /**
     * Deletes a post by ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Downloads the attachment associated with the given post ID. If no attachment exists, returns 404.
     * This method is kept for backward compatibility.
     */
    @GetMapping("/{id}/attachment")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) throws MalformedURLException {
        Post post = postService.getPost(id);
        if (post.getAttachmentPath() == null) {
            return ResponseEntity.notFound().build();
        }
        Path filePath = Paths.get(post.getAttachmentPath());
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + post.getAttachmentName())
                .body(resource);
    }

    /**
     * Downloads a specific attachment by attachment ID.
     */
    @GetMapping("/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachmentById(@PathVariable Long attachmentId) throws MalformedURLException {
        // AttachmentService가 필요하지만, 일단 PostService를 통해 구현
        // 실제 구현에서는 AttachmentService를 만들어서 처리하는 것이 좋습니다.
        return ResponseEntity.notFound().build(); // TODO: Implement attachment download by ID
    }

    /**
     * Handles IllegalArgumentException thrown by the service layer and returns a 404.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }
}