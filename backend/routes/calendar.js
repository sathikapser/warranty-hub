const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Warranty = require('../models/Warranty');
const Service = require('../models/Service');
const AMC = require('../models/AMC');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const getWorkspaceUserIds = async (user) => {
  const ownerId = user.familyWorkspaceOwnerId || user._id;
  const members = await User.find({ familyWorkspaceOwnerId: ownerId });
  return [ownerId, ...members.map(m => m._id)];
};

// Helper: Format date for iCalendar format (YYYYMMDDTHHmmssZ)
const formatICSDate = (date) => {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// @desc    Get structured calendar events (for Google/Outlook links)
// @route   GET /api/calendar/events
// @access  Private
router.get('/events', protect, async (req, res) => {
  try {
    const workspaceIds = await getWorkspaceUserIds(req.user);
    const assets = await Asset.find({ userId: { $in: workspaceIds } });
    const events = [];

    for (const asset of assets) {
      // 1. Warranty Expiry Event
      const warranty = await Warranty.findOne({ assetId: asset._id });
      if (warranty && warranty.endDate) {
        const endDate = new Date(warranty.endDate);
        events.push({
          id: `w_${warranty._id}`,
          title: `🛡️ Warranty Expiry: ${asset.brand} ${asset.assetName}`,
          date: endDate.toISOString().split('T')[0],
          type: 'warranty',
          assetId: asset._id,
          assetName: asset.assetName,
          brand: asset.brand,
          description: `Warranty for ${asset.brand} ${asset.assetName} (Serial: ${asset.serialNumber || 'N/A'}) expires on this date.`,
          googleUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Warranty Expiry: ${asset.brand} ${asset.assetName}`)}&dates=${formatICSDate(endDate)}/${formatICSDate(new Date(endDate.getTime() + 3600000))}&details=${encodeURIComponent(`Warranty expires for ${asset.brand} ${asset.assetName}. Serial: ${asset.serialNumber || 'N/A'}`)}`
        });
      }

      // 2. Next Service Event
      const services = await Service.find({ assetId: asset._id, nextServiceDate: { $exists: true, $ne: null } });
      services.forEach(srv => {
        const sDate = new Date(srv.nextServiceDate);
        events.push({
          id: `s_${srv._id}`,
          title: `🛠️ Scheduled Service: ${asset.brand} ${asset.assetName}`,
          date: sDate.toISOString().split('T')[0],
          type: 'service',
          assetId: asset._id,
          assetName: asset.assetName,
          brand: asset.brand,
          description: `Scheduled maintenance checkup for ${asset.assetName} with ${srv.provider || 'service technician'}.`,
          googleUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Service Due: ${asset.brand} ${asset.assetName}`)}&dates=${formatICSDate(sDate)}/${formatICSDate(new Date(sDate.getTime() + 3600000))}&details=${encodeURIComponent(`Routine maintenance for ${asset.brand} ${asset.assetName}`)}`
        });
      });

      // 3. AMC Renewal Event
      const amc = await AMC.findOne({ assetId: asset._id });
      if (amc && amc.endDate) {
        const amcDate = new Date(amc.endDate);
        events.push({
          id: `amc_${amc._id}`,
          title: `📄 AMC Renewal: ${asset.brand} ${asset.assetName}`,
          date: amcDate.toISOString().split('T')[0],
          type: 'amc',
          assetId: asset._id,
          assetName: asset.assetName,
          brand: asset.brand,
          description: `AMC Contract with ${amc.provider || 'vendor'} expires today.`,
          googleUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`AMC Renewal: ${asset.brand} ${asset.assetName}`)}&dates=${formatICSDate(amcDate)}/${formatICSDate(new Date(amcDate.getTime() + 3600000))}&details=${encodeURIComponent(`AMC renewal due with ${amc.provider}`)}`
        });
      }
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Download standard iCalendar (.ics) file
// @route   GET /api/calendar/export-ics
// @access  Private
router.get('/export-ics', protect, async (req, res) => {
  try {
    const workspaceIds = await getWorkspaceUserIds(req.user);
    const assets = await Asset.find({ userId: { $in: workspaceIds } });

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//WarrantyHub Platform//WarrantyHub 2.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:WarrantyHub Reminders',
      'X-WR-TIMEZONE:UTC'
    ];

    for (const asset of assets) {
      const warranty = await Warranty.findOne({ assetId: asset._id });
      if (warranty && warranty.endDate) {
        const endDate = new Date(warranty.endDate);
        const stamp = formatICSDate(new Date());
        const start = formatICSDate(endDate);
        const end = formatICSDate(new Date(endDate.getTime() + 3600000));

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:warranty-${warranty._id}@warrantyhub.app`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${start}`,
          `DTEND:${end}`,
          `SUMMARY:🛡️ Warranty Expiry: ${asset.brand} ${asset.assetName}`,
          `DESCRIPTION:Warranty for ${asset.brand} ${asset.assetName} (Serial: ${asset.serialNumber || 'N/A'}) expires on this date. Review coverage or request extension.`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      }
    }

    icsContent.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="warrantyhub-calendar.ics"');
    res.send(icsContent.join('\r\n'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
