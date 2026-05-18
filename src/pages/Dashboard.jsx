import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subscribeToRecords } from '../lib/firebase';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [records, setRecords] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToRecords(setRecords);
    return () => unsubscribe();
  }, []);
  
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    avgQuantity: 0
  });

  const [shiftData, setShiftData] = useState([]);

  useEffect(() => {
    if (records) {
      const total = records.length;
      const completed = records.filter(r => r.status === 'completed').length;
      const pending = total - completed;
      
      const qtys = records.map(r => Number(r.totalProduction)).filter(q => !isNaN(q) && q > 0);
      const avgQuantity = qtys.length > 0 ? Math.round(qtys.reduce((a,b)=>a+b, 0) / qtys.length) : 0;

      setStats({ total, completed, pending, avgQuantity });

      // Calculate shift-wise summaries
      const shifts = {};
      records.forEach(r => {
        if (!r.shift) return;
        shifts[r.shift] = (shifts[r.shift] || 0) + 1;
      });
      const chartData = Object.keys(shifts).map(key => ({
        name: key,
        count: shifts[key]
      }));
      setShiftData(chartData);
    }
  }, [records]);

  const colors = ['#818cf8', '#c084fc', '#34d399', '#fbbf24'];

  return (
    <div>
      <motion.h1 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        Operations Dashboard
      </motion.h1>

      <div className="stats-grid">
        <motion.div className="stat-card glass-panel" whileHover={{ scale: 1.02 }}>
          <div className="stat-title">Total Processed</div>
          <div className="stat-value">{stats.total}</div>
        </motion.div>
        <motion.div className="stat-card glass-panel" whileHover={{ scale: 1.02 }}>
          <div className="stat-title">Completed Records</div>
          <div className="stat-value">{stats.completed}</div>
        </motion.div>
        <motion.div className="stat-card glass-panel" whileHover={{ scale: 1.02 }}>
          <div className="stat-title">Pending Review</div>
          <div className="stat-value">{stats.pending}</div>
        </motion.div>
        <motion.div className="stat-card glass-panel" whileHover={{ scale: 1.02 }}>
          <div className="stat-title">Avg Quantity Produced</div>
          <div className="stat-value">{stats.avgQuantity}</div>
        </motion.div>
      </div>

      <motion.div 
        className="glass-panel" 
        style={{ padding: '24px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2>Shift-wise Processing Volume</h2>
        {shiftData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {shiftData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No data available to display chart.</p>
        )}
      </motion.div>
    </div>
  );
}
