// plugins/menu.js — Masha Kujou MD
// ✦ Diseño original restaurado + botón de lista interactiva

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
//  Categorías — igual que tu menuObject original
// ─────────────────────────────────────────────

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

୨୧ \`$prefixperfil\`
> Muestra tu perfil completo.

୨୧ \`$prefixperfil @usuario\`
> Ver el perfil de otro usuario.

୨୧ \`$prefixsetbirthday dd/mm\`
> Registrar tu cumpleaños.

୨୧ \`$prefixreg nombre.edad\`
> Registrarse en el bot.
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

୨୧ \`$prefixping\`
> Mide la velocidad del bot.

୨୧ \`$prefixclima <ciudad>\`
> Clima actual de una ciudad.

୨୧ \`$prefixcalc <expresión>\`
> Calculadora.

୨୧ \`$prefixqr <texto>\`
> Generar código QR.

୨୧ \`$prefixtraducir <texto>\`
> Traducir texto.

୨୧ \`$prefixchiste\`
> Chiste aleatorio.

୨୧ \`$prefixpokedex <nombre>\`
> Info de un Pokémon.
`,

    sockets: `╭୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╮
        *SOCKETS / SUB-BOTS*
╰୨୧─͜─͜─͜─͜─͜─͜୨୧─͜─͜─͜─͜─͜─͜╯

୨୧ *Conexión y gestión de sub-bots*

୨୧ \`$prefixjadibot\`
> Conectar sub-bot con QR.

୨୧ \`$prefixcode\`
> Conectar sub-bot con código.

୨୧ \`$prefixbots\`
> Ver sub-bots activos.

୨୧ \`$prefixdeletesub\`
> Eliminar tu sesión de sub-bot.

୨୧ \`$prefixsetname <nombre>\`
> Cambiar nombre del sub-bot (premium).

୨୧ \`$prefixsetpp\`
> Cambiar foto del sub-bot (premium).
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
`,
}

// Filas para el botón de lista — título, descripción y rowId por categoría
const LIST_ROWS = [
    { title: '💰 Economy',   description: 'Coins, banco, trabajo y más',        rowId: 'cat_economy'   },
    { title: '📥 Downloads', description: 'Música, videos, TikTok y más',       rowId: 'cat_downloads' },
    { title: '🌸 Anime',     description: 'Reacciones, imágenes y waifus',      rowId: 'cat_anime'     },
    { title: '👥 Grupos',    description: 'Administración del grupo',            rowId: 'cat_group'     },
    { title: '👤 Perfil',    description: 'Tu info, nivel, rango y clase',      rowId: 'cat_profile'   },
    { title: '🎨 Stickers',  description: 'Crear y convertir stickers',          rowId: 'cat_stickers'  },
    { title: '🔧 Utils',     description: 'Ping, clima, calc y más',             rowId: 'cat_utils'     },
    { title: '🤖 Sub-Bots',  description: 'Conectar y gestionar sub-bots',      rowId: 'cat_sockets'   },
    { title: '🎰 Gacha',     description: 'Colección, sorteos y premios',        rowId: 'cat_gacha'     },
]

// Mapa rowId → clave de menuObject
const ROW_TO_KEY = {
    cat_economy:   'economy',
    cat_downloads: 'downloads',
    cat_anime:     'anime',
    cat_group:     'group',
    cat_profile:   'profile',
    cat_stickers:  'stickers',
    cat_utils:     'utils',
    cat_sockets:   'sockets',
    cat_gacha:     'gacha',
}

// ─────────────────────────────────────────────
//  Obtener thumbnail del banner (igual que settings.js)
// ─────────────────────────────────────────────

const getBanner = async () => {
    try { return await global.getBannerThumb?.() || null } catch { return null }
}

// ─────────────────────────────────────────────
//  Enviar categoría seleccionada
// ─────────────────────────────────────────────

const sendCategory = async (conn, m, key, usedPrefix) => {
    const template = menuObject[key]
    if (!template) return

    const text = template.replaceAll('$prefix', usedPrefix)
    const thumb = await getBanner()
    const ctx   = global.getNewsletterCtx?.(thumb) || {}

    try {
        await conn.sendMessage(m.chat, {
            text,
            contextInfo: ctx
        }, { quoted: m })
    } catch {
        await m.reply(text)
    }
}

