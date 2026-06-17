const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Warranty = require('../models/Warranty');
const Insurance = require('../models/Insurance');
const AMC = require('../models/AMC');
const Service = require('../models/Service');
const Asset = require('../models/Asset');
const User = require('../models/User');
const Notification = require('../models/Notification');

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
    return null; // Return null if SMTP keys not provided
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
      from: `"WarrantyHub Alerts" <${process.env.EMAIL_USER}>`,
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
  console.log('Running daily asset lifecycle check...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to get user and asset
  const getAssetDetails = async (assetId) => {
    const asset = await Asset.findById(assetId);
    if (!asset) return null;
    const user = await User.findById(asset.userId);
    return { asset, user };
  };

  // Helper to save notifications & send emails
  const triggerAlert = async (user, asset, type, title, message) => {
    try {
      // 1. Create In-App Notification
      await Notification.create({
        userId: user._id,
        title: title,
        message: message,
        type: type
      });

      // 2. Send Email
      await sendEmailAlert(user.email, title, message);

      // 3. Send SMS Alert
      if (user.phone) {
        await sendSMSAlert(user.phone, `${title}: ${message}`);
      }
    } catch (err) {
      console.error('Error triggering alert:', err);
    }
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

    let alertTriggered = false;
    let message = '';

    if (diffDays <= 0) {
      warranty.status = 'expired';
      await warranty.save();
      message = `Your warranty for ${asset.assetName} (${asset.brand}) has expired.`;
      await triggerAlert(user, asset, 'warranty', `Warranty Expired: ${asset.assetName}`, message);
    } else if ([30, 15, 7, 1].includes(diffDays)) {
      if (diffDays <= 30 && warranty.status === 'active') {
        warranty.status = 'expires-soon';
        await warranty.save();
      }
      message = `Your warranty for ${asset.assetName} (${asset.brand}) expires in ${diffDays} day${diffDays > 1 ? 's' : ''}. Consider renewing or extending it.`;
      await triggerAlert(user, asset, 'warranty', `Warranty Expiring Soon: ${asset.assetName}`, message);
    }
  }

  // 2. Check Insurance Policies
  const insurances = await Insurance.find();
  for (const ins of insurances) {
    const details = await getAssetDetails(ins.assetId);
    if (!details) continue;
    const { asset, user } = details;

    const expiryDate = new Date(ins.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      await triggerAlert(user, asset, 'insurance', `Insurance Lapsed: ${asset.assetName}`, `Your insurance policy ${ins.policyNumber} for ${asset.assetName} has expired today.`);
    } else if ([30, 15, 7, 1].includes(diffDays)) {
      await triggerAlert(user, asset, 'insurance', `Insurance Expiring Soon: ${asset.assetName}`, `Your insurance policy ${ins.policyNumber} for ${asset.assetName} expires in ${diffDays} day${diffDays > 1 ? 's' : ''}.`);
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

    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      await triggerAlert(user, asset, 'amc', `AMC Contract Expired: ${asset.assetName}`, `Your Annual Maintenance Contract (AMC) for ${asset.assetName} with ${amc.provider} has expired.`);
    } else if ([30, 15, 7, 1].includes(diffDays)) {
      await triggerAlert(user, asset, 'amc', `AMC Renewal Due: ${asset.assetName}`, `Your AMC contract for ${asset.assetName} is due for renewal in ${diffDays} day${diffDays > 1 ? 's' : ''}.`);
    }
  }

  // 4. Check Upcoming Services
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
      await triggerAlert(user, asset, 'service', `Service Due Today: ${asset.assetName}`, `Your scheduled service for ${asset.assetName} is due today.`);
    } else if ([3, 1].includes(diffDays)) {
      await triggerAlert(user, asset, 'service', `Upcoming Service Reminder: ${asset.assetName}`, `Your scheduled service for ${asset.assetName} is due in ${diffDays} day${diffDays > 1 ? 's' : ''}.`);
    }
  }
};

// Start Cron Job: Run every day at 12:00 AM (0 0 * * *)
// For testing and demo, we also run it immediately when the server starts
const startScheduler = () => {
  cron.schedule('0 0 * * *', checkExpirations);
  console.log('Daily cron scheduler registered.');
  
  // Run an immediate check in the background on startup (non-blocking)
  setTimeout(() => {
    checkExpirations().catch(err => console.error('Error in initial scheduler check:', err));
  }, 5000);
};

module.exports = { startScheduler, checkExpirations };
