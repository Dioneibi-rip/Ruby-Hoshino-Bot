let handler = async (m, { conn }) => {


  const texto = `
💰🎮⊹ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 𝐝𝐞 𝐞𝐜𝐨𝐧𝐨𝐦𝐢́𝐚 𝐲 𝐑𝐏𝐆 𝐩𝐚𝐫𝐚 𝐠𝐚𝐧𝐚𝐫 𝐝𝐢𝐧𝐞𝐫𝐨 𝐲 𝐨𝐭𝐫𝐨𝐬 𝐫𝐞𝐜𝐮𝐫𝐬𝐨𝐬 🏆💎⊹

ൃ⵿꤬ᩚ̸̷͠ᩘ🍒̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#w • #work • #trabajar*
> ✦ Trabaja para ganar ${m.moneda}.
ൃ⵿꤬ᩚ̸̷͠ᩘ🎀̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#slut • #protituirse*
> ✦ Trabaja como prostituta y gana ${m.moneda}.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍨̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#cf • #suerte*
> ✦ Apuesta tus ${m.moneda} a cara o cruz.
ൃ⵿꤬ᩚ̸̷͠ᩘ🌸̷̸ᩚ⃨⢾ ֺ ֢ ᮫ ⵿ ─ *#crime • #crimen*
> ✦ Trabaja como ladrón para ganar ${m.moneda}.
ൃ⵿꤬ᩚ̸̷͠ᩘ🪷̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#ruleta • #roulette • #rt*
> ✦ Apuesta ${m.moneda} al color rojo o negro.
ൃ⵿꤬ᩚ̸̷͠ᩘ🥡̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#casino • #apostar*
> ✦ Apuesta tus ${m.moneda} en el casino.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍒̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#slot*
> ✦ Apuesta tus ${m.moneda} en la ruleta y prueba tu suerte.
ൃ⵿꤬ᩚ̸̷͠ᩘ🎀̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#cartera • #wallet*
> ✦ Ver tus ${m.moneda} en la cartera.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍨̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#banco • #bank*
> ✦ Ver tus ${m.moneda} en el banco.
ൃ⵿꤬ᩚ̸̷͠ᩘ🌸̷̸ᩚ⃨⢾ ֺ ֢ ᮫ ⵿ ─ *#deposit • #depositar • #d*
> ✦ Deposita tus ${m.moneda} al banco.
ൃ⵿꤬ᩚ̸̷͠ᩘ🪷̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#with • #retirar • #withdraw*
> ✦ Retira tus ${m.moneda} del banco.
ൃ⵿꤬ᩚ̸̷͠ᩘ🥡̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#transfer • #pay*
> ✦ Transfiere ${m.moneda} o XP a otros usuarios.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍒̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#miming • #minar • #mine*
> ✦ Trabaja como minero y recolecta recursos.
ൃ⵿꤬ᩚ̸̷͠ᩘ🎀̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#buyall • #buy*
> ✦ Compra ${m.moneda} con tu XP.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍨̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#daily • #diario*
> ✦ Reclama tu recompensa diaria.
ൃ⵿꤬ᩚ̸̷͠ᩘ🌸̷̸ᩚ⃨⢾ ֺ ֢ ᮫ ⵿ ─  *#cofre*
> ✦ Reclama un cofre diario lleno de recursos.
ൃ⵿꤬ᩚ̸̷͠ᩘ🪷̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#weekly • #semanal*
> ✦ Reclama tu regalo semanal.
ൃ⵿꤬ᩚ̸̷͠ᩘ🥡̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#monthly • #mensual*
> ✦ Reclama tu recompensa mensual.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍒̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#steal • #robar • #rob*
> ✦ Intenta robarle ${m.moneda} a alguien.
ൃ⵿꤬ᩚ̸̷͠ᩘ🎀̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#robarxp • #robxp*
> ✦ Intenta robar XP a un usuario.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍨̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#eboard • #baltop*
> ✦ Ver el ranking de usuarios con más ${m.moneda}.
ൃ⵿꤬ᩚ̸̷͠ᩘ🌸̷̸ᩚ⃨⢾ ֺ ֢ ᮫ ⵿ ─ *#aventura • #adventure*
> ✦ Aventúrate en un nuevo reino y recolecta recursos.
ൃ⵿꤬ᩚ̸̷͠ᩘ🪷̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#curar • #heal*
> ✦ Cura tu salud para volverte aventurero.
ൃ⵿꤬ᩚ̸̷͠ᩘ🥡̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#cazar • #hunt • #berburu*
> ✦ Aventúrate en una caza de animales.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍒̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#inv • #inventario*
> ✦ Ver tu inventario con todos tus ítems.
ൃ⵿꤬ᩚ̸̷͠ᩘ🎀̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#mazmorra • #explorar*
> ✦ Explorar mazmorras para ganar ${m.moneda}.
ൃ⵿꤬ᩚ̸̷͠ᩘ🍨̷̸ᩚ⃨⢾ ֺ ֢ ᮫  ─ *#halloween*
> ✦ Reclama tu dulce o truco (Solo en Halloween).
ൃ⵿꤬ᩚ̸̷͠ᩘ🌸̷̸ᩚ⃨⢾ ֺ ֢ ᮫ ⵿ ─ *#christmas • #navidad*
> ✦ Reclama tu regalo navideño (Solo en Navidad).
╰────︶.︶ ⸙ ͛ ͎ ͛  ︶.︶ ੈ₊˚༅,
  `.trim();

  conn.sendFile(m.chat, 'https://files.catbox.moe/hs7g62.jpg', 'descargas.jpg', texto, m, false, {
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: '🌵 ¡chambea, gana y diviertete con estos grandiosos comandos!',
        body: '🤖 comandos de economía y rpg 🌟',
        thumbnailUrl: 'https://files.catbox.moe/bi19e7.png',
        mediaType: 1,
        renderLargerThumbnail: false,
        showAdAttribution: true,
        mediaUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P',
        sourceUrl: 'https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P',
        newsletterJid: '120363335626706839@newsletter',
        newsletterName: '⏤͟͞ू⃪፝͜⁞⟡『 𝙍𝙪𝙗𝙮 𝙃𝙤𝙨𝙝𝙞𝙣𝙤 𝘽𝙤𝙩 』࿐⟡'
      }
    }
  });
};

handler.command = ['menueconomia', 'rpgmenu', 'menurpg'];
export default handler;
