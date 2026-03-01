import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import InteractiveReader from './components/Notebook';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/notebook/:id" element={<InteractiveReader />} />
    </Routes>
  );
}

export default App;