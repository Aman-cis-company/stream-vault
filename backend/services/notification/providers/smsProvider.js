const twilio = require('twilio');
const logger = require('../../../src/config/logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
    logger.info('[Notification Service] Initialized Twilio client successfully');
  } catch (error) {
    logger.error('[Notification Service] Failed to initialize Twilio client:', { error: error.message });
  }
}

async function sendSms(to, body) {
  if (!client || !phoneNumber) {
    logger.warn('[Notification Service] Twilio is not fully configured. SMS outputted to console.', { to, body });
    console.log(`[SMS MOCK] To: ${to} | Body: ${body}`);
    return { mock: true, to, body };
  }
  try {
    const message = await client.messages.create({
      body,
      from: phoneNumber,
      to,
    });
    logger.info('[Notification Service] SMS sent successfully', { messageId: message.sid, to });
    return message;
  } catch (err) {
    logger.error('[Notification Service] Failed to send SMS via Twilio', { to, error: err.message });
    throw err;
  }
}

module.exports = { sendSms, isEnabled: !!(client && phoneNumber) };
