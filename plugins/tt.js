const downloadTikTok = async (url) => {
    let videoUrl = null
    const apis = [
        async () => {
            const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`)
            const j = await r.json()
            return j.data?.play || j.data?.wmplay
        },
        async () => {
            const r = await fetch(`https://rest.alyabotpe.xyz/dl/tiktok?url=${encodeURIComponent(url)}&key=Duarte-zz12`)
            const j = await r.json()
            const d = j.data || j.result
            return d.download || d.url
        }
    ]
    for (const fn of apis) {
        try {
            const link = await fn()
            if (link && String(link).startsWith('http')) { videoUrl = link; break }
        } catch { continue }
    }
    return videoUrl
}

let handler = async (m, { conn, args }) => {
    const url = args[0] || (m.quoted?.text ? m.quoted.text.trim() : '')

    // Respuesta si no hay link (Cálida y natural)
    if (!url || !url.includes('tiktok.com')) {
        return m.reply('¡Vot! ¿Podrías pasarme el enlace del video? No puedo encontrarlo si no me lo das... ✨')
    }

    await m.react('✨')

    try {
        const videoUrl = await downloadTikTok(url)
        if (!videoUrl) throw new Error()

        await m.react('🤍')

        // Texto de respuesta como si fuera ella misma
        const caption = `¡Vot! Aquí tienes el video que querías. Espero que lo disfrutes mucho, de verdad. ✨\n\n— Ｍａｒｉａ  Ｋｕｊｏｕ`

        await conn.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption,
            mimetype: 'video/mp4',
            contextInfo: {
                externalAdReply: {
                    title: 'Ｍａｒｉａ  Ｋｕｊｏｕ',
                    body: '¡Aquí tienes tu video! ✨',
                    mediaType: 1,
                    thumbnailUrl: global.icono,
                    showAdAttribution: false,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: m })

    } catch {
        await m.react('❌')
        return m.reply('Oh, lo siento mucho... No pude obtener el video por ahora. ¿Podemos intentarlo más tarde? 𑁍')
    }
}

handler.help = ['tt']
handler.command = ['tt', 'tiktok', 'tk']
handler.tags = ['dl']

export default handler
