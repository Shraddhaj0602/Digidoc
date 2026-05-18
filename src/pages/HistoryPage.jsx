import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { subscribeToRecords, deleteRecord } from '../lib/firebase';

export default function HistoryPage() {
  const [records, setRecords] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToRecords(setRecords);
    return () => unsubscribe();
  }, []);

  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteRecord(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  if (!records) return <div style={{ padding: '32px' }}>Loading records...</div>;

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.plant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <motion.h1 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        Processing History
      </motion.h1>

      <motion.div 
        className="glass-panel" 
        style={{ padding: '24px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by file name, plant, or department..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '48px' }}
            />
          </div>
          <div style={{ position: 'relative', width: '200px' }}>
            <Filter size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ paddingLeft: '48px' }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending Review</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Upload Date</th>
                <th>Plant</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, i) => (
                  <motion.tr 
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td>
                      <div style={{ fontWeight: 500 }}>{record.fileName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {record.id}</div>
                    </td>
                    <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td>{record.plant || '-'}</td>
                    <td>{record.department || '-'}</td>
                    <td>
                      <span className={`badge ${record.status === 'pending' ? 'badge-pending' : 'badge-completed'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px 12px', fontSize: '0.875rem' }}
                          onClick={() => navigate(`/review/${record.id}`)}
                        >
                          <Eye size={16} /> View
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '8px 12px', fontSize: '0.875rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Custom Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <motion.div 
            className="modal-content glass-panel"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3>Delete Document</h3>
            <p>Are you sure you want to permanently delete this document from Digidoc? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
