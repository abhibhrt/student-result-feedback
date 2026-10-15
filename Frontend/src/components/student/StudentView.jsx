import { useEffect, useMemo, useRef, useState } from 'react';
import API from '../../api/axiosClient';
import AiFeedbackCard from './AiFeedbackCard';

const SEMESTERS = [1, 2, 3, 4, 5, 6];

export default function StudentView({ activeTab }) {
  const [results, setResults] = useState([]);
  const [queries, setQueries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [selectedSem, setSelectedSem] = useState(1);

  const [targetType, setTargetType] = useState('AI');
  const [messageText, setMessageText] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [aiResultId, setAiResultId] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [aiConversations, setAiConversations] = useState([]);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type, key: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const loadData = async () => {
    try {
      const [resData, qData, teachersRes] = await Promise.all([
        API.get('/users/student/results'),
        API.get('/users/student/queries'),
        API.get('/users/student/teachers')
      ]);
      setResults(resData.data || []);
      setQueries(qData.data || []);
      setTeachers(teachersRes.data || []);
    } catch (err) {
      showToast('Error loading student records', 'error');
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const activeResult = useMemo(() => {
    return results.find((r) => Number(r.semester) === Number(selectedSem));
  }, [results, selectedSem]);

  const unifiedHistory = useMemo(() => {
    const facultyItems = queries.map((q) => ({
      id: `faculty-${q.id}`,
      type: 'FACULTY',
      targetName: q.faculty_name,
      question: q.query_message,
      response: q.response,
      createdAt: q.created_at ? new Date(q.created_at).getTime() : 0,
      dateLabel: q.created_at ? new Date(q.created_at).toLocaleDateString() : ''
    }));

    const all = [...facultyItems, ...aiConversations];
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }, [queries, aiConversations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed) return showToast('Type a message first', 'error');

    if (targetType === 'FACULTY') {
      if (!facultyId) return showToast('Select a professor', 'error');
      setLoadingSubmit(true);
      try {
        await API.post('/users/student/ask-teacher', {
          faculty_id: parseInt(facultyId, 10),
          query_message: trimmed
        });
        showToast('Query sent to professor');
        setMessageText('');
        setFacultyId('');
        const qData = await API.get('/users/student/queries');
        setQueries(qData.data || []);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to send query', 'error');
      } finally {
        setLoadingSubmit(false);
      }
    } else {
      setLoadingSubmit(true);
      try {
        const res = await API.post('/users/student/ask-ai', {
          question: trimmed,
          resultId: aiResultId ? parseInt(aiResultId, 10) : null
        });

        const newAiChat = {
          id: `ai-${Date.now()}`,
          type: 'AI',
          targetName: 'Gemini AI Tutor',
          question: trimmed,
          response: res.data.response,
          createdAt: Date.now(),
          dateLabel: new Date().toLocaleDateString()
        };

        setAiConversations((prev) => [newAiChat, ...prev]);
        setMessageText('');
        showToast('AI response received');
      } catch (err) {
        showToast('AI assistant is busy. Please try again', 'error');
      } finally {
        setLoadingSubmit(false);
      }
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

      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="p-5 bg-[#111827] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Select Semester
              </span>
              <p className="text-xs text-slate-500 mt-0.5">Toggle to view respective report cards</p>
            </div>
            <div className="flex items-center gap-2.5">
              {SEMESTERS.map((sem) => {
                const isActive = selectedSem === sem;
                const hasResult = results.some((r) => Number(r.semester) === sem);
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSem(sem)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all relative ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-105'
                        : 'bg-slate-800/90 text-slate-400 hover:text-slate-100 hover:bg-slate-700'
                    }`}
                    title={`Semester ${sem}`}
                  >
                    {sem}
                    {hasResult && !isActive && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {loadingInitial ? (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-300">
                Hold on, we are loading your results...
              </p>
            </div>
          ) : !activeResult ? (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-xs">
              No examination report published for Semester {selectedSem} yet.
            </div>
          ) : (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Semester {activeResult.semester} Report Card
                  </h3>
                  <p className="text-xs text-slate-400">{activeResult.department_name}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold rounded-full uppercase">
                  Published
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <th className="pb-3">Subject</th>
                      <th className="pb-3">Code</th>
                      <th className="pb-3">Score (100)</th>
                      <th className="pb-3">Faculty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {activeResult.marks?.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-3 font-semibold text-slate-200">{m.subject}</td>
                        <td className="py-3 text-slate-400">{m.code}</td>
                        <td className="py-3 font-bold">
                          <span className={m.mark < 60 ? 'text-rose-400' : 'text-emerald-400'}>
                            {m.mark}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{m.faculty_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <AiFeedbackCard text={activeResult.ai_feedback} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'doubts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Ask a Question</h3>
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetType('AI')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    targetType === 'AI'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AI Tutor
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('FACULTY')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    targetType === 'FACULTY'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Faculty
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {targetType === 'FACULTY' ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Faculty
                  </label>
                  <select
                    required
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Professor --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Context (Optional)
                  </label>
                  <select
                    value={aiResultId}
                    onChange={(e) => setAiResultId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- No specific result context --</option>
                    {results.map((r) => (
                      <option key={r.id} value={r.id}>
                        Semester {r.semester} Report Context
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    targetType === 'FACULTY'
                      ? 'Ask your professor about lectures, syllabus, or grades...'
                      : 'Ask AI tutor to explain a topic, plan a study schedule, or solve doubt...'
                  }
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loadingSubmit}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/20"
              >
                {loadingSubmit
                  ? targetType === 'AI'
                    ? 'AI is thinking...'
                    : 'Delivering...'
                  : targetType === 'AI'
                  ? 'Send to AI Tutor'
                  : 'Send to Faculty'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">Conversation History</h3>
              <span className="text-[11px] text-slate-400">
                {unifiedHistory.length} recorded
              </span>
            </div>

            <div className="max-h-[520px] overflow-y-auto space-y-3 pr-1">
              {unifiedHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs italic">
                  No conversations yet. Send a message to AI or your professors.
                </div>
              ) : (
                unifiedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                            item.type === 'AI'
                              ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                              : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="font-semibold text-slate-300">
                          {item.targetName}
                        </span>
                      </div>
                      <span className="text-slate-500">{item.dateLabel}</span>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded-lg text-slate-300">
                      <span className="font-bold text-slate-400 mr-1.5">You:</span>
                      {item.question}
                    </div>

                    {item.response ? (
                      <div className="p-2.5 bg-emerald-950/30 border border-emerald-900/60 rounded-lg text-emerald-200">
                        <div className="font-bold text-emerald-400 mb-1">
                          {item.type === 'AI' ? 'AI Tutor Response:' : 'Faculty Response:'}
                        </div>
                        {item.type === 'AI' ? (
                          <AiFeedbackCard text={item.response} />
                        ) : (
                          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {item.response}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 bg-amber-950/20 border border-amber-900/40 rounded-lg text-amber-400 text-[11px] font-medium italic">
                        Response pending from faculty...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}