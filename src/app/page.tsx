'use client';

import { useState } from 'react';
import Card from '../components/Card';
import ConfirmationModal from '../components/ConfirmationModal';
import ToastNotification from '../components/ToastNotification';

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Import Data</h1>
      </div>

      <div className="import-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '2rem' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Card title="Upload CSV">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px', width: '100%' }}>
              <div>
                <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select a CSV file containing product and competitor data.</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleUpload} className="btn btn-primary" disabled={!file}>
                  Upload & Process
                </button>
              </div>

              {status && (
                <div style={{
                  padding: '1rem',
                  background: status.includes('Error') ? '#fef2f2' : '#f0fdf4',
                  color: status.includes('Error') ? 'var(--danger)' : 'var(--success)',
                  borderRadius: '6px',
                  border: '1px solid currentColor'
                }}>
                  {status}
                </div>
              )}
            </div>
          </Card>

          {stats && (
            <Card title="Last Import Statistics">
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{stats.rowsProcessed}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Rows Processed</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{stats.productsUpserted}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Products Updated</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '2rem', color: 'var(--primary)' }}>{stats.listingsCreated}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Listings Created</p>
                </div>
              </div>
            </Card>
          )}

          <Card title="Danger Zone">
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Clear all products, competitor listings, and price history from the database.
            </p>
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete All Data'}
            </button>
          </Card>
        </div>
        <style jsx global>{`
          @media (max-width: 768px) {
            .import-grid {
               grid-template-columns: 1fr !important;
            }
            .stats-grid {
               grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
