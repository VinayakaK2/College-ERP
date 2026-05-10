import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../api/attendance';
import { classApi } from '../api/classes';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, Save, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present', color: 'bg-green-500' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-500' },
  { value: 'LATE', label: 'Late', color: 'bg-yellow-500' },
  { value: 'MEDICAL_LEAVE', label: 'Medical', color: 'bg-purple-500' },
];

const Attendance = () => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('mark');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadStudents();
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (viewMode === 'view') {
      loadAttendanceRecords();
    }
  }, [viewMode, selectedClass, selectedSection, selectedDate]);

  const loadClasses = async () => {
    try {
      const res = await classApi.getClasses();
      setClasses(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await classApi.getStudents(selectedClass, selectedSection);
      setStudents(res.data || []);
      setRecords((res.data || []).map(s => ({
        studentId: s.id,
        status: 'PRESENT',
        remarks: ''
      })));
    } catch (err) {
      setError('Failed to load students');
    }
  };

  const loadAttendanceRecords = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await attendanceApi.getAttendance({
        classId: selectedClass,
        sectionId: selectedSection,
        date: selectedDate,
        limit: 50
      });
      const existingRecords = res.data?.records || [];
      if (existingRecords.length > 0) {
        setRecords(existingRecords.map(r => ({
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks || '',
          id: r.id
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSections = () => {
    const cls = classes.find(c => c.id === selectedClass);
    return cls?.sections || [];
  };

  const getSubjects = () => {
    const cls = classes.find(c => c.id === selectedClass);
    return cls?.subjects?.map(cs => cs.subject) || [];
  };

  const updateStatus = (studentId, status) => {
    setRecords(prev => prev.map(r =>
      r.studentId === studentId ? { ...r, status } : r
    ));
  };

  const updateRemarks = (studentId, remarks) => {
    setRecords(prev => prev.map(r =>
      r.studentId === studentId ? { ...r, remarks } : r
    ));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSection) {
      setError('Please select class and section');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await attendanceApi.markAttendance({
        records,
        classId: selectedClass,
        sectionId: selectedSection,
        subjectId: selectedSubject || undefined,
        date: selectedDate
      });
      setSuccess('Attendance saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'PRESENT').length,
    absent: records.filter(r => r.status === 'ABSENT').length,
    late: records.filter(r => r.status === 'LATE').length,
    medical: records.filter(r => r.status === 'MEDICAL_LEAVE').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('mark')}
            className={`px-3 py-2 rounded-lg text-sm ${viewMode === 'mark' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            Mark
          </button>
          <button onClick={() => setViewMode('view')}
            className={`px-3 py-2 rounded-lg text-sm ${viewMode === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            View
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
              <option value="">Select Section</option>
              {getSections().map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subject (Optional)</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
              <option value="">General</option>
              {getSubjects().map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-700' },
            { label: 'Present', value: stats.present, color: 'bg-green-100 text-green-700' },
            { label: 'Absent', value: stats.absent, color: 'bg-red-100 text-red-700' },
            { label: 'Late', value: stats.late, color: 'bg-yellow-100 text-yellow-700' },
            { label: 'Medical', value: stats.medical, color: 'bg-purple-100 text-purple-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-lg p-3 text-center`}>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Table */}
      {selectedClass && selectedSection ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">No students in this class/section</td></tr>
                ) : (
                  students.map((student) => {
                    const record = records.find(r => r.studentId === student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{student.rollNumber}</td>
                        <td className="px-4 py-3 text-sm">{student.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {STATUS_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => updateStatus(student.id, opt.value)}
                                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                  record?.status === opt.value
                                    ? `${opt.color} text-white`
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={record?.remarks || ''}
                            onChange={e => updateRemarks(student.id, e.target.value)}
                            placeholder="Optional"
                            className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {students.length > 0 && (
            <div className="p-4 border-t">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
          <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Select a class and section to mark attendance</p>
        </div>
      )}
    </div>
  );
};

export default Attendance;
