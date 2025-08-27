import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPost, createPost } from '../api';
import axios from 'axios';

export default function PostReply() {
  const { id: parentId } = useParams();
  const navigate = useNavigate();
  const [parentPost, setParentPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 사용자 정보 가져오기
    axios.get("http://20.249.113.18:9000/auths/me", { withCredentials: true })
      .then(res => setCurrentUser(res.data))
      .catch(err => {
        console.error("사용자 정보 불러오기 실패:", err);
        navigate('/partnership');
      });

    // 부모 글 정보 가져오기
    fetchPost(parentId)
      .then(res => {
        setParentPost(res.data);
        setTitle(`Re: ${res.data.title}`); // 제목에 Re: 접두사 추가
      })
      .catch(err => {
        setError('원글을 불러올 수 없습니다.');
        console.error(err);
      });
  }, [parentId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !currentUser.role || currentUser.role.trim() === '') {
      setError('답글 작성 권한이 없습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', currentUser.nickName);
      formData.append('content', content);
      if (file) {
        formData.append('file', file);
      }

      // 답글 생성 API 호출
      const response = await axios.post(`/board/api/posts/${parentId}/reply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });

      navigate(`/posts/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data || '답글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (error && !parentPost) {
    return <div className="alert alert-danger mt-4 text-center">{error}</div>;
  }

  if (!parentPost || !currentUser) {
    return <div className="text-center mt-5">⏳ 로딩 중...</div>;
  }

  return (
    <div className="container mt-4">
      {/* 원글 표시 */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">📄 원글 내용</h5>
        </div>
        <div className="card-body">
          <h6 className="card-title">{parentPost.title}</h6>
          <p className="card-text text-muted">
            <small>
              <strong>작성자:</strong> {parentPost.author.length > 1 ? parentPost.author[0] + '*' + parentPost.author.slice(2) : parentPost.author} | 
              <strong> 작성일:</strong> {new Date(parentPost.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
            </small>
          </p>
          <div className="card-text" style={{ whiteSpace: 'pre-line', maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', padding: '10px', borderRadius: '5px', backgroundColor: '#f8f9fa' }}>
            {parentPost.content}
          </div>
        </div>
      </div>

      {/* 답글 작성 폼 */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">💬 답글 작성</h5>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">제목 *</label>
              <input
                type="text"
                className="form-control"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="author" className="form-label">작성자</label>
              <input
                type="text"
                className="form-control"
                id="author"
                value={currentUser.nickName}
                disabled
                style={{ backgroundColor: '#e9ecef' }}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="content" className="form-label">내용 *</label>
              <textarea
                className="form-control"
                id="content"
                rows="10"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="file" className="form-label">첨부파일</label>
              <input
                type="file"
                className="form-control"
                id="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '작성 중...' : '답글 작성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}