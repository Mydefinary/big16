import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchPost, deletePost, downloadAttachment } from '../api';
import CommentSection from './CommentSection';
import axios from 'axios';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
      axios.get("http://20.249.113.18:9000/auths/me", { withCredentials: true })
        .then(res => {
      setCurrentUser(res.data);
    })
        .catch(err => console.error("사용자 정보 불러오기 실패:", err));
    }, []);

const canEdit = currentUser && post && (currentUser.nickName === post.author || currentUser.role === 'admin');

  useEffect(() => {
    fetchPost(id)
      .then(res =>{
      setPost(res.data);
    })
      .catch(err => setError(err.response?.data || err.message));
  }, [id]);

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deletePost(id)
        .then(() => navigate('/partnership'))
        .catch(err => setError(err.response?.data || err.message));
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    downloadAttachment(id)
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', post.attachmentName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => setError(err.response?.data || err.message))
      .finally(() => setDownloading(false));
  };

  if (error) {
    return <div className="alert alert-danger mt-4 text-center">{error}</div>;
  }

  if (!post) {
    return <div className="text-center mt-5">⏳ 게시글을 불러오는 중입니다...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="border rounded p-4 shadow-sm bg-white">
        <h2 className="mb-3">{post.title}</h2>

        <ul className="list-unstyled small text-muted mb-4">
          <li><strong>작성자:</strong> 
          {post.author.length > 1 ? post.author[0] + '*' + post.author.slice(2) : post.author}
          </li> 
                  <li>
  <strong>작성일:</strong>{" "}
  {new Date(post.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
</li>
<li>
  <strong>수정일:</strong>{" "}
  {new Date(post.updatedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
</li>
        </ul>

        <hr />

        <div className="mb-4" style={{ whiteSpace: 'pre-line' }}>{post.content}</div>

        {post.hasAttachment && (
          <div className="mb-4">
            <button className="btn btn-outline-primary" onClick={handleDownload} disabled={downloading}>
              {downloading ? '📥 다운로드 중...' : `📎 첨부파일 다운로드 (${post.attachmentName})`}
            </button>
          </div>
        )}

        <div className="d-flex justify-content-end gap-2">

          {canEdit && (
          <>
          <Link to={`/posts/${id}/edit`} className="btn btn-outline-secondary">✏️ 수정</Link>
          <button className="btn btn-outline-danger" onClick={handleDelete}>🗑️ 삭제</button> 
          </>
          )}
          <Link to={`/partnership`} className="btn btn-outline-secondary">⬅️ 목록</Link>
          {/* <button className="btn btn-light" onClick={() => navigate(-1)}>⬅️ 뒤로</button> */}
        </div>

        


      </div>
      <CommentSection postId={post.id}  />

      {/* currentUser={currentUser} */}
      
    </div>
  );
}
