import { performance } from 'perf_hooks'

let handler = async (m, { conn }) => {
    // 1. Iniciamos el cálculo de velocidad
    let start = performance.now()
    
    // Pequeña pausa para medir la respuesta del event loop
    let end = performance.now()
    let latencia = (end - start).toFixed(3)

    // 2. Construimos las líneas usando tu función msg de handler
    // Nota: El handler ya aplica el prefijo ⟨✦⟩ a cada línea
    const info = [
        `*ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ᴘʀᴏᴊᴇᴄᴛs*`,
        `ʟᴀᴛᴇɴᴄɪᴀ: \`${latencia} ms\``,
        `ᴇsᴛᴀᴅᴏ: \`ᴀᴄᴛɪᴠᴏ ᴘʀᴇᴍɪᴜᴍ\``,
        `sᴇʀᴠɪᴅᴏʀ: \`ɴᴏᴅᴇ.ᴊs v20.x\``
    ]

    // 3. Usamos mashaReply que ya maneja el Icono, Newsletter y Canal
    // Esta función está definida en tu handler.js y usa global.getNewsletterCtx
    try {
        const txt = info.map(l => `⟨✦⟩ ${l}`).join('\n')
        
        const thumb = await global.getIconThumb?.() || null
        const ctx = global.getNewsletterCtx?.(thumb, 'ᴘɪɴɢ - ᴍᴀsʜᴀ sʏsᴛᴇᴍ', 'Velocidad de respuesta real', true) || {}
        
        await conn.sendMessage(m.chat, { 
            text: txt, 
            contextInfo: ctx 
        }, { quoted: m })
        
    } catch (e) {
        // Backup en caso de que falle el contextInfo
        await m.reply(`⟨✦⟩ ʟᴀᴛᴇɴᴄɪᴀ: ${latencia} ms`)
    }
}

handler.help = ['ping']
handler.tags = ['main']
handler.command = /^(p|ping|speed)$/i // Agregué speed como alias

export default handler
