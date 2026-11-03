const axios = require('axios');

const predictSentiment = async (text) => {
  const serviceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  const internalKey = process.env.INTERNAL_API_KEY || 'fashion_secret_key_2026';
  const { data } = await axios.post(
    `${serviceUrl.replace(/\/$/, '')}/predict`,
    { text },
    {
      headers: { 'x-internal-key': internalKey },
      timeout: 30000,
    }
  );

  if (!['positive', 'negative'].includes(data.label) || !Number.isFinite(data.score)) {
    throw new Error('AI service trả về kết quả cảm xúc không hợp lệ.');
  }
  return data;
};

module.exports = { predictSentiment };
