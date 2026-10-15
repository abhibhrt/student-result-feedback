import { useState } from 'react';
import API from '../../../api/axiosClient';
import Modal from '../../common/Modal';

export default function DepartmentModal({ isOpen, onClose, onRefresh }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/department', { name });
      setName('');
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Academic Department">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Department Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Computer Science & Engineering"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
        >
          {loading ? 'Saving...' : 'Add Department'}
        </button>
      </form>
    </Modal>
  );
}