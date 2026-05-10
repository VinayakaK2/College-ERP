import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, CalendarCheck, FileText,
  DollarSign, Bell, BarChart3, LogOut, Menu, X, GraduationCap,
  School, UserCircle
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin, isTeacher, isParent } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavItems = () => {
    if (isAdmin) {
      return [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/students', label: 'Students', icon: Users },
        { path: '/classes', label: 'Classes', icon: School },
        { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
        { path: '/marks', label: 'Marks', icon: FileText },
        { path: '/fees', label: 'Fees', icon: DollarSign },
        { path: '/announcements', label: 'Announcements', icon: Bell },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
      ];
    }
    if (isTeacher) {
      return [
        { path: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/students', label: 'Students', icon: Users },
        { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
        { path: '/marks', label: 'Marks', icon: FileText },
        { path: '/announcements', label: 'Announcements', icon: Bell },
      ];
    }
    if (isParent) {
      return [
        { path: '/parent', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/announcements', label: 'Announcements', icon: Bell },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">College ERP</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-800">College ERP</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
