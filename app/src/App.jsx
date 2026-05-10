import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ParentDashboard from './pages/ParentDashboard';
import Students from './pages/Students';
import Classes from './pages/Classes';
import Attendance from './pages/Attendance';
import Marks from './pages/Marks';
import Fees from './pages/Fees';
import Announcements from './pages/Announcements';
import Analytics from './pages/Analytics';
import './App.css';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role) && !allowedRoles.includes('PARENT' && user.isParent)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
    if (user.isParent || user.role === 'PARENT') return <Navigate to="/parent" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const { user } = useAuth();

  const getHomePath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'TEACHER') return '/teacher';
    if (user.isParent || user.role === 'PARENT') return '/parent';
    return '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getHomePath()} replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to={getHomePath()} replace />} />
        <Route path="admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="teacher" element={<ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="parent" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentDashboard /></ProtectedRoute>} />
        <Route path="students" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><Students /></ProtectedRoute>} />
        <Route path="classes" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><Classes /></ProtectedRoute>} />
        <Route path="attendance" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><Attendance /></ProtectedRoute>} />
        <Route path="marks" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><Marks /></ProtectedRoute>} />
        <Route path="fees" element={<ProtectedRoute allowedRoles={['ADMIN']}><Fees /></ProtectedRoute>} />
        <Route path="announcements" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'PARENT']}><Announcements /></ProtectedRoute>} />
        <Route path="analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><Analytics /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
