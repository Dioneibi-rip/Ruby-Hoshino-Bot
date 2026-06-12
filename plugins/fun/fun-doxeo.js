import { performance } from 'perf_hooks'

var handler = async (m, { conn, text }) => {
    let who;
    let userName;

    if (m.isGroup) {
        if (m.mentionedJid.length > 0) {
            who = m.mentionedJid[0];
            userName = await conn.getName(who);
        } else if (m.quoted) {
            who = m.quoted.sender;
            userName = await conn.getName(who);
        } else {
            who = m.chat;
        }
    } else {
        who = m.chat;
    }

    if (!who) return conn.reply(m.chat, `⚠️ Por favor, etiqueta a alguien o responde a un mensaje para doxear.`, m);

    if (!userName) {
        userName = text || 'Desconocido';
    }

    const getRandomIP = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const getRandomMAC = () => 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]);
    const getRandomPort = () => Math.floor(Math.random() * 65535);
    const brands = ['Samsung Galaxy S23 Ultra', 'iPhone 15 Pro Max', 'Xiaomi 13 Pro', 'Google Pixel 8', 'Huawei P60 Pro', 'Motorola Edge 40'];
    const os = ['Android 14', 'iOS 17.2', 'Windows 11 Mobile', 'HarmonyOS 4.0'];
    const nets = ['Tigo', 'Claro', 'Movistar', 'Vodafone', 'AT&T', 'Starlink Enterprise'];

    let steps = [
        `🔄 *Conectando al servidor satelital...*`,
        `🔓 *Bypassing firewall del dispositivo...* [Success]`,
        `💉 *Inyectando payload SQL en ${userName}...*`,
        `📂 *Descifrando archivos locales (WhatsApp.db)...*`,
        `☁️ *Extrayendo fotos de la galería privada...*`,
        `📍 *Triangulando ubicación GPS precisa...*`
    ];

    const { key } = await conn.sendMessage(m.chat, { text: `💻 *INICIANDO PROTOCOLO DE DOXEO v9.2*...` }, { quoted: m });

    for (let step of steps) {
        await delay(800);
        await conn.sendMessage(m.chat, { text: step, edit: key });
    }

    let old = performance.now();
    let neww = performance.now();
    
    let doxeo = `☠️ *REPORTE DE ACCESO FINALIZADO* ☠️

👤 *Víctima:* ${userName}
🆔 *ID:* @${who.split('@')[0]}
📅 *Fecha:* ${new Date().toLocaleDateString()}
⏰ *Hora:* ${new Date().toLocaleTimeString()}

📡 *DATOS DE RED:*
*IPv4 PÚBLICA:* ${getRandomIP()}
*IPv4 PRIVADA:* 192.168.1.${Math.floor(Math.random() * 100)}
*MAC ADDRESS:* ${getRandomMAC()}
*PROVEEDOR (ISP):* ${pickRandom(nets)}
*LATENCIA:* ${Math.floor(Math.random() * 100)}ms
*DNS PRIMARIO:* 8.8.8.8 (Google)
*PUERTOS ABIERTOS:* ${getRandomPort()}, 80, 443, 8080

📱 *DISPOSITIVO:*
*MODELO:* ${pickRandom(brands)}
*SISTEMA OS:* ${pickRandom(os)}
*BATERÍA:* ${Math.floor(Math.random() * 100)}% 🔋
*TIEMPO DE ACTIVIDAD:* ${Math.floor(Math.random() * 400)} horas
*GPU:* Adreno ${Math.floor(Math.random() * 100) + 600} / Apple GPU

📍 *UBICACIÓN ESTIMADA:*
*LATITUD:* -${Math.random().toFixed(6)}
*LONGITUD:* -${Math.random().toFixed(6)}
*ZONA:* ${pickRandom(['Sótano de su casa', 'Casa de la abuela', 'Ciber café', 'Escuela pública', 'Baño'])}

📂 *ARCHIVOS ENCONTRADOS:*
*FOTOS:* ${Math.floor(Math.random() * 5000)}
*CHATS:* ${Math.floor(Math.random() * 300)}
*BUSQUEDAS DE GOOGLE:* "Cómo ser guapo", "Hack para free fire", "porno de enanos"

⚠️ _El dispositivo ha sido infectado con éxito. Se recomienda formatear._`;

    await conn.sendMessage(m.chat, { text: doxeo, edit: key, mentions: conn.parseMention(doxeo) });
}

handler.help = ['doxear'];
handler.tags = ['fun'];
handler.command = ['doxear', 'doxxeo', 'doxeo'];
handler.register = true;
handler.group = true;

export default handler;

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));