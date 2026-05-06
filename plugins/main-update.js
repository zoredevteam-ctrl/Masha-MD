import { exec } from 'child_process'
import { promisify } from 'util'

const execute = promisify(exec)

let handler = async (m, { conn, isOwner }) => {
    // Seguridad: Solo tú puedes actualizar el bot
    if (!isOwner) return

    try {
        await m.reply('⟨✦⟩ `Eᴊᴇᴄᴜᴛᴀɴᴅᴏ ᴀᴄᴛᴜᴀʟɪᴢᴀᴄɪᴏɴ...` ⏳')

        // Comando para traer los cambios de GitHub
        const { stdout, stderr } = await execute('git pull')

        if (stdout.includes('Already up to date')) {
            return await m.reply('⟨✦⟩ `ᴍᴀsʜᴀ sʏsᴛᴇᴍ` ya está en la versión más reciente. ✅')
        }

        if (stdout.includes('Updating')) {
            const updates = [
                `*ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ᴜᴘᴅᴀᴛᴇᴅ* 🎀`,
                `ᴠᴇʀsɪᴏɴ: \`v${global.botVersion || '1.0.1'}\``,
                '',
                `*ʟᴏɢ ᴅᴇ ᴄᴀᴍʙɪᴏs:*`,
                `\`\`\`${stdout}\`\`\``,
                '',
                `> Rᴇɪɴɪᴄɪᴀɴᴅᴏ sɪsᴛᴇᴍᴀ ᴘᴀʀᴀ ᴀᴘʟɪᴄᴀʀ ᴄᴀᴍʙɪᴏs...`
            ]

            const txt = updates.join('\n')
            const thumb = global.icono

            const ctx = {
                externalAdReply: {
                    title: 'ᴍᴀsʜᴀ sʏsᴛᴇᴍ ᴜᴘᴅᴀᴛᴇ 🪄',
                    body: 'Z0RT SYSTEMS | Actualización Exitosa',
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnailUrl: thumb,
                    sourceUrl: global.rcanal
                }
            }

            await conn.sendMessage(m.chat, { text: txt, contextInfo: ctx }, { quoted: m })
            
            // Reinicio automático para cargar lo nuevo (Solo si usas pm2 o un monitor)
            process.exit(0) 
        }

    } catch (e) {
        console.error(e)
        await m.reply(`⟨✦⟩ *ERROR:* No se pudo actualizar.\n\n\`\`\`${e.message}\`\`\``)
    }
}

handler.help = ['update']
handler.tags = ['main']
handler.command = ['update', 'actualizacion', 'gitpull'] 
handler.rowner = true // Solo para el dueño real

export default handler
