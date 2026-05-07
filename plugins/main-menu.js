import { performance } from 'perf_hooks'
import fs from 'fs'
import path from 'path'
import { database } from '../lib/database.js'

let handler = async (m, { conn, usedPrefix, text }) => {
    const _package = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
    const { money, level, exp, limit, name } = database.getUser(m.sender)

    const uptime = process.uptime() * 1000
    const muptime = clockString(uptime)
    const greeting = getGreeting()

    const category = text.toLowerCase().trim()

    if (category && menuObject[category]) {
        const categoryText = menuObject[category].replaceAll('$prefix', usedPrefix)
        return await conn.sendMessage(m.chat, {
            text: `୨୧ *Masha Kujou — ${category.toUpperCase()}* ୨୧\n\n${categoryText}`,
            contextInfo: getCtx(usedPrefix)
        }, { quoted: m })
    }

    const header = `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ
            ᴍᴇɴᴜ
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

${greeting}, *${name || m.pushName}* ♡

୨୧ *INFORMACIÓN DEL USUARIO*
> ⟡ Nivel: \`${level}\`
> ⟡ Exp: \`${exp}\`
> ⟡ Coins: \`$${money}\`
> ⟡ Diamonds: \`${limit}\`

୨୧ *INFORMACIÓN DEL BOT*
> ⟡ Versión: \`v${_package.version}\`
> ⟡ Prefix: \`${usedPrefix}\`
> ⟡ Runtime: \`${muptime}\`
> ⟡ Modo: \`${global.opts?.self ? 'Privado' : 'Público'}\`

୨୧ *CÓMO USAR EL MENÚ*
> Escribe \`${usedPrefix}menu <categoría>\` para ver una sección específica.
> Ejemplo: \`${usedPrefix}menu economy\`

୨୧ *CATEGORÍAS DISPONIBLES*
> economy
> downloads
> anime
> group
> profile
> stickers
> utils
> sockets
> gacha

୨୧ *TIP*
> Usa \`${usedPrefix}menu\` para ver todo el menú general.
> Usa \`${usedPrefix}menu economy\` para abrir una categoría.

> Powered by Zort Systems ♡
`.trim()

    await conn.sendMessage(m.chat, {
        text: header,
        contextInfo: getCtx(usedPrefix)
    }, { quoted: m })
}

const getCtx = (prefix) => ({
    externalAdReply: {
        title: 'Masha Kujou MD',
        body: `Usa ${prefix}menu <categoría>`,
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

export const menuObject = {
    economy: `╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *ECONOMY*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Comandos para ganar y administrar coins*

୨୧ \`$prefixwork\`
> Trabaja para ganar monedas.

୨୧ \`$prefixbal\`
> Revisa tu balance actual.

୨୧ \`$prefixdaily\`
> Reclama tu recompensa diaria.

୨୧ \`$prefixcasino\`
> Apuesta monedas en el casino.

୨୧ \`$prefixrob\`
> Intenta robar monedas a otro usuario.

୨୧ \`$prefixtransfer\`
> Envía monedas a otro usuario.
`,

    downloads: `╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *DOWNLOADS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Descarga música, videos y contenido*

୨୧ \`$prefixplay\`
> Descarga música desde YouTube.

୨୧ \`$prefixytmp4\`
> Descarga videos de YouTube.

୨୧ \`$prefixspotify\`
> Descarga canciones de Spotify.

୨୧ \`$prefixtiktok\`
> Descarga videos de TikTok sin marca de agua.

୨୧ \`$prefixinstagram\`
> Descarga reels, historias o fotos.

୨୧ \`$prefixfacebook\`
> Descarga videos de Facebook.
`,

    anime: `╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *ANIME*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Reacciones e imágenes anime*

୨୧ \`$prefixwaifu\`
> Imágenes anime aleatorias.

୨୧ \`$prefixneko\`
> Imágenes neko aleatorias.

୨୧ \`$prefixppcouple\`
> Fotos matching para parejas.

୨୧ \`$prefixhug\`
> Abraza a otro usuario.

୨୧ \`$prefixkiss\`
> Envía un beso anime.

୨୧ \`$prefixpat\`
> Da una caricia adorable.
`,

    group: `╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *GROUP*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Comandos de administración del grupo*

୨୧ \`$prefixadd\`
> Agrega un usuario al grupo.

୨୧ \`$prefixkick\`
> Expulsa un usuario del grupo.

୨୧ \`$prefixpromote\`
> Da permisos de admin.

୨୧ \`$prefixdemote\`
> Quita permisos de admin.

୨୧ \`$prefixtagall\`
> Menciona a todos los miembros.

୨୧ \`$prefixgroup open / close\`
> Abre o cierra el grupo.

୨୧ \`$prefixlink\`
> Obtiene el enlace del grupo.
`,

    profile: `╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *PROFILE*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Comandos para ver tu información*

୨୧ \`$prefixprofile\`
> Muestra tu perfil.

୨୧ \`$prefixrank\`
> Revisa tu rango.

୨୧ \`$prefixlevel\`
> Consulta tu nivel.

୨୧ \`$prefixbalance\`
> Revisa tu dinero o coins.
`,

    stickers: `╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *STICKERS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Comandos para crear o convertir stickers*

୨୧ \`$prefixsticker\`
> Convierte una imagen en sticker.

୨୧ \`$prefixtoimg\`
> Convierte sticker en imagen.

୨୧ \`$prefixattp\`
> Crea stickers con texto.

୨୧ \`$prefixemojimix\`
> Combina dos emojis en un sticker.
`,

    utils: `╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *UTILS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Herramientas y funciones útiles*

୨୧ \`$prefixinfo\`
> Muestra información del bot.

୨୧ \`$prefixruntime\`
> Revisa cuánto tiempo lleva activo.

୨୧ \`$prefixping\`
> Mide la velocidad del bot.

୨୧ \`$prefixtourl\`
> Convierte archivos en enlace.

୨୧ \`$prefixquoted\`
> Responde con texto citado.
`,

    sockets: `╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *SOCKETS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Comandos relacionados con conexión y sub-bots*

୨୧ \`$prefixqr\`
> Genera un QR para vincular el bot.

୨୧ \`$prefixcode\`
> Obtiene un código de vinculación.

୨୧ \`$prefixpair\`
> Vincula una sesión con el número.
`,

    gacha: `╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *GACHA*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Comandos de colección y sorteos*

୨୧ \`$prefixgacha\`
> Obtén personajes o recompensas aleatorias.

୨୧ \`$prefixroll\`
> Haz un sorteo o tirada aleatoria.

୨୧ \`$prefixclaim\`
> Reclama tu premio disponible.
`
}

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Buenos días'
    if (hour >= 12 && hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}