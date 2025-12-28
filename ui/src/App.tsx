import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import BulkIntakePage from "./pages/BulkIntakePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/intake" replace />} />
          <Route path="/intake" element={<BulkIntakePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
