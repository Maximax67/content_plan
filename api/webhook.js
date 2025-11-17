// --- api/webhook.js ---
// обробляє тікі повідомлення від користувачів

require('dotenv').config();
const { Telegraf } = require('telegraf');

if (!process.env.BOT_TOKEN) {
  // Ця помилка з'явиться у Vercel Logs, якщо ти не додав токен
  console.error('ПОМИЛКА: BOT_TOKEN не вказано у Environment Variables!');
  // Ми не можемо продовжувати без токена
  throw new Error('ПОМИЛКА: BOT_TOKEN не вказано!');
}
const bot = new Telegraf(process.env.BOT_TOKEN);

// команди
bot.command('start', async (ctx) => { // Додаємо async
  console.log(`Отримано /start з чату: ${ctx.chat.id}`); // Лог для Vercel
  await ctx.reply('Привіт!'); // Додаємо await
  await ctx.reply(`ID цього чату: ${ctx.chat.id}.`); // Додаємо await
  console.log(`Відповідь на /start надіслано.`);
});

// Це "обробник" (handler) для Vercel
module.exports = async (req, res) => {
  try {
    // Telegraf автоматично обробить вхідне повідомлення
    await bot.handleUpdate(req.body);
    // Відповідаємо Telegram "Все добре"
    res.status(200).send('OK');
  } catch (error) {
    console.error('Помилка при обробці вебхука:', error);
    res.status(500).send('Помилка обробки');
  }
};