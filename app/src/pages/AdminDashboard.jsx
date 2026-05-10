import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import { announcementApi } from '../api/announcements';
import {
  Users, UserCheck, School, GraduationCap, Bell,
  DollarSign, TrendingUp, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, annRes] = await Promise.all([
        adminApi.getDashboard(),
        announcementApi.getAnnouncements({ limit: 5 })
      ]);
      setStats(dashRes.data);
      setAnnouncements(annRes.data?.announcements || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats?.counts?.totalStudents || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Teachers', value: stats?.counts?.totalTeachers || 0, icon: UserCheck, color: 'bg-green-500' },
    { label: 'Classes', value: stats?.counts?.totalClasses || 0, icon: School, color: 'bg-purple-500' },
    { label: 'Parents', value: stats?.counts?.totalParents || 0, icon: GraduationCap, color: 'bg-orange-500' },
    { label: 'Pending Fees', value: stats?.pendingFees || 0, icon: DollarSign, color: 'bg-red-500' },
    { label: "Today's Attendance", value: stats?.todayAttendance || 0, icon: Activity, color: 'bg-teal-500' },
  ];

  const attendanceData = [
    { name: 'Present', value: 85 },
    { name: 'Absent', value: 10 },
    { name: 'Late', value: 3 },
    { name: 'Medical', value: 2 },
  ];

  const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'];

  const performanceData = [
    { name: 'Class 11A', avg: 78 },
    { name: 'Class 11B', avg: 82 },
    { name: 'Class 11C', avg: 75 },
    { name: 'Class 12A', avg: 88 },
    { name: 'Class 12B', avg: 85 },
    { name: 'Class 12C', avg: 80 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Class Performance</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={attendanceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {attendanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {attendanceData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Announcements</h2>
          <Bell className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-sm">No announcements yet</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  a.priority === 'HIGH' ? 'bg-red-500' :
                  a.priority === 'URGENT' ? 'bg-red-600' :
                  a.priority === 'NORMAL' ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(a.createdAt).toLocaleDateString()} &middot; {a.audience}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
