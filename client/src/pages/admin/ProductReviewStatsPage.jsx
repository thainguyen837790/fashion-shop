import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Frown, LoaderCircle, MessageSquareText, Smile, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';

const sentimentLabel = (label) => {
  if (label === 'positive') return { text: 'Tích cực', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: Smile };
  if (label === 'negative') return { text: 'Tiêu cực', className: 'bg-rose-50 text-rose-700 border-rose-200', Icon: Frown };
  return { text: 'Chưa phân tích', className: 'bg-gray-50 text-gray-500 border-gray-200', Icon: MessageSquareText };
};

export default function ProductReviewStatsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/admin/products/${id}/review-stats`)
      .then((response) => { if (active) setData(response.data); })
      .catch((err) => { if (active) setError(err.response?.data?.error?.message || 'Không tải được thống kê sản phẩm.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const totalClassified = (data?.sentimentStats?.positive || 0) + (data?.sentimentStats?.negative || 0);
  const positivePercent = totalClassified ? Math.round((data.sentimentStats.positive / totalClassified) * 100) : 0;
  const negativePercent = totalClassified ? 100 - positivePercent : 0;
  const imageUrl = useMemo(() => data?.product?.images?.[0]?.url, [data]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center gap-3 text-sm font-semibold text-gray-500"><LoaderCircle className="h-5 w-5 animate-spin" /> Đang tải thống kê...</div>;
  }

  if (error || !data) {
    return <div className="mx-auto max-w-4xl px-5 py-12"><Link to="/admin" className="text-sm font-bold text-blue-600">← Về quản trị</Link><p role="alert" className="mt-6 rounded-2xl bg-rose-50 p-5 text-sm text-rose-700">{error || 'Không tìm thấy dữ liệu sản phẩm.'}</p></div>;
  }

  return (
    <div className="min-h-[75vh] bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black"><ArrowLeft className="h-4 w-4" /> Về trang quản trị</Link>

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            {imageUrl ? <img src={imageUrl} alt={data.product.name} className="h-24 w-20 rounded-2xl object-cover" /> : <div className="flex h-24 w-20 items-center justify-center rounded-2xl bg-gray-100"><Star className="h-7 w-7 text-gray-400" /></div>}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Thống kê bình luận theo sản phẩm</p>
              <h1 className="mt-1 text-2xl font-black text-gray-950">{data.product.name}</h1>
              <p className="mt-2 text-sm text-gray-500">{data.totalReviews} bình luận · Phân loại bằng PhoBERT</p>
            </div>
            <Link to={`/products/${data.product.slug || data.product.id}`} target="_blank" className="rounded-xl border border-gray-200 px-4 py-2.5 text-center text-xs font-bold text-gray-700 hover:bg-gray-50">Mở trang sản phẩm</Link>
          </div>

          <div className="border-t border-gray-100 px-6 py-6 sm:px-8">
            <div className="mb-3 flex items-center justify-between text-xs font-bold text-gray-600">
              <span>Phân bố cảm xúc trên {totalClassified} bình luận đã phân loại</span>
              <span>{positivePercent}% tích cực · {negativePercent}% tiêu cực</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
              <div className="bg-emerald-500 transition-all" style={{ width: `${positivePercent}%` }} />
              <div className="bg-rose-500 transition-all" style={{ width: `${negativePercent}%` }} />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-500">Tổng bình luận</p>
                <p className="mt-1 text-2xl font-black text-gray-950">{data.totalReviews}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-xs font-semibold text-emerald-700">Tích cực</p>
                <p className="mt-1 text-2xl font-black text-emerald-900">{data.sentimentStats.positive} <span className="text-sm font-bold">({positivePercent}%)</span></p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                <p className="text-xs font-semibold text-rose-700">Tiêu cực</p>
                <p className="mt-1 text-2xl font-black text-rose-900">{data.sentimentStats.negative} <span className="text-sm font-bold">({negativePercent}%)</span></p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5 sm:px-8">
            <h2 className="text-lg font-black text-gray-950">Bình luận của sản phẩm này</h2>
            <p className="mt-1 text-xs text-gray-500">Hiển thị tối đa 100 bình luận mới nhất cùng dự đoán và độ tin cậy của mô hình.</p>
          </div>
          {data.reviews.length ? (
            <div className="divide-y divide-gray-100">
              {data.reviews.map((review) => {
                const sentiment = sentimentLabel(review.sentiment_label);
                const Icon = sentiment.Icon;
                return (
                  <article key={review.id} className="p-5 sm:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">{review.user?.full_name || 'Khách hàng'}</p>
                        <p className="mt-1 text-xs text-gray-400">{new Date(review.created_at).toLocaleString('vi-VN')} · {review.rating} sao</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${sentiment.className}`}>
                          <Icon className="h-3.5 w-3.5" /> {sentiment.text}
                        </span>
                        {['positive', 'negative'].includes(review.sentiment_label) && Number.isFinite(Number(review.sentiment_score)) && <span className="text-xs font-semibold text-gray-500">Tin cậy {Math.round(review.sentiment_score * 100)}%</span>}
                        {review.is_hidden && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">Đã ẩn</span>}
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">{review.content}</p>
                  </article>
                );
              })}
            </div>
          ) : <div className="p-12 text-center text-sm text-gray-400">Sản phẩm này chưa có bình luận.</div>}
        </section>
      </div>
    </div>
  );
}
