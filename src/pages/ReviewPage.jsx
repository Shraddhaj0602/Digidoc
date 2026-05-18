import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecordById, updateRecord, deleteRecord } from '../lib/firebase';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Save, ArrowLeft, Plus, Trash2, ShieldAlert } from 'lucide-react';

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [machines, setMachines] = useState([]);
  const [errors, setErrors] = useState({});

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
          employeeNumber: rec.employeeNumber || '',
          operationCode: rec.operationCode || '',
          machineNumber: rec.machineNumber || '',
          workOrderNumber: rec.workOrderNumber || '',
          quantityProduced: rec.quantityProduced || '',
          timeTaken: rec.timeTaken || '',
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
      if (name === 'shift' && !['A', 'B', 'C'].includes(value)) error = 'Must be A, B, or C';
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
    setMachines(updated);
  };

  const addMachine = () => {
    setMachines([...machines, { 
      machineId: '', productCode: '', plan: '', actual: '', rejects: '', operator: '' 
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

  const handleDeleteRecord = async () => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteRecord(id);
      navigate('/history');
    }
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
          <h2 style={{ marginBottom: '24px' }}>Extracted Fields</h2>

          <form onSubmit={e => e.preventDefault()} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {renderField('plant', 'Plant')}
            {renderField('department', 'Department')}
            {renderField('date', 'Date')}
            {renderField('shift', 'Shift (A/B/C)')}
            {renderField('employeeNumber', 'Employee Number')}
            {renderField('operationCode', 'Operation Code')}
            {renderField('machineNumber', 'Machine Number')}
            {renderField('workOrderNumber', 'Work Order Number')}
            {renderField('quantityProduced', 'Quantity Produced', 'number')}
            {renderField('timeTaken', 'Time Taken')}
            {renderField('totalProduction', 'Total Production', 'number')}
            {renderField('remarks', 'Remarks')}

            <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Machines Array</h3>
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
                      <th>Prod Code</th>
                      <th>Plan</th>
                      <th>Actual</th>
                      <th>Rejects</th>
                      <th>Operator</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map((m, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px' }}><input value={m.machineId || ''} onChange={e => handleMachineChange(i, 'machineId', e.target.value)} style={{ padding: '8px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input value={m.productCode || ''} onChange={e => handleMachineChange(i, 'productCode', e.target.value)} style={{ padding: '8px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input type="number" value={m.plan || ''} onChange={e => handleMachineChange(i, 'plan', e.target.value)} style={{ padding: '8px', width: '70px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input type="number" value={m.actual || ''} onChange={e => handleMachineChange(i, 'actual', e.target.value)} style={{ padding: '8px', width: '70px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input type="number" value={m.rejects || ''} onChange={e => handleMachineChange(i, 'rejects', e.target.value)} style={{ padding: '8px', width: '70px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}><input value={m.operator || ''} onChange={e => handleMachineChange(i, 'operator', e.target.value)} style={{ padding: '8px', fontSize: '0.85rem' }} /></td>
                        <td style={{ padding: '8px' }}>
                          <button className="btn btn-secondary" style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} onClick={() => removeMachine(i)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {machines.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--warning)', padding: '24px' }}>
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
    </div>
  );
}
