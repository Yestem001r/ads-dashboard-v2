const { GoogleAdsApi } = require("google-ads-api");

// 1. Настройка клиента
const client = new GoogleAdsApi({
  client_id: "ТВОЙ_OAUTH_CLIENT_ID.apps.googleusercontent.com", // Возьми в Google Cloud Console
  client_secret: "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",
  developer_token: "MnBbXhKTIRQjdt7WmPFzwA",
});

async function main() {
  // 2. Настройка конкретного аккаунта
  const customer = client.Customer({
    customer_id: "3752704717", // Аккаунт с Campaign #1
    login_customer_id: "8606328142", // Твой MCC
    refresh_token: "ТВОЙ_REFRESH_TOKEN", // Нужно получить один раз
  });

  try {
    // 3. Запрос данных
    const campaigns = await customer.report({
      entity: "campaign",
      attributes: ["campaign.id", "campaign.name", "campaign.status"],
      limit: 10,
    });

    console.log("Данные получены успешно:");
    console.log(JSON.stringify(campaigns, null, 2));
  } catch (error) {
    console.error("Ошибка при запросе к Google Ads:", error);
  }
}

main();