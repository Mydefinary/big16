package com.example.boardapp.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a file attachment for a post.
 */
@Entity
@Table(name = "attachments")
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Reference to the post this attachment belongs to. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    /** Original filename of the attachment. */
    @Column(name = "original_name", nullable = false)
    private String originalName;

    /** Stored filename on disk (with UUID). */
    @Column(name = "stored_name", nullable = false)
    private String storedName;

    /** Full path where the file is stored on disk. */
    @Column(name = "file_path", nullable = false)
    private String filePath;

    /** File size in bytes. */
    @Column(name = "file_size")
    private Long fileSize;

    /** MIME type of the file. */
    @Column(name = "content_type")
    private String contentType;

    /** Date and time when the attachment was uploaded. */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public String getStoredName() {
        return storedName;
    }

    public void setStoredName(String storedName) {
        this.storedName = storedName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}