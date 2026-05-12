// plugins/menu.js — Masha Kujou MD
// ✦ Menú con interactive list (botón "Opciones" como en la imagen)

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
//  Categorías del menú
//  title     → nombre en la lista
//  desc      → descripción corta bajo el título
//  emoji     → emoji de la fila
//  rowId     → ID único que llega en listResponseMessage
//  commands  → texto que se muestra al seleccionar
// ─────────────────────────────────────────────

const CATEGORIAS = [
    {
        title:    'Economy',
        desc:     'Coins, banco, trabajo y más',
        emoji:    '💰',
        rowId:    'cat_economy',
        commands: [
            '💰 *ECONOMY*\n',
            '`$pwork` — Trabaja para ganar coins',
            '`$pbal` — Revisa tu balance',
            '`$pdaily` — Recompensa diaria',
            '`$pcasino` — Apuesta en el casino',
            '`$prob` — Roba coins a otro usuario',
            '`$ptransfer @usuario cantidad` — Envía coins',
            '`$pminar` — Mina recursos',
            '`$pdeposit` — Deposita al banco',
            '`$pwithdraw` — Retira del banco',
        ]
    },
    {
        title:    'Downloads',
        desc:     'Música, videos, TikTok y más',
        emoji:    '📥',
        rowId:    'cat_downloads',
        commands: [
            '📥 *DOWNLOADS*\n',
            '`$pplay <canción>` — Música de YouTube',
            '`$pplayvid <video>` — Video de YouTube',
            '`$pspotify <canción>` — Descarga de Spotify',
            '`$ptiktok <url>` — Video TikTok sin marca',
            '`$pinstagram <url>` — Reels e historias',
            '`$pfacebook <url>` — Videos de Facebook',
        ]
    },
    {
        title:    'Anime',
        desc:     'Reacciones, imágenes y waifus',
        emoji:    '🌸',
        rowId:    'cat_anime',
        commands: [
            '🌸 *ANIME*\n',
            '`$pwaifu` — Imagen waifu aleatoria',
            '`$pneko` — Imágenes neko',
            '`$pppcouple` — Fotos matching parejas',
            '`$phug @usuario` — Abraza a alguien',
            '`$pkiss @usuario` — Beso anime',
            '`$ppat @usuario` — Caricia adorable',
        ]
    },
    {
        title:    'Grupos',
        desc:     'Administración del grupo',
        emoji:    '👥',
        rowId:    'cat_group',
        commands: [
            '👥 *GRUPOS*\n',
            '`$padd número` — Agregar usuario',
            '`$pkick @usuario` — Expulsar usuario',
            '`$ppromote @usuario` — Dar admin',
            '`$pdemote @usuario` — Quitar admin',
            '`$ptagall` — Mencionar a todos',
            '`$pgroup open/close` — Abrir/cerrar grupo',
            '`$plink` — Enlace del grupo',
            '`$psetwelcome <texto>` — Mensaje de bienvenida',
            '`$psetgoodbye <texto>` — Mensaje de despedida',
        ]
    },
    {
        title:    'Perfil',
        desc:     'Tu info, nivel, rango y clase',
        emoji:    '👤',
        rowId:    'cat_profile',
        commands: [
            '👤 *PERFIL*\n',
            '`$pperfil` — Ver tu perfil completo',
            '`$pperfil @usuario` — Ver perfil de otro',
            '`$psetbirthday dd/mm` — Registrar cumpleaños',
            '`$preg nombre.edad` — Registrarse',
        ]
    },
    {
        title:    'Stickers',
        desc:     'Crear y convertir stickers',
        emoji:    '🎨',
        rowId:    'cat_stickers',
        commands: [
            '🎨 *STICKERS*\n',
            '`$psticker` — Imagen → sticker',
            '`$ptoimg` — Sticker → imagen',
            '`$pattp <texto>` — Sticker con texto',
            '`$pemojimix` — Combina emojis',
        ]
    },
    {
        title:    'Utilidades',
        desc:     'Ping, clima, calc y más',
        emoji:    '🔧',
        rowId:    'cat_utils',
        commands: [
            '🔧 *UTILIDADES*\n',
            '`$pping` — Velocidad del bot',
            '`$pclima <ciudad>` — Clima actual',
            '`$pcalc <expresión>` — Calculadora',
            '`$pqr <texto>` — Generar código QR',
            '`$ptraducir <texto>` — Traducir texto',
            '`$pchiste` — Chiste aleatorio',
            '`$ppokedex <nombre>` — Info de pokémon',
        ]
    },
    {
        title:    'Sub-Bots',
        desc:     'Conectar y gestionar sub-bots',
        emoji:    '🤖',
        rowId:    'cat_sockets',
        commands: [
            '🤖 *SUB-BOTS*\n',
            '`$pjadibot` — Conectar sub-bot (QR)',
            '`$pcode` — Conectar sub-bot (código)',
            '`$pbots` — Ver sub-bots activos',
            '`$pdeletesub` — Eliminar tu sesión',
            '`$ppausesub` — Pausar sub-bot',
            '`$psetname <nombre>` — Nombre del sub-bot (premium)',
            '`$psetpp` — Foto del sub-bot (premium)',
        ]
    },
    {
        title:    'Gacha',
        desc:     'Colección, sorteos y premios',
        emoji:    '🎰',
        rowId:    'cat_gacha',
        commands: [
            '🎰 *GACHA*\n',
            '`$pgacha` — Personajes aleatorios',
            '`$proll` — Tirada aleatoria',
            '`$pclaim` — Reclamar premio',
        ]
    },
]

