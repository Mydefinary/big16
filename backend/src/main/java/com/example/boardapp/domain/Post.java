package com.example.boardapp.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    /** ID of the author (for permission checking). */
    @Column(nullable = false)
    @NotBlank(message = "작성자ID는 필수입니다.")
    @Size(max = 50)
    private String author;

    /** Display name of the author (for UI display). */
    @Column(name = "author_nick_name")
    @Size(max = 100)
    private String authorNickName;

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

    /** The original filename of the attachment, if present. (Deprecated - use attachments instead) */
    private String attachmentName;

    /** The path on disk where the attachment is stored. (Deprecated - use attachments instead) */
    private String attachmentPath;

    /** List of attachments for this post. */
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Attachment> attachments = new ArrayList<>();

    /** 답글 기능을 위한 부모 게시글 참조 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Post parent;

    /** 게시글 깊이 (0: 원글, 1: 1차 답글, 2: 2차 답글...) */
    @Column(name = "depth", nullable = false)
    private int depth = 0;

    /** 답글 여부를 쉽게 확인하기 위한 플래그 */
    @Column(name = "is_reply", nullable = false)
    private boolean isReply = false;

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

    public String getAuthorNickName() {
        return authorNickName;
    }

    public void setAuthorNickName(String authorNickName) {
        this.authorNickName = authorNickName;
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

    public Post getParent() {
        return parent;
    }

    public void setParent(Post parent) {
        this.parent = parent;
    }

    public int getDepth() {
        return depth;
    }

    public void setDepth(int depth) {
        this.depth = depth;
    }

    public boolean isReply() {
        return isReply;
    }

    public void setReply(boolean reply) {
        isReply = reply;
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments;
    }

    public void addAttachment(Attachment attachment) {
        this.attachments.add(attachment);
        attachment.setPost(this);
    }
}