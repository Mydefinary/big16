import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import PostForm from './components/PostForm';
import PostReply from './components/PostReply';
import 'bootstrap/dist/css/bootstrap.min.css';
import Faq from './components/Faq';

export default function App() {
  return (
    <div className="container">     
      <Routes>
        <Route path="/" element={<PostList />} />
        <Route path="/partnership" element={<PostList />} />
        <Route path="/posts/new" element={<PostForm isEdit={false} />} />
        <Route path="/posts/:id/edit" element={<PostForm isEdit={true} />} />
        <Route path="/posts/:id/reply" element={<PostReply />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}