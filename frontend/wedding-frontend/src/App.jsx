import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import InvitePage from "./pages/InvitePage";
import AdminCheckinPage from "./pages/AdminCheckinPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/invite/:uuid" element={<InvitePage />} />
        <Route path="/admin/checkin" element={<AdminCheckinPage />} />
      </Routes>
    </BrowserRouter>
  );
}