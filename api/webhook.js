// --- api/webhook.js ---
// обробляє тікі повідомлення від користувачів

require('dotenv').config();
const { Telegraf } = require('telegraf');

if (!process.env.BOT_TOKEN) {
  console.error('ПОМИЛКА: BOT_TOKEN не вказано у Environment Variables!');
  throw new Error('ПОМИЛКА: BOT_TOKEN не вказано!');
}
const bot = new Telegraf(process.env.BOT_TOKEN);

// команди
bot.command('start', async (ctx) => {
  console.log(`Отримано /start з чату: ${ctx.chat.id}`); 
  await ctx.reply('Привіт!'); 
  await ctx.reply(`ID цього чату: ${ctx.chat.id}.`);
  console.log(`Відповідь на /start надіслано.`);
});

module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Помилка при обробці вебхука:', error);
    res.status(500).send('Помилка обробки');
  }
};