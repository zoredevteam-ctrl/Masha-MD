// plugins/menu.js — Masha Kujou MD
// ✦ Menú completo — banner grande via thumbnailUrl, sin descargar imagen

import fs from 'fs'
import path from 'path'
import { database } from '../lib/database.js'

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function clockString(ms) {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor(ms / 60000) % 60
    const s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function getGreeting() {
    const h = new Date().getHours()
    if (h >= 5  && h < 12) return 'Buenos días'
    if (h >= 12 && h < 18) return 'Buenas tardes'
    return 'Buenas noches'
}

// ─────────────────────────────────────────────
//  Context — banner grande, sin newsletter chico
// ─────────────────────────────────────────────

const getCtx = (usedPrefix) => ({
    externalAdReply: {
        title:                 `✦ Masha Kujou MD`,
        body:                  `Usa ${usedPrefix}menu <categoría> para más info`,
        mediaType:             1,
        renderLargerThumbnail: true,
        thumbnailUrl:          global.banner,
        sourceUrl:             global.rcanal   || '',
        mediaUrl:              global.rcanal   || '',
    }
})

// ─────────────────────────────────────────────
//  Menú por categoría (#menu <cat>)
// ─────────────────────────────────────────────

export const menuObject = {

economy: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *💰 ECONOMY*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Gana y administra tus coins*

୨୧ \`$prefixwork\`
> Trabaja para ganar monedas.

୨୧ \`$prefixbal\`
> Revisa tu balance actual.

୨୧ \`$prefixdaily\`
> Reclama tu recompensa diaria.

୨୧ \`$prefixminar\`
> Mina recursos para ganar coins.

୨୧ \`$prefixcrime\`
> Comete un crimen por coins (riesgo).

୨୧ \`$prefixdeposit <cantidad>\`
> Deposita coins al banco.

୨୧ \`$prefixwithdraw <cantidad>\`
> Retira coins del banco.

୨୧ \`$prefixcasino <cantidad>\`
> Apuesta monedas en el casino.

୨୧ \`$prefixrob @usuario\`
> Intenta robar monedas.

୨୧ \`$prefixtransfer @usuario <cantidad>\`
> Envía coins a otro usuario.

୨୧ \`$prefixshop\`
> Ver la tienda del bot.

୨୧ \`$prefixbuy <item>\`
> Comprar un ítem de la tienda.

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡
`.trim(),

downloads: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *📥 DOWNLOADS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Descarga música, videos y más*

୨୧ \`$prefixplay <canción>\`
> Descarga música desde YouTube.

୨୧ \`$prefixplayvid <video>\`
> Descarga video de YouTube.

୨୧ \`$prefixspotify <canción>\`
> Descarga canciones de Spotify.

୨୧ \`$prefixtiktok <url>\`
> Video de TikTok sin marca de agua.

୨୧ \`$prefixinstagram <url>\`
> Reels, historias o fotos de Instagram.

୨୧ \`$prefixfacebook <url>\`
> Videos de Facebook.

୨୧ \`$prefixtwitter <url>\`
> Videos de Twitter / X.

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡
`.trim(),

anime: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *🌸 ANIME*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Reacciones, imágenes y waifus*

୨୧ \`$prefixwaifu\`
> Imagen waifu aleatoria.

୨୧ \`$prefixneko\`
> Imágenes neko aleatorias.

୨୧ \`$prefixppcouple\`
> Fotos matching para parejas.

୨୧ \`$prefixhug @usuario\`
> Abraza a alguien con amor.

୨୧ \`$prefixkiss @usuario\`
> Envía un beso anime.

୨୧ \`$prefixpat @usuario\`
> Da una caricia adorable.

୨୧ \`$prefixslap @usuario\`
> Golpea a alguien (broma).

୨୧ \`$prefixcry\`
> Reacción de llanto.

୨୧ \`$prefixdance\`
> Reacción de baile.

୨୧ \`$prefixwave @usuario\`
> Saluda con la mano.

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡
`.trim(),

group: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *👥 GRUPOS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Administración del grupo*

୨୧ \`$prefixadd <número>\`
> Agregar un usuario al grupo.

୨୧ \`$prefixkick @usuario\`
> Expulsar un usuario.

୨୧ \`$prefixpromote @usuario\`
> Dar permisos de administrador.

୨୧ \`$prefixdemote @usuario\`
> Quitar permisos de administrador.

୨୧ \`$prefixtagall\`
> Mencionar a todos los miembros.

୨୧ \`$prefixgroup open\` / \`$prefixgroup close\`
> Abrir o cerrar el grupo.

୨୧ \`$prefixlink\`
> Enlace de invitación del grupo.

୨୧ \`$prefixrevokelink\`
> Revocar y generar nuevo enlace.

୨୧ \`$prefixsetwelcome <texto>\`
> Personalizar mensaje de bienvenida.

୨୧ \`$prefixsetgoodbye <texto>\`
> Personalizar mensaje de despedida.

୨୧ \`$prefixtestwelcome\`
> Probar el mensaje de bienvenida.

୨୧ \`$prefixwelcomeinfo\`
> Ver configuración actual del grupo.

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡
`.trim(),

profile: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *👤 PERFIL*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Tu información y estadísticas*

୨୧ \`$prefixperfil\`
> Muestra tu perfil completo con foto.

୨୧ \`$prefixperfil @usuario\`
> Ver el perfil de otro usuario.

୨୧ \`$prefixsetbirthday dd/mm\`
> Registrar tu cumpleaños.

୨୧ \`$prefixreg nombre.edad\`
> Registrarse en el bot.

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡
`.trim(),

stickers: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *🎨 STICKERS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Crea y convierte stickers*

୨୧ \`$prefixsticker\`
> Convierte imagen o video en sticker.

୨୧ \`$prefixtoimg\`
> Convierte sticker en imagen.

୨୧ \`$prefixattp <texto>\`
> Crea sticker animado con texto.

୨୧ \`$prefixemojimix\`
> Combina dos emojis en un sticker.

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡
`.trim(),

utils: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *🔧 UTILS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Herramientas útiles*

୨୧ \`$prefixping\`
> Velocidad de respuesta del bot.

୨୧ \`$prefixclima <ciudad>\`
> Clima actual de cualquier ciudad.

୨୧ \`$prefixcalc <expresión>\`
> Calculadora matemática.

୨୧ \`$prefixqr <texto>\`
> Generar código QR.

୨୧ \`$prefixtraducir <texto>\`
> Traducir texto a español.

୨୧ \`$prefixchiste\`
> Chiste aleatorio.

୨୧ \`$prefixfrase\`
> Frase motivacional aleatoria.

୨୧ \`$prefixpokedex <nombre>\`
> Información detallada de un Pokémon.

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡
`.trim(),

sockets: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *🤖 SUB-BOTS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Conecta y gestiona sub-bots*

୨୧ \`$prefixjadibot\`
> Conectar sub-bot con código QR.

୨୧ \`$prefixcode\`
> Conectar sub-bot con código de 8 dígitos.

୨୧ \`$prefixbots\`
> Ver sub-bots activos en el servidor.

୨୧ \`$prefixdeletesub\`
> Eliminar tu sesión de sub-bot.

୨୧ \`$prefixpausesub\`
> Pausar tu sub-bot temporalmente.

୨୧ \`$prefixtoken\`
> Ver tu token de sesión.

୨୧ \`$prefixsetname <nombre>\` *(premium)*
> Cambiar el nombre del sub-bot.

୨୧ \`$prefixsetpp\` *(premium)*
> Cambiar la foto de perfil del sub-bot.

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡
`.trim(),

gacha: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *🎰 GACHA*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Colección, sorteos y premios*

୨୧ \`$prefixgacha\`
> Obtén personajes o recompensas aleatorias.

୨୧ \`$prefixroll\`
> Haz una tirada aleatoria.

୨୧ \`$prefixclaim\`
> Reclama tu premio disponible.

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡
`.trim(),

}

// ─────────────────────────────────────────────
//  Menú general completo
// ─────────────────────────────────────────────

const buildFullMenu = (user, pkg, usedPrefix, greeting) => {
    const nombre = user.name || 'Solnyshko'
    const uptime = clockString(process.uptime() * 1000)

    return `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ
            ᴍᴇɴᴜ
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

${greeting}, *${nombre}* ♡

୨୧ *INFORMACIÓN DEL USUARIO*
> ⟡ Nivel: \`${user.level || 1}\`
> ⟡ Exp: \`${user.exp || 0}\`
> ⟡ Coins: \`$${user.money || 0}\`
> ⟡ Diamonds: \`${user.limit ?? 20}\`

୨୧ *INFORMACIÓN DEL BOT*
> ⟡ Versión: \`v${pkg.version}\`
> ⟡ Prefix: \`${usedPrefix}\`
> ⟡ Runtime: \`${uptime}\`
> ⟡ Modo: \`${global.botOff ? 'Privado' : 'Público'}\`

╭───────────────────────╮
💰 *ECONOMY*
> \`${usedPrefix}work\` — Trabajar por coins
> \`${usedPrefix}bal\` — Ver balance
> \`${usedPrefix}daily\` — Recompensa diaria
> \`${usedPrefix}minar\` — Minar recursos
> \`${usedPrefix}crime\` — Crimen por coins
> \`${usedPrefix}deposit\` / \`${usedPrefix}withdraw\` — Banco
> \`${usedPrefix}casino\` — Apostar
> \`${usedPrefix}rob @u\` — Robar
> \`${usedPrefix}transfer @u cant\` — Enviar
> \`${usedPrefix}shop\` / \`${usedPrefix}buy\` — Tienda

╭───────────────────────╮
📥 *DOWNLOADS*
> \`${usedPrefix}play\` — Música YouTube
> \`${usedPrefix}playvid\` — Video YouTube
> \`${usedPrefix}spotify\` — Spotify
> \`${usedPrefix}tiktok\` — TikTok
> \`${usedPrefix}instagram\` — Instagram
> \`${usedPrefix}facebook\` — Facebook
> \`${usedPrefix}twitter\` — Twitter / X

╭───────────────────────╮
🌸 *ANIME*
> \`${usedPrefix}waifu\` — Imagen waifu
> \`${usedPrefix}neko\` — Imagen neko
> \`${usedPrefix}ppcouple\` — Fotos pareja
> \`${usedPrefix}hug\` / \`${usedPrefix}kiss\` / \`${usedPrefix}pat\` — Reacciones
> \`${usedPrefix}slap\` / \`${usedPrefix}cry\` / \`${usedPrefix}dance\` — Más

╭───────────────────────╮
👥 *GRUPOS*
> \`${usedPrefix}add\` / \`${usedPrefix}kick\` — Agregar / Expulsar
> \`${usedPrefix}promote\` / \`${usedPrefix}demote\` — Admin
> \`${usedPrefix}tagall\` — Mencionar todos
> \`${usedPrefix}group open/close\` — Abrir / cerrar
> \`${usedPrefix}link\` / \`${usedPrefix}revokelink\` — Enlace
> \`${usedPrefix}setwelcome\` / \`${usedPrefix}setgoodbye\` — Mensajes

╭───────────────────────╮
👤 *PERFIL*
> \`${usedPrefix}perfil\` — Ver tu perfil con foto
> \`${usedPrefix}perfil @u\` — Perfil de otro
> \`${usedPrefix}setbirthday dd/mm\` — Cumpleaños
> \`${usedPrefix}reg nombre.edad\` — Registrarse

╭───────────────────────╮
🎨 *STICKERS*
> \`${usedPrefix}sticker\` — Imagen a sticker
> \`${usedPrefix}toimg\` — Sticker a imagen
> \`${usedPrefix}attp\` — Sticker con texto
> \`${usedPrefix}emojimix\` — Combinar emojis

╭───────────────────────╮
🔧 *UTILS*
> \`${usedPrefix}ping\` — Velocidad
> \`${usedPrefix}clima\` — Clima
> \`${usedPrefix}calc\` — Calculadora
> \`${usedPrefix}qr\` — Código QR
> \`${usedPrefix}traducir\` — Traducir
> \`${usedPrefix}chiste\` / \`${usedPrefix}frase\` — Entretenimiento
> \`${usedPrefix}pokedex\` — Pokédex

╭───────────────────────╮
🤖 *SUB-BOTS*
> \`${usedPrefix}jadibot\` — Conectar (QR)
> \`${usedPrefix}code\` — Conectar (código)
> \`${usedPrefix}bots\` — Ver activos
> \`${usedPrefix}deletesub\` — Eliminar sesión
> \`${usedPrefix}setname\` / \`${usedPrefix}setpp\` — Premium

╭───────────────────────╮
🎰 *GACHA*
> \`${usedPrefix}gacha\` — Tirar personaje
> \`${usedPrefix}roll\` — Tirada aleatoria
> \`${usedPrefix}claim\` — Reclamar premio

╰───────────────────────╯

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡`.trim()
}

// ─────────────────────────────────────────────
//  Handler
// ─────────────────────────────────────────────

const handler = async (m, { conn, usedPrefix, text }) => {
    let pkg = { version: '1.0.0' }
    try {
        pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
    } catch {}

    const user     = database.getUser(m.sender)
    const greeting = getGreeting()
    const ctx      = getCtx(usedPrefix)

    // #menu <categoría>
    if (text && text.trim()) {
        const key = text.trim().toLowerCase()
        if (menuObject[key]) {
            const body = `୨୧ *Masha Kujou — ${key.toUpperCase()}* ୨୧\n\n${menuObject[key].replaceAll('$prefix', usedPrefix)}`
            try {
                return await conn.sendMessage(m.chat, { text: body, contextInfo: ctx }, { quoted: m })
            } catch {
                return m.reply(body)
            }
        }
    }

    // #menu completo
    const fullMenu = buildFullMenu(user, pkg, usedPrefix, greeting)
    try {
        await conn.sendMessage(m.chat, { text: fullMenu, contextInfo: ctx }, { quoted: m })
    } catch {
        await m.reply(fullMenu)
    }
}

handler.command = ['menu', 'help', 'comandos', 'start']
handler.tags    = ['main']

export default handler
