package com.example.boardapp.repository;

import com.example.boardapp.domain.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for CRUD operations and search on {@link Post} entities.
 */
@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // 제목 또는 작성자명에 keyword가 포함된 게시글을 검색 (대소문자 무시)
    Page<Post> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(
        String titleKeyword,
        String authorKeyword,
        Pageable pageable
    );
}
