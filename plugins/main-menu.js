// plugins/menu.js — Masha Kujou MD
// ✦ Menú completo en texto plano — sin interactive messages (seguro para grupos)

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
//  Menú por categoría (para #menu <cat>)
// ─────────────────────────────────────────────

export const menuObject = {

economy: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *💰 ECONOMY*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ \`$prefixwork\`
> Trabaja para ganar monedas.

୨୧ \`$prefixbal\`
> Revisa tu balance actual.

୨୧ \`$prefixdaily\`
> Reclama tu recompensa diaria.

୨୧ \`$prefixminar\`
> Mina recursos para ganar coins.

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
`.trim(),

downloads: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *📥 DOWNLOADS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ \`$prefixplay <canción>\`
> Descarga música desde YouTube.

୨୧ \`$prefixplayvid <video>\`
> Descarga video de YouTube.

୨୧ \`$prefixspotify <canción>\`
> Descarga canciones de Spotify.

୨୧ \`$prefixtiktok <url>\`
> Descarga videos de TikTok sin marca.

୨୧ \`$prefixinstagram <url>\`
> Descarga reels, historias o fotos.

୨୧ \`$prefixfacebook <url>\`
> Descarga videos de Facebook.
`.trim(),

anime: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *🌸 ANIME*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ \`$prefixwaifu\`
> Imagen waifu aleatoria.

୨୧ \`$prefixneko\`
> Imágenes neko aleatorias.

୨୧ \`$prefixppcouple\`
> Fotos matching para parejas.

୨୧ \`$prefixhug @usuario\`
> Abraza a alguien.

୨୧ \`$prefixkiss @usuario\`
> Envía un beso anime.

୨୧ \`$prefixpat @usuario\`
> Da una caricia adorable.

୨୧ \`$prefixslap @usuario\`
> Golpea a alguien (broma).

୨୧ \`$prefixcry\`
> Reacción de llanto.
`.trim(),

group: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *👥 GROUP*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ \`$prefixadd <número>\`
> Agrega un usuario al grupo.

୨୧ \`$prefixkick @usuario\`
> Expulsa un usuario.

୨୧ \`$prefixpromote @usuario\`
> Da permisos de admin.

୨୧ \`$prefixdemote @usuario\`
> Quita permisos de admin.

୨୧ \`$prefixtagall\`
> Menciona a todos los miembros.

୨୧ \`$prefixgroup open\` / \`$prefixgroup close\`
> Abre o cierra el grupo.

୨୧ \`$prefixlink\`
> Enlace de invitación del grupo.

୨୧ \`$prefixsetwelcome <texto>\`
> Mensaje de bienvenida personalizado.

୨୧ \`$prefixsetgoodbye <texto>\`
> Mensaje de despedida personalizado.

୨୧ \`$prefixtestwelcome\`
> Probar el mensaje de bienvenida.

୨୧ \`$prefixwelcomeinfo\`
> Ver configuración actual del grupo.
`.trim(),

profile: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *👤 PROFILE*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ \`$prefixperfil\`
> Muestra tu perfil completo con foto.

୨୧ \`$prefixperfil @usuario\`
> Ver el perfil de otro usuario.

୨୧ \`$prefixsetbirthday dd/mm\`
> Registrar tu cumpleaños.

୨୧ \`$prefixreg nombre.edad\`
> Registrarse en el bot.
`.trim(),

stickers: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *🎨 STICKERS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ \`$prefixsticker\`
> Convierte imagen o video en sticker.

୨୧ \`$prefixtoimg\`
> Convierte sticker en imagen.

୨୧ \`$prefixattp <texto>\`
> Crea sticker con texto animado.

୨୧ \`$prefixemojimix\`
> Combina dos emojis en un sticker.
`.trim(),

utils: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *🔧 UTILS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

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
> Información de un Pokémon.
`.trim(),

sockets: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *🤖 SUB-BOTS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

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
> Cambiar la foto del sub-bot.
`.trim(),

gacha: `
╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *🎰 GACHA*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ \`$prefixgacha\`
> Obtén personajes o recompensas aleatorias.

୨୧ \`$prefixroll\`
> Haz una tirada aleatoria.

୨୧ \`$prefixclaim\`
> Reclama tu premio disponible.
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
> \`${usedPrefix}deposit\` — Depositar al banco
> \`${usedPrefix}withdraw\` — Retirar del banco
> \`${usedPrefix}casino\` — Apostar coins
> \`${usedPrefix}rob @u\` — Robar coins
> \`${usedPrefix}transfer @u cant\` — Enviar coins
> \`${usedPrefix}shop\` — Tienda

╭───────────────────────╮

📥 *DOWNLOADS*
> \`${usedPrefix}play <nombre>\` — Música YT
> \`${usedPrefix}playvid <nombre>\` — Video YT
> \`${usedPrefix}spotify <nombre>\` — Spotify
> \`${usedPrefix}tiktok <url>\` — TikTok
> \`${usedPrefix}instagram <url>\` — Instagram
> \`${usedPrefix}facebook <url>\` — Facebook

╭───────────────────────╮

🌸 *ANIME*
> \`${usedPrefix}waifu\` — Imagen waifu
> \`${usedPrefix}neko\` — Imagen neko
> \`${usedPrefix}ppcouple\` — Fotos pareja
> \`${usedPrefix}hug @u\` — Abrazar
> \`${usedPrefix}kiss @u\` — Beso
> \`${usedPrefix}pat @u\` — Caricia
> \`${usedPrefix}slap @u\` — Golpear
> \`${usedPrefix}cry\` — Llorar

╭───────────────────────╮

👥 *GRUPOS*
> \`${usedPrefix}add <num>\` — Agregar
> \`${usedPrefix}kick @u\` — Expulsar
> \`${usedPrefix}promote @u\` — Dar admin
> \`${usedPrefix}demote @u\` — Quitar admin
> \`${usedPrefix}tagall\` — Mencionar todos
> \`${usedPrefix}group open/close\` — Abrir/cerrar
> \`${usedPrefix}link\` — Enlace del grupo
> \`${usedPrefix}setwelcome\` — Bienvenida
> \`${usedPrefix}setgoodbye\` — Despedida

╭───────────────────────╮

👤 *PERFIL*
> \`${usedPrefix}perfil\` — Ver tu perfil
> \`${usedPrefix}perfil @u\` — Perfil de otro
> \`${usedPrefix}setbirthday dd/mm\` — Cumpleaños
> \`${usedPrefix}reg nombre.edad\` — Registrarse

╭───────────────────────╮

🎨 *STICKERS*
> \`${usedPrefix}sticker\` — Imagen a sticker
> \`${usedPrefix}toimg\` — Sticker a imagen
> \`${usedPrefix}attp <texto>\` — Sticker texto
> \`${usedPrefix}emojimix\` — Combinar emojis

╭───────────────────────╮

🔧 *UTILS*
> \`${usedPrefix}ping\` — Velocidad
> \`${usedPrefix}clima <ciudad>\` — Clima
> \`${usedPrefix}calc <expr>\` — Calculadora
> \`${usedPrefix}qr <texto>\` — Código QR
> \`${usedPrefix}traducir <texto>\` — Traducir
> \`${usedPrefix}chiste\` — Chiste
> \`${usedPrefix}frase\` — Frase
> \`${usedPrefix}pokedex <nombre>\` — Pokédex

╭───────────────────────╮

🤖 *SUB-BOTS*
> \`${usedPrefix}jadibot\` — Conectar (QR)
> \`${usedPrefix}code\` — Conectar (código)
> \`${usedPrefix}bots\` — Ver activos
> \`${usedPrefix}deletesub\` — Eliminar sesión
> \`${usedPrefix}pausesub\` — Pausar
> \`${usedPrefix}token\` — Ver token

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

    // #menu <categoría> → mostrar solo esa sección
    if (text && text.trim()) {
        const key = text.trim().toLowerCase()
        if (menuObject[key]) {
            const categoryText = menuObject[key].replaceAll('$prefix', usedPrefix)
            const thumb = await global.getBannerThumb?.() || null
            const ctx   = global.getNewsletterCtx?.(thumb) || {}
            const catTxt = `୨୧ *Masha Kujou — ${key.toUpperCase()}* ୨୧\n\n${categoryText}`
            try {
                if (thumb) {
                    return await conn.sendMessage(m.chat, {
                        image:       thumb,
                        caption:     catTxt,
                        contextInfo: ctx
                    }, { quoted: m })
                }
                return await conn.sendMessage(m.chat, { text: catTxt, contextInfo: ctx }, { quoted: m })
            } catch {
                return m.reply(catTxt)
            }
        }
    }

    // #menu → menú completo
    const fullMenu = buildFullMenu(user, pkg, usedPrefix, greeting)
    const thumb    = await global.getBannerThumb?.() || null
    const ctx      = global.getNewsletterCtx?.(thumb) || {}

    try {
        if (thumb) {
            await conn.sendMessage(m.chat, {
                image:       thumb,
                caption:     fullMenu,
                contextInfo: ctx
            }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, { text: fullMenu, contextInfo: ctx }, { quoted: m })
        }
    } catch {
        await m.reply(fullMenu)
    }
}

handler.command = ['menu', 'help', 'comandos', 'start']
handler.tags    = ['main']

export default handler
