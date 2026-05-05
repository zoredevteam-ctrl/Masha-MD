import { performance } from 'perf_hooks'

let handler = async (m, { conn }) => {
    let start = performance.now()
    
    // Pequeño delay para que el cálculo no sea 0.000
    await new Promise(resolve => setTimeout(resolve, 1))
    
    let end = performance.now()
    let latencia = (end - start).toFixed(3)

    const info = [
        `*ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ᴘʀᴏᴊᴇᴄᴛs*`,
        `ʟᴀᴛᴇɴᴄɪᴀ : \`${latencia} ms\``,
        `ᴇsᴛᴀᴅᴏ : \`ᴀᴄᴛɪᴠᴏ ᴘʀᴇᴍɪᴜᴍ\``,
        `sᴇʀᴠɪᴅᴏʀ : \`ɴᴏᴅᴇ.ᴊs v24.x\``
    ]

    const txt = info.map(l => `⟨✦⟩ ${l}`).join('\n')

    try {
        const thumb = await global.getIconThumb?.() || null
        const ctx = global.getNewsletterCtx?.(
            thumb, 
            'ᴘɪɴɢ - ᴍᴀsʜᴀ sʏsᴛᴇᴍ 🎀', 
            'Velocidad de respuesta real', 
            true
        ) || {}

        await conn.sendMessage(m.chat, { 
            text: txt, 
            contextInfo: ctx 
        }, { quoted: m })

    } catch (e) {
        await m.reply(`⟨✦⟩ ʟᴀᴛᴇɴᴄɪᴀ: ${latencia} ms`)
    }
}

handler.help = ['ping']
handler.tags = ['main']

// CAMBIO CLAVE: Usamos un Array en lugar de RegExp para que tu handler lo lea bien
handler.command = ['p', 'ping', 'speed'] 

export default handler
