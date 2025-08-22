import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchPosts, searchPosts } from '../api';

export default function PostList() {
  const [postsPage, setPostsPage] = useState(null);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '0', 10);
  const size = 10;

  useEffect(() => {
    const q = searchParams.get('q');
    setKeyword(q || '');

    const fetch = q ? searchPosts : fetchPosts;
    fetch(page, size, q)
      .then(res => setPostsPage(res.data))
      .catch(err => setError(err.message));
  }, [page, searchParams]);

  const goToPage = (newPage) => {
    const params = { page: newPage };
    if (keyword) params.q = keyword;
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ page: 0, q: keyword });
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">📋 게시판</h2>
        <Link
  to="/posts/new"
  className="btn shadow-sm"
  style={{ backgroundColor: '#09AA5C', borderColor: '#09AA5C', color: '#fff' }}
>
  + 글쓰기
</Link>
      </div>

      <form onSubmit={handleSearch} className="input-group mb-4">
        <input
          type="text"
          className="form-control shadow-sm"
          placeholder="제목 또는 작성자 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button className="btn btn-outline-primary shadow-sm" type="submit">🔍 검색</button>
      </form>

      <div className="table-responsive shadow-sm">
  <table className="table table-hover align-middle text-center">
    <thead className="table-light">
      <tr>
        <th style={{ width: '60%' }} className="text-start">제목</th>
        <th style={{ width: '20%' }}>작성자</th>
        <th style={{ width: '20%' }}>작성일</th>
      </tr>
    </thead>
    <tbody>
      {postsPage && postsPage.content.length > 0 ? (
        postsPage.content.map(post => (
          <tr key={post.id}>
            <td className="text-start">
              <Link to={`/posts/${post.id}`} className="text-decoration-none fw-semibold">
                {post.title}
              </Link>
            </td>
            <td>{post.author}</td>
            <td>{new Date(post.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="3" className="text-muted py-4">게시글이 없습니다.</td>
        </tr>
      )}
    </tbody>
  </table>
</div>


      {postsPage && postsPage.totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => goToPage(page - 1)} disabled={page === 0}>이전</button>
            </li>
            {Array.from({ length: postsPage.totalPages }, (_, i) => (
              <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                <button className="page-link" onClick={() => goToPage(i)}>{i + 1}</button>
              </li>
            ))}
            <li className={`page-item ${page >= postsPage.totalPages - 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => goToPage(page + 1)} disabled={page >= postsPage.totalPages - 1}>다음</button>
            </li>
          </ul>
        </nav>
      )}

      {error && (
        <div className="alert alert-danger mt-4 shadow-sm">
          오류가 발생했습니다: {error}
        </div>
      )}
    </div>
  );
}
