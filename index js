const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

console.log("🚀 Bot jalan...");

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  bot.sendMessage(chatId, "⏳ Proses...");

  try {
    const res = await axios.post(
      'https://gtc.topupcuy.com/api/v1/check',
      {
        number: text,
        strategy: "smart",
        wait: false
      },
      {
        headers: {
          'x-api-key': process.env.API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    bot.sendMessage(chatId, "✅ HASIL:\n\n" + JSON.stringify(res.data, null, 2));

  } catch (err) {
    console.log(err.response?.data || err.message);
    bot.sendMessage(chatId, "❌ Error API / kena blok");
  }
});
