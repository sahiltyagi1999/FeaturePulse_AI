import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { JobProvider } from './contexts/JobContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AddAppPage from './pages/AddAppPage';
import AppDetailPage from './pages/AppDetailPage';
import { ProgressModal } from './components/ProgressModal/ProgressModal';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <JobProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/apps/new" element={<ProtectedRoute><AddAppPage /></ProtectedRoute>} />
            <Route path="/apps/:id" element={<ProtectedRoute><AppDetailPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <ProgressModal />
        </JobProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
