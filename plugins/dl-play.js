import yts from 'yt-search'
import fetch from 'node-fetch'

// Función interna de respaldo para obtener Buffers si Baileys lo requiere
const getBuffer = async (url) => {
    const res = await fetch(url)
    return Buffer.from(await res.arrayBuffer())
}

const isYTUrl = (url) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url)

async function getVideoInfo(query, videoMatch) {
    const search = await yts(query)
    if (!search.all.length) return null
    const videoInfo = videoMatch ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] : search.all[0]
    return videoInfo || null
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) {
            return m.reply(`Me pides música pero no me dices cuál. ¿Acaso leo mentes? Escribe el nombre o dame el enlace de YouTube.`)
        }

        await m.react('🎧')

        const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
        const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : text
        
        let url = query
        let title = 'Audio'
        let thumb = global.icono
        
        const videoInfo = await getVideoInfo(query, videoMatch)
        
        if (videoInfo) {
            url = videoInfo.url
            title = videoInfo.title
            thumb = videoInfo.image
            
            // Texto natural de Masha en vez de datos robóticos
            await m.reply(`Encontré "${title}". Dame un segundo para extraer el audio, no seas impaciente.`)
        } else {
            return m.reply(`Busqué por todos lados pero no encontré nada llamado "${text}". Intenta con otro nombre.`)
        }

        const audio = await getAudioFromApis(url)
        
        if (!audio?.url) {
            await m.react('❌')
            return m.reply(`No pude descargar el audio de "${title}". O el video tiene restricciones o los servidores me están haciendo perder el tiempo. No es mi culpa.`)
        }

        // Enviamos el audio con el diseño Premium de Z0RT
        await conn.sendMessage(m.chat, { 
            audio: { url: audio.url }, 
            fileName: `${title}.mp3`, 
            mimetype: 'audio/mpeg',
            contextInfo: {
                externalAdReply: {
                    title: 'ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ⏤ ᴍᴜsɪᴄ',
                    body: `Reproduciendo: ${title}`,
                    mediaType: 1,
                    thumbnailUrl: thumb,
                    renderLargerThumbnail: true,
                    sourceUrl: url,
                    newsletterJid: global.newsletterJid,
                    newsletterName: global.newsletterName
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        await m.react('❌')
        console.error('[MASHA ERROR PLAY]', e)
        await m.reply(`Algo se rompió internamente mientras buscaba la canción. Yo no escribí este servidor, así que no me culpes a mí.`)
    }
}

// ─── MOTOR DE EXTRACCIÓN DE APIS ───
async function getAudioFromApis(url) {
    // Usamos el Optional Chaining (?.) por si alguna API no está definida en tu settings no rompa el bot
    const apis = [
        { api: 'Axi', endpoint: `${global.APIs?.axi?.url}/down/ytaudio?url=${encodeURIComponent(url)}`, extractor: res => res?.resultado?.url_dl },    
        { api: 'Ootaizumi', endpoint: `${global.APIs?.ootaizumi?.url}/downloader/youtube/play?query=${encodeURIComponent(url)}`, extractor: res => res.result?.download },
        { api: 'Vreden', endpoint: `${global.APIs?.vreden?.url}/api/v1/download/youtube/audio?url=${encodeURIComponent(url)}&quality=256`, extractor: res => res.result?.download?.url },
        { api: 'Stellar', endpoint: `${global.APIs?.stellar?.url}/dl/ytdl?url=${encodeURIComponent(url)}&format=mp3&key=${global.APIs?.stellar?.key}`, extractor: res => res.result?.download },
        { api: 'Ootaizumi v2', endpoint: `${global.APIs?.ootaizumi?.url}/downloader/youtube?url=${encodeURIComponent(url)}&format=mp3`, extractor: res => res.result?.download },
        { api: 'Vreden v2', endpoint: `${global.APIs?.vreden?.url}/api/v1/download/play/audio?query=${encodeURIComponent(url)}`, extractor: res => res.result?.download?.url },
        { api: 'Nekolabs', endpoint: `${global.APIs?.nekolabs?.url}/downloader/youtube/v1?url=${encodeURIComponent(url)}&format=mp3`, extractor: res => res.result?.downloadUrl },
        { api: 'Nekolabs v2', endpoint: `${global.APIs?.nekolabs?.url}/downloader/youtube/play/v1?q=${encodeURIComponent(url)}`, extractor: res => res.result?.downloadUrl }
    ]

    for (const { api, endpoint, extractor } of apis) {
        if (!endpoint || endpoint.includes('undefined')) continue; // Evita llamadas a APIs no configuradas
        
        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 10000)
            const res = await fetch(endpoint, { signal: controller.signal }).then(r => r.json())
            clearTimeout(timeout)
            const link = extractor(res)
            if (link) return { url: link, api }
        } catch (e) {}
        await new Promise(resolve => setTimeout(resolve, 500))
    }
    return null
}

handler.help = ['play', 'ytmp3']
handler.tags = ['dl']
handler.command = ['play', 'mp3', 'ytmp3', 'ytaudio', 'playaudio']

export default handler
