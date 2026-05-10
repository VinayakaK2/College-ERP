import React, { useState, useEffect } from 'react';
import { feesApi } from '../api/fees';
import { studentApi } from '../api/students';
import { Plus, X, DollarSign, Search, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({ studentId: '', totalAmount: '', dueDate: '', description: '' });
  const [paymentData, setPaymentData] = useState({ amount: '', method: '', referenceNo: '', notes: '' });

  useEffect(() => {
    loadData();
    loadStudents();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await feesApi.getFees(params);
      setFees(res.data?.fees || []);
    } catch (err) {
      setError('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await studentApi.getStudents({ limit: 100 });
      setStudents(res.data?.students || []);
    } catch (err) { console.error(err); }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    try {
      await feesApi.createFee({
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        dueDate: formData.dueDate || null
      });
      setShowForm(false);
      setFormData({ studentId: '', totalAmount: '', dueDate: '', description: '' });
      setSuccess('Fee record created');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create fee');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await feesApi.recordPayment(showPayment.id, {
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        referenceNo: paymentData.referenceNo,
        notes: paymentData.notes
      });
      setShowPayment(null);
      setPaymentData({ amount: '', method: '', referenceNo: '', notes: '' });
      setSuccess('Payment recorded successfully');
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PARTIAL': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'OVERDUE': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalExpected = fees.reduce((s, f) => s + f.totalAmount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalPending = fees.reduce((s, f) => s + f.remainingAmount, 0);

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
        <h1 className="text-2xl font-bold text-gray-800">Fees Management</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Add Fee
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Total Expected</p><p className="text-xl font-bold text-gray-800">Rs.{totalExpected.toLocaleString()}</p></div>
            <div className="bg-blue-500 p-3 rounded-lg"><DollarSign className="w-5 h-5 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Total Collected</p><p className="text-xl font-bold text-green-700">Rs.{totalPaid.toLocaleString()}</p></div>
            <div className="bg-green-500 p-3 rounded-lg"><CheckCircle className="w-5 h-5 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Pending Amount</p><p className="text-xl font-bold text-red-700">Rs.{totalPending.toLocaleString()}</p></div>
            <div className="bg-red-500 p-3 rounded-lg"><AlertCircle className="w-5 h-5 text-white" /></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="PENDING">Pending</option>
          <option value="OVERDUE">Overdue</option>
        </select>
        <button onClick={loadData}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
          Search
        </button>
      </div>

      {/* Fee Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create Fee Record</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateFee} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Student *</label>
                <select required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.studentId} - {s.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium mb-1">Total Amount (Rs.) *</label>
                <input type="number" required value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" min="1" /></div>
              <div><label className="block text-sm font-medium mb-1">Due Date</label>
                <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g. Annual Tuition Fee" /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <button onClick={() => setShowPayment(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm"><span className="text-gray-500">Student:</span> {showPayment.student?.name}</p>
                <p className="text-sm"><span className="text-gray-500">Total:</span> Rs.{showPayment.totalAmount}</p>
                <p className="text-sm"><span className="text-gray-500">Remaining:</span> <span className="font-bold text-red-600">Rs.{showPayment.remainingAmount}</span></p>
              </div>
              <form onSubmit={handlePayment} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Amount (Rs.) *</label>
                  <input type="number" required value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    min="1" max={showPayment.remainingAmount} /></div>
                <div><label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="">Select</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select></div>
                <div><label className="block text-sm font-medium mb-1">Reference No</label>
                  <input type="text" value={paymentData.referenceNo} onChange={e => setPaymentData({...paymentData, referenceNo: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Notes</label>
                  <input type="text" value={paymentData.notes} onChange={e => setPaymentData({...paymentData, notes: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" /></div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowPayment(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Record Payment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Fees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fees.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">No fee records</td></tr>
              ) : (
                fees.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{f.student?.name}<br/><span className="text-xs text-gray-400">{f.student?.studentId}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{f.description || '-'}</td>
                    <td className="px-4 py-3 text-sm">Rs.{f.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-green-600">Rs.{f.paidAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-red-600">Rs.{f.remainingAmount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusClass(f.status)}`}>
                        {getStatusIcon(f.status)} {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.remainingAmount > 0 && (
                        <button onClick={() => { setShowPayment(f); setPaymentData({ amount: '', method: '', referenceNo: '', notes: '' }); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">
                          <CreditCard className="w-3 h-3" /> Pay
                        </button>
                      )}
                    </td>
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

export default Fees;
