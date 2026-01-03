import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import BulkIntakePage from "./pages/BulkIntakePage";
import ReviewPage from "./pages/ReviewPage";
import ContentPage from "./pages/ContentPage";

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
      }}
    >
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/intake" replace />} />

          <Route path="/intake" element={<BulkIntakePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/review/:contentId" element={<ReviewPage />} />
          <Route path="/content" element={<ContentPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
