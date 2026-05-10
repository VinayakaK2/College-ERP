import React, { useState, useEffect } from 'react';
import { teacherApi } from '../api/teacher';
import { Users, FileText, CalendarCheck, BookOpen, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TeacherDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await teacherApi.getDashboard();
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

  const stats = data?.stats || {};
  const teacher = data?.teacher;

  const performanceData = [
    { subject: 'Math', avg: 82 },
    { subject: 'Phy', avg: 78 },
    { subject: 'Chem', avg: 85 },
    { subject: 'Bio', avg: 76 },
    { subject: 'CS', avg: 90 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
      </div>

      {/* Teacher Info */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{teacher?.user?.name || 'Teacher'}</h2>
            <p className="text-sm text-gray-500">
              {teacher?.subject?.name} &middot; {teacher?.class?.name} {teacher?.section?.name}
            </p>
            <p className="text-xs text-gray-400">{teacher?.employeeId}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Students', value: stats.totalStudents || 0, icon: Users, color: 'bg-blue-500' },
          { label: 'Marks Entered', value: stats.recentMarks || 0, icon: FileText, color: 'bg-green-500' },
          { label: "Today's Attendance", value: stats.todayAttendance || 0, icon: CalendarCheck, color: 'bg-purple-500' },
          { label: 'Subjects', value: stats.totalSubjects || 0, icon: BookOpen, color: 'bg-orange-500' },
        ].map((card) => {
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

      {/* Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Subject Performance Overview</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avg" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TeacherDashboard;
