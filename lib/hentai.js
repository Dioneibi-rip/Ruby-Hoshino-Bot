import fetch from 'node-fetch'
import sharp from 'sharp'

const API_URL = "https://manhwawebbackend-production.up.railway.app"
const HEADERS = {
    "Origin": "https://manhwaweb.com",
    "Referer": "https://manhwaweb.com/",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    "Accept": "application/json, text/plain, */*"
}

const sanitizeFileName = (name = 'manhwa') => name.replace(/[<>:"/\\|?*]+/g, '').trim() || 'manhwa'

// 1. Buscar Manhwa
async function searchManhwa(query) {
    const res = await fetch(`${API_URL}/manhwa/library?buscar=${encodeURIComponent(query)}&order_item=alfabetico&order_dir=desc&page=0`, { headers: HEADERS })
    if (!res.ok) throw new Error(`Error de conexión con ManhwaWeb (${res.status}).`)
    
    const data = await res.json()
    const results = data.data || []
    
    return results.map(item => ({
        id: item.real_id || item._id,
        title: item.the_real_name || item.name_esp || item._name || "Sin título",
        thumb: item._imagen || ''
    })).slice(0, 15) // Limitamos a 15 resultados
}

// 2. Obtener lista de Capítulos de un Manhwa
async function getManhwaChapters(mangaId) {
    const res = await fetch(`${API_URL}/manhwa/see/${mangaId}`, { headers: HEADERS })
    if (!res.ok) throw new Error(`Manga no disponible (${res.status}).`)
    
    const data = await res.json()
    const title = data.the_real_name || data.name_esp || data._name || "Sin título"
    const rawChapters = data.chapters || []
    
    const chapters = rawChapters.map(ch => {
        let chId = ""
        if (ch.link) {
            const parts = ch.link.split('/').filter(p => p.length > 0)
            chId = parts[parts.length - 1]
        }
        if (!chId) chId = `${mangaId}-${ch.chapter}`
        
        return { id: chId, chapter: ch.chapter }
    })
    
    // Devolvemos el título y los capítulos (invertidos para que el 1 salga primero)
    return { title, chapters: chapters.reverse() }
}

// ==========================================
// CONSTRUCTOR DE PDF (Reutilizado de tu código)
// ==========================================
const getJpegSize = (buffer) => {
    if(!buffer||buffer.length<4||buffer[0]!==0xFF||buffer[1]!==0xD8)return{width:1000,height:1400}
    let i=2
    while(i<buffer.length){
        if(buffer[i]!==0xFF){i++;continue}
        const marker=buffer[i+1]
        const length=buffer.readUInt16BE(i+2)
        if([0xC0,0xC1,0xC2].includes(marker)){
            const height=buffer.readUInt16BE(i+5)
            const width=buffer.readUInt16BE(i+7)
            return{width,height}
        }
        i+=2+length
    }
    return{width:1000,height:1400}
}

const buildPdfFromJpegs = (title, jpegBuffers) => {
    const objects=[]
    const pushObj=(content)=>{objects.push(content);return objects.length}
    const pageIds=[]
    for(const img of jpegBuffers){
        const size=getJpegSize(img)
        const imgObj=pushObj(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${size.width} /Height ${size.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`),img,Buffer.from('\nendstream')]))
        const contentStream=`q\n${size.width} 0 0 ${size.height} 0 0 cm\n/Im${imgObj} Do\nQ`
        const contentObj=pushObj(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`)
        const pageObj=pushObj(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${size.width} ${size.height}] /Resources << /XObject << /Im${imgObj} ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>`)
        pageIds.push(pageObj)
    }
    const kids=pageIds.map((id)=>`${id} 0 R`).join(' ')
    const pagesId=pushObj(`<< /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >>`)
    for(const pageId of pageIds){
        objects[pageId-1]=String(objects[pageId-1]).replace('/Parent 0 0 R',`/Parent ${pagesId} 0 R`)
    }
    const catalogId=pushObj(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)
    const infoId=pushObj(`<< /Title (${title.replace(/[()]/g,'')}) /Producer (Bot-Generador) >>`)
    let offset=0
    const chunks=[Buffer.from('%PDF-1.4\n')]
    offset+=chunks[0].length
    const xref=['0000000000 65535 f ']
    for(let i=0;i<objects.length;i++){
        const obj=Buffer.isBuffer(objects[i])?objects[i]:Buffer.from(String(objects[i]))
        const head=Buffer.from(`${i+1} 0 obj\n`)
        const tail=Buffer.from('\nendobj\n')
        xref.push(String(offset).padStart(10,'0')+' 00000 n ')
        chunks.push(head,obj,tail)
        offset+=head.length+obj.length+tail.length
    }
    const xrefOffset=offset
    const xrefBody=`xref\n0 ${objects.length+1}\n${xref.join('\n')}\n`
    const trailer=`trailer\n<< /Size ${objects.length+1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    chunks.push(Buffer.from(xrefBody),Buffer.from(trailer))
    return Buffer.concat(chunks)
}

// 3. Descargar y construir PDF de un Capítulo
async function buildManhwaPdf(chapterId, mangaTitle = "Capitulo") {
    // Obtener imágenes del capítulo
    const res = await fetch(`${API_URL}/chapters/see/${chapterId}`, { headers: HEADERS })
    if (!res.ok) throw new Error(`No se pudo obtener el capítulo (${res.status}).`)
    
    const data = await res.json()
    const imagesUrls = data.chapter?.img || []
    
    if (!imagesUrls.length) throw new Error('El capítulo no tiene páginas disponibles.')

    const jpegBuffers = []
    
    for (const url of imagesUrls) {
        try {
            const imgRes = await fetch(url, { headers: HEADERS })
            if (!imgRes.ok) continue
            const arr = await imgRes.arrayBuffer()
            
            // CONVERSIÓN OBLIGATORIA A JPEG (los manhwas usan mucho WebP)
            const jpegBuffer = await sharp(Buffer.from(arr))
                .jpeg({ quality: 80 })
                .toBuffer()
                
            jpegBuffers.push(jpegBuffer)
        } catch (err) {
            console.log(`Error descargando/convirtiendo imagen: ${url}`)
            continue
        }
    }

    if (!jpegBuffers.length) throw new Error('La descarga falló, no se obtuvieron imágenes compatibles.')

    const safeTitle = sanitizeFileName(`Manhwa_${mangaTitle}_${chapterId}`)
    const pdfBuffer = buildPdfFromJpegs(safeTitle, jpegBuffers)
    
    return { 
        pdfBuffer, 
        fileName: `${safeTitle}.pdf`, 
        pageCount: jpegBuffers.length, 
        coverBuffer: jpegBuffers[0] 
    }
}

export { searchManhwa, getManhwaChapters, buildManhwaPdf }
