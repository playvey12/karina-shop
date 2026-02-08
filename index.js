const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();



const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on('photo', async (ctx) => {
    try {
        await ctx.reply("📸 Фото принял, начинаю поиск...");

     
        const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        const tgFileLink = await ctx.telegram.getFileLink(photoId);

    
        const imgbbResponse = await axios.get(`https://api.imgbb.com/1/upload`, {
            params: {
                key: process.env.IMGBB_KEY,
                image: tgFileLink.href
            }
        });
        const publicPhotoUrl = imgbbResponse.data.data.url;
        console.log('Картинка в облаке:', publicPhotoUrl);

        await ctx.reply('🔍 Ищу на Wildberries, Ozon и AliExpress...');

    
       const response = await axios.get('https://www.searchapi.io/api/v1/search', {
            params: {
                engine: "google_lens",
                url: publicPhotoUrl,
                api_key: process.env.SEARCH_API_KEY,
                gl: "ru", 
                hl: "ru"  
            }
        });


     const results = response.data.visual_matches || [];
        let finalResult = [];

        results.forEach(element => {
            const link = element.link || "";
            const title = element.title || "Товар";
            const source = element.source || "Магазин";
            
            
            console.log(`Найдено: ${source} -> ${link}`);

     
            const isMarket = /wildberries|aliexpress|Instagram|supercheap|Alibaba/.test(link.toLowerCase());

            if (isMarket && link.startsWith('https')) {
                finalResult.push(`🛍 <b>${source}</b>: <a href="${link}">${title}</a>`);
            }
        });

   
        if (finalResult.length > 0) {
         
            const uniqueLinks = [...new Set(finalResult)].slice(0, 3);
            await ctx.replyWithHTML(`Крошка, смотри что я нашел:\n\n${uniqueLinks.join('\n\n')}`);
        } else {
            await ctx.reply(' На наших маркетплейсах ничего не нашлось. Попробуй другое фото!');
        }

    } catch (error) {
        console.error('Ошибка:', error.message);
        if (error.message.includes('ENOTFOUND')) {
            await ctx.reply('Ошибка сети: не удается связаться с сервером. Пожалуйста, выполни команду смены DNS (Шаг 1).');
        } else {
            await ctx.reply('Произошла ошибка. Проверь API ключи.');
        }
    }
});

bot.launch().then(() => console.log('🚀 Бот запущен! Жду фото.'));


process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));