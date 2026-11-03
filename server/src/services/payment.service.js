const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../db/prisma');

const hmac = (algorithm, key, value) => crypto.createHmac(algorithm, key).update(value).digest('hex');
const safeEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left.toLowerCase());
  const b = Buffer.from(right.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const fail = (message, status = 503) => Object.assign(new Error(message), { status });
const frontendUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
const resultUrl = (provider, orderId) => `${frontendUrl()}/payment/result?provider=${provider}&orderId=${orderId}`;

const createVnpay = (order, ip) => {
  const { VNPAY_TMN_CODE: tmnCode, VNPAY_HASH_SECRET: secret } = process.env;
  if (!tmnCode || !secret) throw fail('VNPay chưa được cấu hình khóa merchant trong server/.env');
  const now = new Date();
  const format = (date) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
    return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
  };
  const params = {
    vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: tmnCode,
    vnp_Amount: String(Math.round(Number(order.total_amount) * 100)), vnp_CurrCode: 'VND',
    vnp_TxnRef: String(order.id), vnp_OrderInfo: `Thanh toan don hang ${order.id}`,
    vnp_OrderType: 'other', vnp_Locale: 'vn',
    vnp_ReturnUrl: `${process.env.API_URL || 'http://localhost:5000'}/api/payments/vnpay/return`,
    vnp_IpAddr: (ip || '').replace('::ffff:', '').slice(0, 45),
    vnp_CreateDate: format(now), vnp_ExpireDate: format(new Date(now.getTime() + 15 * 60 * 1000)),
  };
  const sorted = Object.keys(params).sort().map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`).join('&');
  const signature = hmac('sha512', secret, sorted);
  const query = `${sorted}&vnp_SecureHash=${signature}`;
  return `${process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'}?${query}`;
};

const createMomo = async (order) => {
  const { MOMO_PARTNER_CODE: partnerCode, MOMO_ACCESS_KEY: accessKey, MOMO_SECRET_KEY: secret } = process.env;
  if (!partnerCode || !accessKey || !secret || !process.env.MOMO_IPN_URL) {
    throw fail('Thiếu MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY hoặc MOMO_IPN_URL trong server/.env. MOMO_IPN_URL phải là HTTPS công khai.');
  }
  const orderId = String(order.id);
  const requestId = `${order.id}-${Date.now()}`;
  const amount = String(Math.round(Number(order.total_amount)));
  const redirectUrl = resultUrl('momo', order.id);
  const ipnUrl = process.env.MOMO_IPN_URL;
  const orderInfo = `Thanh toan don hang ${order.id}`;
  const requestType = process.env.MOMO_REQUEST_TYPE || 'captureWallet';
  const extraData = '';
  const raw = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const payload = { partnerCode, requestId, amount, orderId, orderInfo, redirectUrl, ipnUrl, requestType, extraData, lang: 'vi', signature: hmac('sha256', secret, raw) };
  const response = await axios.post(process.env.MOMO_CREATE_URL || 'https://test-payment.momo.vn/v2/gateway/api/create', payload, { timeout: 15000 });
  if (Number(response.data?.resultCode) !== 0 || !response.data?.payUrl) throw fail(response.data?.message || 'MoMo không tạo được liên kết thanh toán', 502);
  return response.data.payUrl;
};

const createZaloPay = async (order) => {
  const { ZALOPAY_APP_ID: appId, ZALOPAY_KEY1: key1, ZALOPAY_KEY2: key2 } = process.env;
  if (!appId || !key1 || !key2 || !process.env.ZALOPAY_CALLBACK_URL) throw fail('ZaloPay chưa cấu hình đủ thông tin merchant/callback trong server/.env');
  const appTransId = `${new Date().toISOString().slice(2, 10).replace(/-/g, '')}_${order.id}`;
  const appTime = Date.now();
  const amount = Math.round(Number(order.total_amount));
  const embedData = JSON.stringify({ preferred_payment_method: [], redirecturl: resultUrl('zalopay', order.id) });
  const item = '[]';
  const appUser = `user_${order.user_id}`;
  const macInput = [appId, appTransId, appUser, amount, appTime, embedData, item].join('|');
  const body = new URLSearchParams({
    app_id: appId, app_trans_id: appTransId, app_user: appUser, app_time: String(appTime),
    amount: String(amount), item, embed_data: embedData, description: `Thanh toan don hang ${order.id}`,
    callback_url: process.env.ZALOPAY_CALLBACK_URL, mac: hmac('sha256', key1, macInput),
  });
  const response = await axios.post(process.env.ZALOPAY_CREATE_URL || 'https://sb-openapi.zalopay.vn/v2/create', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000,
  });
  if (Number(response.data?.return_code) !== 1 || !response.data?.order_url) throw fail(response.data?.return_message || 'ZaloPay không tạo được liên kết thanh toán', 502);
  return response.data.order_url;
};

