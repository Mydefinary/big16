package com.example.boardapp.service;

import com.example.boardapp.domain.Post;
import com.example.boardapp.domain.Attachment;
import com.example.boardapp.repository.PostRepository;
import com.example.boardapp.repository.CommentRepository;
import com.example.boardapp.repository.AttachmentRepository;
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
import java.util.List;
import java.util.UUID;

/**
 * Service containing business logic for managing posts and their attachments.
 */
@Service
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;

    /** Directory where attachments will be stored on the server. This path can be configured in application properties. Default: uploads */
    private final Path attachmentDir;

    public PostService(PostRepository postRepository,
                       CommentRepository commentRepository,
                       AttachmentRepository attachmentRepository,
                       @Value("${app.attachment-dir:uploads}") String attachmentDir) throws IOException {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
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

    public Post createPost(String title, String author, String authorNickName, String content, MultipartFile[] files) throws IOException {
        Post post = new Post();
        post.setTitle(title);
        post.setAuthor(author);
        post.setAuthorNickName(authorNickName);
        post.setContent(content);
        post.setDepth(0); // 원글은 depth 0
        post.setReply(false); // 원글은 답글이 아님
        Post saved = postRepository.save(post);
        
        if (files != null && files.length > 0) {
            storeFiles(saved, files);
        }
        return saved;
    }

    public Post createReply(Long parentId, String title, String author, String authorNickName, String content, MultipartFile[] files) throws IOException {
        Post parentPost = getPost(parentId);
        
        Post reply = new Post();
        reply.setTitle(title);
        reply.setAuthor(author);
        reply.setAuthorNickName(authorNickName);
        reply.setContent(content);
        reply.setParent(parentPost);
        reply.setDepth(parentPost.getDepth() + 1);
        reply.setReply(true);
        
        Post saved = postRepository.save(reply);
        if (files != null && files.length > 0) {
            storeFiles(saved, files);
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

        // 2. 첨부파일 삭제 (신규 방식)
        deleteAllAttachments(post);
        
        // 2-1. 첨부파일 삭제 (기존 방식 - 호환성)
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
    
    /**
     * Store multiple files for a post. Maximum 20 files allowed.
     */
    private void storeFiles(Post post, MultipartFile[] files) throws IOException {
        if (files.length > 20) {
            throw new IllegalArgumentException("최대 20개까지 첨부파일을 업로드할 수 있습니다.");
        }
        
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                storeAttachment(post, file);
            }
        }
    }
    
    /**
     * Store a single attachment file.
     */
    private void storeAttachment(Post post, MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        int idx = originalFilename != null ? originalFilename.lastIndexOf('.') : -1;
        if (idx >= 0) {
            extension = originalFilename.substring(idx);
        }
        
        String storedFileName = UUID.randomUUID() + extension;
        Path targetPath = this.attachmentDir.resolve(storedFileName).normalize();
        Files.copy(file.getInputStream(), targetPath);
        
        Attachment attachment = new Attachment();
        attachment.setOriginalName(originalFilename);
        attachment.setStoredName(storedFileName);
        attachment.setFilePath(targetPath.toString());
        attachment.setFileSize(file.getSize());
        attachment.setContentType(file.getContentType());
        attachment.setPost(post);
        
        attachmentRepository.save(attachment);
        post.addAttachment(attachment);
        
        // 호환성을 위해 첫 번째 파일을 기존 필드에도 저장
        if (post.getAttachmentName() == null) {
            post.setAttachmentName(originalFilename);
            post.setAttachmentPath(targetPath.toString());
        }
    }
    
    /**
     * Delete all attachments for a post.
     */
    private void deleteAllAttachments(Post post) {
        List<Attachment> attachments = attachmentRepository.findByPostId(post.getId());
        for (Attachment attachment : attachments) {
            try {
                Files.deleteIfExists(Paths.get(attachment.getFilePath()));
            } catch (IOException ignored) {
                // Best-effort deletion
            }
        }
        attachmentRepository.deleteByPostId(post.getId());
    }
}
