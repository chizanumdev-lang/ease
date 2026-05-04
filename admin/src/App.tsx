import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client/react';
import { client } from './lib/apollo';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserAnalytics from './pages/UserAnalytics';
import VideoLibrary from './pages/VideoLibrary';
import SystemHealth from './pages/SystemHealth';

import { WorkflowBuilder } from './modules/workflow/components/WorkflowBuilder';
import { Settings } from './modules/settings/Settings';

function App() {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UserAnalytics />} />
                <Route path="/content" element={<VideoLibrary />} />
                <Route path="/health" element={<SystemHealth />} />
                <Route path="/workflow" element={<WorkflowBuilder />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ApolloProvider>
  );
}


export default App;
