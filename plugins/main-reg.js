import { createHash } from 'crypto'
import { database } from '../lib/database.js'

let Reg = /([|{\\]) Registrarse ([|{\\])/i // Alias por si quieres usar botones
let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user = database.getUser(m.sender)
    
    // Si ya está registrado
    if (user.registered === true) {
        return m.reply(`⟨✦⟩ Ya estás registrado en la base de datos de *Masha System*.\n\n*Nombre:* ${user.name}\n*Edad:* ${user.age}\n*SN:* ${user.sn}`)
    }

    // Formato: #reg nombre.edad
    let [name, age] = text.split('.')
    if (!name || !age) {
        return m.reply(`⟨✦⟩ *Uso Incorrecto*\n\nUsa el comando: \`${usedPrefix + command} nombre.edad\`\n*Ejemplo:* \`${usedPrefix + command} ${m.pushName}.15\``)
    }

    if (name.length >= 30) return m.reply('⟨✦⟩ El nombre es demasiado largo.')
    age = parseInt(age)
    if (age > 100) return m.reply('⟨✦⟩ ¡Vaya! ¿Eres un elfo? Por favor, usa una edad real.')
    if (age < 5) return m.reply('⟨✦⟩ Los bebés no saben programar bots...')

    // Guardar en Base de Datos
    user.name = name.trim()
    user.age = age
    user.registered = true
    user.registered_time = Date.now()
    user.sn = createHash('md5').update(m.sender).digest('hex').slice(0, 10) // Número de serie único

    let regMsg = `
*「 ʀᴇɢɪsᴛʀᴏ ᴇxɪᴛᴏsᴏ 」*

⟨✦⟩ ɴᴏᴍʙʀᴇ : \`${user.name}\`
⟨✦⟩ ᴇᴅᴀᴅ : \`${user.age} años\`
⟨✦⟩ sɴ : \`${user.sn}\`
⟨✦⟩ ʙᴏɴᴏ : \`$1000\` y \`10 diamantes\`

> *Ahora puedes usar todas las funciones de Masha Kujou MD.* 🎀
`.trim()

    // Premios por registro
    user.money += 1000
    user.limit += 10

    try {
        const thumb = global.icono
        const ctx = {
            externalAdReply: {
                title: 'ᴍᴀsʜᴀ sʏsᴛᴇᴍ ⏤ ᴜsᴇʀ ʀᴇɢɪsᴛᴇʀ',
                body: `Bienvenido(a) a Z0RT SYSTEMS`,
                mediaType: 1,
                renderLargerThumbnail: true,
                thumbnailUrl: thumb,
                sourceUrl: global.rcanal,
                // Incorporamos los datos del Newsletter en el pie de la tarjeta
                forwardingScore: 999,
                isForwarded: true,
                newsletterJid: global.newsletterJid,
                newsletterName: global.newsletterName,
                serverMessageId: 143
            }
        }

        await conn.sendMessage(m.chat, { 
            text: regMsg, 
            contextInfo: ctx 
        }, { quoted: m })

    } catch (e) {
        await m.reply(regMsg)
    }
}

handler.help = ['reg']
handler.tags = ['main']
handler.command = ['reg', 'registrar', 'regbot', 'verificar']

export default handler
