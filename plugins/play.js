// plugins/perfil.js — Masha Kujou MD
// ✦ Perfil completo del usuario con foto de perfil
// ✦ Muestra: nombre, nivel, exp, dinero, banco, clase, rango, cumpleaños, registro

import { database } from '../lib/database.js'

// ─────────────────────────────────────────────
//  Rangos por nivel
// ─────────────────────────────────────────────

const getRango = level => {
    if (level >= 100) return { nombre: 'Leyenda',      emoji: '👑' }
    if (level >= 75)  return { nombre: 'Maestro',      emoji: '💎' }
    if (level >= 50)  return { nombre: 'Élite',        emoji: '🌟' }
    if (level >= 35)  return { nombre: 'Experto',      emoji: '⚔️'  }
    if (level >= 20)  return { nombre: 'Veterano',     emoji: '🛡️'  }
    if (level >= 10)  return { nombre: 'Aprendiz',     emoji: '📖' }
    if (level >= 5)   return { nombre: 'Novato',       emoji: '🌱' }
    return              { nombre: 'Recién llegado', emoji: '🌾' }
}

// ─────────────────────────────────────────────
//  Barra de progreso de EXP
// ─────────────────────────────────────────────

const expParaSiguienteNivel = level => level * 150

const barraExp = (exp, level) => {
    const needed   = expParaSiguienteNivel(level)
    const current  = exp % needed
    const pct      = Math.min(Math.floor((current / needed) * 10), 10)
    const filled   = '▰'.repeat(pct)
    const empty    = '▱'.repeat(10 - pct)
    const porcentaje = Math.floor((current / needed) * 100)
    return { barra: filled + empty, porcentaje, current, needed }
}

// ─────────────────────────────────────────────
//  Clase RPG
// ─────────────────────────────────────────────

const clases = {
    guerrero:   { nombre: 'Guerrero',   emoji: '⚔️'  },
    mago:       { nombre: 'Mago',       emoji: '🔮' },
    arquero:    { nombre: 'Arquero',    emoji: '🏹' },
    asesino:    { nombre: 'Asesino',    emoji: '🗡️'  },
    curandero:  { nombre: 'Curandero', emoji: '💚' },
    invocador:  { nombre: 'Invocador', emoji: '🌀' },
    ninguna:    { nombre: 'Sin clase',  emoji: '❓' },
}

const getClase = key => clases[key] || clases.ninguna

// ─────────────────────────────────────────────
//  Formatear fecha legible
// ─────────────────────────────────────────────

const formatDate = ts => {
    if (!ts || ts === 0) return 'No registrado'
    const d   = new Date(ts)
    const pad = n => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

const formatDateTime = ts => {
    if (!ts || ts === 0) return 'No registrado'
    const d   = new Date(ts)
    const pad = n => String(n).padStart(2, '0')
    return (
        `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}`
    )
}

// Días desde que se registró
const diasDesdeRegistro = ts => {
    if (!ts || ts === 0) return 0
    return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24))
}

// Próximo cumpleaños
const proximoCumple = cumple => {
    if (!cumple) return null
    const [dia, mes] = cumple.split('/').map(Number)
    if (!dia || !mes) return null
    const hoy   = new Date()
    let fecha   = new Date(hoy.getFullYear(), mes - 1, dia)
    if (fecha < hoy) fecha = new Date(hoy.getFullYear() + 1, mes - 1, dia)
    const diff  = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24))
    return diff === 0 ? '¡Hoy es tu cumpleaños! 🎂' : `En ${diff} días 🎂`
}

// ─────────────────────────────────────────────
//  Formatear dinero
// ─────────────────────────────────────────────

const fmt = n => {
    if (!n || isNaN(n)) return '0'
    return Number(n).toLocaleString('es-ES')
}

// ─────────────────────────────────────────────
//  Obtener foto de perfil
// ─────────────────────────────────────────────

const getProfilePic = async (conn, jid) => {
    try {
        const url = await conn.profilePictureUrl(jid, 'image')
        const res = await fetch(url)
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer())
    } catch { return null }
}

const getFallback = async () => {
    try { return await global.getIconThumb?.() || null } catch { return null }
}

// ─────────────────────────────────────────────
//  Construir el texto del perfil
// ─────────────────────────────────────────────

const buildPerfil = (user, displayName, jid) => {
    const num       = jid.split('@')[0].split(':')[0]
    const level     = user.level     || 1
    const exp       = user.exp       || 0
    const money     = user.money     || 0
    const bank      = user.bank      || 0
    const limit     = user.limit     ?? 20
    const warning   = user.warning   || 0
    const premium   = user.premium   || false
    const registered = user.registered || false

    const rango     = getRango(level)
    const clase     = getClase(user.clase || 'ninguna')
    const expInfo   = barraExp(exp, level)
    const dias      = diasDesdeRegistro(user.registered_time)
    const cumple    = proximoCumple(user.birthday)
    const regDate   = formatDateTime(user.registered_time)
    const lastClaim = formatDate(user.lastclaim)

    const estado    = premium ? '✦ Premium' : registered ? '• Registrado' : '• Invitado'
    const badgePrem = premium ? '💎' : '○'

    return (
        '┌─────────────────────────┐\n' +
        `│  ${badgePrem} *${(displayName || user.name || num).slice(0, 18)}*\n` +
        `│  +${num}\n` +
        '├─────────────────────────┤\n' +
        `│  ${rango.emoji} *${rango.nombre}*  ·  ${estado}\n` +
        `│  ${clase.emoji} Clase: *${clase.nombre}*\n` +
        '├─────────────────────────┤\n' +
        `│  ⭐ Nivel:  *${level}*\n` +
        `│  ✨ EXP:    *${exp}* / ${expInfo.needed}\n` +
        `│  ${expInfo.barra} ${expInfo.porcentaje}%\n` +
        '├─────────────────────────┤\n' +
        `│  💰 Efectivo: *$${fmt(money)}*\n` +
        `│  🏦 Banco:    *$${fmt(bank)}*\n` +
        `│  💵 Total:    *$${fmt(money + bank)}*\n` +
        '├─────────────────────────┤\n' +
        `│  🎂 Cumpleaños: *${user.birthday || 'No registrado'}*\n` +
        (cumple ? `│  ${cumple}\n` : '') +
        `│  🗓️ Miembro desde: *${regDate}*\n` +
        `│  📅 Días con nosotros: *${dias}*\n` +
        `│  🔄 Último claim: *${lastClaim}*\n` +
        '├─────────────────────────┤\n' +
        `│  ⚡ Límite diario: *${limit}*\n` +
        `│  ⚠️ Advertencias: *${warning}/3*\n` +
        `│  📊 Edad: *${user.age ?? 'No registrada'}*\n` +
        '└─────────────────────────┘'
    )
}

