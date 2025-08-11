package com.example.boardapp.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * Entity representing a bulletin board post. Each post may have an optional file
 * attachment stored on disk. Only one attachment is allowed per post.
 */
@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Title of the post. */
    @Column(nullable = false)
    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 255)
    private String title;

    /** Name of the author (writer). */
    @Column(nullable = false)
    @NotBlank(message = "작성자명은 필수입니다.")
    @Size(max = 100)
    private String author;

    /** Content of the post. */
    @Lob
    @Column(nullable = false)
    @NotBlank(message = "내용은 필수입니다.")
    private String content;

    /** Date and time the post was created. Automatically set when persisted. */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /** Date and time the post was last updated. Updated whenever entity changes. */
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /** The original filename of the attachment, if present. */
    private String attachmentName;

    /** The path on disk where the attachment is stored. */
    private String attachmentPath;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public String getAttachmentName() {
        return attachmentName;
    }

    public void setAttachmentName(String attachmentName) {
        this.attachmentName = attachmentName;
    }

    public String getAttachmentPath() {
        return attachmentPath;
    }

    public void setAttachmentPath(String attachmentPath) {
        this.attachmentPath = attachmentPath;
    }
}