// services/GoogleAdsService.js
const { GoogleAdsApi } = require('google-ads-api');
require('dotenv').config();

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID,
  login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

async function getDailyStats() {
  try {
    const results = await customer.report({
      entity: 'campaign',
      attributes: [
        'campaign.id',
        'campaign.name',
        'metrics.cost_micros', // Расходы в микро-единицах
        'metrics.clicks',
        'metrics.impressions',
      ],
      constraints: {
        'segments.date': 'DURING LAST_30_DAYS', // Берем данные за 30 дней
      },
      limit: 10,
    });

    return results.map(row => ({
      name: row.campaign.name,
      // Превращаем микро-валюту в обычную (делим на 1 000 000)
      cost: (row.metrics.cost_micros / 1000000).toFixed(2),
      clicks: row.metrics.clicks,
      impressions: row.metrics.impressions,
    }));
  } catch (error) {
    console.error("Ошибка сервиса:", error);
    throw error;
  }
}

module.exports = { getDailyStats };