        const max = Math.min(packDetails.stickers.length, 20);
        let stickersArray = [];
        let coverBuffer = null;

        for (let i = 0; i < max; i++) {
            const sticker = packDetails.stickers[i];
            try {
                const response = await axios.get(sticker.imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 15000
                });

                const buffer = Buffer.from(response.data);
                let finalBuffer;

                // 🛠️ Aplicamos la lógica de redimensionamiento de Codex
                if (sticker.isAnimated) {
                    finalBuffer = buffer;
                } else {
                    finalBuffer = await sharp(buffer)
                        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .webp({ quality: 90 })
                        .toBuffer();
                }

                // 🖼️ Creamos una portada estática obligatoria (i === 0)
                if (i === 0) {
                    try {
                        coverBuffer = await sharp(finalBuffer, { animated: false })
                            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                            .webp({ quality: 90 })
                            .toBuffer();
                    } catch {
                        coverBuffer = finalBuffer;
                    }
                }

                stickersArray.push({
                    media: finalBuffer, // El core modificado espera 'media'
                    isAnimated: sticker.isAnimated,
                    emojis: ['🎀'],
                    fileName: `sticker-${i}.webp` // Importante para la unicidad que pedía el test
                });

            } catch (err) {
                console.log(`Error al procesar sticker ${i + 1}:`, err.message);
            }
        }

        // 🚀 Envío con el nuevo formato corregido
        await conn.sendMessage(
            m.chat,
            {
                stickerPack: {
                    name: packDetails.name,
                    publisher: packDetails.author,
                    description: 'Descargado por tu Bot Kawaii ✨',
                    cover: coverBuffer,
                    stickers: stickersArray
                }
            },
            { quoted: m }
        );
