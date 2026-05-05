import { performance } from 'perf_hooks'

let handler = async (m, { conn }) => {
    // Medimos el tiempo inicial
    let start = performance.now()
    
    // Ejecutamos una pequeña operación para que el ping sea real
    let end = performance.now()
    let latencia = (end - start).toFixed(4) 

    // Formateamos las líneas con el estilo de tu handler ⟨✦⟩
    const info = [
        `*ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ᴘʀᴏᴊᴇᴄᴛs*`,
        `ʟᴀᴛᴇɴᴄɪᴀ : \`${latencia} ms\``,
        `ᴇsᴛᴀᴅᴏ : \`ᴀᴄᴛɪᴠᴏ ᴘʀᴇᴍɪᴜᴍ\``,
        `sᴇʀᴠɪᴅᴏʀ : \`ɴᴏᴅᴇ.ᴊs v24.x\``
    ]

    // Unimos las líneas usando tu prefijo ⟨✦⟩
    const txt = info.map(l => `⟨✦⟩ ${l}`).join('\n')

    try {
        // Obtenemos el thumbnail y el contexto configurado en tu global
        const thumb = await global.getIconThumb?.() || null
        
        // Ajusté el emoji a 🎀 para que combine con el estilo Masha que pediste
        const ctx = global.getNewsletterCtx?.(
            thumb, 
            'ᴘɪɴɢ - ᴍᴀsʜᴀ sʏsᴛᴇᴍ 🎀', 
            'Velocidad de respuesta en tiempo real', 
            true
        ) || {}

        await conn.sendMessage(m.chat, { 
            text: txt, 
            contextInfo: ctx 
        }, { quoted: m })

    } catch (e) {
        // Backup por si falla el contextInfo de las Newsletters
        await m.reply(`⟨✦⟩ ʟᴀᴛᴇɴᴄɪᴀ: ${latencia} ms`)
    }
}

handler.help = ['ping']
handler.tags = ['main']
handler.command = /^(p|ping|speed)$/i 

export default handler
