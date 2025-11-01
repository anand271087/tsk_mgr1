import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white flex items-center justify-center"><p className="text-white text-2xl">Signup Page - Coming Soon</p></div>} />
        <Route path="/dashboard" element={<div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white flex items-center justify-center"><p className="text-white text-2xl">Dashboard - Coming Soon</p></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
