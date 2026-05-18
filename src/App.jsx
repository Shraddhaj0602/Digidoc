import React, { useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, History, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import HistoryPage from './pages/HistoryPage';
import { seedIfEmpty } from './lib/seedData';

function App() {
  useEffect(() => {
    seedIfEmpty();
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="logo-area">
          <Activity size={28} />
          <span>Digidoc</span>
        </div>
        
        <nav className="nav-links">
          <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/upload" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <UploadCloud size={20} /> Upload Docs
          </NavLink>
          <NavLink to="/history" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <History size={20} /> History
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/review/:id" element={<ReviewPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </motion.div>
      </main>
    </div>
  );
}

export default App;
