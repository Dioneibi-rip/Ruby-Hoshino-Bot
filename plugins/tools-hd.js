import fetch from "node-fetch";
import crypto from "crypto";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

const handler = async (m, { conn }) => {
  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || '';

  // Validación de archivo
  if (!mime || !/image\/(png|jpe?g)/.test(mime)) {
    return conn.reply(m.chat, `❌ Por favor, responde a una *imagen válida* (png o jpg).`, m);
  }

  await m.react("⏳"); // Espera inicial

  try {
    // Descarga de la imagen
    let media = await q.download();

    if (!media) throw new Error("No se pudo descargar la imagen.");

    // Subida a Catbox
    let link = await catbox(media);

    if (!link || !link.startsWith("http")) {
      throw new Error("Error al subir la imagen a Catbox.");
    }

    // Procesando con API upscale
    let upscaleApi = `https://api.siputzx.my.id/api/iloveimg/upscale?image=${encodeURIComponent(link)}&scale=2`;
    let res = await fetch(upscaleApi);
    let data = await res.json();

    if (!data.status || !data.result) {
      throw new Error(data.message || "La API de upscale no devolvió un resultado válido.");
    }

    // Aviso de procesamiento exitoso
    await conn.reply(m.chat, `✨ *Procesando tu imagen en HD...*`, m);

    // Envío de imagen mejorada
    await conn.sendMessage(m.chat, {
      image: { url: data.result },
      caption: `✅ *Imagen mejorada con éxito* \n\n🔗 *Enlace HD:* ${data.result}`
    }, { quoted: m });

    await m.react("✅"); // Reacción de éxito

  } catch (e) {
    console.error(e);
    await m.react("❌");
    return conn.reply(m.chat, `❌ *Error al procesar la imagen:*\n\`\`\`${e.message}\`\`\``, m);
  }
};

handler.help = ['hd', 'upscale'];
handler.tags = ['herramientas'];
handler.command = ['hd', 'upscale', 'mejorarimagen']; 
handler.register = true;
handler.limit = true;

export default handler;

// ─── Funciones auxiliares ───
async function catbox(content) {
  const { ext, mime } = (await fileTypeFromBuffer(content)) || {};
  const blob = new Blob([content.toArrayBuffer()], { type: mime });
  const formData = new FormData();
  const randomBytes = crypto.randomBytes(5).toString("hex");
  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", blob, randomBytes + "." + ext);

  const response = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: formData,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36",
    },
  });

  return await response.text();
}
