import { nsfwWarning } from '../../library/respuesta.js';
import { resolveInteractionTarget } from '../../core/identity-utils.js'

let handler = async (m, { conn, command, text }) => {
if (m.isGroup && !global.db.getChat(m.chat).nsfw) {
return m.reply(nsfwWarning());
}

let user = await resolveInteractionTarget(m, conn);
let userName = user === m.sender ? `@${m.sender.split('@')[0]}` : `@${user.split('@')[0]}`;
m.react('🔥');

const responseMessage = `
*TE HAN LLENADO LA CARA DE SEMEN POR PUTA Y ZORRA!*

*Le ha metido el pene a* \`${text || userName}\` *con todo y condón hasta quedar seco, has dicho "por favor más duroooooo!, ahhhhhhh, ahhhhhh, hazme un hijo que sea igual de pitudo que tú!" mientras te penetraba y luego te ha dejado en silla de ruedas!*

\`${text || userName}\`
✿ *YA TE HAN PENETRADO!*`;

conn.reply(m.chat, responseMessage, null, { mentions: [user] });
}

handler.help = ['penetrar @user'];
handler.tags = ['nsfw'];
handler.command = ['penetrar', 'penetrado'];
handler.register = true;
handler.group = true;
handler.fail = null;

export default handler;
