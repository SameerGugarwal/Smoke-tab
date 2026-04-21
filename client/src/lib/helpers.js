// Convert paise to rupees display string
export const formatAmount = (paise) => {
  if (paise == null) return '₹0';
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Get initials from name
export const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

// Format relative time
export const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// Format date for display
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Generate UPI deep link
export const buildUpiLink = (upiId, amount, name, note = 'SmokeTab dues') => {
  const rupees = (amount / 100).toFixed(2);
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${rupees}&cu=INR&tn=${encodeURIComponent(note)}`;
};

// Is mobile device
export const isMobile = () => /Mobi|Android/i.test(navigator.userAgent);
