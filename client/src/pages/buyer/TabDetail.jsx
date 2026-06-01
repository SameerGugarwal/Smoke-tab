import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { formatAmount } from '../../lib/helpers';
import TransactionList from '../../components/TransactionList';
import PaymentModal from '../../components/PaymentModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import useSocket from '../../hooks/useSocket';
import { connectSocket } from '../../lib/socket';

export default function TabDetail() {
  const { tabId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadData();
    const s = connectSocket();
    s.emit('join:tab', { tabId });
    return () => s.emit('leave:tab', { tabId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]);

  useSocket('tab:item-added', ({ tx, tab: updatedTab }) => {
    if (updatedTab._id === tabId) {
      setTab(updatedTab);
      setTransactions((prev) => [tx, ...prev]);
      showToastMsg(`${tx.itemIcon} ${tx.itemName} added`);
    }
  });

  useSocket('tab:item-removed', ({ txId, tab: updatedTab }) => {
    if (updatedTab._id === tabId) {
      setTab(updatedTab);
      setTransactions((prev) => prev.filter((t) => t._id !== txId));
    }
  });

  useSocket('tab:payment-received', ({ tab: updatedTab }) => {
    if (updatedTab._id === tabId) {
      setTab(updatedTab);
      setPendingPayment(null);
      showToastMsg('Vendor confirmed your payment! ✅');
    }
  });

  useSocket('tab:payment-rejected', ({ tab: updatedTab }) => {
    if (updatedTab._id === tabId) {
      setTab(updatedTab);
      setPendingPayment(null);
      showToastMsg('Vendor rejected your payment ❌');
    }
  });

  useSocket('tab:payment-initiated', ({ payment }) => {
    if (payment.tabId === tabId) {
      setPendingPayment(payment);
    }
  });

  const loadData = async () => {
    try {
      const [tabRes, payRes] = await Promise.all([
        api.get(`/tabs/${tabId}`),
        api.get(`/payments/tab/${tabId}`)
      ]);
      setTab(tabRes.data.tab);
      setTransactions(tabRes.data.transactions);
      const pending = payRes.data.payments.find(p => p.status === 'pending');
      setPendingPayment(pending || null);
    } finally {
      setLoading(false);
    }
  };

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleLeaveTab = async () => {
    if (tab.balanceDue > 0) {
      alert("Cannot leave the vendor while you have unpaid dues.");
      return;
    }
    if (window.confirm("Are you sure you want to disconnect from this vendor?")) {
      try {
        await api.delete(`/tabs/${tabId}/leave`);
        navigate('/buyer');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to leave vendor');
      }
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const shop = tab?.shopId;

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/buyer')}>←</button>
        <div className="list-item-icon">🏪</div>
        <div style={{ flex: 1 }}>
          <h3>{shop?.name}</h3>
        </div>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={handleLeaveTab}
          style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}
        >
          Leave
        </button>
      </div>

      {/* Balance + pay button */}
      <div className="card" style={{ borderColor: tab?.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>You owe</div>
            <div className={`amount ${tab?.balanceDue > 0 ? 'amount-danger' : ''}`}>
              {formatAmount(tab?.balanceDue)}
            </div>
          </div>
          {tab?.balanceDue > 0 && shop?.upiId && !pendingPayment && (
            <button
              className="btn btn-primary"
              onClick={() => setShowPayment(true)}
            >
              💸 Pay Now
            </button>
          )}
          {pendingPayment && (
            <div style={{ fontSize: '0.85rem', color: 'var(--color-warning)', fontWeight: 600 }}>
              ⏳ Payment pending approval
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="section-title">Transactions</div>
        <TransactionList transactions={transactions} isVendor={false} />
      </div>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          tab={tab}
          shop={shop}
          onClose={() => setShowPayment(false)}
          onConfirmed={() => loadData()}
        />
      )}
    </div>
  );
}
