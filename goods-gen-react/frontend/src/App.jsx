// src/App.jsx

import React from 'react';
import './App.css';
import GoodsForm from './components/GoodsForm'; // GoodsForm을 불러옵니다.

function App() {
  return (
    <div className="App">
      {/* 다른 컴포넌트(예: NavBar)가 있다면 여기에 추가 */}
      <GoodsForm /> {/* 화면에 표시되도록 추가 */}
    </div>
  );
}

export default App;