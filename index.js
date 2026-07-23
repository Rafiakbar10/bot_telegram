const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const API_KEY_GTC = process.env.API_KEY_GTC;

if (!API_KEY_GTC) {
  console.error('CRITICAL ERROR: API_KEY_GTC belum diisi di Variables Railway!');
  process.exit(1);
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

// Menampilkan QR Code di Deploy Logs Railway
client.on('qr', (qr) => {
  console.log('====================================================');
  console.log('SCAN QR CODE DI BAWAH INI LEWAT WHATSAPP HP KAMU:');
  console.log('====================================================');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Bot WhatsApp berhasil online dan siap digunakan!');
});

client.on('message', async (msg) => {
  const text = msg.body ? msg.body.trim() : '';

  if (/^08\d{8,13}$/.test(text)) {
    msg.reply('Sedang memproses pengecekan nomor, mohon tunggu sebentar...');

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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 60000
        }
      );

      const result = response.data;
      console.log('Respon API:', JSON.stringify(result));

      if (result && (result.data || result.tags)) {
        const payload = result.data || result;
        let replyMessage = `*Hasil Cek Nomor ${text}:*\n\n`;

        if (Array.isArray(payload.tags) && payload.tags.length > 0) {
          replyMessage += payload.tags.map((tag) => `- ${tag}`).join('\n');
        } else if (payload.tags) {
          replyMessage += String(payload.tags);
        } else {
          replyMessage += 'Tidak ditemukan tagar untuk nomor ini.';
        }

        msg.reply(replyMessage);
      } else {
        msg.reply('Pengecekan selesai, namun tidak ada data tagar yang ditemukan.');
      }
    } catch (error) {
      console.error('Error API:', error.message);
      msg.reply('Gagal melakukan pengecekan. Pastikan saldo API kamu mencukupi atau coba beberapa saat lagi.');
    }
  }
});

client.initialize();
