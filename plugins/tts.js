import fetch from 'node-fetch'

const fixUrl = (url) => {
    if (!url) return null
    const s = String(url)
    if (s.startsWith('http')) return s
    if (s.startsWith('/'))    return 'https://www.tikwm.com' + s
    return null
}

const searchTikTok = async (query) => {
    try {
        const r = await fetch('https://www.tikwm.com/api/feed/search?keywords=' + encodeURIComponent(query) + '&count=5&cursor=0&web=1')
        const j = await r.json()
        if (j?.code === 0 && j?.data?.videos?.length) {
            const v = j.data.videos[0]
            return {
                videoId: v.id,
                titulo: v.title || query,
                autor: v.author?.unique_id || 'alguien',
                videoUrl: fixUrl(v.play) || fixUrl(v.wmplay),
                thumb: fixUrl(v.cover) || fixUrl(v.origin_cover)
            }
        }
    } catch (e) { return null }
    return null
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const query = (text || '').trim()

    if (!query) {
        return m.reply(`¿Aún no sabes qué buscar? No me hagas perder el tiempo... dime qué quieres encontrar en TikTok.`)
    }

    await m.react('🪄') // Un toque de magia de Masha

    try {
        const result = await searchTikTok(query)

        if (!result) {
            await m.react('❄️')
            return m.reply(`Busqué por todos lados pero no encontré nada sobre "${query}". Intenta ser más específico.`)
        }

        let finalUrl = result.videoUrl
        if (!finalUrl && result.videoId) {
            const r = await fetch(`https://www.tikwm.com/api/?url=https://www.tiktok.com/@${result.autor}/video/${result.videoId}`)
            const j = await r.json()
            if (j?.code === 0) finalUrl = fixUrl(j.data?.play)
        }

        if (!finalUrl) throw new Error()

        // Texto natural de Masha
        const caption = `Aquí tienes lo que pediste sobre "${result.titulo}". No te acostumbres a que sea tan eficiente, ¿vale?`

        await conn.sendMessage(m.chat, {
            video: { url: finalUrl },
            caption,
            mimetype: 'video/mp4',
            contextInfo: {
                externalAdReply: {
                    title: 'ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ⏤ ᴛɪᴋᴛᴏᴋ sʏsᴛᴇᴍ',
                    body: `ᴅᴇʟɪᴠᴇʀᴇᴅ ʙʏ ᴢ0ʀᴛ sʏsᴛᴇᴍs`,
                    mediaType: 1,
                    thumbnailUrl: result.thumb || global.icono,
                    renderLargerThumbnail: true,
                    sourceUrl: global.rcanal,
                    newsletterJid: global.newsletterJid,
                    newsletterName: global.newsletterName
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        await m.react('❌')
        return m.reply(`Hubo un problema técnico al procesar el video. No es mi culpa, seguro es el servidor.`)
    }
}

handler.help = ['tiktoksearch']
handler.tags = ['dl']
handler.command = ['tiktoksearch', 'tts', 'ttb', 'buscartt']

export default handler
