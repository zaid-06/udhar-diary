import { Navigate, Route, Routes } from "react-router-dom";
import { BusinessRouteGuard } from "@/shared/guards/BusinessRouteGuard";
import { ProtectedRoute } from "@/shared/guards/ProtectedRoute";
import { CreateBusinessPage } from "@/pages/CreateBusinessPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { BusinessRoutes } from "@/routes/business-routes";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/business/create"
        element={
          <BusinessRouteGuard requireBusiness={false}>
            <CreateBusinessPage />
          </BusinessRouteGuard>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <BusinessRouteGuard>
              <BusinessRoutes />
            </BusinessRouteGuard>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

