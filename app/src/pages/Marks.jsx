import React, { useState, useEffect } from 'react';
import { marksApi } from '../api/marks';
import { classApi } from '../api/classes';
import { adminApi } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, X, Search, TrendingUp, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Marks = () => {
  const { isAdmin } = useAuth();
  const [marks, setMarks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewRanking, setViewRanking] = useState(false);
  const [rankings, setRankings] = useState([]);

  const [filters, setFilters] = useState({ classId: '', subjectId: '', examType: '', search: '' });
  const [formData, setFormData] = useState({
    studentId: '', subjectId: '', examType: 'THEORY', testName: '', marks: '', maxMarks: 100, remarks: ''
  });

  useEffect(() => {
    loadData();
    loadClasses();
    loadSubjects();
  }, []);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const params = { limit: 50 };
      if (filters.classId) params.classId = filters.classId;
      if (filters.subjectId) params.subjectId = filters.subjectId;
      if (filters.examType) params.examType = filters.examType;
      const res = await marksApi.getMarks(params);
      setMarks(res.data?.marks || []);
    } catch (err) {
      setError('Failed to load marks');
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

  const loadSubjects = async () => {
    try {
      const res = await adminApi.getSubjects();
      setSubjects(res.data || []);
    } catch (err) { console.error(err); }
  };

  const loadStudents = async (classId) => {
    if (!classId) return;
    try {
      const res = await classApi.getStudents(classId);
      setStudents(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await marksApi.createMark({
        ...formData,
        marks: parseFloat(formData.marks),
        maxMarks: parseInt(formData.maxMarks)
      });
      setShowForm(false);
      setFormData({ studentId: '', subjectId: '', examType: 'THEORY', testName: '', marks: '', maxMarks: 100, remarks: '' });
      setSuccess('Marks saved successfully');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save marks');
    }
  };

  const loadRankings = async () => {
    if (!filters.classId) {
      setError('Select a class to view rankings');
      return;
    }
    try {
      const res = await marksApi.getClassRanking(filters.classId, { subjectId: filters.subjectId, examType: filters.examType });
      setRankings(res.data || []);
      setViewRanking(true);
    } catch (err) {
      setError('Failed to load rankings');
    }
  };

  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || id;

  const avgMarks = marks.length > 0
    ? (marks.reduce((s, m) => s + (m.marks / m.maxMarks) * 100, 0) / marks.length).toFixed(1)
    : 0;

  const chartData = marks.slice(0, 20).map(m => ({
    name: m.student?.name?.split(' ')[0] || 'Student',
    marks: (m.marks / m.maxMarks) * 100,
    subject: getSubjectName(m.subjectId)
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Marks Management</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Enter Marks
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Total Entries</p><p className="text-2xl font-bold text-gray-800">{marks.length}</p></div>
            <div className="bg-blue-500 p-3 rounded-lg"><FileText className="w-6 h-6 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Average</p><p className="text-2xl font-bold text-gray-800">{avgMarks}%</p></div>
            <div className="bg-green-500 p-3 rounded-lg"><TrendingUp className="w-6 h-6 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Top Score</p><p className="text-2xl font-bold text-gray-800">
              {marks.length > 0 ? Math.max(...marks.map(m => (m.marks / m.maxMarks) * 100)).toFixed(0) : 0}%
            </p></div>
            <div className="bg-orange-500 p-3 rounded-lg"><Award className="w-6 h-6 text-white" /></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={filters.classId} onChange={e => setFilters({...filters, classId: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.subjectId} onChange={e => setFilters({...filters, subjectId: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filters.examType} onChange={e => setFilters({...filters, examType: e.target.value})}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
            <option value="">All Types</option>
            <option value="THEORY">Theory</option>
            <option value="COMPETITIVE">Competitive</option>
          </select>
          <input type="text" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}
            placeholder="Search..."
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          <button onClick={loadRankings}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
            View Rankings
          </button>
        </div>
      </div>

      {/* Add Marks Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Enter Marks</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <select onChange={e => loadStudents(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Student *</label>
                <select required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.rollNumber} - {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <select required value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exam Type *</label>
                <select required value={formData.examType} onChange={e => setFormData({...formData, examType: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="THEORY">Theory</option>
                  <option value="COMPETITIVE">Competitive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Test Name *</label>
                <input type="text" required value={formData.testName} onChange={e => setFormData({...formData, testName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g. Unit Test 1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Marks *</label>
                  <input type="number" required value={formData.marks} onChange={e => setFormData({...formData, marks: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    min="0" step="0.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Marks *</label>
                  <input type="number" required value={formData.maxMarks} onChange={e => setFormData({...formData, maxMarks: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    min="1" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <input type="text" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Optional" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rankings Modal */}
      {viewRanking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Class Rankings</h2>
              <button onClick={() => setViewRanking(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {rankings.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No data for rankings</p>
              ) : (
                <div className="space-y-2">
                  {rankings.map((r, i) => (
                    <div key={r.id} className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? 'bg-yellow-50' : i === 1 ? 'bg-gray-50' : i === 2 ? 'bg-orange-50' : 'bg-white border'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>{r.rank}</div>
                      <div className="flex-1"><p className="font-medium text-sm">{r.name}</p><p className="text-xs text-gray-500">{r.subjectCount} subjects</p></div>
                      <div className="text-right"><p className="font-bold text-sm">{r.percentage}%</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Marks Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Bar dataKey="marks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Marks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {marks.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">No marks records</td></tr>
              ) : (
                marks.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{m.student?.name}</td>
                    <td className="px-4 py-3 text-sm">{m.subject?.name}</td>
                    <td className="px-4 py-3 text-sm">{m.testName}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${
                      m.examType === 'THEORY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>{m.examType}</span></td>
                    <td className="px-4 py-3 text-sm font-medium">{m.marks}/{m.maxMarks}</td>
                    <td className="px-4 py-3 text-sm">{((m.marks/m.maxMarks)*100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Marks;
