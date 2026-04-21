import { useState, useEffect, useCallback } from 'react';
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
  }, [tabId]);

  useSocket('tab:payment-received', ({ tab: updatedTab }) => {
    if (updatedTab._id === tabId) {
      setTab(updatedTab);
      showToast('Payment confirmed ✅');
    }
  });

  const loadData = async () => {
    try {
      const [tabRes, invRes] = await Promise.all([
        api.get(`/tabs/${tabId}`),
        api.get('/shops/mine/inventory'),
      ]);
      setTab(tabRes.data.tab);
      setTransactions(tabRes.data.transactions);
      setItems(invRes.data.items);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
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
