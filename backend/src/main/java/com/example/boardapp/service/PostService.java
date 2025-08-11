package com.example.boardapp.service;

import com.example.boardapp.domain.Post;
import com.example.boardapp.repository.PostRepository;
import com.example.boardapp.repository.CommentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Service containing business logic for managing posts and their attachments.
 */
@Service
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    /** Directory where attachments will be stored on the server. This path can be configured in application properties. Default: uploads */
    private final Path attachmentDir;

    public PostService(PostRepository postRepository,
                       CommentRepository commentRepository,
                       @Value("${app.attachment-dir:uploads}") String attachmentDir) throws IOException {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.attachmentDir = Paths.get(attachmentDir).toAbsolutePath().normalize();
        Files.createDirectories(this.attachmentDir);
    }

    @Transactional(readOnly = true)
    public Page<Post> getPosts(Pageable pageable) {
        return postRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Post getPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. ID=" + id));
    }

    @Transactional(readOnly = true)
    public Page<Post> searchPosts(String keyword, Pageable pageable) {
        return postRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(
                keyword, keyword, pageable);
    }

    public Post createPost(String title, String author, String content, MultipartFile file) throws IOException {
        Post post = new Post();
        post.setTitle(title);
        post.setAuthor(author);
        post.setContent(content);
        Post saved = postRepository.save(post);
        if (file != null && !file.isEmpty()) {
            storeFile(saved, file);
        }
        return saved;
    }

    public Post updatePost(Long id, String title, String author, String content, MultipartFile file, boolean removeAttachment) throws IOException {
        Post post = getPost(id);
        post.setTitle(title);
        post.setAuthor(author);
        post.setContent(content);
        if (file != null && !file.isEmpty()) {
            deleteAttachmentIfExists(post);
            storeFile(post, file);
        } else if (removeAttachment) {
            deleteAttachmentIfExists(post);
        }
        return postRepository.save(post);
    }

    /**
     * Deletes a post, its comments, and its attachment from the filesystem.
     */
    public void deletePost(Long id) {
        Post post = getPost(id);

        // 1. 연결된 댓글 먼저 삭제
        commentRepository.deleteByPostId(id);

        // 2. 첨부파일 삭제
        deleteAttachmentIfExists(post);

        // 3. 게시글 삭제
        postRepository.delete(post);
    }

    private void storeFile(Post post, MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        int idx = originalFilename != null ? originalFilename.lastIndexOf('.') : -1;
        if (idx >= 0) {
            extension = originalFilename.substring(idx);
        }
        String storedFileName = UUID.randomUUID() + extension;
        Path targetPath = this.attachmentDir.resolve(storedFileName).normalize();
        Files.copy(file.getInputStream(), targetPath);
        post.setAttachmentName(originalFilename);
        post.setAttachmentPath(targetPath.toString());
    }

    private void deleteAttachmentIfExists(Post post) {
        if (post.getAttachmentPath() != null) {
            Path path = Paths.get(post.getAttachmentPath());
            try {
                Files.deleteIfExists(path);
            } catch (IOException ignored) {
                // Best-effort deletion
            }
            post.setAttachmentPath(null);
            post.setAttachmentName(null);
        }
    }
}
