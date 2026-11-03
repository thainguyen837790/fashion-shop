const prisma = require('../db/prisma');
const { predictSentiment } = require('../services/sentiment.service');

const getReviews = async (req, res) => {
    try {
        const rawProductId = req.query.product_id || req.params.id;
        const where = { is_hidden: false };
        if (rawProductId) {
            where.product_id = Number(rawProductId);
        }

        const reviews = await prisma.review.findMany({
            where,
            include: {
                user: { select: { id: true, full_name: true } },
                product: { select: { id: true, name: true, slug: true } },
                aspects: true,
            },
            orderBy: { created_at: 'desc' },
        });

        return res.status(200).json({ items: reviews, total: reviews.length });
    } catch (err) {
        return res.status(500).json({ error: { message: err.message } });
    }
};

const createReview = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: { message: 'Vui lòng đăng nhập để gửi đánh giá' } });
        }

        const rawProductId = req.body.product_id || req.params.id;
        const { order_item_id, rating, content } = req.body;

        if (!rawProductId || !rating || !content || !content.trim()) {
            return res.status(400).json({ error: { message: 'Vui lòng cung cấp đầy đủ số sao và nội dung đánh giá' } });
        }

        const productId = Number(rawProductId);
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: { message: 'Sản phẩm không tồn tại' } });
        }

        // Kiểm tra nếu có order_item_id mà đã từng được đánh giá
        if (order_item_id) {
            const existing = await prisma.review.findFirst({
                where: { order_item_id: Number(order_item_id) }
            });
            if (existing) {
                return res.status(400).json({ error: { message: 'Sản phẩm trong đơn hàng này đã được đánh giá trước đó' } });
            }
        }

        const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
        let sentiment;
        try {
            sentiment = await predictSentiment(content.trim());
        } catch (analysisError) {
            console.error('Không phân tích được cảm xúc đánh giá:', analysisError.message);
            return res.status(503).json({
                error: { message: 'Dịch vụ phân tích cảm xúc hiện không khả dụng. Vui lòng thử gửi đánh giá lại sau.' }
            });
        }

        const review = await prisma.review.create({
            data: {
                user_id: userId,
                product_id: productId,
                order_item_id: order_item_id ? Number(order_item_id) : null,
                rating: numRating,
                content: content.trim(),
                sentiment_label: sentiment.label,
                sentiment_score: sentiment.score,
                analysis_status: 'done',
                model_version: sentiment.modelVersion || 'phobert-fashion-v1',
                analyzed_at: new Date(),
                aspects: sentiment.aspects?.length ? {
                    create: sentiment.aspects.map((aspect) => ({
                        aspect: aspect.aspect,
                        sentiment_label: aspect.label,
                        score: aspect.score,
                    })),
                } : undefined,
            },
            include: {
                user: { select: { id: true, full_name: true } },
                product: { select: { id: true, name: true, slug: true } },
                aspects: true,
            },
        });

        return res.status(201).json(review);
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: { message: 'Đơn hàng này đã được đánh giá rồi' } });
        }
        return res.status(500).json({ error: { message: err.message || 'Lỗi khi lưu đánh giá' } });
    }
};

module.exports = { getReviews, createReview };
