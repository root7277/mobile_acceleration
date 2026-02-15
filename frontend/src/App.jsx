import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import Certificates from './pages/Certificates';
import CertificateView from './pages/CertificateView';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminEnrollments from './pages/admin/AdminEnrollments';
import Statistics from './pages/admin/Statistics';
import LessonListPage from './pages/LessonListPage';
import LessonPlayerPage from './pages/LessonPlayerPage';
import LessonListAdminPage from './pages/admin/LessonListAdminPage';
import LessonFormAdminPage from './pages/admin/LessonFormAdminPage';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !['admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/certificate/verify/:code" element={<CertificateView />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:courseId" element={<CourseDetails />} />
        <Route path="courses/:courseId/lessons" element={<LessonListPage />} />
        <Route path="courses/:courseId/lessons/:lessonId" element={<LessonPlayerPage />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/courses" element={<ProtectedRoute adminOnly><AdminCourses /></ProtectedRoute>} />
        <Route path="admin/courses/:courseId/lessons" element={<ProtectedRoute adminOnly><LessonListAdminPage /></ProtectedRoute>} />
        <Route path="admin/courses/:courseId/lessons/new" element={<ProtectedRoute adminOnly><LessonFormAdminPage /></ProtectedRoute>} />
        <Route path="admin/courses/:courseId/lessons/:lessonId/edit" element={<ProtectedRoute adminOnly><LessonFormAdminPage /></ProtectedRoute>} />
        <Route path="admin/enrollments" element={<ProtectedRoute adminOnly><AdminEnrollments /></ProtectedRoute>} />
        <Route path="admin/statistics" element={<ProtectedRoute adminOnly><Statistics /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
