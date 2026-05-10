// events/welcome.js — Masha Kujou MD
// ✦ Listener puro de group-participants.update
// ✦ Muestra foto de perfil del usuario + canal en el contextInfo
// ✦ Los comandos de configuración van en plugins/welcome.js

import { database } from '../lib/database.js'

// ─────────────────────────────────────────────
//  Mensajes por defecto
// ─────────────────────────────────────────────

const DEFAULT_WELCOME =
    '✦ ʙɪᴇɴᴠᴇɴɪᴅᴏ/ᴀ {mencion} 🌸\n' +
    '◈ ɴᴏᴍʙʀᴇ    *{nombre}*\n' +
    '◈ ɢʀᴜᴘᴏ     *{grupo}*\n' +
    '◈ ᴍɪᴇᴍʙʀᴏs  *{miembros}*\n' +
    '◈ ғᴇᴄʜᴀ     {fecha}  {hora}\n\n' +
    '_Bienvenido/a a la familia_ 💛'

const DEFAULT_GOODBYE =
    '✦ ʜᴀsᴛᴀ ʟᴜᴇɢᴏ {mencion} 🌙\n' +
    '◈ ɴᴏᴍʙʀᴇ    *{nombre}*\n' +
    '◈ ɢʀᴜᴘᴏ     *{grupo}*\n' +
    '◈ ᴍɪᴇᴍʙʀᴏs  *{miembros}*\n' +
    '◈ ғᴇᴄʜᴀ     {fecha}  {hora}\n\n' +
    '_Te deseamos lo mejor en tu camino_ 💛'

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

const getGroup = (chat) => {
    if (!database.data.groups)       database.data.groups = {}
    if (!database.data.groups[chat]) database.data.groups[chat] = {}
    return database.data.groups[chat]
}

const getNow = () => {
    const d   = new Date()
    const pad = n => String(n).padStart(2, '0')
    return {
        fecha: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
        hora:  `${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
}

const fillTemplate = (tpl, vars) =>
    tpl
        .replace(/\{nombre\}/gi,   vars.nombre   ?? '')
        .replace(/\{numero\}/gi,   vars.numero   ?? '')
        .replace(/\{grupo\}/gi,    vars.grupo    ?? '')
        .replace(/\{miembros\}/gi, vars.miembros ?? '')
        .replace(/\{desc\}/gi,     vars.desc     ?? '')
        .replace(/\{mencion\}/gi,  vars.mencion  ?? '')
        .replace(/\{fecha\}/gi,    vars.fecha    ?? '')
        .replace(/\{hora\}/gi,     vars.hora     ?? '')
        .replace(/\{bot\}/gi,      vars.bot      ?? '')

// Obtener foto de perfil como Buffer — devuelve null si no tiene
const getProfilePic = async (conn, jid) => {
    try {
        const url = await conn.profilePictureUrl(jid, 'image')
        const res = await fetch(url)
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer())
    } catch { return null }
}

// Foto de fallback (icono del bot) si el usuario no tiene foto
const getFallbackThumb = async () => {
    try { return await global.getIconThumb?.() || null } catch { return null }
}

// Construir contextInfo con newsletter + canal
const buildCtx = (thumb, title, body) => ({
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid:   global.newsletterJid   || '',
        serverMessageId: -1,
        newsletterName:  global.newsletterName  || ''
    },
    externalAdReply: {
        title:                 title || global.botName || 'Masha Kujou',
        body:                  body  || global.newsletterName || '',
        mediaType:             1,
        sourceUrl:             global.rcanal || '',
        mediaUrl:              global.rcanal || '',
        thumbnail:             thumb,
        showAdAttribution:     false,
        containsAutoReply:     true,
        renderLargerThumbnail: false
    }
})

// Construir variables para un participante
const buildVars = async (conn, participantJid, groupMeta) => {
    const num  = participantJid.split('@')[0].split(':')[0]
    const { fecha, hora } = getNow()

    // Intentar obtener nombre del contacto
    let nombre = num
    try {
        const contact = conn.store?.contacts?.[participantJid]
        if (contact?.name || contact?.notify) nombre = contact.name || contact.notify
    } catch {}

    const desc = (groupMeta?.desc || groupMeta?.description || '')
        .toString().slice(0, 80).trim()

    return {
        nombre,
        numero:   num,
        grupo:    groupMeta?.subject  || 'Grupo',
        miembros: String(groupMeta?.participants?.length ?? '?'),
        desc:     desc || 'Sin descripción',
        mencion:  `@${num}`,
        fecha,
        hora,
        bot:      conn.user?.name || global.botName || 'Masha Kujou'
    }
}

// ─────────────────────────────────────────────
//  Enviar con foto de perfil como imagen
//  Si no tiene foto → envía thumbnail en el contextInfo
// ─────────────────────────────────────────────

const sendEvent = async (conn, chat, participantJid, text, isWelcome) => {
    const mentions = [participantJid]

    // 1. Intentar foto de perfil del usuario
    const ppBuf = await getProfilePic(conn, participantJid)

    // 2. Thumbnail para el externalAdReply
    //    Si hay foto de perfil → usarla como thumb también
    //    Si no → usar icono del bot
    const thumbBuf = ppBuf || await getFallbackThumb()

    const groupLabel = isWelcome ? '🌸 Bienvenida' : '🌙 Despedida'
    const ctx = buildCtx(thumbBuf, groupLabel, global.newsletterName || global.botName || 'Masha Kujou')

    try {
        if (ppBuf) {
            // Enviar foto de perfil como imagen con caption
            await conn.sendMessage(chat, {
                image:       ppBuf,
                caption:     text,
                mentions,
                contextInfo: ctx
            })
        } else {
            // Sin foto — solo texto con contextInfo
            await conn.sendMessage(chat, {
                text,
                mentions,
                contextInfo: ctx
            })
        }
    } catch (e) {
        // Fallback mínimo sin contextInfo
        try {
            await conn.sendMessage(chat, { text, mentions })
        } catch {}
    }
}

// ─────────────────────────────────────────────
//  Exportaciones del evento (requeridas por handler.js)
// ─────────────────────────────────────────────

export const event   = 'group-participants.update'
export const enabled = (id) => id?.endsWith('@g.us') ?? false

export const run = async (conn, update) => {
    const { id: chat, participants, action } = update

    if (!['add', 'remove'].includes(action)) return

    const groupData = getGroup(chat)

    // Obtener metadata del grupo
    let groupMeta = null
    try { groupMeta = await conn.groupMetadata(chat) } catch { return }

    const isWelcome = action === 'add'
    const isGoodbye = action === 'remove'

    // Verificar si está activo para este grupo
    if (isWelcome && !groupData.welcomeActive) return
    if (isGoodbye && !groupData.goodbyeActive) return

    const botNum = conn.user?.id?.split(':')[0]

    for (const participantJid of participants) {
        // No saludar al propio bot
        const partNum = participantJid.split('@')[0].split(':')[0]
        if (partNum === botNum) continue

        const vars = await buildVars(conn, participantJid, groupMeta)

        if (isWelcome) {
            const tpl  = groupData.welcomeMsg || DEFAULT_WELCOME
            const text = fillTemplate(tpl, vars)
            await sendEvent(conn, chat, participantJid, text, true)
        }

        if (isGoodbye) {
            const tpl  = groupData.goodbyeMsg || DEFAULT_GOODBYE
            const text = fillTemplate(tpl, vars)
            await sendEvent(conn, chat, participantJid, text, false)
        }
    }
}
