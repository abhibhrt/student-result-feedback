import { useEffect, useMemo, useRef, useState } from 'react';
import API from '../../api/axiosClient';

const SEMESTERS = [1, 2, 3, 4, 5, 6];

export default function FacultyView({ activeTab }) {
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [selectedSem, setSelectedSem] = useState(1);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [roster, setRoster] = useState([]);
  const [marksState, setMarksState] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [queries, setQueries] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type, key: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const loadInitialData = async () => {
    try {
      const [deptRes, subRes, qRes] = await Promise.all([
        API.get('/users/teacher/departments'),
        API.get('/users/teacher/subjects'),
        API.get('/users/teacher/queries')
      ]);

      setDepartments(deptRes.data);
      setSubjects(subRes.data);
      setQueries(qRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      const matchesDept =
        selectedDeptId === 'ALL' || String(sub.dept_id) === String(selectedDeptId);
      const matchesSem = Number(sub.semester) === Number(selectedSem);
      return matchesDept && matchesSem;
    });
  }, [subjects, selectedDeptId, selectedSem]);

  useEffect(() => {
    if (filteredSubjects.length > 0) {
      const exists = filteredSubjects.some((s) => s.id === selectedSubject?.id);
      if (!exists) {
        setSelectedSubject(filteredSubjects[0]);
      }
    } else {
      setSelectedSubject(null);
      setRoster([]);
      setMarksState({});
    }
  }, [filteredSubjects, selectedSubject]);

  const loadRoster = async (subjectId) => {
    try {
      const res = await API.get(`/users/teacher/roster/${subjectId}`);
      setRoster(res.data);
      const initial = {};
      res.data.forEach((item) => {
        initial[item.mark_id] = item.mark ?? '';
      });
      setMarksState(initial);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load roster', 'error');
    }
  };

  useEffect(() => {
    if (selectedSubject?.id) {
      loadRoster(selectedSubject.id);
    }
  }, [selectedSubject]);

  const filteredRoster = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return roster.filter((student) => {
      const name = (student.student_name || '').toLowerCase();
      const email = (student.email || '').toLowerCase();
      const matchesSearch = !query || name.includes(query) || email.includes(query);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'GRADED' && student.is_submitted) ||
        (statusFilter === 'MISSING' && !student.is_submitted);

      return matchesSearch && matchesStatus;
    });
  }, [roster, searchQuery, statusFilter]);

  const handleBulkSubmit = async () => {
    if (!selectedSubject) return;

    const payload = Object.keys(marksState)
      .filter((k) => marksState[k] !== '')
      .map((k) => ({
        mark_id: parseInt(k, 10),
        mark: parseFloat(marksState[k])
      }));

    if (payload.length === 0) return showToast('Enter marks first', 'error');

    try {
      const res = await API.put(`/users/teacher/marks/${selectedSubject.id}`, { marks: payload });
      showToast(res.data.message || 'Marks saved');
      loadRoster(selectedSubject.id);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save marks', 'error');
    }
  };

  const handleReply = async (queryId) => {
    const reply = replyInputs[queryId];
    if (!reply) return showToast('Enter response first', 'error');
    try {
      await API.put(`/users/teacher/query-reply/${queryId}`, { response: reply });
      showToast('Response sent');
      const qRes = await API.get('/users/teacher/queries');
      setQueries(qRes.data);
    } catch (err) {
      showToast('Failed to respond', 'error');
    }
  };

  return (
    <div className="space-y-6 relative">
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress-3s {
          animation: shrinkWidth 3s linear forwards;
        }
      `}</style>

      {toast && (
        <div
          key={toast.key}
          className={`fixed top-5 right-5 z-50 overflow-hidden shadow-2xl rounded-xl border backdrop-blur-md px-4 py-3 min-w-[240px] max-w-sm ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3 text-xs font-semibold pb-2">
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white text-sm leading-none"
            >
              ×
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className={`h-full animate-progress-3s ${
                toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="p-5 bg-[#111827] border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex flex-col gap-1.5 min-w-[220px]">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Department
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs font-medium focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Semester
              </label>
              <div className="flex items-center gap-2.5">
                {SEMESTERS.map((sem) => {
                  const isActive = selectedSem === sem;
                  return (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setSelectedSem(sem)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-105'
                          : 'bg-slate-800/90 text-slate-400 hover:text-slate-100 hover:bg-slate-700'
                      }`}
                      title={`Semester ${sem}`}
                    >
                      {sem}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">
                Subjects in Semester {selectedSem}:
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {filteredSubjects.length} found
              </span>
            </div>

            {filteredSubjects.length === 0 ? (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-500 italic text-center">
                No subjects found for Semester {selectedSem} under this department.
              </div>
            ) : (
              <div className="flex gap-2 pb-2 overflow-x-auto">
                {filteredSubjects.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedSubject?.id === sub.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {sub.name} ({sub.code})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Batch Grading:{' '}
                  {selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : 'None'}
                </h3>
                <p className="text-xs text-slate-400">
                  Showing {filteredRoster.length} of {roster.length} enrolled students
                </p>
              </div>
              <button
                onClick={handleBulkSubmit}
                disabled={!selectedSubject || roster.length === 0}
                className="self-start md:self-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/20"
              >
                Save All Marks
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search by student name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                {['ALL', 'GRADED', 'MISSING'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      statusFilter === status
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status === 'GRADED' ? 'Graded' : 'Missing'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Grade Score (100)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredRoster.map((r) => (
                    <tr key={r.mark_id} className="hover:bg-slate-900/50">
                      <td className="py-3 font-medium text-slate-200">{r.student_name}</td>
                      <td className="py-3 text-slate-400">{r.email}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.is_submitted
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {r.is_submitted ? 'Graded' : 'Missing'}
                        </span>
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={marksState[r.mark_id] ?? ''}
                          onChange={(e) =>
                            setMarksState({ ...marksState, [r.mark_id]: e.target.value })
                          }
                          className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                  {filteredRoster.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        {!selectedSubject
                          ? 'Select a subject to display the roster.'
                          : roster.length === 0
                          ? 'No enrolled students found.'
                          : 'No students match your filter criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'queries' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-100 mb-4">Direct Student Doubts</h3>
          {queries.length === 0 ? (
            <p className="text-xs text-slate-400">No doubts assigned to you.</p>
          ) : (
            <div className="space-y-4">
              {queries.map((q) => (
                <div
                  key={q.id}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex justify-between text-slate-400">
                    <span className="font-semibold text-slate-200">
                      {q.student_name} ({q.student_email})
                    </span>
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg text-slate-300 font-mono">
                    {q.query_message}
                  </div>
                  {q.response ? (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-900 rounded-lg text-emerald-300">
                      <strong>Your Reply:</strong> {q.response}
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Write feedback for student..."
                        value={replyInputs[q.id] || ''}
                        onChange={(e) =>
                          setReplyInputs({ ...replyInputs, [q.id]: e.target.value })
                        }
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs"
                      />
                      <button
                        onClick={() => handleReply(q.id)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}