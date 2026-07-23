const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Membaca variabel dari environment Railway
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const API_KEY_GTC = process.env.API_KEY_GTC;

if (!TELEGRAM_TOKEN || !API_KEY_GTC) {
  console.error('CRITICAL ERROR: TELEGRAM_TOKEN atau API_KEY_GTC belum diisi di Railway!');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Perintah /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'Halo! Silakan kirimkan nomor HP (contoh: 08123456789) untuk mengecek tagar/nama.'
  );
});

// Penanganan pesan masuk
bot.on('message', async (msg) => {
  const text = msg.text ? msg.text.trim() : '';

  // Abaikan jika berupa command seperti /start
  if (text.startsWith('/')) return;

  // Validasi format nomor HP (08xx, 10-15 digit)
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
          'x-api-key': API_KEY_GTC.trim(),
          // User-Agent ini penting agar request tidak dianggap bot spam oleh Cloudflare
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 60000 // Menunggu respon hingga 60 detik
      }
    );

    const result = response.data;
    console.log('Respon sukses dari server:', JSON.stringify(result));

    if (result && (result.data || result.tags)) {
      const payload = result.data || result;
      let messageText = `*Hasil Cek Nomor ${text}:*\n\n`;

      if (Array.isArray(payload.tags) && payload.tags.length > 0) {
        messageText += payload.tags.map((tag) => `- ${tag}`).join('\n');
      } else if (payload.tags) {
        messageText += String(payload.tags);
      } else {
        messageText += 'Tidak ditemukan tagar untuk nomor ini.';
      }

      bot.sendMessage(chatId, messageText, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, 'Pengecekan selesai, namun tidak ada data tagar yang ditemukan.');
    }
  } catch (error) {
    if (error.response) {
      console.error('Error Respon Server:', error.response.status, error.response.data);
    } else {
      console.error('Error Koneksi:', error.message);
    }

    bot.sendMessage(
      chatId,
      'Gagal melakukan pengecekan. Silakan periksa saldo API kamu atau coba beberapa saat lagi.'
    );
  }
});
