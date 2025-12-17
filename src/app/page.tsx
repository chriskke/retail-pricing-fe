'use client';

import { useState } from 'react';
import Card from '../components/Card';
import ConfirmationModal from '../components/ConfirmationModal';
import ToastNotification from '../components/ToastNotification';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // UI State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

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
      setStatus('Success! Data imported.');
      setStats(data.stats);
      setToast({ msg: 'Data imported successfully', type: 'success' });
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
    } catch (error) {
      console.error(error);
      setToast({ msg: 'Failed to delete data', type: 'error' });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

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

      <div className={styles.header}>
        <h1>Import Data</h1>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          <Card title="Upload CSV">
            <div className={styles.uploadCardContent}>
              <div>
                <p className={styles.helperText}>Select a CSV file containing product and competitor data.</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
              </div>

              <div className={styles.buttonGroup}>
                <button onClick={handleUpload} className="btn btn-primary" disabled={!file}>
                  Upload & Process
                </button>
              </div>

              {status && (
                <div className={`${styles.statusMessage} ${status.includes('Error') ? styles.statusError : styles.statusSuccess}`}>
                  {status}
                </div>
              )}
            </div>
          </Card>

          {stats && (
            <Card title="Last Import Statistics">
              <div className={styles.statsGrid}>
                <div>
                  <h3 className={styles.statValue}>{stats.rowsProcessed}</h3>
                  <p className={styles.statLabel}>Rows Processed</p>
                </div>
                <div>
                  <h3 className={styles.statValue}>{stats.productsUpserted}</h3>
                  <p className={styles.statLabel}>Products Updated</p>
                </div>
                <div>
                  <h3 className={styles.statValue}>{stats.listingsCreated}</h3>
                  <p className={styles.statLabel}>Listings Created</p>
                </div>
              </div>
            </Card>
          )}

          <Card title="Danger Zone">
            <p className={styles.dangerText}>
              Clear all products, competitor listings, and price history from the database.
            </p>
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete All Data'}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
