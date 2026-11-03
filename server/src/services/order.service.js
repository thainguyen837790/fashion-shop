const prisma = require('../db/prisma');

const createOrder = async (userId, orderData) => {
  const { receiver_name, phone, address_line, city, payment_method = 'cod', selected_item_ids } = orderData;

  // Lấy giỏ hàng của user
  const cart = await prisma.cart.findUnique({
    where: { user_id: userId },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    const err = new Error('Giỏ hàng đang trống');
    err.status = 400;
    throw err;
  }

  // Lọc sản phẩm được chọn nếu có
  let itemsToOrder = cart.items;
  if (Array.isArray(selected_item_ids) && selected_item_ids.length > 0) {
    itemsToOrder = cart.items.filter((item) => selected_item_ids.includes(item.id));
  }

  if (itemsToOrder.length === 0) {
    const err = new Error('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
    err.status = 400;
    throw err;
  }

  // Đảm bảo phương thức thanh toán hợp lệ với enum của Prisma
  if (!['cod', 'vnpay', 'momo', 'zalopay'].includes(payment_method)) {
    const err = new Error('Phương thức thanh toán không hợp lệ');
    err.status = 400;
    throw err;
  }
  const validPaymentMethod = payment_method;

  // Thực thi Transaction để trừ tồn kho và tạo đơn an toàn
  return prisma.$transaction(async (tx) => {
    let totalAmount = 0;

    // 1. Kiểm tra tồn kho cho các mặt hàng được đặt
    for (const item of itemsToOrder) {
      if (item.variant.stock < item.quantity) {
        throw new Error(
          `Sản phẩm "${item.variant.product.name}" (${item.variant.size}-${item.variant.color}) không đủ hàng`
        );
      }
      totalAmount += Number(item.variant.price) * item.quantity;
    }

    // 2. Tạo đơn hàng
    const order = await tx.order.create({
      data: {
        user_id: userId,
        receiver_name,
        phone,
        address_line,
        city,
        payment_method: validPaymentMethod,
        payment_status: 'unpaid',
        status: 'pending',
        total_amount: totalAmount,
        items: {
          create: itemsToOrder.map((item) => ({
            variant_id: item.variant_id,
            product_name: `${item.variant.product.name} (${item.variant.color} / ${item.variant.size})`,
            unit_price: item.variant.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // 3. Trừ tồn kho
    for (const item of itemsToOrder) {
      await tx.productVariant.update({
        where: { id: item.variant_id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 4. Xóa các mặt hàng đã đặt khỏi giỏ hàng
    const orderedItemIds = itemsToOrder.map((item) => item.id);
    await tx.cartItem.deleteMany({
      where: { id: { in: orderedItemIds } },
    });

    return order;
  });
};

const getOrdersByUserId = async (userId) => {
  return prisma.order.findMany({
    where: { user_id: userId },
    include: {
      items: {
        include: {
          review: true,
          variant: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sort_order: 'asc' } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
};

const rollbackUnpaidOrder = async (orderId) => prisma.$transaction(async (tx) => {
  const order = await tx.order.findUnique({ where: { id: Number(orderId) }, include: { items: true } });
  if (!order || order.payment_status === 'paid' || order.status === 'cancelled') return;
  const cart = await tx.cart.upsert({ where: { user_id: order.user_id }, create: { user_id: order.user_id }, update: {} });
  for (const item of order.items) {
    await tx.productVariant.update({ where: { id: item.variant_id }, data: { stock: { increment: item.quantity } } });
    const existing = await tx.cartItem.findFirst({ where: { cart_id: cart.id, variant_id: item.variant_id } });
    if (existing) {
      await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: { increment: item.quantity } } });
    } else {
      await tx.cartItem.create({ data: { cart_id: cart.id, variant_id: item.variant_id, quantity: item.quantity } });
    }
  }
  await tx.order.update({ where: { id: order.id }, data: { status: 'cancelled' } });
});

const getOrderById = async (userId, orderId, role) => {
  const where = { id: parseInt(orderId) };
  if (role !== 'admin') {
    where.user_id = userId;
  }

  const order = await prisma.order.findFirst({
    where,
    include: {
      items: {
        include: {
          review: true,
          variant: {
            include: {
              product: {
                include: {
                  images: { orderBy: { sort_order: 'asc' } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    const err = new Error('Không tìm thấy đơn hàng');
    err.status = 404;
    throw err;
  }

  return order;
};

const cancelOrder = async (userId, orderId) => {
  const order = await prisma.order.findFirst({
    where: { id: parseInt(orderId), user_id: userId },
    include: { items: true },
  });

  if (!order) {
    const err = new Error('Không tìm thấy đơn hàng');
    err.status = 404;
    throw err;
  }

  if (order.status !== 'pending') {
    const err = new Error('Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xử lý');
    err.status = 400;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variant_id },
        data: { stock: { increment: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
    });
  });
};

const updateOrderStatus = async (orderId, status) => {
  return prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { status },
  });
};

module.exports = {
  createOrder,
  rollbackUnpaidOrder,
  getOrdersByUserId,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
};
