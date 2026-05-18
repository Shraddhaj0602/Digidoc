import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { saveRecord } from '../lib/firebase';
import { extractDocumentData } from '../services/gemini';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const navigate = useNavigate();

  // Load API Key from environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleExtract = async () => {
    if (!file) return;
    if (!apiKey) {
      setStatusText('API Key is missing! Please ensure VITE_GEMINI_API_KEY is set in .env');
      return;
    }

    setIsExtracting(true);
    setStatusText('Sending document to Gemini 2.5 Pro...');

    try {
      // 1. Run Gemini API
      const extractedData = await extractDocumentData(file, apiKey);

      setStatusText('Saving extracted data...');

      // Convert file to Base64 for persistent DB storage
      const getBase64 = (f) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
      const fileDataUrl = await getBase64(file);

      // 2. Save to DB as pending
      const id = await saveRecord({
        ...extractedData,
        fileName: file.name,
        fileType: file.type,
        fileUrl: fileDataUrl,
        status: 'pending'
      });

      setIsExtracting(false);
      navigate(`/review/${id}`);
    } catch (err) {
      console.error(err);
      setStatusText(`Error: ${err.message || 'Extraction Failed'}`);
      setIsExtracting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Upload Operational Document
      </motion.h1>

      <motion.div
        className="glass-panel"
        style={{ padding: '40px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {!file ? (
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <UploadCloud className="drop-icon" />
            <h3>Drag & Drop your document here</h3>
            <p style={{ marginTop: '8px' }}>Supports PDF, JPEG, PNG, WEBP (Gemini 2.5 Flash handles both text and images)</p>
            <button className="btn btn-secondary" style={{ marginTop: '24px' }}>Browse Files</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
              <File size={36} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{file.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <button className="btn btn-secondary" onClick={() => setFile(null)}>Remove</button>
            </div>

            {/* Document Preview */}
            <div className="preview-pane" style={{ height: '400px' }}>
              {file.type === 'application/pdf' ? (
                <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }} title="PDF Preview" />
              ) : (
                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={handleExtract}
                disabled={isExtracting}
                style={{ width: '100%', height: '56px', fontSize: '1.1rem' }}
              >
                {isExtracting ? (
                  <><div className="loader" style={{ width: '24px', height: '24px', borderWidth: '3px', marginRight: '12px' }}></div> Analyzing with Gemini 2.5 Pro...</>
                ) : (
                  'Run Gemini Extraction'
                )}
              </button>

              {(isExtracting || statusText) && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} color="var(--primary)" /> {statusText}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
