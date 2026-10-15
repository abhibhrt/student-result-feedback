import { useState } from 'react';
import API from '../../../api/axiosClient';
import Modal from '../../common/Modal';

export default function SubjectModal({ isOpen, onClose, lookups, onRefresh }) {
  const [form, setForm] = useState({ name: '', code: '', semester: 1, department_id: '', faculty_id: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/subject', {
        ...form,
        semester: parseInt(form.semester),
        department_id: parseInt(form.department_id),
        faculty_id: form.faculty_id ? parseInt(form.faculty_id) : null
      });
      setForm({ name: '', code: '', semester: 1, department_id: '', faculty_id: '' });
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Curriculum Subject">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Subject Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Operating Systems"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Subject Code</label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. CS501"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Semester</label>
            <input
              type="number"
              min={1}
              max={8}
              required
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Department</label>
          <select
            required
            value={form.department_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100"
          >
            <option value="">-- Choose Department --</option>
            {lookups.departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Assigned Teacher (Taught to all students)</label>
          <select
            required
            value={form.faculty_id}
            onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100"
          >
            <option value="">-- Select Teacher --</option>
            {lookups.teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.empid})</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition mt-2"
        >
          {loading ? 'Creating...' : 'Register Subject'}
        </button>
      </form>
    </Modal>
  );
}