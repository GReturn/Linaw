import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import InteractiveReader from './components/Notebook';
import './index.css';
import AuthPage from "./pages/AuthPage";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/notebook/:id" element={<InteractiveReader />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);