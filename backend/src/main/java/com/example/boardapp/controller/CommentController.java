package com.example.boardapp.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

import com.example.boardapp.domain.Comment;
import com.example.boardapp.domain.Post;
import com.example.boardapp.repository.CommentRepository;
import com.example.boardapp.repository.PostRepository;


@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    public CommentController(CommentRepository commentRepository, PostRepository postRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
    }

    @GetMapping("/{postId}")
    public List<Comment> getComments(@PathVariable Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }

    // @PostMapping("/{postId}")
    // public Comment addComment(@PathVariable Long postId, @RequestBody Comment comment) {
    //     Post post = postRepository.findById(postId)
    //         .orElseThrow(() -> new RuntimeException("Post not found"));
    //     comment.setPost(post);
    //     return commentRepository.save(comment);
    // }

    @PostMapping("/{postId}")
    public Comment addComment(@PathVariable Long postId, @RequestBody Comment comment) {
        System.out.println("📌 postId: " + postId);
        System.out.println("📌 comment.author: " + comment.getAuthor());
        System.out.println("📌 comment.content: " + comment.getContent());

        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found"));

        comment.setPost(post);

        return commentRepository.save(comment);
    }

    // PUT /api/comments/{id} - 댓글 수정
    @PutMapping("/{id}")
    public Comment updateComment(@PathVariable Long id, @RequestBody Comment updatedComment) {
        Comment comment = commentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Comment not found"));
        comment.setContent(updatedComment.getContent());
        return commentRepository.save(comment);
    }

    // DELETE /api/comments/{id} - 댓글 삭제
    @DeleteMapping("/{id}")
    public void deleteComment(@PathVariable Long id) {
        commentRepository.deleteById(id);
    }
}

