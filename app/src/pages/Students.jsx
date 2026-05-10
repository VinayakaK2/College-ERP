import React, { useState, useEffect } from 'react';
import { studentApi } from '../api/students';
import { classApi } from '../api/classes';
import { useAuth } from '../context/AuthContext';
import {
  Search, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, User, Phone, Mail, MapPin
} from 'lucide-react';

const Students = () => {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '', rollNumber: '', name: '', classId: '', sectionId: '',
    fatherName: '', motherName: '', phone: '', email: '', address: '',
    admissionYear: new Date().getFullYear(), dob: ''
  });
  const [error, setError] = useState('');
  const [viewStudent, setViewStudent] = useState(null);

  useEffect(() => {
    loadData();
    loadClasses();
  }, [page, search, selectedClass, selectedSection]);

  const loadData = async () => {
    try {
      const res = await studentApi.getStudents({
        page, limit: 10, search, classId: selectedClass, sectionId: selectedSection
      });
      setStudents(res.data?.students || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await classApi.getClasses();
      setClasses(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getSections = () => {
    const cls = classes.find(c => c.id === selectedClass);
    return cls?.sections || [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await studentApi.updateStudent(editing.id, formData);
      } else {
        await studentApi.createStudent(formData);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save student');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this student?')) return;
    try {
      await studentApi.deleteStudent(id);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete student');
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '', rollNumber: '', name: '', classId: '', sectionId: '',
      fatherName: '', motherName: '', phone: '', email: '', address: '',
      admissionYear: new Date().getFullYear(), dob: ''
    });
  };

  const openEdit = (student) => {
    setEditing(student);
    setFormData({
      studentId: student.studentId,
      rollNumber: student.rollNumber,
      name: student.name,
      classId: student.classId,
      sectionId: student.sectionId,
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      admissionYear: student.admissionYear,
      dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : ''
    });
    setShowForm(true);
  };

  const viewDetails = async (student) => {
    try {
      const res = await studentApi.getStudent(student.id);
      setViewStudent(res.data);
    } catch (err) {
      setError('Failed to load student details');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(true); setEditing(null); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, ID, roll number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <select
          value={selectedClass}
          onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={selectedSection}
          onChange={(e) => { setSelectedSection(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        >
          <option value="">All Sections</option>
          {getSections().map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
        </select>
      </div>

      {/* Student Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input type="text" required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number *</label>
                <input type="text" required value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value, sectionId: ''})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                <select required value={formData.sectionId} onChange={e => setFormData({...formData, sectionId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="">Select Section</option>
                  {classes.find(c => c.id === formData.classId)?.sections?.map(s =>
                    <option key={s.id} value={s.id}>Section {s.name}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                <input type="text" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                <input type="text" value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Year *</label>
                <input type="number" required value={formData.admissionYear} onChange={e => setFormData({...formData, admissionYear: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {viewStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Student Details</h2>
              <button onClick={() => setViewStudent(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{viewStudent.name}</p>
                  <p className="text-sm text-gray-500">{viewStudent.studentId} &middot; Roll: {viewStudent.rollNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Class</span><p className="font-medium">{viewStudent.class?.name} - {viewStudent.section?.name}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Status</span><p className="font-medium">{viewStudent.status}</p></div>
                {viewStudent.fatherName && <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Father</span><p className="font-medium">{viewStudent.fatherName}</p></div>}
                {viewStudent.motherName && <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Mother</span><p className="font-medium">{viewStudent.motherName}</p></div>}
                {viewStudent.phone && <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Phone</span><p className="font-medium">{viewStudent.phone}</p></div>}
                {viewStudent.email && <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Email</span><p className="font-medium">{viewStudent.email}</p></div>}
                <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Admission Year</span><p className="font-medium">{viewStudent.admissionYear}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Attendance</span><p className="font-medium">{viewStudent._count?.attendance || 0} records</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">No students found</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.studentId}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => viewDetails(s)} className="text-sm font-medium text-blue-600 hover:underline">
                        {s.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.class?.name} - {s.section?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.rollNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        s.status === 'INACTIVE' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isAdmin && <>
                          <button onClick={() => openEdit(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