const createPayment = async (order, ip) => {
  if (order.payment_method === 'vnpay') return createVnpay(order, ip);
  if (order.payment_method === 'momo') return createMomo(order);
  if (order.payment_method === 'zalopay') return createZaloPay(order);
  throw fail('Phương thức thanh toán trực tuyến không được hỗ trợ', 400);
};

const markPaid = async (orderId, method, amount) => {
  const id = Number(orderId);
  if (!Number.isInteger(id)) return false;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.payment_method !== method || Math.round(Number(order.total_amount)) !== Number(amount)) return false;
  if (order.payment_status !== 'paid') {
    await prisma.order.updateMany({ where: { id, payment_status: 'unpaid', status: { not: 'cancelled' } }, data: { payment_status: 'paid' } });
  }
  return true;
};

const verifyVnpay = (query) => {
  const received = query.vnp_SecureHash;
  if (!received || !process.env.VNPAY_HASH_SECRET) return false;
  const params = { ...query };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  const sorted = Object.keys(params).sort().map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`).join('&');
  return safeEqual(received, hmac('sha512', process.env.VNPAY_HASH_SECRET, sorted));
};

const handleVnpayIpn = async (query) => {
  if (!verifyVnpay(query)) return { RspCode: '97', Message: 'Invalid signature' };
  const amount = Number(query.vnp_Amount) / 100;
  const order = await prisma.order.findUnique({ where: { id: Number(query.vnp_TxnRef) } });
  if (!order) return { RspCode: '01', Message: 'Order not found' };
  if (order.payment_status === 'paid') return { RspCode: '02', Message: 'Order already confirmed' };
  if (order.payment_method !== 'vnpay' || Math.round(Number(order.total_amount)) !== amount) return { RspCode: '04', Message: 'Invalid amount or method' };
  if (query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00') await markPaid(order.id, 'vnpay', amount);
  return { RspCode: '00', Message: 'Confirm Success' };
};

const handleMomoIpn = async (body) => {
  const { MOMO_ACCESS_KEY: accessKey, MOMO_SECRET_KEY: secret, MOMO_PARTNER_CODE: partnerCode } = process.env;
  if (!secret || !accessKey || body.partnerCode !== partnerCode) return false;
  const raw = `accessKey=${accessKey}&amount=${body.amount}&extraData=${body.extraData || ''}&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}&requestId=${body.requestId}&responseTime=${body.responseTime}&resultCode=${body.resultCode}&transId=${body.transId}`;
  if (!safeEqual(body.signature, hmac('sha256', secret, raw))) return false;
  if (Number(body.resultCode) !== 0) return true;
  return markPaid(body.orderId, 'momo', body.amount);
};

const handleZaloCallback = async (body) => {
  if (!process.env.ZALOPAY_KEY2 || !body?.data || !safeEqual(body.mac, hmac('sha256', process.env.ZALOPAY_KEY2, body.data))) return false;
  const data = JSON.parse(body.data);
  if (String(data.app_id) !== String(process.env.ZALOPAY_APP_ID)) return false;
  const orderId = String(data.app_trans_id || '').split('_').pop();
  return markPaid(orderId, 'zalopay', data.amount);
};

module.exports = { createPayment, verifyVnpay, handleVnpayIpn, handleMomoIpn, handleZaloCallback };
