import { useState } from 'react';
import API from '../../../api/axiosClient';
import Modal from '../../common/Modal';

export default function StudentModal({ isOpen, onClose, lookups, onRefresh }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneno: '', curr_sem: 1, year: 1, department_id: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/student', {
        ...form,
        curr_sem: parseInt(form.curr_sem),
        year: parseInt(form.year),
        department_id: parseInt(form.department_id)
      });
      setForm({ name: '', email: '', password: '', phoneno: '', curr_sem: 1, year: 1, department_id: '' });
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enroll student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Student">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
        <input type="email" placeholder="Student Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
        <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
        <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="Sem" min={1} max={8} required value={form.curr_sem} onChange={e => setForm({...form, curr_sem: e.target.value})} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
          <input type="number" placeholder="Year" min={1} max={4} required value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
          <input type="text" placeholder="Phone" value={form.phoneno} onChange={e => setForm({...form, phoneno: e.target.value})} className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100" />
        </div>
        <select required value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100">
          <option value="">-- Choose Department --</option>
          {lookups.departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition mt-2">
          {loading ? 'Registering...' : 'Enroll Student'}
        </button>
      </form>
    </Modal>
  );
}