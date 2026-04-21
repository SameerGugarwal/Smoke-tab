const cron = require('node-cron');
const Tab = require('../models/Tab');

// Twilio stub — configure with real credentials to enable
const sendWhatsApp = async (phone, message) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[WhatsApp STUB] To ${phone}: ${message}`);
    return;
  }

  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await twilio.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:+91${phone}`,
    body: message,
  });
};

const runWeeklyReminders = async () => {
  console.log('[Cron] Running weekly WhatsApp reminders...');
  try {
    const tabs = await Tab.find({ balanceDue: { $gt: 0 } })
      .populate('buyerId', 'name phone')
      .populate('shopId', 'name');

    for (const tab of tabs) {
      const amount = (tab.balanceDue / 100).toFixed(2);
      const message = `Hi ${tab.buyerId.name}! Your current tab at ${tab.shopId.name} is ₹${amount}. Please clear your dues. Thank you! 🙏`;
      await sendWhatsApp(tab.buyerId.phone, message);
    }

    console.log(`[Cron] Sent reminders to ${tabs.length} customers.`);
  } catch (err) {
    console.error('[Cron] WhatsApp reminder error:', err.message);
  }
};

// Run every Monday at 9 AM
const scheduleReminders = () => {
  cron.schedule('0 9 * * 1', runWeeklyReminders, { timezone: 'Asia/Kolkata' });
  console.log('[Cron] WhatsApp reminder job scheduled (Mondays 9 AM IST)');
};

module.exports = { scheduleReminders, runWeeklyReminders };
