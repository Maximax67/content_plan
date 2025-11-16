// --- api/cron.js ---
// тільки перевірка таблиці.
// Vercel буде тикати його за розкладом.

require('dotenv').config();
require('dns').setDefaultResultOrder('ipv4first');
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

// --- Ініціалізація ---
const bot = new Telegraf(process.env.BOT_TOKEN);
const sheetUrl = process.env.SHEET_URL;
const chatId = process.env.CHAT_ID;

async function checkSheetAndSend() {
  console.log('Запущено перевірку таблиці (CRON)...');
  
  // перевірки .env
  if (!chatId) {
    console.error('ПОМИЛКА: CHAT_ID не вказано. Зупиняю cron.');
    return;
  }
  if (!sheetUrl) {
    console.error('ПОМИЛКА: SHEET_URL не вказано. Зупиняю cron.');
    await bot.telegram.sendMessage(chatId, 'Помилка cron: SHEET_URL не вказано.');
    return;
  }

  try {
    // получаємо сьогоднішню дату
    const today = new Date().toLocaleDateString('uk-UA', {
      timeZone: 'Europe/Kyiv',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    console.log(`Cron job: Сьогоднішня дата (Київ): ${today}`);

    // завантажуємо CSV-файл
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      throw new Error(`Не вдалося завантажити таблицю: ${response.statusText}`);
    }
    const csvData = await response.text();

    // парсим
    const rows = csvData.trim().split(/\r?\n/);
    let headers = rows[0].split(',').map(h => h.trim());
    if (headers[0] && headers[0].charCodeAt(0) === 0xFEFF) {
      headers[0] = headers[0].substring(1);
    }

    const dateIndex = headers.indexOf('Публікація');
    const pubIndex = headers.indexOf('Публікація');
    const postIndex = headers.indexOf('Допис');
    const textAuthorIndex = headers.indexOf('Виконавець тексту');
    const imageAuthorIndex = headers.indexOf('Виконавець картинки');

    if (dateIndex === -1) {
      throw new Error('Не можу знайти стовпець "Публіка...');
    }

    for (let i = 1; i < rows.length; i++) {
      const columns = rows[i].split(',').map(c => c.trim());
      const postDate = columns[dateIndex];

      if (postDate === today) {
        console.log(`Cron job: Знайдено збіг! Дата: ${postDate}`);
        
        const publication = columns[pubIndex] || 'N/A';
        const postText = columns[postIndex] || 'N/A';
        const textAuthor = columns[textAuthorIndex] || 'N/A';
        const imageAuthor = columns[imageAuthorIndex] || 'N/A';

        const message = `
🔔 **Нагадування про публікацію на сьогодні (${today})** 🔔

**Дата:**
${publication}

**Допис:**
${postText}

**Виконавець (Текст):** ${textAuthor}
**Виконавець (Картинка):** ${imageAuthor}
        `;

        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log(`Cron job: Повідомлення надіслано до чату ${chatId}`);
      }
    }
    console.log('Cron job: Перевірку завершено.');
  } catch (error) {
    console.error('Cron job: Сталася помилка:', error.message);
    try {
      // Намагаємося надіслати помилку в Telegram
      await bot.telegram.sendMessage(chatId, `Помилка Cron: ${error.message}`);
    } catch (e) {
      console.error('Cron job: Не вдалося надіслати повідомлення про помилку', e);
    }
  }
}

// --- Vercel Handler ---
// головна функція, яку Vercel викличе
module.exports = async (req, res) => {
  await checkSheetAndSend();
  res.status(200).send('Cron job виконано.');
};