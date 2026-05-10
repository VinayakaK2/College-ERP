import React, { useState, useEffect } from 'react';
import { parentApi } from '../api/parent';
import { useAuth } from '../context/AuthContext';
import {
  User, School, CalendarCheck, FileText, DollarSign,
  TrendingUp, TrendingDown, Award, BookOpen
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const ParentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await parentApi.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error(err);
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

  const student = data?.student;
  const stats = data?.stats;

  const marksData = [
    { test: 'UT1', math: 85, phy: 78, chem: 90 },
    { test: 'UT2', math: 88, phy: 82, chem: 85 },
    { test: 'Mid', math: 92, phy: 88, chem: 87 },
    { test: 'UT3', math: 90, phy: 85, chem: 92 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Parent Portal</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">{student?.name}</h2>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1"><School className="w-4 h-4" /> {student?.class?.name} - Section {student?.section?.name}</span>
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> ID: {student?.studentId}</span>
              <span>Roll: {student?.rollNumber}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-700">{stats?.attendancePercentage}%</p>
              <p className="text-xs text-green-600">Attendance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Attendance', value: `${stats?.attendancePercentage || 0}%`, icon: CalendarCheck, color: 'bg-green-500', sub: `${stats?.totalAttendance || 0} records` },
          { label: 'Total Tests', value: stats?.totalMarks || 0, icon: FileText, color: 'bg-blue-500', sub: 'Marks recorded' },
          { label: 'Fees Paid', value: `Rs.${(stats?.paidFees || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-purple-500', sub: `Pending: Rs.${(stats?.pendingFees || 0).toLocaleString()}` },
          { label: 'Pending Fees', value: `Rs.${(stats?.pendingFees || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-orange-500', sub: 'Due amount' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Marks Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Marks Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={marksData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="test" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="math" stroke="#3b82f6" name="Mathematics" strokeWidth={2} />
            <Line type="monotone" dataKey="phy" stroke="#10b981" name="Physics" strokeWidth={2} />
            <Line type="monotone" dataKey="chem" stroke="#f59e0b" name="Chemistry" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Announcements</h2>
        <div className="space-y-3">
          {(data?.announcements || []).length === 0 ? (
            <p className="text-gray-500 text-sm">No announcements</p>
          ) : (
            data.announcements.map((a) => (
              <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    a.priority === 'HIGH' ? 'bg-red-500' : a.priority === 'URGENT' ? 'bg-red-600' : 'bg-blue-500'
                  }`} />
                  <p className="font-medium text-sm text-gray-800">{a.title}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-4">{a.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
