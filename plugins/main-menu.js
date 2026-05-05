import { performance } from 'perf_hooks'
import fs from 'fs'
import path from 'path'
import { database } from '../lib/database.js'

let handler = async (m, { conn, usedPrefix }) => {
    let _package = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
    let { money, level, exp, limit, name } = database.getUser(m.sender)
    
    // Configuración de tiempo y saludo
    let uptime = process.uptime() * 1000
    let muptime = clockString(uptime)
    let greeting = getGreeting()

    const menu = `
${greeting}, *${name || m.pushName}* 🎀

*「 ɪɴғᴏ ᴜsᴜᴀʀɪᴏ 」*
⟨✦⟩ ɴɪᴠᴇʟ : \`${level}\`
⟨✦⟩ ᴇxᴘ : \`${exp}\`
⟨✦⟩ ᴅɪɴᴇʀᴏ : \`$${money}\`
⟨✦⟩ ᴅɪᴀᴍᴀɴᴛᴇs : \`${limit}\`

*「 ɪɴғᴏ ʙᴏᴛ 」*
⟨✦⟩ ᴠᴇʀsɪᴏɴ : \`v${_package.version}\`
⟨✦⟩ ᴘʀᴇғɪᴊᴏ : \`[ ${usedPrefix} ]\`
⟨✦⟩ ᴀᴄᴛɪᴠᴏ : \`${muptime}\`
⟨✦⟩ ᴍᴏᴅᴏ : \`${global.opts?.self ? 'Privado' : 'Público'}\`

*「 ʟɪsᴛᴀ ᴅᴇ ᴄᴏᴍᴀɴᴅᴏs 」*

  *🎀 ᴍᴀɪɴ*
  • ${usedPrefix}ping
  • ${usedPrefix}update
  • ${usedPrefix}owner

  *🪄 ᴇᴄᴏɴᴏᴍʏ*
  • ${usedPrefix}balance
  • ${usedPrefix}claim
  • ${usedPrefix}work

  *🎀 ᴅᴏᴡɴʟᴏᴀᴅs*
  • ${usedPrefix}play
  • ${usedPrefix}tiktok
  • ${usedPrefix}ig

  *🪄 ᴀɴɪᴍᴇ*
  • ${usedPrefix}waifu
  • ${usedPrefix}neko
  • ${usedPrefix}masha

  *🎀 ɢʀᴏᴜᴘs*
  • ${usedPrefix}kick
  • ${usedPrefix}add
  • ${usedPrefix}promote

---
> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ
`.trim()

    try {
        // Usamos el global.banner para que se vea en grande
        const banner = global.banner 
        
        const ctx = {
            externalAdReply: {
                title: 'ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ᴍᴅ ⏤ sʏsᴛᴇᴍ',
                body: 'Premium WhatsApp Bot Experience',
                mediaType: 1,
                previewType: 0,
                renderLargerThumbnail: true, // ESTO HACE QUE EL BANNER SEA GRANDE
                thumbnailUrl: banner,
                sourceUrl: global.rcanal || 'https://github.com/Zoredevteam-ctrl'
            }
        }

        await conn.sendMessage(m.chat, { 
            text: menu, 
            contextInfo: ctx 
        }, { quoted: m })

    } catch (e) {
        await m.reply(menu)
    }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'comandos'] 

export default handler

// ── Funciones de Ayuda ────────────────────────────────────────────────────────

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

function getGreeting() {
    let hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Buenos días'
    if (hour >= 12 && hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}
