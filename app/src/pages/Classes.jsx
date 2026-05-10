import React, { useState, useEffect } from 'react';
import { classApi } from '../api/classes';
import { adminApi } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Users, ChevronRight, School, BookOpen, UserCheck } from 'lucide-react';

const Classes = () => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [expandedClass, setExpandedClass] = useState(null);
  const [error, setError] = useState('');

  const [classForm, setClassForm] = useState({ name: '', level: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', classId: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', maxMarks: 100 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clsRes, subRes] = await Promise.all([
        classApi.getClasses(),
        adminApi.getSubjects()
      ]);
      setClasses(clsRes.data || []);
      setSubjects(subRes.data || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await classApi.createClass(classForm);
      setShowClassForm(false);
      setClassForm({ name: '', level: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await classApi.createSection(sectionForm);
      setShowSectionForm(false);
      setSectionForm({ name: '', classId: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createSubject(subjectForm);
      setShowSubjectForm(false);
      setSubjectForm({ name: '', code: '', maxMarks: 100 });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleExpand = (id) => {
    setExpandedClass(expandedClass === id ? null : id);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Classes & Sections</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowSubjectForm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
              <BookOpen className="w-4 h-4" /> Subject
            </button>
            <button onClick={() => setShowSectionForm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
              <Plus className="w-4 h-4" /> Section
            </button>
            <button onClick={() => setShowClassForm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <Plus className="w-4 h-4" /> Class
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Subject Form */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Subject</h2>
              <button onClick={() => setShowSubjectForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Subject Name *</label>
                <input type="text" required value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Code *</label>
                <input type="text" required value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowSubjectForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Form */}
      {showSectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Section</h2>
              <button onClick={() => setShowSectionForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateSection} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Class *</label>
                <select required value={sectionForm.classId} onChange={e => setSectionForm({...sectionForm, classId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="">Select</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium mb-1">Section Name *</label>
                <input type="text" required value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="A, B, C..." /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowSectionForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Form */}
      {showClassForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Class</h2>
              <button onClick={() => setShowClassForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateClass} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Class Name *</label>
                <input type="text" required value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="Class 11" /></div>
              <div><label className="block text-sm font-medium mb-1">Level *</label>
                <input type="number" required value={classForm.level} onChange={e => setClassForm({...classForm, level: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="11" /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowClassForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subjects List */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Subjects ({subjects.length})</h2>
        <div className="flex flex-wrap gap-2">
          {subjects.map(s => (
            <span key={s.id} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> {s.name} ({s.code})
            </span>
          ))}
        </div>
      </div>

      {/* Classes List */}
      <div className="space-y-3">
        {classes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No classes found</p>
        ) : (
          classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => toggleExpand(cls.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <School className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">{cls.name}</p>
                    <p className="text-xs text-gray-500">Level {cls.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {cls._count?.students || 0}</span>
                    <span className="flex items-center gap-1"><UserCheck className="w-4 h-4" /> {cls._count?.teachers || 0}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {cls.subjects?.length || 0}</span>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedClass === cls.id ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {expandedClass === cls.id && (
                <div className="border-t px-4 pb-4">
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cls.sections?.map(section => (
                      <div key={section.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">Section {section.name}</p>
                          <span className="text-xs text-gray-500">{section._count?.students || 0} students</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {cls.teachers?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Assigned Teachers</p>
                      <div className="flex flex-wrap gap-2">
                        {cls.teachers.map(t => (
                          <span key={t.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {t.user?.name} ({t.subject?.name})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Classes;
