import { useState, useEffect } from 'react';
import Sidebar from './components/common/Sidebar';
import Topbar from './components/common/Topbar';
import Login from './components/auth/Login';
import AdminView from './components/admin/AdminView';
import FacultyView from './components/faculty/FacultyView';
import StudentView from './components/student/StudentView';

export default function App() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedRole) {
      setRole(savedRole);
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setActiveTab(savedRole === 'admin' ? 'dashboard' : savedRole === 'teacher' ? 'subjects' : 'results');
    }
  }, []);

  const handleLogin = (userRole, userData) => {
    setRole(userRole);
    setUser(userData);
    setActiveTab(userRole === 'admin' ? 'dashboard' : userRole === 'teacher' ? 'subjects' : 'results');
  };

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setUser(null);
  };

  if (!role) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-[#070b14] text-slate-100">
      {/* Left Sidebar */}
      <Sidebar role={role} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} onLogout={handleLogout} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {role === 'admin' && <AdminView activeTab={activeTab} />}
          {role === 'teacher' && <FacultyView activeTab={activeTab} />}
          {role === 'student' && <StudentView activeTab={activeTab} />}
        </main>
      </div>
    </div>
  );
}