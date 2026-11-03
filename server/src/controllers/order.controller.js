const orderService = require('../services/order.service');
const paymentService = require('../services/payment.service');

const createOrder = async (req, res) => {
  try {
    const { receiver_name, phone, address_line, city, payment_method } = req.body;
    if (!receiver_name || !phone || !address_line || !city) {
      return res.status(400).json({ error: { message: 'Vui lòng điền đủ thông tin nhận hàng' } });
    }
    const order = await orderService.createOrder(req.user.id, req.body);
    if (payment_method && payment_method !== 'cod') {
      try {
        const checkoutUrl = await paymentService.createPayment(order, req.ip);
        return res.status(201).json({ order, checkoutUrl });
      } catch (paymentError) {
        await orderService.rollbackUnpaidOrder(order.id);
        throw paymentError;
      }
    }
    res.status(201).json({ order, checkoutUrl: null });
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrdersByUserId(req.user.id);
    res.status(200).json(orders);
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.user.id, req.params.id, req.user.role);
    res.status(200).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await orderService.cancelOrder(req.user.id, req.params.id);
    res.status(200).json({ message: 'Đã hủy đơn hàng thành công', order });
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } });
  }
};

const adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.status(200).json({ message: 'Cập nhật trạng thái thành công', order });
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderDetail,
  cancelOrder,
  adminUpdateStatus,
};
