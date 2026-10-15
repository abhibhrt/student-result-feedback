import { useState } from 'react';
import API from '../../../api/axiosClient';
import Modal from '../../common/Modal';

export default function TeacherModal({ isOpen, onClose, lookups, onRefresh }) {
  const [form, setForm] = useState({ name: '', empid: '', email: '', password: '', phoneno: '', department_id: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/teacher', {
        ...form,
        department_id: parseInt(form.department_id)
      });
      setForm({ name: '', empid: '', email: '', password: '', phoneno: '', department_id: '' });
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to onboard teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Onboard Faculty Member">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
        <div className="grid grid-cols-2 gap-3">
          <input type="text" placeholder="Employee ID" required value={form.empid} onChange={e => setForm({...form, empid: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
          <input type="text" placeholder="Phone" value={form.phoneno} onChange={e => setForm({...form, phoneno: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
        </div>
        <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
        <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
        <select required value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100">
          <option value="">-- Choose Department --</option>
          {lookups.departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition mt-2">
          {loading ? 'Creating...' : 'Enroll Faculty'}
        </button>
      </form>
    </Modal>
  );
}