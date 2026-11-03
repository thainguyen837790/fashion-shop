CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    product_id INT NOT NULL REFERENCES products(id),
    order_item_id INT UNIQUE NOT NULL REFERENCES order_items(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    sentiment_label VARCHAR(20) CHECK (sentiment_label IN ('positive', 'negative')),
    sentiment_score NUMERIC(4, 3),
    analysis_status VARCHAR(20) DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'done', 'failed')),
    model_version VARCHAR(50),
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_aspects (
    id SERIAL PRIMARY KEY,
    review_id INT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    aspect VARCHAR(50) NOT NULL,
    sentiment_label VARCHAR(20) NOT NULL CHECK (sentiment_label IN ('positive', 'negative')),
    score NUMERIC(4, 3)
);

CREATE INDEX idx_reviews_product ON reviews(product_id, created_at);
CREATE INDEX idx_reviews_sentiment ON reviews(sentiment_label);
CREATE INDEX idx_aspects_filter ON review_aspects(aspect, sentiment_label);
