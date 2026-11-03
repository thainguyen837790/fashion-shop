import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import api from '../../api/axios';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setError('Không tìm thấy mã đơn hàng trong kết quả thanh toán.');
      setChecking(false);
      return undefined;
    }
    let active = true;
    let attempts = 0;
    let timer;
    const refresh = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`);
        if (!active) return;
        setOrder(response.data);
        if (response.data.payment_status === 'paid' || attempts >= 9) {
          setChecking(false);
          return;
        }
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.error?.message || 'Không tải được trạng thái đơn hàng. Hãy đăng nhập lại rồi xem đơn trong tài khoản.');
        setChecking(false);
        return;
      }
      attempts += 1;
      timer = window.setTimeout(refresh, 3000);
    };
    refresh();
    return () => { active = false; window.clearTimeout(timer); };
  }, [orderId]);

  const paid = order?.payment_status === 'paid';
  const failed = order?.status === 'cancelled';
  const Icon = paid ? CheckCircle2 : failed ? XCircle : Clock3;
  const title = paid ? 'Thanh toán thành công' : failed ? 'Đơn hàng đã bị hủy' : checking ? 'Đang xác nhận thanh toán' : 'Thanh toán đang chờ xác nhận';

  return (
    <section className="min-h-[65vh] bg-[#f7f8fa] px-4 py-16 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${paid ? 'bg-emerald-50 text-emerald-600' : failed ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
          <Icon className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-black text-gray-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          {error || (paid ? 'Cổng thanh toán đã xác nhận giao dịch. Đơn hàng của bạn đang được xử lý.' : 'Cổng thanh toán có thể cần thêm thời gian để gửi xác nhận. Trạng thái sẽ tự cập nhật tại đơn hàng.')}
        </p>
        {order && <p className="mt-4 inline-flex rounded-xl bg-gray-50 px-4 py-2 font-mono text-sm font-bold text-gray-800">Mã đơn #{order.id}</p>}
        {checking && <p className="mt-3 text-xs text-gray-400">Đang kiểm tra trạng thái…</p>}
        <div className="mt-7 flex justify-center gap-3">
          <Link to="/account?tab=orders" className="rounded-full bg-black px-6 py-3 text-xs font-bold text-white">Xem đơn hàng</Link>
          <Link to="/" className="rounded-full border border-gray-200 px-6 py-3 text-xs font-bold text-gray-800">Tiếp tục mua sắm</Link>
        </div>
      </div>
    </section>
  );
}