// ─────────────────────────────────────────────
//  Construir secciones para el interactive list
// ─────────────────────────────────────────────

const buildSections = (prefix) => [{
    title: '✦ Categorías disponibles',
    rows: CATEGORIAS.map(cat => ({
        title:       `${cat.emoji} ${cat.title}`,
        description: cat.desc,
        rowId:       cat.rowId
    }))
}]

// ─────────────────────────────────────────────
//  Enviar la categoría seleccionada
// ─────────────────────────────────────────────

const sendCategory = async (conn, m, cat, prefix) => {
    const thumb = await global.getIconThumb?.() || null
    const ctx   = global.getNewsletterCtx?.(thumb) || {}

    const text = cat.commands
        .map(c => c.startsWith('`') ? c.replace(/\$p/g, prefix) : c)
        .join('\n')

    const header = (
        '╭୨୧─͜─͜─͜─͜─͜─͜୨୧╮\n' +
        `  ${cat.emoji} *${cat.title.toUpperCase()}*\n` +
        '╰୨୧─͜─͜─͜─͜─͜─͜୨୧╯\n\n' +
        text + '\n\n' +
        `> Powered by ˚₊· ɪ ᴀᴍ Aᴅʀɪᴇɴ ♡`
    )

    try {
        await conn.sendMessage(m.chat, {
            text:        header,
            contextInfo: ctx
        }, { quoted: m })
    } catch {
        await m.reply(header)
    }
}

// ─────────────────────────────────────────────
//  Handler principal
// ─────────────────────────────────────────────

const handler = async (m, { conn, usedPrefix, text }) => {
    let pkg = { version: '1.0.0' }
    try { pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')) } catch {}

    const user     = database.getUser(m.sender)
    const greeting = getGreeting()
    const uptime   = clockString(process.uptime() * 1000)
    const nombre   = user.name || m.pushName || 'Solnyshko'

    // ── Si escribió #menu economy (texto directo) — compatibilidad ────────────
    if (text && text.trim()) {
        const key = text.trim().toLowerCase()
        // Buscar por rowId o por título
        const cat = CATEGORIAS.find(c =>
            c.rowId === `cat_${key}` ||
            c.title.toLowerCase() === key ||
            c.rowId === key
        )
        if (cat) return sendCategory(conn, m, cat, usedPrefix)
    }

    // ── Menú principal con interactive list ───────────────────────────────────
    const thumb  = await global.getIconThumb?.() || null
    const ctx    = global.getNewsletterCtx?.(thumb) || {}

    const body = (
        `${greeting}, *${nombre}* ♡\n\n` +
        '୨୧ *INFORMACIÓN DEL USUARIO*\n' +
        `> ⟡ Nivel: \`${user.level || 1}\`\n` +
        `> ⟡ EXP: \`${user.exp || 0}\`\n` +
        `> ⟡ Coins: \`$${user.money || 0}\`\n` +
        `> ⟡ Límite: \`${user.limit ?? 20}\`\n\n` +
        '୨୧ *INFORMACIÓN DEL BOT*\n' +
        `> ⟡ Versión: \`v${pkg.version}\`\n` +
        `> ⟡ Prefix: \`${usedPrefix}\`\n` +
        `> ⟡ Runtime: \`${uptime}\`\n` +
        `> ⟡ Modo: \`${global.botOff ? 'Privado' : 'Público'}\`\n\n` +
        '> Selecciona una categoría 👇'
    )

    try {
        await conn.sendMessage(m.chat, {
            interactiveMessage: {
                header: {
                    hasMediaAttachment: false
                },
                body: {
                    text: body
                },
                footer: {
                    text: `✦ Masha Kujou MD · ${usedPrefix}menu <cat> · Powered by ɪ ᴀᴍ Aᴅʀɪᴇɴ`
                },
                nativeFlowMessage: {
                    buttons: [{
                        name: 'single_select',
                        buttonParamsJson: JSON.stringify({
                            title:    '☰  Categorías',
                            sections: buildSections(usedPrefix)
                        })
                    }]
                }
            },
            contextInfo: ctx
        }, { quoted: m })
    } catch {
        // Fallback si el servidor no soporta interactive messages
        await conn.sendMessage(m.chat, {
            text:        body + '\n\n' + CATEGORIAS.map(c => `> ${c.emoji} \`${usedPrefix}menu ${c.title.toLowerCase()}\` — ${c.desc}`).join('\n'),
            contextInfo: ctx
        }, { quoted: m })
    }
}

// ─────────────────────────────────────────────
//  Interceptar respuesta de lista (handler.before)
//  Cuando el usuario selecciona una opción de la lista
//  llega como listResponseMessage — lo procesamos aquí
// ─────────────────────────────────────────────

handler.before = async (m, { conn }) => {
    if (!m?.message) return false

    // Detectar listResponseMessage
    const lrm = m.message?.listResponseMessage
    if (!lrm) return false

    const rowId = lrm.singleSelectReply?.selectedRowId || ''
    if (!rowId.startsWith('cat_')) return false

    const cat = CATEGORIAS.find(c => c.rowId === rowId)
    if (!cat) return false

    const prefix = global.prefix || '#'
    await sendCategory(conn, m, cat, prefix)
    return true  // detener procesamiento posterior
}

handler.command = ['menu', 'help', 'comandos', 'start']
handler.tags    = ['main']

export default handler
