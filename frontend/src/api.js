import axios from 'axios';

// Configure base URL for backend API. When deploying behind proxy this can be relative.
const apiClient = axios.create({
  baseURL: '/board/api',
  // Optional: withCredentials: true
});

// List posts with pagination (default page 0 size 10).
export function fetchPosts(page = 0, size = 10) {
  return apiClient.get(`/posts`, { params: { page, size } });
}

// Get single post by id.
export function fetchPost(id) {
  return apiClient.get(`/posts/${id}`);
}

// Create new post. data should be FormData containing title, author, content, optional file.
export function createPost(data) {
  return apiClient.post(`/posts`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// Update existing post. data should be FormData; include removeAttachment flag.
export function updatePost(id, data) {
  return apiClient.put(`/posts/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// Delete post by id.
export function deletePost(id) {
  return apiClient.delete(`/posts/${id}`);
}

// Download attachment; returns blob.
export function downloadAttachment(id) {
  return apiClient.get(`/posts/${id}/attachment`, { responseType: 'blob' });
}

// Search posts by keyword in title or author (with pagination)
export function searchPosts(page = 0, size = 10, keyword = '') {
  return apiClient.get(`/posts/search`, {
    params: { q: keyword, page, size }
  });
}