// ─────────────────────────────────────────────
//  Handler
// ─────────────────────────────────────────────

const handler = async (m, { conn, isOwner, who, args }) => {
    // Objetivo: el mencionado, respondido, o el propio usuario
    const targetJid = who || m.sender

    // Normalizar JID
    const num        = targetJid.split('@')[0].split(':')[0]
    const normalJid  = num + '@s.whatsapp.net'

    // Traer usuario de la DB (getUser lo crea si no existe)
    const user       = database.getUser(normalJid)

    // Nombre: push name si es el propio, si no intentar desde store
    let displayName = ''
    if (normalJid === m.sender) {
        displayName = m.pushName || ''
    } else {
        try {
            const contact = conn.store?.contacts?.[normalJid]
            displayName   = contact?.name || contact?.notify || ''
        } catch {}
    }

    await m.react('🔍')

    // Obtener foto de perfil
    const ppBuf  = await getProfilePic(conn, normalJid)
    const thumb  = ppBuf || await getFallback()

    // Construir texto
    const texto  = buildPerfil(user, displayName, normalJid)

    // Contexto con canal
    const ctx    = global.getNewsletterCtx?.(thumb, '✦ Perfil', global.newsletterName || '') || {}

    try {
        if (ppBuf) {
            // Con foto de perfil como imagen principal
            await conn.sendMessage(m.chat, {
                image:       ppBuf,
                caption:     texto,
                mentions:    [normalJid],
                contextInfo: ctx
            }, { quoted: m })
        } else {
            // Sin foto — solo texto con thumbnail en el reply
            await conn.sendMessage(m.chat, {
                text:        texto,
                mentions:    [normalJid],
                contextInfo: ctx
            }, { quoted: m })
        }
    } catch {
        await m.reply(texto)
    }

    await m.react('✓')
}

// ─────────────────────────────────────────────
//  Comando #setbirthday — guardar cumpleaños
// ─────────────────────────────────────────────

handler.before = async (m, { conn }) => {
    // Detectar #setbirthday dd/mm sin pasar por el handler principal
    // (por si el usuario quiere registrar su cumpleaños)
    return false
}

// ─────────────────────────────────────────────
//  Sub-comando: #setbirthday
// ─────────────────────────────────────────────

const birthdayHandler = async (m, { conn, text }) => {
    const input = (text || '').trim()

    // Validar formato dd/mm
    const regex = /^(\d{1,2})\/(\d{1,2})$/
    const match = input.match(regex)

    if (!match) {
        return m.reply(
            '⟨✦⟩ *formato incorrecto*\n\n' +
            '◈ Usa: *#setbirthday dd/mm*\n' +
            '◈ Ejemplo: *#setbirthday 15/03*'
        )
    }

    const dia = parseInt(match[1])
    const mes = parseInt(match[2])

    if (dia < 1 || dia > 31 || mes < 1 || mes > 12) {
        return m.reply('⟨✦⟩ fecha inválida. Revisa el día y el mes.')
    }

    const user     = database.getUser(m.sender)
    user.birthday  = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
    await database.save()

    return m.reply(
        '⟨✦⟩ cumpleaños guardado ✓\n' +
        `◈ Fecha: *${user.birthday}*\n` +
        '◈ Te recordaré en tu día especial 🎂'
    )
}

birthdayHandler.command = ['setbirthday', 'cumpleanos', 'birthday']
birthdayHandler.tags    = ['perfil']

// ─────────────────────────────────────────────
//  Exportar ambos handlers como uno combinado
// ─────────────────────────────────────────────

// Handler principal (perfil)
handler.command = ['perfil', 'profile', 'card', 'me', 'yo', 'stats']
handler.tags    = ['perfil']

// Exportamos el de perfil como default y el de birthday aparte
// Pero como solo se puede exportar un default, los fusionamos:

const combined = async (m, ctx) => {
    const cmd = ctx.command?.toLowerCase()
    if (['setbirthday', 'cumpleanos', 'birthday'].includes(cmd)) {
        return birthdayHandler(m, ctx)
    }
    return handler(m, ctx)
}

combined.command = [
    'perfil', 'profile', 'card', 'me', 'yo', 'stats',
    'setbirthday', 'cumpleanos', 'birthday'
]
combined.tags = ['perfil']

export default combined
