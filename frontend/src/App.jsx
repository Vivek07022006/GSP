import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyProfile from './pages/FacultyProfile';
import AdminDashboard from './pages/AdminDashboard';
import TeamReviewFaculty from './pages/TeamReviewFaculty';

function Dashboard({ user }) {
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'student') return <StudentDashboard user={user} />;
  if (user.role === 'faculty') return <FacultyDashboard user={user} />;
  if (user.role === 'admin') return <AdminDashboard user={user} />;
  return <Navigate to="/" replace />;
}

const DASHBOARD_ROLES = ['student', 'faculty', 'admin'];

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch { localStorage.clear(); }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const setAuthUser = (data) => {
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  const showNavbar = user && DASHBOARD_ROLES.includes(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar user={user} onLogout={handleLogout} />}

      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login setAuthUser={setAuthUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" replace />} />
        <Route path="/dashboard/team/:teamId" element={user && user.role === 'faculty' ? <TeamReviewFaculty user={user} /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={user && user.role === 'faculty' ? <FacultyProfile user={user} /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}