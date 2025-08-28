package com.example.boardapp.repository;

import com.example.boardapp.domain.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Attachment entities.
 */
@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    
    /**
     * Find all attachments for a specific post.
     */
    List<Attachment> findByPostId(Long postId);
    
    /**
     * Delete all attachments for a specific post.
     */
    void deleteByPostId(Long postId);
}