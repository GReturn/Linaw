import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import InteractiveReader from './pages/Notebook';
import './index.css';
import AuthPage from "./pages/AuthPage";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/notebook/:id"
            element={
              <ProtectedRoute>
                <InteractiveReader />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
