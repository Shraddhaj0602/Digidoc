import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecordById, updateRecord, deleteRecord } from '../lib/firebase';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Save, ArrowLeft, Plus, Trash2, ShieldAlert, X } from 'lucide-react';

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [machines, setMachines] = useState([]);
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchRecord = async () => {
      const rec = await getRecordById(id);
      if (rec) {
        setRecord(rec);
        setFormData({
          plant: rec.plant || '',
          department: rec.department || '',
          shift: rec.shift || '',
          date: rec.date || '',
          totalProduction: rec.totalProduction || '',
          remarks: rec.remarks || ''
        });
        setMachines(rec.machines || []);
        
        // Initial validation run to populate validation summary
        runValidation({
          ...rec,
          totalProduction: rec.totalProduction || ''
        });
      }
    };
    fetchRecord();
  }, [id]);

  const validateField = (name, value) => {
    let error = null;
    if (!value && name !== 'remarks') {
      error = 'Required field';
    } else {
      if (name === 'totalProduction' && (isNaN(value) || Number(value) < 0)) error = 'Must be a positive number';
    }
    return error;
  };

  const runValidation = (dataToValidate = formData) => {
    const newErrors = {};
    Object.keys(dataToValidate).forEach(key => {
      if (['plant', 'department', 'shift', 'date', 'totalProduction'].includes(key)) {
        const err = validateField(key, dataToValidate[key]);
        if (err) newErrors[key] = err;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    runValidation(newFormData);
  };

  const handleMachineChange = (index, field, value) => {
    const updated = [...machines];
    updated[index][field] = value;
    if (field === 'employeeId') updated[index]['operator'] = value;
    if (field === 'actual') updated[index]['quantityProduced'] = value;
    setMachines(updated);
  };

  const addMachine = () => {
    setMachines([...machines, { 
      machineId: '', employeeId: '', operator: '', productCode: '', workOrderNumber: '', plan: '', actual: '', quantityProduced: '', rejects: '', timeTaken: '' 
    }]);
  };

  const removeMachine = (index) => {
    setMachines(machines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await updateRecord(id, {
      ...formData,
      totalProduction: Number(formData.totalProduction) || 0,
      machines,
      status: 'completed'
    });
    navigate('/history');
  };

  const handleDeleteRecord = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteRecord = async () => {
    await deleteRecord(id);
    setShowDeleteModal(false);
    navigate('/history');
  };

  if (!record) return <div style={{ padding: '48px' }}><div className="loader"></div></div>;

  const renderField = (name, label, type = 'text') => {
    const conf = record.confidence_scores ? (record.confidence_scores[name] || 0) : 1;
    const isLowConfidence = conf < 0.8;
    const hasError = !!errors[name];

    return (
      <div className="form-group" key={name}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label>{label}</label>
          <span className={`badge ${isLowConfidence ? 'confidence-low' : 'confidence-high'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem' }}>
            {isLowConfidence && <AlertTriangle size={12} />}
            {(conf * 100).toFixed(0)}% AI Conf
          </span>
        </div>
        <input 
          type={type} 
          name={name} 
          value={formData[name] || ''} 
          onChange={handleChange}
          className={`${hasError ? 'input-warning' : isLowConfidence ? 'input-warning' : ''}`}
        />
        {hasError && <span className="warning-text" style={{ color: 'var(--warning)', fontSize: '0.85rem', marginTop: '6px', fontWeight: 500, display: 'block' }}>{errors[name]}</span>}
      </div>
    );
  };

  const machinesConf = record.confidence_scores?.machines || 1;
  const isMachinesLowConf = machinesConf < 0.75;
  const errorCount = Object.keys(errors).length;
  
  // Find low confidence fields
  const lowConfFields = [];
  if (record.confidence_scores) {
    Object.entries(record.confidence_scores).forEach(([key, val]) => {
      if (val < 0.8) lowConfFields.push(key);
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '10px' }}><ArrowLeft size={22} /></button>
        <h1 style={{ margin: 0 }}>Review & Validate</h1>
        <span className={`badge ${record.status === 'pending' ? 'badge-pending' : 'badge-completed'}`}>
          {record.status.toUpperCase()}
        </span>
      </div>

      {/* Validation Summary Panel */}
      <motion.div 
        className="glass-panel" 
        style={{ padding: '20px', marginBottom: '32px', borderLeft: errorCount > 0 ? '4px solid var(--warning)' : lowConfFields.length > 0 ? '4px solid var(--warning)' : '4px solid var(--success)' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          {errorCount > 0 ? (
            <AlertTriangle size={32} color="var(--warning)" />
          ) : lowConfFields.length > 0 ? (
            <AlertTriangle size={32} color="var(--warning)" />
          ) : (
            <CheckCircle size={32} color="var(--success)" />
          )}
          
          <div>
            <h3 style={{ marginBottom: '8px' }}>Validation Status</h3>
            {errorCount > 0 ? (
              <p style={{ color: 'var(--warning)', margin: 0 }}>There are {errorCount} validation warnings. You can still save, but please verify the fields.</p>
            ) : lowConfFields.length > 0 ? (
              <p style={{ color: 'var(--warning)', margin: 0 }}>All data is valid, but Gemini flagged {lowConfFields.length} field(s) with low confidence. Please verify.</p>
            ) : (
              <p style={{ color: 'var(--success)', margin: 0 }}>Data looks good! High AI confidence and all business rules passed.</p>
            )}
            
            {lowConfFields.length > 0 && errorCount === 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Please check: {lowConfFields.join(', ')}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="review-layout">
        {/* Document Viewer */}
        <motion.div 
          className="glass-panel" 
          style={{ padding: '24px' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-main)' }}>{record.fileName}</h2>
          <div className="preview-pane" style={{ height: record.fileType === 'application/pdf' ? '600px' : 'auto' }}>
            {record.fileType === 'application/pdf' ? (
              <iframe src={record.fileUrl} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }} title="Document Preview" />
            ) : (
              <img src={record.fileUrl} alt="Document" style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }} />
            )}
          </div>
        </motion.div>

        {/* Data Form */}
        <motion.div 
          className="glass-panel" 
          style={{ padding: '32px' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <form onSubmit={e => e.preventDefault()} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* 1. Machines Array Section (First!) */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>Machines Array</h3>
                <span className={`badge ${isMachinesLowConf ? 'confidence-low' : 'confidence-high'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isMachinesLowConf && <AlertTriangle size={14} />}
                  {(machinesConf * 100).toFixed(0)}% Overall AI Conf
                </span>
              </div>
              
              <div className="table-container" style={{ border: '1px solid var(--card-border)' }}>
                <table>
                  <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <tr>
                      <th>Machine ID</th>
                      <th>Emp ID</th>
                      <th>Prod Code</th>
                      <th>Work Order</th>
                      <th>Plan</th>
                      <th>Qty Produced</th>
                      <th>Rejects</th>
                      <th>Time Taken (Hrs)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map((m, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px' }}><input value={m.machineId || ''} onChange={e => handleMachineChange(i, 'machineId', e.target.value)} style={{ padding: '8px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input value={m.employeeId || m.operator || ''} onChange={e => handleMachineChange(i, 'employeeId', e.target.value)} style={{ padding: '8px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input value={m.productCode || ''} onChange={e => handleMachineChange(i, 'productCode', e.target.value)} style={{ padding: '8px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input value={m.workOrderNumber || ''} onChange={e => handleMachineChange(i, 'workOrderNumber', e.target.value)} style={{ padding: '8px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input type="number" value={m.plan || ''} onChange={e => handleMachineChange(i, 'plan', e.target.value)} style={{ padding: '8px', width: '70px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input type="number" value={m.actual || m.quantityProduced || ''} onChange={e => handleMachineChange(i, 'actual', e.target.value)} style={{ padding: '8px', width: '90px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input type="number" value={m.rejects || ''} onChange={e => handleMachineChange(i, 'rejects', e.target.value)} style={{ padding: '8px', width: '70px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input value={m.timeTaken || ''} onChange={e => handleMachineChange(i, 'timeTaken', e.target.value)} style={{ padding: '8px', width: '90px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}>
                          <button className="btn btn-secondary" style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} onClick={() => removeMachine(i)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {machines.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', color: 'var(--warning)', padding: '24px' }}>
                          <AlertTriangle size={20} style={{ margin: '0 auto 8px' }} />
                          No machine data automatically detected.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-secondary" style={{ marginTop: '16px', padding: '10px 16px', fontSize: '0.9rem' }} onClick={addMachine}>
                <Plus size={16} /> Add Machine Row
              </button>
            </div>

            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--card-border)', margin: '16px 0 8px 0' }} />

            {/* 2. General Extracted Fields Section (Below!) */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h2 style={{ marginBottom: '24px', fontSize: '1.3rem', color: 'var(--text-main)' }}>Extracted Fields</h2>
            </div>
            {renderField('plant', 'Plant')}
            {renderField('department', 'Department')}
            {renderField('date', 'Date')}
            {renderField('shift', 'Shift')}
            {renderField('totalProduction', 'Total Production', 'number')}
            {renderField('remarks', 'Remarks')}

            {/* 3. Action Buttons */}
            <div style={{ gridColumn: '1 / -1', marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--card-border)', paddingTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/history')}>Cancel</button>
              <button 
                className="btn btn-secondary" 
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }} 
                onClick={handleDeleteRecord}
              >
                <Trash2 size={20} /> Delete Record
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                <CheckCircle size={20} /> Approve & Save
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Sleek Custom Slate-Glass Deletion Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 22, 0.75)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '24px'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, rgba(22, 28, 45, 0.8), rgba(15, 18, 36, 0.95))',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setShowDeleteModal(false)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '50%',
                padding: '8px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '16px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)'
              }}>
                <ShieldAlert size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Delete Operational Record</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
              Are you sure you want to delete this digitized sheet? All extracted metrics and manual edits will be permanently wiped from the database.
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
                style={{ padding: '12px 20px', fontSize: '0.9rem' }}
              >
                No, Keep Record
              </button>
              <button 
                className="btn btn-primary" 
                onClick={confirmDeleteRecord}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  padding: '12px 22px',
                  fontSize: '0.9rem',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.25)'
                }}
              >
                Yes, Delete Record
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
