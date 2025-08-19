import React, { useEffect, useState } from 'react';
import axios from 'axios';

function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    axios.get(`/api/comments/${postId}`)
      .then(res => setComments(res.data))
      .catch(err => console.error(err));
  }, [postId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`/api/comments/${postId}`, { author, content })
      .then(res => {
        setComments(prev => [...prev, res.data]);
        setAuthor('');
        setContent('');
      });
  };

  const handleDelete = (id) => {
    axios.delete(`/api/comments/${id}`)
      .then(() => {
        setComments(prev => prev.filter(c => c.id !== id));
      });
  };

  const handleEdit = (id, originalContent) => {
    setEditingId(id);
    setEditContent(originalContent);
  };

  const handleEditSubmit = (id) => {
    axios.put(`/api/comments/${id}`, { content: editContent })
      .then(res => {
        setComments(prev =>
          prev.map(c => c.id === id ? { ...c, content: res.data.content } : c)
        );
        setEditingId(null);
        setEditContent('');
      });
  };

  return (
    <div className="mt-5 p-4 border rounded shadow-sm bg-light">
      <h5 className="fw-bold mb-4">💬 댓글</h5>

      <div className="mb-4">
        {comments.length === 0 && <p className="text-muted">아직 댓글이 없습니다.</p>}
        {comments.map((c) => (
          <div key={c.id} className="p-3 mb-3 border rounded bg-white">
            <div className="d-flex justify-content-between mb-1">
              <strong className="text-dark">{c.author}</strong>
              <small className="text-muted">{new Date(c.createdAt).toLocaleString()}</small>
            </div>
            {editingId === c.id ? (
              <>
                <textarea
                  className="form-control mb-2"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <div className="text-end">
                  <button className="btn btn-sm btn-success me-2" onClick={() => handleEditSubmit(c.id)}>저장</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingId(null)}>취소</button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-2">{c.content}</p>
                <div className="text-end">
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(c.id, c.content)}>수정</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>삭제</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="작성자 이름"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </div>
        <div className="mb-2">
          <textarea
            className="form-control"
            placeholder="댓글을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            required
          />
        </div>
        <div className="text-end">
          <button className="btn btn-success btn-sm px-4">댓글 작성</button>
        </div>
      </form>
    </div>
  );
}

export default CommentSection;
