import React, { useState, useEffect } from 'react';
import { announcementApi } from '../api/announcements';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Bell, AlertTriangle, Info, Megaphone, Calendar } from 'lucide-react';

const PRIORITY_CONFIG = {
  LOW: { color: 'bg-gray-100 text-gray-700', icon: Info },
  NORMAL: { color: 'bg-blue-100 text-blue-700', icon: Bell },
  HIGH: { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  URGENT: { color: 'bg-red-100 text-red-700', icon: Megaphone },
};

const Announcements = () => {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', audience: 'ALL', priority: 'NORMAL', expiryDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await announcementApi.getAnnouncements({ limit: 50 });
      setAnnouncements(res.data?.announcements || []);
    } catch (err) {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await announcementApi.createAnnouncement({
        ...formData,
        expiryDate: formData.expiryDate || null
      });
      setShowForm(false);
      setFormData({ title: '', description: '', audience: 'ALL', priority: 'NORMAL', expiryDate: '' });
      setSuccess('Announcement created');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await announcementApi.deleteAnnouncement(id);
      setSuccess('Announcement deleted');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError('Failed to delete');
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">New Announcement</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Title *</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Description *</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={4} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Audience</label>
                  <select value={formData.audience} onChange={e => setFormData({...formData, audience: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="ALL">All</option>
                    <option value="STUDENTS">Students</option>
                    <option value="TEACHERS">Teachers</option>
                    <option value="PARENTS">Parents</option>
                  </select></div>
                <div><label className="block text-sm font-medium mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Expiry Date (Optional)</label>
                <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No announcements</p>
          </div>
        ) : (
          announcements.map((a) => {
            const config = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.NORMAL;
            const Icon = config.icon;
            return (
              <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800">{a.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.description}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${config.color}`}>{a.priority}</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{a.audience}</span>
                          <span className="text-gray-400">by {a.user?.name}</span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDelete(a.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-2">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Announcements;
