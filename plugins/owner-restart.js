// plugins/restart.js — Masha Kujou MD
// ✦ Reinicia el proceso del bot limpiamente
// ✦ Solo el owner puede ejecutarlo

import { database } from '../lib/database.js'

const handler = async (m, { conn, isOwner }) => {
    if (!isOwner) {
        return m.reply('⟨✦⟩ sᴏʟᴏ ᴇʟ *owner* ᴘᴜᴇᴅᴇ ʀᴇɪɴɪᴄɪᴀʀ ᴇʟ ʙᴏᴛ.')
    }

    const thumb = await global.getIconThumb?.() || null
    const ctx   = global.getNewsletterCtx?.(thumb) || {}

    // Avisar antes de cerrar
    try {
        await conn.sendMessage(m.chat, {
            text: '⟨✦⟩ ʀᴇɪɴɪᴄɪᴀɴᴅᴏ...\n◈ ᴠᴜᴇʟᴠᴏ ᴇɴ ᴜɴᴏs sᴇɢᴜɴᴅᴏs 🌸',
            contextInfo: ctx
        }, { quoted: m })
    } catch {}

    // Guardar la DB antes de salir
    try { await database.save() } catch {}

    // Esperar un momento para que el mensaje llegue
    setTimeout(() => process.exit(0), 1500)
}

handler.command = ['restart', 'reiniciar', 'reboot']
handler.tags    = ['owner']
handler.owner   = true

export default handler
