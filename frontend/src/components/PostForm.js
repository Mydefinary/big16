import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPost, createPost, updatePost } from '../api';
import axios from 'axios';

export default function PostForm({ isEdit }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [existingAttachmentName, setExistingAttachmentName] = useState('');
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    axios.get("http://20.249.113.18:9000/auths/me", { withCredentials: true })
      .then(res => setCurrentUser(res.data))
      .catch(err => console.error("사용자 정보 불러오기 실패:", err));
  }, []);

  useEffect(() => {
    if (isEdit) {
      fetchPost(id)
        .then(res => {
          const data = res.data;
          setTitle(data.title);
          setAuthor(data.author);
          setContent(data.content);
          if (data.hasAttachment) {
            setExistingAttachmentName(data.attachmentName);
          }
        })
        .catch(err => setError(err.response?.data || err.message));
    }
  }, [id, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목, 내용을 모두 입력하세요.');
      return;
    }
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    
    // 다중 파일 처리
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }
    
    if (isEdit) formData.append('removeAttachment', removeAttachment);

    const save = isEdit ? updatePost : createPost;
    const redirect = isEdit ? () => navigate(`/posts/${id}`) : (res) => navigate(`/posts/${res.data.id}`);

    save(isEdit ? id : formData, formData)
      .then(res => redirect(res))
      .catch(err => setError(err.response?.data || err.message));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length > 20) {
      alert('최대 20개까지 첨부파일을 업로드할 수 있습니다.');
      e.target.value = null;
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    
    for (let file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`파일 "${file.name}"이 10MB를 초과합니다.`);
        e.target.value = null;
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(`파일 "${file.name}"의 형식이 지원되지 않습니다. (PDF, JPG, PNG만 허용)`);
        e.target.value = null;
        return;
      }
    }

    setFiles(selectedFiles);
    if (isEdit) setRemoveAttachment(false);
  };
  if (error) {
    return (
      <div className="alert alert-danger mt-4 text-center">
        {typeof error === 'string'
          ? error
          : error.error || '오류가 발생했습니다.'}
      </div>
    );
  }


  return (
    <div className="container mt-4">
      <div className="p-4 border rounded shadow-sm bg-white">
        <h3 className="mb-4">{isEdit ? '✏️ 게시글 수정' : '📝 새 게시글 작성'}</h3>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-3">
            <label className="form-label fw-semibold">제목</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          {/* <div className="mb-3">
            <label className="form-label fw-semibold">작성자</label>
            <input
              type="text"
              className="form-control"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
          </div> */}

          <div className="mb-3">
            <label className="form-label fw-semibold">내용</label>
            <textarea
              className="form-control"
              rows="6"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">첨부파일 (최대 20개, 각각 10MB 이하)</label>
            <input 
              type="file" 
              className="form-control" 
              onChange={handleFileChange} 
              multiple 
            />
            
            {files.length > 0 && (
              <div className="mt-2">
                <strong>선택된 파일:</strong>
                <ul className="list-unstyled mt-1">
                  {files.map((file, index) => (
                    <li key={index} className="text-muted">
                      📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {isEdit && existingAttachmentName && files.length === 0 && !removeAttachment && (
              <div className="form-text mt-2">
                현재 파일: {existingAttachmentName}{' '}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={() => setRemoveAttachment(true)}
                >
                  삭제
                </button>
              </div>
            )}
            {removeAttachment && (
              <div className="form-text text-danger mt-2">기존 첨부파일이 삭제됩니다.</div>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="submit" className="btn btn-primary">{isEdit ? '수정' : '등록'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
}
