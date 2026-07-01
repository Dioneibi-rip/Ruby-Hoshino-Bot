import { isChatBannedForBot, normalizeSessionJid } from '../../src/core/session-utils.js'
let handler = m => m
handler.all = async function (m) {
let chat = global.db.getChat(m.chat)

if (isChatBannedForBot(chat, normalizeSessionJid(this))) return

const sendBn = async (url) => {
await this.sendPresenceUpdate('recording', m.chat)
await this.sendFile(m.chat, url, 'voice.mp3', null, m, true, { type: 'audioMessage', ptt: true })
}

if (/^A Bueno master|Bueno master|Bueno Máster|🫂$/i.test(m.text) && chat.audios) {
if (!global.db.getChat(m.chat).audios && m.isGroup) throw 0
await sendBn('https://qu.ax/xynz.mp3')
}

if (/^ara ara$/i.test(m.text) && chat.audios) {
await sendBn('https://qu.ax/PPgt.mp3')
}

if (chat.audios && m.text.match(/(bienvenido|🥳|🤗)/gi)) {
let vn = 'https://qu.ax/cUYg.mp3'
this.sendPresenceUpdate('recording', m.chat)
await this.sendMessage(m.chat, {
audio: { url: vn },
contextInfo: {

},
ptt: true,
mimetype: 'audio/mpeg',
fileName: `voice.mp3`
}, { quoted: m })
}

if (chat.audios && m.text.match(/(Blackpink in your area|blackpink in your area|in your area|In your area)/gi)) {
await sendBn('https://qu.ax/pavq.mp3')
}

if (chat.audios && m.text.match(/(Buen día grupo|Buen dia grupo)/gi)) {
await sendBn('https://qu.ax/GoKq.mp3')
}

if (chat.audios && m.text.match(/(Calla Fan de bts|bts|Amo a bts)/gi)) {
let vn = 'https://qu.ax/oqNf.mp3'
let sticker = 'https://qu.ax/rfHP.webp'
this.sendPresenceUpdate('recording', m.chat)
let or = ['audio', 'sticker'];
let media = or[Math.floor(Math.random() * 2)]
if (media === 'audio') await this.sendFile(m.chat, vn, 'voice.mp3', null, m, true, { type: 'audioMessage', ptt: true });
if (media === 'sticker') await this.sendFile(m.chat, sticker, 'sticker.webp', '', m);
}

if (chat.audios && m.text.match(/(Cambiate a Movistar|cambiate a Movistar|cambiate a movistar|Cambiate a movistar|movistar)/gi)) {
await sendBn('https://qu.ax/RxJC.mp3')
}

if (chat.audios && m.text.match(/(Corte Corte|corte|pelea|pelear|golpear|golpea)/gi)) {
await sendBn('https://qu.ax/hRuU.mp3')
}

if (chat.audios && m.text.match(/(El Toxico|El tóxico|Toxico|tóxico|malo|mala|estupido|estupida)/gi)) {
await sendBn('https://qu.ax/WzBd.mp3')
}

if (chat.audios && m.text.match(/(Elmo sabe donde vives|Elmo sabe dónde vives|elmo|vives|de donde eres|eres de|sabes)/gi)) {
await sendBn('https://qu.ax/YsLt.mp3')
}

if (chat.audios && m.text.match(/(En caso de una investigación|En caso de una investigacion|cia|nasa|detective|👤|🕵️‍|♀️🕵️‍♂️)/gi)) {
await sendBn('https://qu.ax/Syg.mp3')
}

if (chat.audios && m.text.match(/(fbi|FBI|picus|PICUS|🗣|💻)/gi)) {
await sendBn('https://qu.ax/wFbD.mp3')
}

if (chat.audios && m.text.match(/(lloro|porqué estás tite|no estes tite|porqué estas tite|no estés tite|🥹|🥺|😭)/gi)) {
await sendBn('https://qu.ax/VrjA.mp3')
}

if (chat.audios && m.text.match(/(Eres Fuerte|god|🤜|🤛|🦾|👊)/gi)) {
await sendBn('https://qu.ax/lhzq.mp3')
}

if (chat.audios && m.text.match(/(Zzzz|zzz|😴|💩|👽)/gi)) {
await sendBn('https://qu.ax/KkSZ.mp3')
}

if (chat.audios && m.text.match(/(Las reglas del grupo|lee|leíste|leiste)/gi)) {
await sendBn('https://qu.ax/fwek.mp3')
}

if (chat.audios && m.text.match(/(Me anda buscando anonymous|me anda buscando anonymous|Me está buscando anonymous|me está buscando anonymous|Me está buscando anonimo|Me esta buscando anonimo|anonimus|anónimo)/gi)) {
await sendBn('https://qu.ax/MWJz.mp3')
}

if (chat.audios && m.text.match(/(Momento equisde|momento equisde|Momento|fuera|🤘|👄|🕴️|💃|🕺)/gi)) {
await sendBn('https://qu.ax/PitP.mp3')
}

if (chat.audios && m.text.match(/(Motivacion|Motivación|☘️)/gi)) {
await sendBn('https://qu.ax/MXnK.mp3')
}

if (chat.audios && m.text.match(/(Muchachos|⛈️|🌩️|🌦️|🌤️|🌪️|escucharon)/gi)) {
await sendBn('https://qu.ax/dRVb.mp3')
}

if (chat.audios && m.text.match(/(Nico Nico|🐄|🐖|🐬|🐼|🐰|🐇|🦦|🐋)/gi)) {
await sendBn('https://qu.ax/OUyB.mp3')
}

if (chat.audios && m.text.match(/(No Rompas más|No Rompas mas|💔|😖|😣)/gi)) {
await sendBn('https://qu.ax/ZkAp.mp3')
}

if (chat.audios && m.text.match(/(Potaxio|Potasio|🥑)/gi)) {
await sendBn('https://qu.ax/vPoj.mp3')
}

if (chat.audios && m.text.match(/(Que tal Grupo|qué tal grupo|grupos)/gi)) {
await sendBn('https://qu.ax/lirF.mp3')
}

if (chat.audios && m.text.match(/(Se están riendo de mí|Se estan riendo de mi|Se esta riendo de mi|Se está riendo de mi|se estan)/gi)) {
await sendBn('https://qu.ax/XBXo.mp3')
}

if (chat.audios && m.text.match(/(Su nivel de pendejo|pendeja|pendejo|idiota|tonto|tonta|🙄)/gi)) {
await sendBn('https://qu.ax/SUHo.mp3')
}

if (chat.audios && m.text.match(/(tal vez|puede ser|posible|🧘‍|♀️🧘|🍦|🍡|🌮|🎩)/gi)) {
await sendBn('https://qu.ax/QMjH.mp3')
}

if (chat.audios && m.text.match(/(Te gusta el Pepino|🥒|🍆|nepe)/gi)) {
await sendBn('https://qu.ax/ddrn.mp3')
}

if (chat.audios && m.text.match(/(Todo bien|😇|😄|🏂|⛷️|🏋️‍|♂️🏋️‍|♀️🤹‍|♀️🤹‍|♂️👌)/gi)) {
await sendBn('https://qu.ax/EDUC.mp3')
}

if (chat.audios && m.text.match(/(Traigan le una falda|Traiganle una falda|Nina|niña|niño)/gi)) {
await sendBn('https://qu.ax/fnTL.mp3')
}

if (chat.audios && m.text.match(/(Y este quien es|Y este quien poronga es|Y este quien porongas es|vida)/gi)) {
let vn = 'https://qu.ax/QnET.mp3'
let randow = 'https://qu.ax/yHJn.webp'
this.sendPresenceUpdate('recording', m.chat)
let or = ['audio', 'sticker'];
let media = or[Math.floor(Math.random() * 2)]
if (media === 'audio') await this.sendFile(m.chat, vn, 'voice.mp3', null, m, true, { type: 'audioMessage', ptt: true });
if (media === 'sticker') await this.sendFile(m.chat, randow, 'sticker.webp', '', m)
}

if (chat.audios && m.text.match(/(Goku pervertido|pervertido|pervertida|goku|antojen|antogen|😈|👿|👉👌|👌👈)/gi)) {
await sendBn('https://qu.ax/CUmZ.mp3')
}

if (chat.audios && m.text.match(/(abduzcan|Abduzcan|adbuzcan|Adbuzcan)/gi)) {
await sendBn('./media/abduzcan.mp3')
}

if (chat.audios && m.text.match(/(TENGO LOS CALZONES|Tengo los calzones|tengo los calzones|🥶|😨|calzones)/gi)) {
await sendBn('https://qu.ax/pzRp.mp3')
}

if (chat.audios && m.text.match(/(anadieleimporta|a nadie le importa|y que|no importa|literal)/gi)) {
await sendBn('https://qu.ax/JocM.mp3')
}

if (chat.audios && m.text.match(/(miarda de bot|mierda de bot|mearda de bot|Miarda de Bot|Mierda de Bot|Mearda de Bot|bot puto|Bot puto|Bot CTM|Bot ctm|bot CTM|bot ctm|bot pendejo|Bot pendejo|bot de mierda)/gi)) {
await sendBn('https://qu.ax/UEZQ.mp3')
}

if (chat.audios && m.text.match(/(baneado|Baneado|baneada)/gi)) {
await sendBn('https://qu.ax/SJJt.mp3')
}

if (chat.audios && m.text.match(/(Cada|Basado|Basada|Basadisimo|BASADO|basado|basada|Que basado|Que basada|que basado)/gi)) {
await sendBn('https://qu.ax/jDAl.mp3')
}

if (chat.audios && m.text.match(/(Bien pensado woody|bien pensado woody|Bien pensado|bien pensado|Bien pensado wudy|bien pensado wudy|Bien pensado Woody|bien pensado Woody|Bien pensado woodi|bien pensado woodi)/gi)) {
await sendBn('https://qu.ax/nvxb.mp3')
}

if (chat.audios && m.text.match(/(bañate|Bañat)/gi)) {
await sendBn('https://qu.ax/JsYa.mp3')
}

if (chat.audios && m.text.match(/(buenas noches|Buenas noches|Boanoite|boanoite)/gi)) {
await sendBn('https://qu.ax/TTfs.mp3')
}

if (chat.audios && m.text.match(/(Bueno si|bueno si|bueno sí|Bueno sí)/gi)) {
await sendBn('https://qu.ax/DqBM.mp3')
}

if (chat.audios && m.text.match(/(buenos dias|Buenos dias|buenos días|Buenos días)/gi)) {
await sendBn('https://qu.ax/wLUF.mp3')
}

if (chat.audios && m.text.match(/(Me olvide|ME OLVIDE|me olvide|Me olvidé|me olvidé|lgante)/gi)) {
await sendBn('https://qu.ax/SbX.mp3')
}

if (chat.audios && m.text.match(/(giagnosticadocongay|diagnosticado con gay|diagnosticado gay|te diagnóstico con gay|diagnóstico gay|te diagnostico con gay|te diagnóstico con gay|te diagnosticó con gay|te diagnostico con gay)/gi)) {
await sendBn('https://qu.ax/cUl.mp3')
}

if (chat.audios && m.text.match(/(El pepe|el pepe|El Pepe|el Pepe)/gi)) {
await sendBn('https://qu.ax/Efdb.mp3')
}

if (chat.audios && m.text.match(/(el rap de fernanfloo|grap|trap)/gi)) {
await sendBn('https://qu.ax/Vved.mp3')
}

if (chat.audios && m.text.match(/(Enojado|ENOJADO|enojado|Molesto|Enojada|ENOJADA|enojada|Molesta|🤬|😡|😠|😤)/gi)) {
await sendBn('https://qu.ax/jqTX.mp3')
}

if (chat.audios && m.text.match(/(ENTRADA|entrada|Entrada|Entra|ENTRA|Entra|Ingresa|ingresa|INGRESA|ingresar|INGRESAR|Ingresar)/gi)) {
await sendBn('https://qu.ax/UpAC.mp3')
}

if (chat.audios && m.text.match(/(Esto va ser épico papus|esto va ser épico papus|Esto va ser|Esto va a hacer|esto va acer|Esto va aser|esto va ser|esto va a hacer)/gi)) {
await sendBn('https://qu.ax/pjTx.mp3')
}

if (chat.audios && m.text.match(/(Esto va para ti|esto va para ti)/gi)) {
await sendBn('https://qu.ax/Tabl.mp3')
}

if (chat.audios && m.text.match(/(feliz cumpleaños|felizcumpleaños|happy birthday)/gi)) {
await sendBn('https://qu.ax/UtmZ.mp3')
}

if (chat.audios && m.text.match(/(fiesta del admin2|fiesta del admin 2|fiestadeladmin2|fiesta del administrador)/gi)) {
await sendBn('https://qu.ax/MpnG.mp3')
}

if (chat.audios && m.text.match(/(Fiesta del admin|fiesta del admin)/gi)) {
await sendBn('https://qu.ax/jDVi.mp3')
}

if (chat.audios && m.text.match(/(fiesta del admin 3|atención grupo|atencion grupo|aviso importante|fiestadeladmin3|fiesta en casa)/gi)) {
await sendBn('https://qu.ax/fRz.mp3')
}

if (chat.audios && m.text.match(/(Fino señores|fino señores|Fino senores|fino senores|Fino🧐|🧐🍷|🧐🍷|🐍|🙉|🙈)/gi)) {
await sendBn('https://qu.ax/hapR.mp3')
}

if (chat.audios && m.text.match(/(Me voy|me voy|ME VOY|Me fui|me fui|ME FUI|Se fue|se fue|SE FUE|Adios|adios|ADIOS|Chao|chao|CHAO)/gi)) {
await sendBn('https://qu.ax/iOky.mp3')
}

if (chat.audios && m.text.match(/(tunometecabrasaramambiche|tunometecabrasaramanbiche|tunometecabrasarananbiche|tunometecabrasaranambiche)/gi)) {
await sendBn('https://qu.ax/LAAB.mp3')
}

if (chat.audios && m.text.match(/(gemidos|gemime|gime|gemime|gemi2)/gi)) {
await sendBn('https://qu.ax/bwPL.mp3')
}

if (chat.audios && m.text.match(/(audio hentai|Audio hentai|audiohentai|Audiohentai)/gi)) {
await sendBn('https://qu.ax/GSUY.mp3')
}

if (chat.audios && m.text.match(/(hola|ola|hi|hello)/gi)) {
await sendBn('https://qu.ax/eGdW.mp3')
}

if (chat.audios && m.text.match(/(Homero chino|homero chino|Omero chino|omero chino|Homero Chino)/gi)) {
await sendBn('https://qu.ax/ebe.mp3')
}

if (chat.audios && m.text.match(/(sexo|Sexo|Hora de sexo|hora de sexo)/gi)) {
await sendBn('https://qu.ax/Mlfu.mp3')
}

if (chat.audios && m.text.match(/(Jesucristo|jesucristo|Jesús|jesús|Auronplay|Auron|Dios)/gi)) {
await sendBn('https://qu.ax/AWdx.mp3')
}

if (chat.audios && m.text.match(/(La voz de hombre|la voz de hombre|La voz del hombre|la voz del hombre|La voz|la voz|🥸|👨|👩|🤦‍|♂️🤦‍|♀️🤷‍♂️|🤷‍♀️)/gi)) {
await sendBn('./media/la-voz-de-hombre.mp3')
}

if (chat.audios && m.text.match(/(laoracion|La biblia|La oración|La biblia|La oración|la biblia|La Biblia|oremos|recemos|rezemos|🙏)/gi)) {
await sendBn('https://qu.ax/GeeA.mp3')
}

if (chat.audios && m.text.match(/(Marica tu|cancion1|Marica quien|maricon|bando)/gi)) {
await sendBn('https://qu.ax/XULE.mp3')
}

if (chat.audios && m.text.match(/(MA MA MASIVO|ma ma masivo|Ma ma masivo|Bv|BV|bv|masivo|Masivo|MASIVO)/gi)) {
await sendBn('https://qu.ax/mNX.mp3')
}

if (chat.audios && m.text.match(/(ho me vengo|oh me vengo|o me vengo|Ho me vengo|Oh me vengo|O me vengo)/gi)) {
await sendBn('https://qu.ax/waHR.mp3')
}

if (chat.audios && m.text.match(/(Me pica los cocos|ME PICA |me pica|Me pican los cocos|ME PICAN)/gi)) {
await sendBn('https://qu.ax/UrNl.mp3')
}

if (chat.audios && m.text.match(/(mmm|Mmm|MmM)/gi)) {
await sendBn('https://qu.ax/gxFs.mp3')
}

if (chat.audios && m.text.match(/(Moshi moshi|Shinobu|mundo)/gi)) {
await sendBn('https://qu.ax/JAyd.mp3')
}

if (chat.audios && m.text.match(/(nadie te pregunto|Nadie te pregunto|Nadie te preguntó|nadie te preguntó)/gi)) {
await sendBn('https://qu.ax/MrGg.mp3')
}

if (chat.audios && m.text.match(/(Feliz navidad|feliz navidad|Merry Christmas|merry chritmas)/gi)) {
await sendBn('https://qu.ax/XYyY.m4a')
}

if (chat.audios && m.text.match(/(niconico|NICONICO|Niconico|niconiconi|Niconiconi|NICONICONI)/gi)) {
await sendBn('https://qu.ax/YdVq.mp3')
}

if (chat.audios && m.text.match(/(No chupa la|No chupala|no chupala|No chu|no chu|No, chupala|No, chupa la)/gi)) {
await sendBn('https://qu.ax/iCRk.mp3')
}

if (chat.audios && m.text.match(/(No me hables|no me hables)/gi)) {
await sendBn('https://qu.ax/xxtz.mp3')
}

if (chat.audios && m.text.match(/(no me hagas usar esto|No me hagas usar esto|No me agas usar esto)/gi)) {
await sendBn('https://qu.ax/bzDa.mp3')
}

if (chat.audios && m.text.match(/(NO DIGAS ESO PAPU|no digas eso papu|No gigas eso papu|NO PAPU|No papu|NO papu|no papu)/gi)) {
await sendBn('https://qu.ax/jsb.mp3')
}

if (chat.audios && m.text.match(/(noche de paz|Noche de paz|Noche de amor|noche de amor|Noche de Paz|🌚|🌕|🌖|🌗|🌘|🌑|🌒|🌓|🌔|🌙|🪐)/gi)) {
await sendBn('https://qu.ax/SgrV.mp3')
}

if (chat.audios && m.text.match(/(Nyapasu|Nyanpasu|nyapasu|Nyapasu|Gambure|Yabure|🐨|🐣|🐥|🦄|🤙)/gi)) {
await sendBn('https://qu.ax/ZgFZ.mp3')
}

if (chat.audios && m.text.match(/(Ohayo|ohayo|Ojayo|ojayo|Ohallo|ohallo|Ojallo|ojallo|🏮|🎎|⛩️|🐲|🐉|🌸|🍙|🍘)/gi)) {
await sendBn('https://qu.ax/PFxn.mp3')
}

if (chat.audios && m.text.match(/(OMAIGA|OMG|omg|omaiga|Omg|Omaiga|OMAIGA)/gi)) {
await sendBn('https://qu.ax/PfuN.mp3')
}

if (chat.audios && m.text.match(/(oni-chan|onichan|o-onichan)/gi)) {
await sendBn('https://qu.ax/sEFj.mp3')
}

if (chat.audios && m.text.match(/(orale|Orale)/gi)) {
await sendBn('https://qu.ax/Epen.mp3')
}

if (chat.audios && m.text.match(/(Pasa pack|vendes tu nudes|pasa video hot|pasa tu pack|pasa fotos hot|vendes tu pack|Vendes tu pack|Vendes tu pack?|vendes tu pack|Pasa Pack Bot|pasa pack Bot|pasa tu pack Bot|Pásame tus fotos desnudas|pásame tu pack|me pasas tu pak|me pasas tu pack|pasa pack)/gi)) {
await sendBn('https://qu.ax/KjHR.mp3')
}

if (chat.audios && m.text.match(/(Contexto|CONTEXTO|contexto|Pasen contexto|PASEN CONTEXTO|pasen contexto|Y el contexto|Y EL CONTEXTO|y el contexto)/gi)) {
await sendBn('https://qu.ax/YBzh.mp3')
}

if (chat.audios && m.text.match(/(Pero esto|pero esto|Pero esto ya es otro nivel|pero esto ya es otro nivel|Otro nivel|otro nivel)/gi)) {
await sendBn('https://qu.ax/javz.mp3')
}

if (chat.audios && m.text.match(/(PIKA|pica|Pica|Pikachu|pikachu|PIKACHU|picachu|Picachu)/gi)) {
await sendBn('https://qu.ax/wbAf.mp3')
}

if (chat.audios && m.text.match(/(Pokemon|pokemon|Pokémon|pokémon)/gi)) {
await sendBn('https://qu.ax/kWLh.mp3')
}

if (chat.audios && m.text.match(/(Quién es tu senpai botsito 7u7|Quien es tu senpai botsito 7u7|Quién es tu sempai botsito 7u7|Quien es tu sempai botsito 7u7|Quién es tu senpai botsito 7w7|Quien es tu senpai botsito 7w7|quién es tu senpai botsito 7u7|quien es tu senpai botsito 7u7|Quién es tu sempai botsito 7w7|Quien es tu sempai botsito 7w7|Quién es tu senpai botsito|Quien es tu senpai botsito|Quién es tu sempai botsito|Quien es tu sempai botsito|Quién es tu senpai botsito|Quien es tu senpai botsito|quién es tu senpai botsito|quien es tu senpai botsito|Quién es tu sempai botsito|Quien es tu sempai botsito)/gi)) {
await sendBn('https://qu.ax/uyqQ.mp3')
}

if (chat.audios && m.text.match(/(rawr|Rawr|RAWR|raawwr|rraawr|rawwr)/gi)) {
await sendBn('https://qu.ax/YnoG.mp3')
}

if (chat.audios && m.text.match(/(hablame|Habla me|Hablame|habla me|Háblame|háblame)/gi)) {
await sendBn('https://qu.ax/uQqA.mp3')
}

if (chat.audios && m.text.match(/(Cagaste|Miedo|miedo|Pvp|PVP|temor|que pasa|Que sucede|Que pasa|que sucede|Qué pasa|Qué sucede|Dime|dime)/gi)) {
await sendBn('https://qu.ax/FAVP.mp3')
}

if (chat.audios && m.text.match(/(YOSHI|Yoshi|YoShi|yoshi)/gi)) {
await sendBn('https://qu.ax/ZgKT.mp3')
}

if (chat.audios && m.text.match(/(Verdad que te engañe|verdad que te engañe|verdad que|Verdad que)/gi)) {
await sendBn('https://qu.ax/yTid.mp3')
}

if (chat.audios && m.text.match(/(vivan|vivan los novios|vivanlosnovios)/gi)) {
await sendBn('https://qu.ax/vHX.mp3')
}

if (chat.audios && m.text.match(/(Yamete|yamete|Yamete kudasai|yamete kudasai)/gi)) {
await sendBn('https://qu.ax/thgS.mp3')
}

if (chat.audios && m.text.match(/(Usted esta detenido|usted esta detenido|usted está detenido|Usted está detenido)/gi)) {
await sendBn('https://qu.ax/UWqX.mp3')
}

if (chat.audios && m.text.match(/(una pregunta|pregunton|preguntona)/gi)) {
await sendBn('https://qu.ax/NHOM.mp3')
}

if (chat.audios && m.text.match(/(oye|🐔|Chiste)/gi)) {
await sendBn('https://qu.ax/MSiQ.mp3')
}

if (chat.audios && m.text.match(/(gaspi y la minita|Gaspi y la mina|ig del la minita)/gi)) {
await sendBn('https://qu.ax/wYil.mp3')
}

if (chat.audios && m.text.match(/(gaspi frase|frase)/gi)) {
await sendBn('https://qu.ax/gNwU.mp3')
}

if (chat.audios && m.text.match(/(se pubrio|se que re pubrio)/gi)) {
await sendBn('https://qu.ax/keKg.mp3')
}

if (chat.audios && m.text.match(/(goo|temazo|fuaa temon)/gi)) {
await sendBn('https://qu.ax/SWYV.mp3')
}

if (chat.audios && m.text.match(/(:V|:v|v:)/gi)) {
await sendBn('https://qu.ax/cxDg.mp3')
}

if (chat.audios && m.text.match(/(freefire|freefire)/gi)) {
await sendBn('https://qu.ax/Dwqp.mp3')
}

if (chat.audios && m.text.match(/(Aguanta|aguanta)/gi)) {
await sendBn('https://qu.ax/Qmz.mp3')
}

if (chat.audios && m.text.match(/(es viernes|Es viernes)/gi)) {
await sendBn('https://qu.ax/LcdD.mp3')
}

if (chat.audios && m.text.match(/(feriado|feriado de que)/gi)) {
await sendBn('https://qu.ax/mFCT.mp3')
}

if (chat.audios && m.text.match(/(Delevery|delivery|espanadas)/gi)) {
await sendBn('https://qu.ax/WGzN.mp3')
}

if (chat.audios && m.text.match(/(putos|tarado|tarado eh|tarado)/gi)) {
await sendBn('https://qu.ax/CoOd.mp3')
}

if (chat.audios && m.text.match(/(donde esta?|donde esta)/gi)) {
await sendBn('https://qu.ax/kCWg.mp3')
}

if (chat.audios && m.text.match(/(Q onda|que onda|🤪)/gi)) {
await sendBn('https://qu.ax/YpsR.mp3')
}

if (chat.audios && m.text.match(/(bebesita|bot canta)/gi)) {
await sendBn('https://qu.ax/Ouwp.mp3')
}

if (chat.audios && m.text.match(/(tka|tka)/gi)) {
await sendBn('https://qu.ax/jakw.mp3')
}

if (chat.audios && m.text.match(/(takataka|bot cantar)/gi)) {
await sendBn('https://qu.ax/rxvq.mp3')
}

if (chat.audios && m.text.match(/(Hey|Hei|hey|HEY)/gi)) {
await sendBn('https://qu.ax/AaBt.mp3')
}

if (chat.audios && m.text.match(/(Joder|joder)/gi)) {
await sendBn('https://qu.ax/lSgD.mp3')
}

if (chat.audios && m.text.match(/(:c|c:|:c)/gi)) {
await sendBn('https://qu.ax/XMHj.mp3')
}

if (chat.audios && m.text.match(/(siu|siiuu|ssiiuu|siuuu|siiuuu|siiiuuuu|siuuuu|siiiiuuuuu|siu|SIIIIUUU)/gi)) {
await sendBn('https://qu.ax/bfC.mp3')
}

if (chat.audios && m.text.match(/(Sus|sus|Amongos|among us|Among us|Among)/gi)) {
await sendBn('https://qu.ax/Mnrz.mp3')
}

if (chat.audios && m.text.match(/(te amo|teamo)/gi)) {
await sendBn('https://qu.ax/rGdn.mp3')
}

if (chat.audios && m.text.match(/(Estoy triste|ESTOY TRISTE|estoy triste|Triste|TRISTE|triste|Troste|TROSTE|troste|Truste|TRUSTE|truste)/gi)) {
await sendBn('https://qu.ax/QSyP.mp3')
}

if (chat.audios && m.text.match(/(un Pato| un pato|un pato que va caminando alegremente|Un pato|Un Pato)/gi)) {
await sendBn('https://qu.ax/pmOm.mp3')
}

if (chat.audios && m.text.match(/(UwU|uwu|Uwu|uwU|UWU)/gi)) {
await sendBn('https://qu.ax/hfyX.mp3')
}

if (chat.audios && m.text.match(/(fiesta viernes|viernes|Viernes|viernes fiesta)/gi)) {
await sendBn('https://qu.ax/wqXs.mp3')
}

if (chat.audios && m.text.match(/(WTF|wtf|Wtf|wataf|watafac|watafack)/gi)) {
await sendBn('https://qu.ax/aPtM.mp3')
}

if (chat.audios && m.text.match(/(Yokese|yokese|YOKESE)/gi)) {
await sendBn('https://qu.ax/PWgf.mp3')
}

if (chat.audios && m.text.match(/(Bruno|bruno)/gi)) {
await sendBn('https://qu.ax/frSi.mp3')
}

if (chat.audios && m.text.match(/(vetealavrg|vete a la vrg|vete a la verga)/gi)) {
await sendBn('https://qu.ax/pXts.mp3')
}

if (chat.audios && m.text.match(/(basta jovenes ya|basta jovenes|basta)/gi)) {
await sendBn('https://qu.ax/uXVZ.mp4')
}

if (chat.audios && m.text.match(/(hice algo que nunca hice|ya chambie|chambie)/gi)) {
await sendBn('https://qu.ax/sDWq.mp3')
}

return !0 }
export default handler
