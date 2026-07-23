const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const API_KEY_GTC = process.env.API_KEY_GTC;

if (!TELEGRAM_TOKEN || !API_KEY_GTC) {
  console.error('Error: TELEGRAM_TOKEN atau API_KEY_GTC belum diisi!');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'Halo! Silakan kirimkan nomor HP (contoh: 08123456789) untuk cek nama/tagar.'
  );
});

bot.on('message', async (msg) => {
  const text = msg.text ? msg.text.trim() : '';

  if (text.startsWith('/')) return;

  if (!/^08\d{8,13}$/.test(text)) {
    return bot.sendMessage(
      msg.chat.id,
      'Format nomor tidak valid. Nomor harus berawalan 08 dan terdiri dari 10-15 digit angka.'
    );
  }

  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Sedang memproses pengecekan, mohon tunggu sebentar...');

  try {
    const response = await axios.post(
      'https://gtc.topupcuy.com/api/v1/check',
      {
        number: text,
        strategy: 'smart',
        wait: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY_GTC.trim()
        },
        timeout: 60000 // Beri waktu hingga 60 detik karena wait: true butuh waktu captcha
      }
    );

    const result = response.data;
    console.log('Respon API:', JSON.stringify(result));

    // Jika respon mengembalikan data/tags
    if (result && (result.data || result.tags)) {
      const dataTag = result.data || result;
      let messageText = `*Hasil Cek Nomor ${text}:*\n\n`;

      if (Array.isArray(dataTag.tags)) {
        messageText += dataTag.tags.map((tag) => `- ${tag}`).join('\n');
      } else if (typeof dataTag === 'object') {
        messageText += '```json\n' + JSON.stringify(dataTag, null, 2) + '\n```';
      } else {
        messageText += String(dataTag);
      }

      bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, 'Pengecekan selesai, namun tidak ada tagar yang ditemukan.');
    }
  } catch (error) {
    // Mencatat detail error ke Log Railway
    if (error.response) {
      console.error('Error dari API Topupcuy:', error.response.status, error.response.data);
    } else {
      console.error('Error Konek:', error.message);
    }

    bot.sendMessage(
      chatId,
      'Gagal melakukan pengecekan. Pastikan saldo API kamu mencukupi atau coba lagi nanti.'
    );
  }
});
