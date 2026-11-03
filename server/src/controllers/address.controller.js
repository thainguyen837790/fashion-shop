const prisma = require('../db/prisma');

// 1. Lấy danh sách địa chỉ của user
const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const addresses = await prisma.address.findMany({
      where: { user_id: userId },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
    return res.status(200).json(addresses);
  } catch (err) {
    return res.status(500).json({ error: { message: 'Lỗi lấy danh sách địa chỉ' } });
  }
};

// 2. Thêm địa chỉ mới
const createAddress = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { recipient, phone, province, district, ward, street, is_default } = req.body;

    if (!recipient || !phone || !street) {
      return res.status(400).json({ error: { message: 'Vui lòng nhập đầy đủ tên, SĐT và địa chỉ' } });
    }

    // Nếu đặt là mặc định hoặc là địa chỉ đầu tiên, gỡ mặc định các địa chỉ khác
    const count = await prisma.address.count({ where: { user_id: userId } });
    const makeDefault = is_default || count === 0;

    if (makeDefault) {
      await prisma.address.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        user_id: userId,
        recipient: recipient.trim(),
        phone: phone.trim(),
        province: province || '',
        district: district || '',
        ward: ward || '',
        street: street.trim(),
        is_default: makeDefault,
      },
    });

    return res.status(201).json(newAddress);
  } catch (err) {
    return res.status(500).json({ error: { message: 'Không thể thêm địa chỉ' } });
  }
};

// 3. Cập nhật địa chỉ
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const addressId = parseInt(req.params.id);
    const { recipient, phone, province, district, ward, street, is_default } = req.body;

    if (is_default) {
      await prisma.address.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: addressId },
      data: {
        recipient,
        phone,
        province,
        district,
        ward,
        street,
        is_default: is_default !== undefined ? is_default : undefined,
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ error: { message: 'Không thể cập nhật địa chỉ' } });
  }
};

// 4. Xóa địa chỉ
const deleteAddress = async (req, res) => {
  try {
    const addressId = parseInt(req.params.id);
    await prisma.address.delete({ where: { id: addressId } });
    return res.status(200).json({ message: 'Đã xóa địa chỉ' });
  } catch (err) {
    return res.status(500).json({ error: { message: 'Không thể xóa địa chỉ' } });
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
