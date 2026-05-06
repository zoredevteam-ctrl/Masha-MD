let handler = async (m, { conn, usedPrefix }) => {
    // Definimos los datos del creador (Adrien)
    const ownerNumber = global.owner[0][0] // Toma el primer número de settings.js
    const ownerName   = global.owner[0][1] || 'Adrien'

    // Generamos la vCard (Tarjeta de contacto)
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${ownerName};;;\nFN:${ownerName}\nORG:Z0RT SYSTEMS;\nTITLE:Developer & Founder;\nitem1.TEL;waid=${ownerNumber}:${ownerNumber}\nitem1.X-ABLabel:Masha Kujou Developer\nX-WA-BIZ-DESCRIPTION:˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ — XLR4-Security\nEND:VCARD`

    // Mensaje estético de presentación
    const txt = `
*「 ɪɴғᴏ ᴅᴇʟ ᴄʀᴇᴀᴅᴏʀ 」*

⟨✦⟩ ɴᴏᴍʙʀᴇ : \`˚₊· ͟͟͞͞  Aᴅʀɪᴇɴ\`
⟨✦⟩ ʀᴏʟ : \`ᴅᴇᴠᴇʟᴏᴘᴇʀ ᴍᴀsᴛᴇʀ\`
⟨✦⟩ ᴇǫᴜɪᴘᴏ : \`ᴢ0ʀᴛ sʏsᴛᴇᴍs\`
⟨✦⟩ ᴇsᴛᴀᴅᴏ : \`ᴅɪsᴘᴏɴɪʙʟᴇ ᴘᴀʀᴀ ᴘʀᴏʏᴇᴄᴛᴏs\`

> *Si tienes dudas o quieres reportar un error, contacta directamente con el dueño.* 🎀
`.trim()

    try {
        // 1. Enviamos la tarjeta de contacto primero
        await conn.sendMessage(m.chat, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: m })

        // 2. Enviamos el mensaje con el banner y la info del canal
        const thumb = global.icono
        const ctx = {
            externalAdReply: {
                title: 'ᴍᴀsʜᴀ sʏsᴛᴇᴍ ⏤ ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ',
                body: 'Pᴏᴡᴇʀᴇᴅ ʙʏ Z0RT SYSTEMS',
                mediaType: 1,
                renderLargerThumbnail: true, // Icono expandido
                thumbnailUrl: thumb,
                sourceUrl: global.rcanal,
                // Datos del Newsletter/Canal
                newsletterJid: global.newsletterJid,
                newsletterName: global.newsletterName,
                forwardingScore: 999,
                isForwarded: true
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

handler.help = ['owner']
handler.tags = ['main']
handler.command = ['owner', 'creador', 'contacto', 'adrien'] 

export default handler
