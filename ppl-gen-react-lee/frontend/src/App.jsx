// src/App.js

import './App.css';
import Header from './components/Header';
import GenerateForm from './components/GenerateForm.tsx';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <GenerateForm />
      </div>
    </AuthProvider>
  );
}

export default App;