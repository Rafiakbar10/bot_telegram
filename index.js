const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Membaca token dan API key dari variabel lingkungan Railway
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const API_KEY_GTC = process.env.API_KEY_GTC;

if (!TELEGRAM_TOKEN || !API_KEY_GTC) {
  console.error('Error: TELEGRAM_TOKEN atau API_KEY_GTC belum diisi di Railway!');
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
          'x-api-key': API_KEY_GTC
        }
      }
    );

    const result = response.data;

    if (result && result.data) {
      let messageText = `*Hasil Cek Nomor ${text}:*\n\n`;
      
      if (Array.isArray(result.data.tags)) {
        messageText += result.data.tags.map(tag => `- ${tag}`).join('\n');
      } else {
        messageText += JSON.stringify(result.data, null, 2);
      }

      bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, 'Data tidak ditemukan atau terjadi kesalahan.');
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      'Gagal melakukan pengecekan. Pastikan saldo API kamu mencukupi atau coba lagi nanti.'
    );
  }
});
