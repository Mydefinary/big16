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

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
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

    public PostController(PostService postService) {
        this.postService = postService;
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
                post.getId(), post.getTitle(), post.getAuthor(), post.getCreatedAt()
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
                post.getId(), post.getTitle(), post.getAuthor(), post.getCreatedAt()
        ));
        return ResponseEntity.ok(dtoPage);
    }


    /**
     * Returns a single post with full details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PostResponseDto> getPost(@PathVariable Long id) {
        Post post = postService.getPost(id);
        PostResponseDto dto = new PostResponseDto(
                post.getId(),
                post.getTitle(),
                post.getAuthor(),
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
    public ResponseEntity<PostResponseDto> createPost(
            @RequestParam("title") String title,
            @RequestParam("author") String author,
            @RequestParam("content") String content,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {
        Post post = postService.createPost(title, author, content, file);
        PostResponseDto dto = new PostResponseDto(
                post.getId(), post.getTitle(), post.getAuthor(), post.getContent(), post.getCreatedAt(), post.getUpdatedAt(), post.getAttachmentPath() != null, post.getAttachmentName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * Creates a reply to an existing post. Accepts multipart form data with optional file.
     */
    @PostMapping(value = "/{parentId}/reply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponseDto> createReply(
            @PathVariable Long parentId,
            @RequestParam("title") String title,
            @RequestParam("author") String author,
            @RequestParam("content") String content,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException {
        
        // 권한 체크 - 작성자가 role이 있는지 확인
        // TODO: 실제 사용자 인증 로직 추가 필요
        
        Post reply = postService.createReply(parentId, title, author, content, file);
        PostResponseDto dto = new PostResponseDto(
                reply.getId(), reply.getTitle(), reply.getAuthor(), reply.getContent(), 
                reply.getCreatedAt(), reply.getUpdatedAt(), 
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
                post.getId(), post.getTitle(), post.getAuthor(), post.getContent(), post.getCreatedAt(), post.getUpdatedAt(), post.getAttachmentPath() != null, post.getAttachmentName()
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
     * Handles IllegalArgumentException thrown by the service layer and returns a 404.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
    }
}