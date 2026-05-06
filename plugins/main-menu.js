import { performance } from 'perf_hooks'
import fs from 'fs'
import path from 'path'
import { database } from '../lib/database.js'

let handler = async (m, { conn, usedPrefix, text }) => {
    let _package = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
    let { money, level, exp, limit, name } = database.getUser(m.sender)

    let uptime = process.uptime() * 1000
    let muptime = clockString(uptime)
    let greeting = getGreeting()
    
    // Si el usuario pide una categoría específica (ej: #menu economia)
    let category = text.toLowerCase().trim()
    if (menuObject[category]) {
        let categoryText = menuObject[category].replaceAll('$prefix', usedPrefix)
        return await conn.sendMessage(m.chat, { 
            text: `*「 ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ — ${category.toUpperCase()} 」*\n\n${categoryText}`,
            contextInfo: getCtx(usedPrefix)
        }, { quoted: m })
    }

    // Menú Principal
    const header = `
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

> Vincula un *usuario* con tu número utilizando *${usedPrefix}qr* o *${usedPrefix}code para ser sub-bot de María kujou*.

‧꒷︶꒷꒥꒷‧₊˚꒷︶꒷꒥꒷︶꒷˚₊‧꒷꒥꒷︶꒷‧

*🎀 ᴄᴀᴛᴇɢᴏʀɪᴀs ᴅɪsᴘᴏɴɪʙʟᴇs:*
Para ver los comandos, escribe el nombre de la categoría.
Ejemplo: \`${usedPrefix}menu economia\`

◈ \`economia\`
◈ \`gacha\`
◈ \`downloads\`
◈ \`profile\`
◈ \`sockets\`
◈ \`stickers\`
◈ \`utils\`
◈ \`grupo\`
◈ \`anime\`
◈ \`nsfw\`

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴢ0ʀᴛ sʏsᴛᴇᴍs ❄️
`.trim()

    await conn.sendMessage(m.chat, { 
        text: header, 
        contextInfo: getCtx(usedPrefix) 
    }, { quoted: m })
}

// Función para generar el contexto visual (Banner expandido)
const getCtx = (prefix) => ({
    externalAdReply: {
        title: 'ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ᴍᴅ ⏤ ᴍᴇɴᴜ sʏsᴛᴇᴍ',
        body: `Usa ${prefix}menu <categoría> para explorar`,
        mediaType: 1,
        renderLargerThumbnail: true,
        thumbnailUrl: global.banner,
        sourceUrl: global.rcanal,
        newsletterJid: global.newsletterJid,
        newsletterName: global.newsletterName
    }
})

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'comandos'] 

export default handler

// --- DISEÑO DE CATEGORÍAS (Bordes Editados) ---
export const menuObject = {
economia: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *ECONOMY* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Comandos de Economía para ganar coins.
ꕤ *$prefixw » $prefixwork*
> Ganar coins trabajando.
ꕤ *$prefixbalance » $prefixbal*
> Ver tus monedas actuales.
ꕤ *$prefixdaily » $prefixdiario*
> Recompensa diaria.
ꕤ *$prefixcasino » $prefixslot*
> Apostar coins en el casino.
ꕤ *$prefixrob » $prefixsteal*
> Intentar robar coins a otro.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,

downloads: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *DOWNLOAD* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Descarga contenido multimedia.
ꕤ *$prefixfb » $prefixfacebook*
> Descargar de Facebook.
ꕤ *$prefixplay » $prefixytmp3*
> Música de YouTube.
ꕤ *$prefixvideo » $prefixytmp4*
> Video de YouTube.
ꕤ *$prefixtt » $prefixtiktok*
> Video de TikTok (Sin marca).
ꕤ *$prefixig » $prefixinstagram*
> Reels e imágenes de IG.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,

anime: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *ANIME* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Reacciones y fotos anime.
ꕤ *$prefixwaifu » $prefixneko*
> Fotos aleatorias.
ꕤ *$prefixppcp » $prefixppcouple*
> Fotos para compartir.
ꕤ *$prefixhug » $prefixkiss » $prefixpat*
> Reacciones sociales.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`
// Puedes seguir pegando el resto de tus categorías aquí...
}

// --- FUNCIONES AUXILIARES ---
function clockString(ms) {
    let h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

function getGreeting() {
    let hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Buenos días'
    if (hour >= 12 && hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}
