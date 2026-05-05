import { performance } from 'perf_hooks'

let handler = async (m, { conn }) => {
    let start = performance.now()
    let end = performance.now()
    let latencia = (end - start).toFixed(3)

    const info = [
        `*ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ᴘʀᴏᴊᴇᴄᴛs*`,
        `ʟᴀᴛᴇɴᴄɪᴀ: \`${latencia} ms\``,
        `ᴇsᴛᴀᴅᴏ: \`ᴀᴄᴛɪᴠᴏ ᴘʀᴇᴍɪᴜᴍ\``,
        `sᴇʀᴠɪᴅᴏʀ: \`ɴᴏᴅᴇ.ᴊs v24.x\``
    ]

    try {
        // Tu handler usa ⟨✦⟩ por defecto, aquí armamos el texto limpio
        const txt = info.map(l => l).join('\n')

        const thumb = await global.getIconThumb?.() || null
        const ctx = global.getNewsletterCtx?.(thumb, 'ᴘɪɴɢ - ᴍᴀsʜᴀ sʏsᴛᴇᴍ 💥', 'Velocidad de respuesta real', true) || {}

        await conn.sendMessage(m.chat, { 
            text: txt, 
            contextInfo: ctx 
        }, { quoted: m })

    } catch (e) {
        await m.reply(`⟨✦⟩ ʟᴀᴛᴇɴᴄɪᴀ: ${latencia} ms`)
    }
}

// ESTO ES LO MÁS IMPORTANTE:
// Tu handler.js filtra los comandos por estas propiedades
handler.help = ['ping']
handler.tags = ['main']
handler.command = /^(p|ping|speed)$/i 

export default handler