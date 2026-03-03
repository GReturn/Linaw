import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import InteractiveReader from './pages/Notebook';
import './index.css';
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from './pages/SettingsPage';
import { SettingsProvider } from './context/SettingsContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
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
            <Route
              path="/notebook/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);
