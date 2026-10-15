import { useState, useEffect, useMemo, useRef } from 'react';
import API from '../../api/axiosClient';
import DepartmentModal from './forms/DepartmentModal';
import SubjectModal from './forms/SubjectModal';
import TeacherModal from './forms/TeacherModal';
import StudentModal from './forms/StudentModal';
import InitExamModal from './forms/InitExamModal';

const SEMESTERS = [1, 2, 3, 4, 5, 6];

export default function AdminView({ activeTab }) {
  const [lookups, setLookups] = useState({
    departments: [],
    teachers: [],
    students: [],
    subjects: []
  });
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);

  const [subjectSearch, setSubjectSearch] = useState('');
  const [manageSemFilter, setManageSemFilter] = useState('ALL');
  const [facultySearch, setFacultySearch] = useState('');

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [modals, setModals] = useState({
    dept: false,
    subject: false,
    teacher: false,
    student: false,
    initExam: false
  });

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type, key: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchLookups = async () => {
    try {
      const res = await API.get('/admin/lookups');
      setLookups(res.data);
      if (res.data.departments?.length > 0 && !selectedDept) {
        setSelectedDept(String(res.data.departments[0].id));
      }
    } catch (err) {
      showToast('Failed to load lookup data', 'error');
    }
  };

  useEffect(() => {
    fetchLookups();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handlePublishCohort = async () => {
    if (!selectedDept) return showToast('Select a department first', 'error');
    setPublishing(true);
    setPublishStatus(null);
    try {
      const res = await API.post('/admin/exam/publish', {
        department_id: parseInt(selectedDept, 10),
        semester: parseInt(selectedSem, 10)
      });
      setPublishStatus({ success: true, message: res.data.message });
      showToast(res.data.message || 'Results published successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Publishing prerequisites not met';
      setPublishStatus({
        success: false,
        message: errorMsg,
        pending: err.response?.data?.pendingEntries || []
      });
      showToast(errorMsg, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const selectedDeptObj = useMemo(() => {
    return lookups.departments.find((d) => String(d.id) === String(selectedDept));
  }, [lookups.departments, selectedDept]);

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    return (lookups.subjects || []).filter((s) => {
      const matchesSearch =
        !q ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q) ||
        (s.faculty_name || '').toLowerCase().includes(q);
      const matchesSem =
        manageSemFilter === 'ALL' || Number(s.semester) === Number(manageSemFilter);
      return matchesSearch && matchesSem;
    });
  }, [lookups.subjects, subjectSearch, manageSemFilter]);

  const filteredTeachers = useMemo(() => {
    const q = facultySearch.trim().toLowerCase();
    return (lookups.teachers || []).filter((t) => {
      return (
        !q ||
        (t.name || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q) ||
        (t.empid || '').toLowerCase().includes(q)
      );
    });
  }, [lookups.teachers, facultySearch]);

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

      <div className="p-4 bg-[#111827] border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <button
          onClick={() => setModals({ ...modals, initExam: true })}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
        >
          <span>⚡</span>
          <span>Initialize Exam</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModals({ ...modals, dept: true })}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            + Department
          </button>
          <button
            onClick={() => setModals({ ...modals, subject: true })}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            + Subject
          </button>
          <button
            onClick={() => setModals({ ...modals, teacher: true })}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            + Faculty
          </button>
          <button
            onClick={() => setModals({ ...modals, student: true })}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            + Student
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Semester Cohort Result Publisher
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compile and release semester evaluations with Gemini mentorship notes
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Target:</span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-indigo-300 font-semibold">
                  {selectedDeptObj ? selectedDeptObj.name : 'No Dept'} • Sem {selectedSem}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-6 flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose Department --</option>
                  {lookups.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-6 flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Semester
                </label>
                <div className="flex items-center gap-2.5">
                  {SEMESTERS.map((sem) => {
                    const isActive = selectedSem === sem;
                    return (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setSelectedSem(sem)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
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

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Ensure all teachers have submitted marks before releasing the cohort.
              </div>
              <button
                onClick={handlePublishCohort}
                disabled={publishing || !selectedDept}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20"
              >
                {publishing ? 'Validating & Compiling AI...' : `Publish Sem ${selectedSem} Results`}
              </button>
            </div>
          </div>

          {publishStatus && (
            <div
              className={`p-5 rounded-2xl border text-xs leading-relaxed space-y-3 ${
                publishStatus.success
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              <div className="font-bold text-sm flex items-center gap-2">
                <span>{publishStatus.success ? '✓' : '⚠'}</span>
                <span>{publishStatus.message}</span>
              </div>

              {publishStatus.pending && publishStatus.pending.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-rose-900/50">
                  <div className="font-semibold text-rose-200">
                    Pending Student Mark Submissions ({publishStatus.pending.length}):
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {publishStatus.pending.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-rose-900/30 border border-rose-800/40 p-2.5 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-200 mr-2">
                            {item.student_name}
                          </span>
                          <span className="text-rose-300 font-mono text-[11px]">
                            {item.subject_name}
                          </span>
                        </div>
                        <span className="text-rose-400 text-[11px] font-medium">
                          Faculty: {item.faculty_name || 'Unassigned'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-100">Subjects Directory</h4>
              <span className="text-xs text-slate-400 font-medium">
                {filteredSubjects.length} of {lookups.subjects.length}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <input
                type="text"
                placeholder="Search subject or code..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="w-full sm:flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <select
                value={manageSemFilter}
                onChange={(e) => setManageSemFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Sems</option>
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>
                    Sem {sem}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredSubjects.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic">
                  No matching subjects found.
                </div>
              ) : (
                filteredSubjects.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs flex justify-between items-center transition"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">
                        {s.name}{' '}
                        <span className="text-indigo-400 font-mono text-[11px]">({s.code})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Semester {s.semester} • Faculty:{' '}
                        <span className="text-slate-300 font-medium">
                          {s.faculty_name || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-100">Faculty Directory</h4>
              <span className="text-xs text-slate-400 font-medium">
                {filteredTeachers.length} of {lookups.teachers.length}
              </span>
            </div>

            <input
              type="text"
              placeholder="Search faculty by name, email, or emp id..."
              value={facultySearch}
              onChange={(e) => setFacultySearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredTeachers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic">
                  No matching faculty found.
                </div>
              ) : (
                filteredTeachers.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs flex justify-between items-center transition"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-200">
                        {t.name}{' '}
                        <span className="text-slate-500 font-mono text-[11px]">({t.empid})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{t.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <DepartmentModal
        isOpen={modals.dept}
        onClose={() => setModals({ ...modals, dept: false })}
        onRefresh={fetchLookups}
      />
      <SubjectModal
        isOpen={modals.subject}
        onClose={() => setModals({ ...modals, subject: false })}
        lookups={lookups}
        onRefresh={fetchLookups}
      />
      <TeacherModal
        isOpen={modals.teacher}
        onClose={() => setModals({ ...modals, teacher: false })}
        lookups={lookups}
        onRefresh={fetchLookups}
      />
      <StudentModal
        isOpen={modals.student}
        onClose={() => setModals({ ...modals, student: false })}
        lookups={lookups}
        onRefresh={fetchLookups}
      />
      <InitExamModal
        isOpen={modals.initExam}
        onClose={() => setModals({ ...modals, initExam: false })}
        lookups={lookups}
      />
    </div>
  );
}