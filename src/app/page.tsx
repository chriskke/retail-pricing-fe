'use client';

import { useState, useEffect } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';
import ToastNotification from '../components/ToastNotification';
import styles from '../styles/Home.module.css';
import { Icons } from '../components/Icons';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Data State
  const [hasData, setHasData] = useState(false);
  const [checkingData, setCheckingData] = useState(true);

  // UI State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    checkData();
  }, []);

  const checkData = () => {
    setCheckingData(true);
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.analytics && data.analytics.total_products > 0) {
          setHasData(true);
          setStats({
            rowsProcessed: data.analytics.total_products
          });
        } else {
          setHasData(false);
        }
        setCheckingData(false);
      })
      .catch(err => {
        console.error('Failed to check data status:', err);
        setCheckingData(false);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setToast({ msg: 'Please select a file', type: 'error' });
      return;
    }

    setStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      const rowCount = data.stats?.rowsProcessed || '0';

      setStatus(`Success! ${rowCount} rows of data imported`);
      setStats({
        rowsProcessed: rowCount
      });
      setToast({ msg: 'Data imported successfully', type: 'success' });
      setHasData(true);
    } catch (error) {
      console.error(error);
      setStatus('Error uploading file');
      setToast({ msg: 'Error uploading file', type: 'error' });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/upload`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      setStatus('All data cleared.');
      setStats(null);
      setFile(null);
      setToast({ msg: 'All data deleted successfully', type: 'success' });
      setHasData(false);
    } catch (error) {
      console.error(error);
      setToast({ msg: 'Failed to delete data', type: 'error' });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (checkingData) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className={styles.spinner} style={{ width: '32px', height: '32px' }}></div>
      </div>
    );
  }

  const isUploading = status === 'Uploading...';

  return (
    <div className={styles.container}>
      {toast && <ToastNotification message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete All Data"
        message="Are you sure you want to delete ALL data? This includes products, competitor listings, price history, and the Action Board. This cannot be undone."
        confirmText="Delete Everything"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <div className={styles.headerSection}>
        <h1 className={styles.title}>Import Data</h1>
        <p className={styles.subtitle}>Upload your product pricing CSV to update your dashboard and analytics.</p>
      </div>

      {!hasData ? (
        <div className={styles.uploadCard}>
          {isUploading && (
            <div className={styles.overlay}>
              <div className={styles.spinner}></div>
              <div style={{ fontWeight: 500, color: '#334155' }}>Processing your data...</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>This may take a moment</div>
            </div>
          )}

          <div style={{ padding: '2rem' }}>
            {!file ? (
              <label className={styles.uploadArea}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className={styles.hiddenInput}
                  disabled={isUploading}
                />
                <div className={styles.uploadIconWrapper}>
                  <Icons.CloudUpload />
                </div>
                <div className={styles.uploadText}>Click to upload or drag and drop</div>
                <div className={styles.uploadSubtext}>CSV files only (max 10MB)</div>
              </label>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className={styles.selectedFileBar}>
                  <div className={styles.fileName}>
                    <span style={{ fontSize: '1.5rem' }}>📄</span>
                    {file.name}
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Change
                  </button>
                </div>
                <div style={{ marginTop: '2rem' }}>
                  <button onClick={handleUpload} className={styles.actionButton} disabled={isUploading}>
                    Start Import
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.uploadCard}>
          <div className={styles.successContent}>
            <div style={{ color: '#22c55e', marginBottom: '1rem' }}>
              <Icons.CheckCircle />
            </div>
            <h3 className={styles.successTitle}>Data Imported Successfully</h3>
            <p className={styles.successDesc}>Your product data is ready to be analyzed.</p>

            {stats && (
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats.rowsProcessed || '—'}</div>
                  <div className={styles.statLabel}>Products Imported</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className={styles.actionButton}
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => window.location.href = '/analytics'}
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone Section */}
      <div className={styles.dangerZone}>
        <div className={styles.dangerInfo}>
          <h3>Danger Zone</h3>
          <p>Need to start fresh? This will remove all existing products and history.</p>
        </div>
        <button onClick={() => setShowDeleteModal(true)} className={styles.dangerButton} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete All Data'}
        </button>
      </div>
    </div>
  );
}
