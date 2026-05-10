import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/analytics';
import { classApi } from '../api/classes';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Award, Activity,
  BarChart3, PieChart as PieIcon, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classAnalytics, setClassAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardAnalytics();
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassAnalytics(selectedClass);
    }
  }, [selectedClass]);

  const loadDashboardAnalytics = async () => {
    try {
      const res = await analyticsApi.getDashboardAnalytics();
      setData(res.data);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await classApi.getClasses();
      setClasses(res.data || []);
    } catch (err) { console.error(err); }
  };

  const loadClassAnalytics = async (classId) => {
    try {
      const res = await analyticsApi.getClassAnalytics(classId);
      setClassAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const fees = data?.fees || {};
  const marks = data?.marks || {};

  const attendanceData = [
    { name: 'Present', value: data?.attendance?.PRESENT || 0 },
    { name: 'Absent', value: data?.attendance?.ABSENT || 0 },
    { name: 'Late', value: data?.attendance?.LATE || 0 },
    { name: 'Medical', value: data?.attendance?.MEDICAL_LEAVE || 0 },
  ];

  const feesByStatus = (fees.byStatus || []).map(f => ({
    name: f.status,
    value: f._count
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: overview.totalStudents || 0, icon: Users, color: 'bg-blue-500', trend: '+12%' },
          { label: 'Active Students', value: overview.activeStudents || 0, icon: Activity, color: 'bg-green-500', trend: '+8%' },
          { label: 'Avg Marks', value: `${marks.averageMarks || 0}%`, icon: Award, color: 'bg-orange-500', trend: '+3%' },
          { label: 'Fees Collected', value: `Rs.${(fees.totalCollected || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-purple-500', trend: '+15%' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                    <div className={`flex items-center gap-0.5 text-xs ${card.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {card.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {card.trend}
                    </div>
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-lg ml-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Attendance Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={attendanceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                {attendanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Fees by Status</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={feesByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class-wise Analytics */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Class-wise Performance</h2>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          >
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {classAnalytics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Students</p>
                <p className="text-2xl font-bold text-blue-800">{classAnalytics.studentCount}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Attendance %</p>
                <p className="text-2xl font-bold text-green-800">{classAnalytics.attendance?.percentage}%</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600">Subjects</p>
                <p className="text-2xl font-bold text-purple-800">{classAnalytics.subjectCount}</p>
              </div>
            </div>

            {classAnalytics.toppers?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Performers</h3>
                <div className="space-y-2">
                  {classAnalytics.toppers.slice(0, 5).map((t, i) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>{i + 1}</div>
                      <div className="flex-1"><p className="text-sm font-medium">{t.name}</p></div>
                      <p className="text-sm font-bold text-blue-600">{t.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {classAnalytics.subjectAverages?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Subject-wise Average</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={classAnalytics.subjectAverages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject.name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="average" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">Select a class to view detailed analytics</p>
        )}
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-gray-500">Total Expected</p>
            <p className="text-xl font-bold text-gray-800">Rs.{(fees.totalExpected || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 border rounded-lg bg-green-50">
            <p className="text-sm text-green-600">Total Collected</p>
            <p className="text-xl font-bold text-green-700">Rs.{(fees.totalCollected || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 border rounded-lg bg-red-50">
            <p className="text-sm text-red-600">Total Pending</p>
            <p className="text-xl font-bold text-red-700">Rs.{(fees.totalPending || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
