const express = require('express');
const paymentService = require('../services/payment.service');
const router = express.Router();

router.get('/vnpay/ipn', async (req, res) => {
  try { res.json(await paymentService.handleVnpayIpn(req.query)); }
  catch (error) { res.status(500).json({ RspCode: '99', Message: error.message }); }
});

router.get('/vnpay/return', (req, res) => {
  const frontend = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const orderId = paymentService.verifyVnpay(req.query) ? req.query.vnp_TxnRef : '';
  res.redirect(`${frontend}/payment/result?provider=vnpay&orderId=${encodeURIComponent(orderId)}`);
});

router.post('/momo/ipn', async (req, res) => {
  try {
    const valid = await paymentService.handleMomoIpn(req.body);
    res.status(valid ? 204 : 400).end();
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/zalopay/callback', async (req, res) => {
  try {
    const valid = await paymentService.handleZaloCallback(req.body);
    res.json(valid
      ? { return_code: 1, return_message: 'success' }
      : { return_code: 0, return_message: 'invalid callback' });
  } catch (error) { res.json({ return_code: 0, return_message: error.message }); }
});

module.exports = router;
