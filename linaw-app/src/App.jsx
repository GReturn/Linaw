import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import InteractiveReader from './components/Notebook'
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/notebook/:id" element={
        <ProtectedRoute>
          <InteractiveReader />
        </ProtectedRoute>
      } />
      <Route path="/auth" element={<AuthPage />} />
    </Routes>
  );
}

export default App;