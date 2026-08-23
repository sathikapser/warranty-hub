const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Warranty = require('../models/Warranty');
const Insurance = require('../models/Insurance');
const AMC = require('../models/AMC');
const Service = require('../models/Service');
const Asset = require('../models/Asset');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { emitUserEvent, emitWorkspaceEvent, broadcastActivity } = require('./socket');
const twilio = require('twilio');

// Configure Twilio SMS Client
const createTwilioClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const sendSMSAlert = async (toPhone, text) => {
  if (!toPhone) return;
  const client = createTwilioClient();
  if (!client) {
    console.log(`[SMS Alert Bypassed] To: ${toPhone} | Message: ${text}`);
    return;
  }

  try {
    await client.messages.create({
      body: text,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone
    });
    console.log(`[SMS Alert Sent] To: ${toPhone}`);
  } catch (error) {
    console.error('[SMS Error]:', error.message);
  }
};

// Configure Nodemailer Transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEmailAlert = async (toEmail, subject, text) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[Email Alert Bypassed] To: ${toEmail} | Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"WarrantyHub 2.0 Alerts" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      text: text
    });
    console.log(`[Email Alert Sent] To: ${toEmail} | Subject: ${subject}`);
  } catch (error) {
    console.error('[Email Error]:', error.message);
  }
};

const checkExpirations = async () => {
  console.log('[Scheduler] Running continuous asset lifecycle & warranty expiry check...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getAssetDetails = async (assetId) => {
    const asset = await Asset.findById(assetId);
    if (!asset) return null;
    const user = await User.findById(asset.userId);
    return { asset, user };
  };

  const triggerAlert = async (user, asset, type, title, message, urgency = 'medium', metadata = {}) => {
    try {
      // 1. Create In-App Notification
      const notif = await Notification.create({
        userId: user._id,
        title: title,
        message: message,
        type: type
      });

      // 2. Real-Time WebSockets push
      emitUserEvent(user._id.toString(), 'notification_new', {
        notification: notif,
        asset: { id: asset._id, name: asset.assetName, brand: asset.brand },
        urgency
      });

      const workspaceId = user.familyWorkspaceOwnerId || user._id;
      emitWorkspaceEvent(workspaceId.toString(), 'warranty_alert', {
        title,
        message,
        assetName: asset.assetName,
        urgency,
        assetId: asset._id
      });

      // 3. User Notification Preferences
      const prefs = user.notificationPreferences || { emailEnabled: true, smsEnabled: false };

      if (prefs.emailEnabled ?? true) {
        await sendEmailAlert(user.email, title, message);
      }

      if ((prefs.smsEnabled ?? false) && user.phone) {
        await sendSMSAlert(user.phone, `${title}: ${message}`);
      }
    } catch (err) {
      console.error('Error triggering alert:', err);
    }
  };

  // Standard reminder checkpoints: 30 days, 15 days, 7 days, 3 days, 1 day, 0 days (expired)
  const defaultIntervals = [30, 15, 7, 3, 1, 0];

  const getReminderDays = (user) => {
    if (user.notificationPreferences && Array.isArray(user.notificationPreferences.reminderDays) && user.notificationPreferences.reminderDays.length > 0) {
      return user.notificationPreferences.reminderDays;
    }
    return defaultIntervals;
  };

  // 1. Check Warranties
  const warranties = await Warranty.find({ status: { $ne: 'expired' } });
  for (const warranty of warranties) {
    const details = await getAssetDetails(warranty.assetId);
    if (!details) continue;
    const { asset, user } = details;

    const endDate = new Date(warranty.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const reminderDays = getReminderDays(user);

    if (diffDays <= 0) {
      warranty.status = 'expired';
      await warranty.save();
      const msg = `Your warranty for ${asset.brand} ${asset.assetName} expired today. Protect it with an Extended Warranty or AMC contract.`;
      await triggerAlert(user, asset, 'warranty', `🔴 Warranty Expired: ${asset.brand} ${asset.assetName}`, msg, 'urgent', { daysRemaining: 0 });
    } else if (reminderDays.includes(diffDays) || diffDays <= 30) {
      if (diffDays <= 30 && warranty.status === 'active') {
        warranty.status = 'expires-soon';
        await warranty.save();
      }
      
      const urgency = diffDays <= 3 ? 'urgent' : diffDays <= 7 ? 'high' : 'medium';
      const msg = `Your warranty for ${asset.brand} ${asset.assetName} expires in ${diffDays} day${diffDays > 1 ? 's' : ''} (${endDate.toLocaleDateString()}). File any pending claims now.`;
      await triggerAlert(user, asset, 'warranty', `⚠️ Warranty Expiring Soon: ${asset.brand} ${asset.assetName} (${diffDays}d remaining)`, msg, urgency, { daysRemaining: diffDays });
    }
  }

  // 2. Check Upcoming Scheduled Services
  const services = await Service.find();
  for (const srv of services) {
    if (!srv.nextServiceDate) continue;
    const details = await getAssetDetails(srv.assetId);
    if (!details) continue;
    const { asset, user } = details;

    const nextDate = new Date(srv.nextServiceDate);
    nextDate.setHours(0, 0, 0, 0);

    const diffTime = nextDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      await triggerAlert(user, asset, 'service', `🛠️ Service Due Today: ${asset.brand} ${asset.assetName}`, `Scheduled routine service for ${asset.assetName} is due today with ${srv.provider || 'service technician'}.`, 'urgent');
    } else if (diffDays === 7 || diffDays === 1) {
      await triggerAlert(user, asset, 'service', `🔧 Service Reminder: ${asset.brand} ${asset.assetName}`, `Upcoming maintenance service is scheduled in ${diffDays} day${diffDays > 1 ? 's' : ''}.`, 'medium');
    }
  }

  // 3. Check AMCs
  const amcs = await AMC.find();
  for (const amc of amcs) {
    const details = await getAssetDetails(amc.assetId);
    if (!details) continue;
    const { asset, user } = details;

    const endDate = new Date(amc.endDate);
    endDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7 && diffDays >= 0) {
      await triggerAlert(user, asset, 'amc', `📄 AMC Renewal Reminder: ${asset.assetName}`, `Annual Maintenance Contract with ${amc.provider} expires in ${diffDays} days.`, 'medium');
    }
  }
};

const startScheduler = () => {
  // Run once every hour for proactive tracking
  cron.schedule('0 * * * *', checkExpirations);
  console.log('[Scheduler] Background lifecycle worker registered (hourly cron).');
  
  // Non-blocking immediate check on startup
  setTimeout(() => {
    checkExpirations().catch(err => console.error('[Scheduler] Startup check error:', err));
  }, 4000);
};

module.exports = { startScheduler, checkExpirations };