// ─────────────────────────────────────────────
//  Handler principal
// ─────────────────────────────────────────────

const handler = async (m, { conn, usedPrefix, text }) => {
    let pkg = { version: '1.0.0' }
    try {
        pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
    } catch {}

    const user     = database.getUser(m.sender)
    const greeting = getGreeting()
    const uptime   = clockString(process.uptime() * 1000)
    const nombre   = user.name || m.pushName || 'Solnyshko'

    // ── Si vino con texto (#menu economy) — mostrar categoría directo ─────────
    if (text && text.trim()) {
        const key = text.trim().toLowerCase()
        if (menuObject[key]) return sendCategory(conn, m, key, usedPrefix)
    }

    // ── Header exactamente igual al tuyo original ─────────────────────────────
    const header = `
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

> Powered by ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ ♡`.trim()

    // Thumbnail = banner (igual que tu getCtx original)
    const thumb = await getBanner()

    // ── Intentar enviar con botón de lista interactiva ────────────────────────
    try {
        await conn.sendMessage(m.chat, {
            text:   header,
            footer: `Selecciona una categoría 👇`,
            buttons: [],
            sections: [
                {
                    title: '✦ Categorías',
                    rows:  LIST_ROWS
                }
            ],
            listType:    1,
            buttonText:  '☰  Ver categorías',
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid:   global.newsletterJid,
                    serverMessageId: -1,
                    newsletterName:  global.newsletterName
                },
                externalAdReply: {
                    title:                 'Masha Kujou MD',
                    body:                  `Usa ${usedPrefix}menu <categoría>`,
                    mediaType:             1,
                    renderLargerThumbnail: true,
                    thumbnail:             thumb,
                    sourceUrl:             global.rcanal,
                }
            }
        }, { quoted: m })
    } catch {
        // Fallback: listMessage directo (método alternativo)
        try {
            await conn.sendMessage(m.chat, {
                listMessage: {
                    title:       'ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ — ᴍᴇɴᴜ',
                    description: header,
                    buttonText:  '☰  Ver categorías',
                    listType:    1,
                    sections:    [{ title: '✦ Categorías', rows: LIST_ROWS }],
                    footerText:  `Powered by ˚₊· ɪ ᴀᴍ Aᴅʀɪᴇɴ ♡`
                },
                contextInfo: {
                    externalAdReply: {
                        title:                 'Masha Kujou MD',
                        body:                  `Usa ${usedPrefix}menu <categoría>`,
                        mediaType:             1,
                        renderLargerThumbnail: true,
                        thumbnail:             thumb,
                        sourceUrl:             global.rcanal,
                    }
                }
            }, { quoted: m })
        } catch {
            // Fallback final: tu menú original tal cual
            await conn.sendMessage(m.chat, {
                text: header,
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid:   global.newsletterJid,
                        serverMessageId: -1,
                        newsletterName:  global.newsletterName
                    },
                    externalAdReply: {
                        title:                 'Masha Kujou MD',
                        body:                  `Usa ${usedPrefix}menu <categoría>`,
                        mediaType:             1,
                        renderLargerThumbnail: true,
                        thumbnail:             thumb,
                        sourceUrl:             global.rcanal,
                    }
                }
            }, { quoted: m })
        }
    }
}

// ─────────────────────────────────────────────
//  handler.before — intercepta la selección de la lista
// ─────────────────────────────────────────────

handler.before = async (m, { conn }) => {
    if (!m?.message) return false

    // listResponseMessage — usuario seleccionó una fila
    const lrm   = m.message?.listResponseMessage
    const rowId = lrm?.singleSelectReply?.selectedRowId || ''

    if (!rowId.startsWith('cat_')) return false

    const key = ROW_TO_KEY[rowId]
    if (!key) return false

    const prefix = global.prefix || '#'
    await sendCategory(conn, m, key, prefix)
    return true
}

handler.command = ['menu', 'help', 'comandos', 'start']
handler.tags    = ['main']

export default handler
