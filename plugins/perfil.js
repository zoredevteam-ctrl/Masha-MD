// plugins/perfil.js — Masha Kujou MD
// ✦ Perfil del usuario con foto + datos completos

import { database } from '../lib/database.js'

// ─────────────────────────────────────────────
//  Rangos por nivel
// ─────────────────────────────────────────────

const getRango = level => {
    if (level >= 100) return { nombre: 'Leyenda',         emoji: '👑' }
    if (level >= 75)  return { nombre: 'Maestro',         emoji: '💎' }
    if (level >= 50)  return { nombre: 'Élite',           emoji: '🌟' }
    if (level >= 35)  return { nombre: 'Experto',         emoji: '⚔️'  }
    if (level >= 20)  return { nombre: 'Veterano',        emoji: '🛡️'  }
    if (level >= 10)  return { nombre: 'Aprendiz',        emoji: '📖' }
    if (level >= 5)   return { nombre: 'Novato',          emoji: '🌱' }
    return              { nombre: 'Recién llegado',    emoji: '🌾' }
}

// ─────────────────────────────────────────────
//  Barra de EXP
// ─────────────────────────────────────────────

const expParaNivel = level => level * 150

const barraExp = (exp, level) => {
    const needed  = expParaNivel(level)
    const current = exp % needed || 0
    const pct     = Math.min(Math.floor((current / needed) * 10), 10)
    return {
        barra:      '▰'.repeat(pct) + '▱'.repeat(10 - pct),
        porcentaje: Math.floor((current / needed) * 100),
        current,
        needed
    }
}

// ─────────────────────────────────────────────
//  Clases RPG
// ─────────────────────────────────────────────

const CLASES = {
    guerrero:  { nombre: 'Guerrero',  emoji: '⚔️'  },
    mago:      { nombre: 'Mago',      emoji: '🔮' },
    arquero:   { nombre: 'Arquero',   emoji: '🏹' },
    asesino:   { nombre: 'Asesino',   emoji: '🗡️'  },
    curandero: { nombre: 'Curandero', emoji: '💚' },
    invocador: { nombre: 'Invocador', emoji: '🌀' },
}
const getClase = key => CLASES[key] || { nombre: 'Sin clase', emoji: '❓' }

// ─────────────────────────────────────────────
//  Fechas y helpers
// ─────────────────────────────────────────────

const pad = n => String(n).padStart(2, '0')

const formatDate = ts => {
    if (!ts || ts === 0) return 'No registrado'
    const d = new Date(ts)
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

const formatDateTime = ts => {
    if (!ts || ts === 0) return 'No registrado'
    const d = new Date(ts)
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const diasDesde = ts => {
    if (!ts || ts === 0) return 0
    return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24))
}

const proximoCumple = str => {
    if (!str) return null
    const [dia, mes] = str.split('/').map(Number)
    if (!dia || !mes) return null
    const hoy   = new Date()
    let fecha   = new Date(hoy.getFullYear(), mes - 1, dia)
    if (fecha <= hoy) fecha = new Date(hoy.getFullYear() + 1, mes - 1, dia)
    const diff  = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24))
    return diff === 0 ? '¡Hoy es tu día! 🎉' : `Faltan ${diff} días 🎂`
}

const fmt = n => (!n || isNaN(n)) ? '0' : Number(n).toLocaleString('es-ES')

// ─────────────────────────────────────────────
//  Foto de perfil
// ─────────────────────────────────────────────

const getProfilePic = async (conn, jid) => {
    try {
        const url = await conn.profilePictureUrl(jid, 'image')
        const res = await fetch(url)
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer())
    } catch { return null }
}

// ─────────────────────────────────────────────
//  Construir texto del perfil
// ─────────────────────────────────────────────

