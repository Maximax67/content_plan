import { Telegraf } from 'telegraf';
import { BOT_TOKEN } from '../config';
import { runCron, startCommandReply } from '../commands';

const telegramBot = new Telegraf(BOT_TOKEN);

telegramBot.command('start', startCommandReply);
telegramBot.command('run_cron', runCron);

export { telegramBot };
