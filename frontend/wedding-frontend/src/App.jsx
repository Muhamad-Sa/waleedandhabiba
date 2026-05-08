import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import InvitePage from "./pages/InvitePage";
import AdminCheckinPage from "./pages/AdminCheckinPage";
import InvitationGeneratorPage from "./pages/InvitationGeneratorPage";
import QRAdminPage from "./pages/QRAdminPage";
import ScanPage from "./pages/ScanPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/invite/:uuid" element={<InvitePage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/generator" element={<InvitationGeneratorPage />} />
        <Route path="/admin/qr" element={<QRAdminPage />} />
        <Route path="/scanner" element={<AdminCheckinPage />} />
        <Route path="/admin/checkin" element={<AdminCheckinPage />} />
      </Routes>
    </BrowserRouter>
  );
}
