// --- api/cron.js ---
require('dotenv').config();
require('dns').setDefaultResultOrder('ipv4first');
const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');

// --- Ініціалізація ---
if (!process.env.BOT_TOKEN) {
  console.error('ПОМИЛКА: BOT_TOKEN не вказано!');
  process.exit(1);
}
const bot = new Telegraf(process.env.BOT_TOKEN);
const sheetUrl = process.env.SHEET_URL;
const chatId = process.env.CHAT_ID;

function escapeHTML(text) {
  if (!text) return 'N/A'; 
  
  text = String(text);

  let result = '';
  let lastIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    let escape = '';

    if (ch === '&') escape = '&amp;';
    else if (ch === '<') escape = '&lt;';
    else if (ch === '>') escape = '&gt;';
    else if (ch === '"') escape = '&quot;';
    else if (ch === "'") escape = '&#039;';

    if (escape) {
      result += text.slice(lastIndex, i) + escape;
      lastIndex = i + 1;
    }
  }

  if (lastIndex === 0) return text; 
  return result + text.slice(lastIndex);
}


async function checkSheetAndSend() {
  console.log('Запущено перевірку таблиці (CRON)...');
  
  if (!chatId || !sheetUrl) {
    console.error('ПОМИЛКА: CHAT_ID або SHEET_URL не вказано.');
    return;
  }

  try {
    // 1. Отримуємо дату
    const today = new Date().toLocaleDateString('uk-UA', {
      timeZone: 'Europe/Kyiv',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    console.log(`Cron job: Сьогоднішня дата: ${today}`);

    // 2. Завантажуємо
    const response = await fetch(sheetUrl);
    if (!response.ok) throw new Error(`Помилка завантаження: ${response.statusText}`);
    const csvData = await response.text();

    // 3. Парсимо
    const rows = csvData.trim().split(/\r?\n/);
    let headers = rows[0].split(',').map(h => h.trim());
    if (headers[0] && headers[0].charCodeAt(0) === 0xFEFF) {
      headers[0] = headers[0].substring(1);
    }

    // 4. Індекси
    const dateIndex = headers.indexOf('Публікація');
    const pubIndex = headers.indexOf('Публікація');
    const postIndex = headers.indexOf('Допис');
    const textAuthorIndex = headers.indexOf('Виконавець тексту');
    const imageAuthorIndex = headers.indexOf('Виконавець картинки');

    if (dateIndex === -1) throw new Error('Стовпець "Публікація" не знайдено.');

    // 5. Пошук
    for (let i = 1; i < rows.length; i++) {
      const columns = rows[i].split(',').map(c => c.trim());
      if (columns.length <= dateIndex) continue;
      
      const postDate = columns[dateIndex];

      if (postDate === today) {
        console.log(`Знайдено пост на сьогодні!`);
        
        const publication = escapeHTML(columns[pubIndex]);
        const postText = escapeHTML(columns[postIndex]);
        const textAuthor = escapeHTML(columns[textAuthorIndex]);
        const imageAuthor = escapeHTML(columns[imageAuthorIndex]);
        
        const message = `
🔔 <b>Нагадування про публікацію на сьогодні (${escapeHTML(today)})</b> 🔔

<b>Дата:</b>
${publication}

<b>Допис:</b>
${postText}

<b>Виконавець (Текст):</b> ${textAuthor}
<b>Виконавець (Картинка):</b> ${imageAuthor}
        `;

        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
        console.log(`Надіслано в чат ${chatId}`);
      }
    }
    console.log('Перевірку завершено.');

  } catch (error) {
    console.error('Помилка:', error.message);
    try {
      await bot.telegram.sendMessage(chatId, `Помилка Cron: ${error.message}`);
    } catch (e) {}
  }
}

module.exports = async (req, res) => {
  await checkSheetAndSend();
  res.status(200).send('Cron job виконано.');
};