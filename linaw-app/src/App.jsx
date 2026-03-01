import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import InteractiveReader from './components/Notebook'
import AuthPage from "./pages/AuthPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/notebook/:id" element={<InteractiveReader />} />
      <Route path="/auth" element={<AuthPage />} />
    </Routes>
  );
}

export default App;