const buildPerfil = (user, displayName, jid) => {
    const num    = jid.split('@')[0].split(':')[0]
    const level  = user.level   || 1
    const exp    = user.exp     || 0
    const money  = user.money   || 0
    const bank   = user.bank    || 0
    const rango  = getRango(level)
    const clase  = getClase(user.clase)
    const expI   = barraExp(exp, level)
    const dias   = diasDesde(user.registered_time)
    const cumple = proximoCumple(user.birthday)
    const badge  = user.premium ? '💎 Premium' : user.registered ? '• Registrado' : '• Invitado'
    const warns  = user.warning || 0

    const nombre = (displayName || user.name || num).slice(0, 20)

    return (
        '\n' +
        '  ╔══════════════════════╗\n' +
        `  ║  ✦ *${nombre}*\n` +
        `  ║  +${num}\n` +
        '  ╠══════════════════════╣\n' +
        `  ║  ${rango.emoji} *${rango.nombre}*  ·  ${badge}\n` +
        `  ║  ${clase.emoji} *${clase.nombre}*\n` +
        '  ╠══════════════════════╣\n' +
        `  ║  ⭐ Nivel:  *${level}*\n` +
        `  ║  ✨ EXP:    *${expI.current}* / ${expI.needed}\n` +
        `  ║  ${expI.barra} *${expI.porcentaje}%*\n` +
        '  ╠══════════════════════╣\n' +
        `  ║  💰 Efectivo:  *$${fmt(money)}*\n` +
        `  ║  🏦 Banco:     *$${fmt(bank)}*\n` +
        `  ║  💵 Total:     *$${fmt(money + bank)}*\n` +
        '  ╠══════════════════════╣\n' +
        `  ║  🎂 Cumpleaños: *${user.birthday || 'No registrado'}*\n` +
        (cumple ? `  ║  🗓️ ${cumple}\n` : '') +
        `  ║  📅 Registro: *${formatDateTime(user.registered_time)}*\n` +
        `  ║  🌙 Días aquí: *${dias}*\n` +
        `  ║  🔄 Último claim: *${formatDate(user.lastclaim)}*\n` +
        '  ╠══════════════════════╣\n' +
        `  ║  📊 Edad:       *${user.age ?? 'No registrada'}*\n` +
        `  ║  ⚡ Límite:     *${user.limit ?? 20}*\n` +
        `  ║  ⚠️ Warns:      *${warns}/3*\n` +
        '  ╚══════════════════════╝'
    )
}

// ─────────────────────────────────────────────
//  Handler principal
// ─────────────────────────────────────────────

const handler = async (m, { conn, command, text, who }) => {
    const cmd = command.toLowerCase()

    // ── #setbirthday ──────────────────────────────────────────────────────────
    if (['setbirthday', 'cumpleanos', 'birthday'].includes(cmd)) {
        const input = (text || '').trim()
        const match = input.match(/^(\d{1,2})\/(\d{1,2})$/)

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
            return m.reply('⟨✦⟩ fecha inválida. Revisa el día y mes.')
        }

        const user    = database.getUser(m.sender)
        user.birthday = `${pad(dia)}/${pad(mes)}`
        await database.save()

        return m.reply(
            '⟨✦⟩ cumpleaños guardado ✓\n' +
            `◈ Fecha: *${user.birthday}*\n` +
            '◈ Te recordaré en tu día especial 🎂'
        )
    }

    // ── #perfil / #profile / etc. ─────────────────────────────────────────────
    const targetJid    = who
        ? (who.split('@')[0].split(':')[0] + '@s.whatsapp.net')
        : m.sender

    const user         = database.getUser(targetJid)

    // Nombre del target
    let displayName = ''
    if (targetJid === m.sender) {
        displayName = m.pushName || ''
    } else {
        try {
            const c     = conn.store?.contacts?.[targetJid]
            displayName = c?.name || c?.notify || ''
        } catch {}
    }

    await m.react('🔍')

    // Foto de perfil
    const ppBuf = await getProfilePic(conn, targetJid)
    const thumb = ppBuf || await global.getIconThumb?.() || null

    // Texto
    const texto = buildPerfil(user, displayName, targetJid)

    // Context con canal
    const ctx = global.getNewsletterCtx?.(thumb, '✦ Perfil', global.newsletterName || '') || {}

    try {
        if (ppBuf) {
            await conn.sendMessage(m.chat, {
                image:       ppBuf,
                caption:     texto,
                mentions:    [targetJid],
                contextInfo: ctx
            }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, {
                text:        texto,
                mentions:    [targetJid],
                contextInfo: ctx
            }, { quoted: m })
        }
        await m.react('✓')
    } catch {
        await m.reply(texto)
        await m.react('✓')
    }
}

// ─────────────────────────────────────────────
//  Metadata — handler.js lo lee de aquí
// ─────────────────────────────────────────────

handler.command = [
    'perfil', 'profile', 'card', 'me', 'yo', 'stats',
    'setbirthday', 'cumpleanos', 'birthday'
]
handler.tags = ['perfil']

export default handler
