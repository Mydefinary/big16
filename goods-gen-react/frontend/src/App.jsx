// src/App.tsx

import React from 'react';
import './App.css';
import GoodsForm from './components/GoodsForm.tsx'; // GoodsForm을 불러옵니다.
import AuthGuard from './components/AuthGuard.js';

function App() {
  return (
    <div className="App">
      {/* 다른 컴포넌트(예: NavBar)가 있다면 여기에 추가 */}
      <GoodsForm /> {/* 화면에 표시되도록 추가 */}
    </div>
  );
}

export default App;