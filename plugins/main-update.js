import { performance } from 'perf_hooks'

let handler = async (m, { conn }) => {
    // Definimos los cambios de la versión
    const updates = [
        `*ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ᴜᴘᴅᴀᴛᴇs*`,
        `ᴠᴇʀsɪᴏɴ: \`v${global.botVersion || '1.0.0'}\``,
        `ᴇsᴛᴀᴅᴏ: \`ᴏᴘᴛɪᴍɪᴢᴀᴅᴏ\``,
        '',
        `*ɴᴏᴠᴇᴅᴀᴅᴇs ʀᴇᴄɪᴇɴᴛᴇs:*`,
        `• ɴᴜᴇᴠᴏ sɪsᴛᴇᴍᴀ ᴅᴇ ʙᴀsᴇ ᴅᴇ ᴅᴀᴛᴏs (ʟᴏᴡᴅʙ v3).`,
        `• sɪʟᴇɴᴄɪᴀᴅᴏ ᴅᴇ ᴇʀʀᴏʀᴇs 'ʙᴀᴅ ᴍᴀᴄ' ᴇɴ ᴄᴏɴsᴏʟᴀ.`,
        `• ᴍᴇᴊᴏʀᴀ ᴇɴ ʟᴀ ʟᴀᴛᴇɴᴄɪᴀ ᴅᴇ ʀᴇsᴘᴜᴇsᴛᴀ.`,
        `• ɴᴜᴇᴠᴀ ᴇsᴛᴇᴛɪᴄᴀ ᴍᴀsʜᴀ sʏsᴛᴇᴍ ʀᴇғɪɴᴇᴅ.`
    ]

    const txt = updates.map(l => l.startsWith('*') || l === '' ? l : `⟨✦⟩ ${l}`).join('\n')

    try {
        // Usamos el icono global, pero forzamos un formato que lo haga lucir mejor
        const thumb = global.icono // Tu URL de imagen principal
        
        // Configuramos el contextInfo para que el "icono chiquito" se vea elegante
        const ctx = {
            externalAdReply: {
                title: 'ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ - ɴᴇᴡ ᴜᴘᴅᴀᴛᴇ 🎀',
                body: 'Z0RT SYSTEMS | Premium Edition',
                mediaType: 1,
                previewType: 0,
                renderLargerThumbnail: true, // ESTO HACE QUE EL ICONO SE VEA MÁS GRANDE
                thumbnailUrl: thumb,
                sourceUrl: global.rcanal || 'https://github.com/Zoredevteam-ctrl'
            }
        }

        await conn.sendMessage(m.chat, { 
            text: txt, 
            contextInfo: ctx 
        }, { quoted: m })

    } catch (e) {
        await m.reply(txt)
    }
}

handler.help = ['update']
handler.tags = ['main']
handler.command = ['update', 'actualizacion', 'novedades'] 

export default handler
