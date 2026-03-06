import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VideoLibrary from './pages/VideoLibrary';
import GoalCategories from './pages/GoalCategories';
import ProgramTemplates from './pages/ProgramTemplates';
import UserAnalytics from './pages/UserAnalytics';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/videos" element={<VideoLibrary />} />
              <Route path="/goals" element={<GoalCategories />} />
              <Route path="/programs" element={<ProgramTemplates />} />
              <Route path="/analytics" element={<UserAnalytics />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
