import { useState } from 'react';
import API from '../../../api/axiosClient';
import Modal from '../../common/Modal';

export default function InitExamModal({ isOpen, onClose, lookups }) {
  const [deptId, setDeptId] = useState('');
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/admin/exam/initialize', {
        department_id: parseInt(deptId),
        semester: parseInt(semester)
      });
      alert(res.data.message);
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to initialize exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initialize Semester Batch Exam">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Target Department</label>
          <select
            required
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100"
          >
            <option value="">-- Select Department --</option>
            {lookups.departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Semester</label>
          <input
            type="number"
            min={1}
            max={8}
            required
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100"
          />
        </div>

        <p className="text-[11px] text-slate-400 leading-normal bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          This enrolls all active students in this cohort across all department semester subjects with blank marks ready for faculty grading.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
        >
          {loading ? 'Initializing Roster...' : 'Generate Exam Cohort'}
        </button>
      </form>
    </Modal>
  );
}