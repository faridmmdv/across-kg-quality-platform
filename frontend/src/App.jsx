import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UniversityDash from './components/UniversityDash';
import AdminDash from './components/AdminDash';
import GraphView from './components/GraphView'; // IMPORT THE NEW COMPONENT
import './App.css';

function App() {
  const [user, setUser] = useState(null); 
  const [loginType, setLoginType] = useState('uni'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // NAVIGATION STATE (New!)
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'graph'

  // DATA STATE
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA
  const fetchCourses = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/courses/');
      setCourses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Backend offline:", error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  // ACTIONS
  const handleAddCourse = async (courseData) => {
    try {
      await axios.post('http://127.0.0.1:8000/api/submit/', courseData);
      alert("Submission received! SHACL Validation complete.");
      fetchCourses();
    } catch (error) {
      alert("Error submitting course. Check backend console.");
    }
  };

  const handleReview = async (id, status, feedback) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/review/${id}/`, { status, feedback });
      fetchCourses();
    } catch (error) {
      alert("Error updating status");
    }
  };

  // LOGIN LOGIC
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginType === 'admin') {
      if (email === 'admin@across.eu' && password === 'admin123') {
        setUser({ role: 'admin', name: 'ADMIN', title: 'Main Admin' });
      } else {
        alert("ACCESS DENIED: Required: admin@across.eu / admin123");
      }
    } else {
      if (email === 'staff@tu-chemnitz.de' && password === 'staff123') {
        setUser({ role: 'uni', name: 'University Stuff', title: 'Professor' });
      } else {
        alert("ACCESS DENIED: Required: staff@tu-chemnitz.de / staff123");
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmail('');
    setPassword('');
    setCurrentView('dashboard'); // Reset view on logout
  };

  const pendingCount = courses.filter(c => c.status === 'pending').length;
  const issueCount = courses.filter(c => c.status === 'rejected').length;
  const totalCount = courses.length;

  if (!user) {
    // ... (Login Screen HTML - Keep this exactly as it was in previous version) ...
    return (
      <div className="login-container">
        <div className="login-hero">
          <div className="brand-badge">ACROSS ALLIANCE</div>
          <h1 className="hero-title">Federated<br/>Knowledge Graph</h1>
          <p className="hero-text">Advanced Quality Management Platform  <strong>FAIR Principles</strong> and <strong>Linked Data Standards</strong>.</p>
          <div className="hero-features">
            
            

          </div>
        </div>
        <div className="login-form-wrapper">
          <div className="login-card">
            <div className="login-header">
              <h3>{loginType === 'admin' ? 'Federation Admin' : 'University Portal'}</h3>
              <p>Secure Access Gateway</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label>Email Credential</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={loginType === 'admin' ? "admin@across.eu" : "staff@tu-chemnitz.de"} />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <button type="submit" className="btn-login">Authenticate</button>
            </form>
            <div className="toggle-login" onClick={() => setLoginType(loginType === 'uni' ? 'admin' : 'uni')}>
              {loginType === 'uni' ? "Are you Quality Management?" : "Are you University Staff?"} <span>Switch Role</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-circle">A</div>
          <div className="brand-text">ACROSS<br/><span>PLATFORM</span></div>
        </div>
        
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="icon">📊</span> Dashboard
          </div>
          
          <div 
            className={`nav-item ${currentView === 'graph' ? 'active' : ''}`} 
            onClick={() => setCurrentView('graph')}
          >
            <span className="icon">📂</span> Knowledge Graph
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">{user.name.charAt(0)}</div>
          <div className="user-details"><span className="name">{user.name}</span><span className="role">{user.title}</span></div>
          <button onClick={handleLogout} className="btn-logout-icon">↪</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-bar">
          <h2 className="page-title">
            {currentView === 'graph' ? 'Knowledge Graph Explorer' : (user.role === 'admin' ? 'Quality Control Center' : 'University Data Submission')}
          </h2>
          <div className="status-indicator"><span className="dot"></span> {loading ? 'Syncing...' : 'System Operational'}</div>
        </header>

        {/* Stats only show on Dashboard */}
        {user.role === 'admin' && currentView === 'dashboard' && (
          <div className="workspace" style={{paddingBottom: 0, marginBottom: '-20px'}}>
             <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{pendingCount}</div>
                <div className="stat-label">Pending Reviews</div>
              </div>
              <div className="stat-card" style={{borderColor: issueCount > 0 ? '#fca5a5' : ''}}>
                <div className="stat-value" style={{color: issueCount > 0 ? '#ef4444' : ''}}>{issueCount}</div>
                <div className="stat-label">Issues Found</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{totalCount}</div>
                <div className="stat-label">Total Nodes</div>
              </div>
            </div>
          </div>
        )}

        <div className="workspace">
          {currentView === 'graph' ? (
            <GraphView courses={courses} />
          ) : user.role === 'uni' ? (
            <UniversityDash courses={courses} onAdd={handleAddCourse} />
          ) : (
            <AdminDash courses={courses} onReview={handleReview} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;