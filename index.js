require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Format Rupiah
function rupiah(angka) {
    return new Intl.NumberFormat("id-ID").format(angka);
}

// Hitung Asuransi Santai
function getSantai(harga) {

    if (harga >= 1000000 && harga <= 10000000) {
        return 599000;
    }

    if (harga > 10000000 && harga <= 30000000) {
        return 899000;
    }

    return 0;
}

bot.start((ctx) => {

    ctx.reply(
`👋 Halo ${ctx.from.first_name}

Selamat datang di Bot Simulasi Home Credit.

Silakan kirim harga barang.

Contoh:
8500000`
    );

});

bot.on("text", (ctx) => {

    const harga = Number(ctx.message.text.replace(/\./g, "").replace(/,/g, ""));

    if (isNaN(harga)) {
        return ctx.reply("Masukkan angka ya.\n\nContoh:\n8500000");
    }

    const santai = getSantai(harga);

    if (santai === 0) {
        return ctx.reply("Harga di luar rentang simulasi.");
    }

    const total = harga + santai;

    ctx.reply(
`📋 SIMULASI

💰 Harga Barang
Rp ${rupiah(harga)}

🛡️ Asuransi Santai
Rp ${rupiah(santai)}

💳 Total Pembiayaan
Rp ${rupiah(total)}`
    );

});

bot.launch();

console.log("Bot berjalan...");
