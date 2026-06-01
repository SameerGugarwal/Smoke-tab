import { formatAmount } from '../lib/helpers';
import { CheckCircle2, Clock } from 'lucide-react';

export default function ReceiptModal({ payment, onClose }) {
  if (!payment) return null;

  const date = new Date(payment.createdAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  const isConfirmed = payment.status === 'confirmed';

  return (
    <div style={{ padding: 0, overflow: 'hidden', background: '#f8f9fa', color: '#333', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid #ddd' }}>
      
      {/* Receipt Header */}
      <div style={{ background: isConfirmed ? '#00e676' : '#ffea00', padding: '1.25rem', textAlign: 'center', color: isConfirmed ? '#fff' : '#333' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
          {isConfirmed ? <CheckCircle2 size={40} /> : <Clock size={40} />}
        </div>
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>
          {isConfirmed ? 'Payment Successful' : 'Payment Pending'}
        </h3>
        <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.25rem' }}>
          {date}
        </div>
      </div>

      {/* Receipt Body */}
      <div style={{ padding: '1.5rem 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount Paid</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111', margin: '0.25rem 0' }}>
            {formatAmount(payment.amount)}
          </div>
          <div style={{ display: 'inline-block', background: '#e0e0e0', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>
            via {payment.method.toUpperCase()}
          </div>
        </div>

        <div style={{ borderTop: '2px dashed #ccc', margin: '1rem 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Shop Name</span>
            <span style={{ fontWeight: 600, textAlign: 'right' }}>{payment.tabId?.shopId?.name || 'Shop'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Customer</span>
            <span style={{ fontWeight: 600, textAlign: 'right' }}>{payment.tabId?.buyerId?.name || 'Customer'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Transaction ID</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace', textAlign: 'right' }}>{payment.upiRef || payment._id.slice(-8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Receipt Footer */}
      <div style={{ padding: '0.75rem', background: '#e9ecef', textAlign: 'center' }}>
        <button onClick={onClose} style={{ 
          background: '#333', color: '#fff', border: 'none', 
          padding: '8px 20px', borderRadius: '6px', 
          fontWeight: 600, cursor: 'pointer', width: '100%',
          fontSize: '0.9rem'
        }}>
          Close Receipt
        </button>
      </div>

    </div>
  );
}
