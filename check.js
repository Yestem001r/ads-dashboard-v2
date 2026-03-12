require('dotenv').config();
const adsSdk = require('facebook-nodejs-business-sdk');

// Инициализируем API
try {
    const FacebookAdsApi = adsSdk.FacebookAdsApi.init(process.env.FB_ACCESS_TOKEN);
    const AdAccount = adsSdk.AdAccount;
    
    // Важно: ID должен быть с префиксом act_
    const accountId = process.env.FB_AD_ACCOUNT_ID;
    const account = new AdAccount(accountId);

    console.log(`\n--- 🔍 Проверка Meta API для аккаунта: ${accountId} ---`);

    // Пытаемся получить базовую инфу об аккаунте
    account.get(['name', 'account_status', 'currency'])
        .then((acc) => {
            console.log('✅ Связь успешно установлена!');
            console.log(`📌 Название аккаунта: ${acc.name}`);
            console.log(`📌 Валюта: ${acc.currency}`);
            
            const statusMap = {
                1: 'ACTIVE (Активен)',
                2: 'DISABLED (Отключен)',
                3: 'UNSETTLED (Есть долг)',
                7: 'PENDING_RISK_REVIEW (Проверка безопасности)',
                101: 'IN_GRACE_PERIOD (Льготный период)'
            };
            console.log(`📌 Статус: ${statusMap[acc.account_status] || acc.account_status}`);
            
            console.log('\n🚀 Теперь можешь смело обновлять server.js — доступ подтвержден.');
        })
        .catch((error) => {
            console.error('\n❌ Ошибка при запросе к Meta:');
            // Выводим детальную ошибку от Facebook
            if (error.response && error.response.error) {
                console.error(`Сообщение: ${error.response.error.message}`);
                console.error(`Тип: ${error.response.error.type}`);
                console.error(`Код: ${error.response.error.code}`);
            } else {
                console.error(error.message);
            }
            console.log('\n💡 Совет: проверь, что в .env ID аккаунта начинается с "act_"');
        });

} catch (e) {
    console.error('❌ Ошибка инициализации SDK:', e.message);
}