import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { formatAmount, getInitials } from '../../lib/helpers';
import ItemGrid from '../../components/ItemGrid';
import TransactionList from '../../components/TransactionList';
import LimitWarningModal from '../../components/LimitWarningModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import useSocket from '../../hooks/useSocket';
import { connectSocket } from '../../lib/socket';

export default function CustomerTab() {
  const { tabId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [limitWarning, setLimitWarning] = useState(null);
  const [pendingItem, setPendingItem] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadData();
    const s = connectSocket();
    s.emit('join:tab', { tabId });
    return () => s.emit('leave:tab', { tabId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]);

  useSocket('tab:payment-received', ({ tab: updatedTab }) => {
    if (updatedTab._id === tabId) {
      setTab(updatedTab);
      showToast('Payment confirmed ✅');
    }
  });

  useSocket('tab:payment-initiated', ({ payment }) => {
    if (payment.tabId === tabId) {
      setPendingPayments((prev) => [payment, ...prev]);
      showToast('Buyer recorded a payment!');
    }
  });

  const loadData = async () => {
    try {
      const [tabRes, invRes, payRes] = await Promise.all([
        api.get(`/tabs/${tabId}`),
        api.get('/shops/mine/inventory'),
        api.get(`/payments/tab/${tabId}`),
      ]);
      setTab(tabRes.data.tab);
      setTransactions(tabRes.data.transactions);
      setItems(invRes.data.items);
      setPendingPayments(payRes.data.payments.filter(p => p.status === 'pending'));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const confirmPayment = async (paymentId) => {
    try {
      await api.put(`/payments/${paymentId}/confirm`);
      setPendingPayments((prev) => prev.filter((p) => p._id !== paymentId));
    } catch {
      showToast('Error confirming payment');
    }
  };

  const rejectPayment = async (paymentId) => {
    try {
      await api.put(`/payments/${paymentId}/reject`);
      setPendingPayments((prev) => prev.filter((p) => p._id !== paymentId));
      showToast('Payment rejected');
    } catch {
      showToast('Error rejecting payment');
    }
  };

  const addItem = async (item, override = false) => {
    setAdding(true);
    try {
      const res = await api.post(`/tabs/${tabId}/transactions`, {
        itemId: item._id,
        itemName: item.name,
        itemIcon: item.icon,
        category: item.category,
        quantity: 1,
        amount: item.price,
        limitOverride: override,
      });
      setTab(res.data.tab);
      setTransactions((prev) => [res.data.tx, ...prev]);
      showToast(`${item.icon} ${item.name} added`);
      setLimitWarning(null);
      setPendingItem(null);
    } catch (err) {
      if (err.response?.data?.limitExceeded) {
        setPendingItem(item);
        setLimitWarning(err.response.data);
      } else {
        showToast('Error adding item');
      }
    } finally {
      setAdding(false);
    }
  };

  const deleteTransaction = async (txId) => {
    try {
      const res = await api.delete(`/tabs/${tabId}/transactions/${txId}`);
      setTab(res.data.tab);
      setTransactions((prev) => prev.filter((t) => t._id !== txId));
      showToast('Removed');
    } catch {
      showToast('Error removing');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const buyer = tab?.buyerId;

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}

      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/vendor')}>←</button>
        <div className="avatar">{getInitials(buyer?.name || '?')}</div>
        <div style={{ flex: 1 }}>
          <h3>{buyer?.name}</h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{buyer?.phone}</div>
        </div>
      </div>

      {/* Balance */}
      <div className="card" style={{ borderColor: tab?.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Outstanding Balance</div>
        <div className={`amount ${tab?.balanceDue > 0 ? 'amount-danger' : ''}`}>
          {formatAmount(tab?.balanceDue)}
        </div>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div className="section-title" style={{ color: 'var(--color-warning)' }}>Pending Payments</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingPayments.map((p) => (
              <div key={p._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--color-warning)' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{formatAmount(p.amount)}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>via {p.method.toUpperCase()}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '8px 12px', fontSize: '0.9rem', color: 'var(--color-danger)' }} onClick={() => rejectPayment(p._id)}>
                    Reject
                  </button>
                  <button className="btn btn-primary btn-sm" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => confirmPayment(p._id)}>
                    Confirm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick-add grid */}
      <div>
        <div className="section-title">Quick Add</div>
        <ItemGrid items={items} onSelect={addItem} loading={adding} />
      </div>

      {/* Transaction list */}
      <div>
        <div className="section-title">Recent Transactions</div>
        <TransactionList
          transactions={transactions}
          onDelete={deleteTransaction}
          isVendor={true}
        />
      </div>

      {/* Limit warning modal */}
      <LimitWarningModal
        warning={limitWarning}
        onOverride={() => pendingItem && addItem(pendingItem, true)}
        onCancel={() => { setLimitWarning(null); setPendingItem(null); }}
      />
    </div>
  );
}
