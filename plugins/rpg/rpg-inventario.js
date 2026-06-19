import db from '../../lib/database.js';
import moment from 'moment-timezone';
import { formatJobLine, ensureJobFields } from '../../lib/rpg-jobs.js';

let handler = async (m, { conn, usedPrefix }) => {
    let who = m.mentionedJid[0] ? m.mentionedJid[0] : m.sender;

    if (!global.db.userExists(who)) {
        return conn.reply(m.chat, `${emoji} El usuario no se encuentra en mi base de Datos.`, m);
    }

    let img = 'https://qu.ax/fRMNm.jpg';
    let user = global.db.getUser(who);
    ensureJobFields(user);
    let name = conn.getName(who);

    let premium = user.premium ? '✅' : '❌';

    let text = `╭━〔 Inventario de ${name} 〕⬣\n` +
               `┋ 💸 *${m.moneda} en Cartera:* ${user.coin || 0}\n` +  
               `┋ 🏦 *${m.moneda} en Banco:* ${user.bank || 0}\n` + 
               `┋ ♦️ *Esmeraldas:* ${user.emerald || 0}\n` + 
               `┋ 🔩 *Hierro:* ${user.iron || 0}\n` +  
               `┋ 🏅 *Oro:* ${user.gold || 0}\n` + 
               `┋ 🕋 *Carbón:* ${user.coal || 0}\n` +  
               `┋ 🪨 *Piedra:* ${user.stone || 0}\n` +  
               `┋ ✨ *Experiencia:* ${user.exp || 0}\n` + 
               `┋ ❤️ *Salud:* ${user.health || 100}\n` + 
               `┋ 💎 *Diamantes:* ${user.diamond || 0}\n` +   
               `┋ 🍬 *Dulces:* ${user.candies || 0}\n` + 
               `┋ 🎁 *Regalos:* ${user.gifts || 0}\n` + 
               `┋ 🎟️ *Tokens:* ${user.joincount || 0}\n` +  
               `┋ ⚜️ *Premium:* ${premium}\n` + 
               `┋ 💼 *Trabajo:* ${formatJobLine(user)}\n` + 
               `┋ ⏳ *Última Aventura:* ${user.lastAdventure ? moment(user.lastAdventure).fromNow() : 'Nunca'}\n` + 
               `┋ 📅 *Fecha:* ${new Date().toLocaleString('id-ID')}\n` +
               `╰━━━━━━━━━━━━⬣`;

    await conn.sendFile(m.chat, img, 'yuki.jpg', text, fkontak);
}

handler.help = ['inventario', 'inv'];
handler.tags = ['rpg'];
handler.command = ['inventario', 'inv']; 
handler.group = true;
handler.register = true;

export default handler;