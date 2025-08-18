// src/App.jsx

import './App.css';
import Header from './components/Header';
import GoodsForm from './components/GoodsForm.tsx';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <GoodsForm />
      </div>
    </AuthProvider>
  );
}

export default App;