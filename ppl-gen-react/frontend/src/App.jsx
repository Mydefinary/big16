// src/App.js

import './App.css';
// 1. 두 컴포넌트를 정확하게 import 합니다.
// (파일 확장자 .tsx는 생략해도 괜찮습니다)
import GenerateForm from './components/GenerateForm.tsx';
import AuthGuard from './components/AuthGuard.js';
function App() {
  return (
    <div className="App">
      {/* 2. import한 컴포넌트들을 나열합니다. */}
      <GenerateForm />
    </div>
  );
}

export default App;