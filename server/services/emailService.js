const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;
if (config.isEmailConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.email.user, pass: config.email.pass }
  });
}

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const eventDate = (event) => {
  if (!event?.date) return 'Date to be announced';
  const date = new Date(event.date);
  return Number.isNaN(date.getTime()) ? String(event.date) : date.toLocaleDateString();
};

const sendMail = async (mailOptions, description) => {
  if (!transporter) {
    console.log(`Email not configured. Skipping ${description}.`);
    return false;
  }
  await transporter.sendMail(mailOptions);
  console.log(`${description} sent to ${mailOptions.to}`);
  return true;
};

const sendBookingConfirmation = async (booking, event, user) => {
  if (!user?.email || !event) return false;
  const seatLabels = (booking.seats || []).map((seat) => seat.seatLabel).join(', ');
  const venue = event.venue?.name || 'Venue to be announced';
  const html = `
    <h2>Booking Confirmed</h2>
    <p>Dear ${escapeHtml(user.name)},</p>
    <p>Your booking for <strong>${escapeHtml(event.title)}</strong> is confirmed.</p>
    <p><strong>Booking reference:</strong> ${escapeHtml(booking.bookingReference)}</p>
    <p><strong>Venue:</strong> ${escapeHtml(venue)}<br>
    <strong>Date:</strong> ${escapeHtml(eventDate(event))}<br>
    <strong>Time:</strong> ${escapeHtml(event.startTime || 'To be announced')}<br>
    <strong>Seats:</strong> ${escapeHtml(seatLabels)}<br>
    <strong>Total:</strong> ₹${Number(booking.totalAmount || 0).toFixed(2)}</p>
    <p>Your QR ticket is attached and embedded below.</p>
    ${booking.qrCode ? '<p><img src="cid:qrcode" alt="Booking QR code" width="220" /></p>' : ''}
  `;
  const attachments = [];
  if (booking.qrCode) {
    const base64Data = booking.qrCode.split(',')[1];
    attachments.push({ filename: 'ticket-qr.png', content: base64Data, encoding: 'base64', cid: 'qrcode' });
  }
  return sendMail({
    from: config.email.user,
    to: user.email,
    subject: `Booking Confirmation - ${event.title}`,
    html,
    attachments
  }, 'Booking confirmation email');
};

const sendWaitlistOffer = async (waitlistEntry, event, user, rawToken) => {
  if (!user?.email || !event || !rawToken) return false;
  const claimUrl = `${config.clientUrl}/waitlist?entry=${waitlistEntry._id}&token=${encodeURIComponent(rawToken)}`;
  const html = `
    <h2>Seat Available from the Waitlist</h2>
    <p>Dear ${escapeHtml(user.name)},</p>
    <p>A seat (${escapeHtml(waitlistEntry.offeredSeat)}) in the ${escapeHtml(waitlistEntry.category)} category is available for <strong>${escapeHtml(event.title)}</strong>.</p>
    <p>This secure offer expires in ${config.waitlistOfferMinutes} minutes.</p>
    <p><a href="${claimUrl}">Claim your seat</a></p>
  `;
  return sendMail({
    from: config.email.user,
    to: user.email,
    subject: `Seat Available for ${event.title}`,
    html
  }, 'Waitlist offer email');
};

const sendWaitlistOfferExpired = async (waitlistEntry, event, user) => {
  if (!user?.email || !event) return false;
  return sendMail({
    from: config.email.user,
    to: user.email,
    subject: `Waitlist offer expired - ${event.title}`,
    html: `<p>Dear ${escapeHtml(user.name)},</p><p>Your waitlist offer for ${escapeHtml(event.title)} expired before it was claimed. The seat has been offered to the next eligible customer.</p>`
  }, 'Waitlist expiry email');
};

module.exports = {
  sendBookingConfirmation,
  sendWaitlistOffer,
  sendWaitlistOfferExpired
};
