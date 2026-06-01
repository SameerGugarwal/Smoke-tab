import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatAmount } from '../../lib/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';
import ReceiptModal from '../../components/ReceiptModal';

export default function VendorPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    api.get('/payments/vendor')
      .then(res => setPayments(res.data.payments))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Payments Received</h2>
      </div>

      {payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
          No payments found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {payments.map(payment => (
            <div key={payment._id}>
              <div 
                className="card" 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${payment.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-warning)'}` }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{payment.tabId?.buyerId?.name || 'Customer'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {new Date(payment.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {selectedPayment?._id !== payment._id && (
                    <button 
                      onClick={() => setSelectedPayment(payment)}
                      style={{ marginTop: '0.75rem', background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      View Receipt
                    </button>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{formatAmount(payment.amount)}</div>
                  <div style={{ fontSize: '0.75rem', color: payment.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-warning)', textTransform: 'uppercase', fontWeight: 600, marginTop: '0.25rem' }}>
                    {payment.status}
                  </div>
                </div>
              </div>
              
              {selectedPayment?._id === payment._id && (
                <div style={{ marginTop: '0.5rem' }}>
                  <ReceiptModal payment={payment} onClose={() => setSelectedPayment(null)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
