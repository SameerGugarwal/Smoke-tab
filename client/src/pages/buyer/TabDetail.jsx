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
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadData();
    const s = connectSocket();
    s.emit('join:tab', { tabId });
    return () => s.emit('leave:tab', { tabId });
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

  const loadData = async () => {
    try {
      const res = await api.get(`/tabs/${tabId}`);
      setTab(res.data.tab);
      setTransactions(res.data.transactions);
    } finally {
      setLoading(false);
    }
  };

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
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
          {tab?.balanceDue > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => setShowPayment(true)}
            >
              💸 Pay Now
            </button>
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
