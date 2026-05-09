import { exec } from 'child_process'
import { promisify } from 'util'

const execute = promisify(exec)

let handler = async (m, { conn, isOwner }) => {
    // Seguridad: Solo tú puedes actualizar el bot
    if (!isOwner) return

    try {
        await m.reply('Dame un momento, estoy sincronizando los archivos de GitHub... no me presiones. ⏳')

        // Comando para traer los cambios de GitHub
        const { stdout, stderr } = await execute('git pull')

        if (stdout.includes('Already up to date')) {
            return await m.reply('Ya estoy en la versión más reciente. ¿Crees que me quedo atrás? 🎀')
        }

        if (stdout.includes('Updating')) {
            const updates = [
                `Ya descargué los nuevos archivos. Los cambios en los comandos ya están listos para usarse.`,
                ``,
                `*Cambios detectados:*`,
                `\`\`\`${stdout.trim()}\`\`\``
            ]

            const txt = updates.join('\n')

            const ctx = {
                externalAdReply: {
                    title: 'ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ⏤ ᴜᴘᴅᴀᴛᴇ',
                    body: 'Z0RT SYSTEMS',
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnailUrl: global.icono,
                    sourceUrl: global.rcanal,
                    newsletterJid: global.newsletterJid,
                    newsletterName: global.newsletterName
                }
            }

            await conn.sendMessage(m.chat, { text: txt, contextInfo: ctx }, { quoted: m })
            
            // ❌ Eliminé process.exit(0) aquí. 
            // Ahora el bot hará git pull y seguirá funcionando sin apagarse.
        }

    } catch (e) {
        console.error(e)
        await m.reply(`Algo salió mal con GitHub. Revisa la consola, yo no puedo arreglar tu código roto.\n\n\`\`\`${e.message}\`\`\``)
    }
}

handler.help = ['update']
handler.tags = ['main']
handler.command = ['update', 'actualizacion', 'gitpull'] 
handler.rowner = true // Solo para el dueño real

export default handler
