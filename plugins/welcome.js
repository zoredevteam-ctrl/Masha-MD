// plugins/welcome.js — Masha Kujou MD
// ✦ Comandos para que el usuario del sub-bot personalice
//   el mensaje de bienvenida y despedida de sus grupos
//
// ─────────────────────────────────────────────
//  COMANDOS DISPONIBLES
// ─────────────────────────────────────────────
//
//  #setwelcome <texto>   → guarda y activa el welcome
//  #setgoodbye <texto>   → guarda y activa el goodbye
//  #delwelcome           → desactiva el welcome
//  #delgoodbye           → desactiva el goodbye
//  #testwelcome          → simula el welcome contigo mismo
//  #testgoodbye          → simula el goodbye contigo mismo
//  #welcomeinfo          → muestra la config actual del grupo
//
// ─────────────────────────────────────────────
//  VARIABLES SOPORTADAS EN LOS MENSAJES
// ─────────────────────────────────────────────
//
//  {nombre}    → nombre push del usuario
//  {numero}    → número sin @s.whatsapp.net
//  {grupo}     → nombre del grupo
//  {miembros}  → cantidad de miembros
//  {desc}      → descripción del grupo (80 chars)
//  {mencion}   → @usuario (mención clickeable)
//  {fecha}     → dd/mm/yyyy
//  {hora}      → hh:mm
//  {bot}       → nombre del bot conectado
//
// ─────────────────────────────────────────────

import { database } from '../lib/database.js'

// ─────────────────────────────────────────────
//  Defaults (mismos que en events/welcome.js)
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

const HELP =
    '⟨✦⟩ *variables disponibles*\n\n' +
    '  `{nombre}`    → nombre del usuario\n' +
    '  `{numero}`    → número sin @\n' +
    '  `{grupo}`     → nombre del grupo\n' +
    '  `{miembros}`  → cantidad de miembros\n' +
    '  `{desc}`      → descripción del grupo\n' +
    '  `{mencion}`   → @mención clickeable\n' +
    '  `{fecha}`     → dd/mm/yyyy\n' +
    '  `{hora}`      → hh:mm\n' +
    '  `{bot}`       → nombre del bot\n\n' +
    '⟨✦⟩ *ejemplo*\n' +
    '`#setwelcome Hola {mencion}! Bienvenido a *{grupo}* 🌸\n' +
    'Somos {miembros} miembros. ¡Disfruta!`'

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

const getProfilePic = async (conn, jid) => {
    try {
        const url = await conn.profilePictureUrl(jid, 'image')
        const res = await fetch(url)
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer())
    } catch { return null }
}

const getFallbackThumb = async () => {
    try { return await global.getIconThumb?.() || null } catch { return null }
}

const buildCtx = (thumb, isWelcome) => ({
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid:   global.newsletterJid  || '',
        serverMessageId: -1,
        newsletterName:  global.newsletterName || ''
    },
    externalAdReply: {
        title:                 isWelcome ? '🌸 Bienvenida' : '🌙 Despedida',
        body:                  global.newsletterName || global.botName || 'Masha Kujou',
        mediaType:             1,
        sourceUrl:             global.rcanal || '',
        mediaUrl:              global.rcanal || '',
        thumbnail:             thumb,
        showAdAttribution:     false,
        containsAutoReply:     true,
        renderLargerThumbnail: false
    }
})

const buildVars = async (conn, participantJid, groupMeta) => {
    const num  = participantJid.split('@')[0].split(':')[0]
    const { fecha, hora } = getNow()

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
        grupo:    groupMeta?.subject || 'Grupo',
        miembros: String(groupMeta?.participants?.length ?? '?'),
        desc:     desc || 'Sin descripción',
        mencion:  `@${num}`,
        fecha,
        hora,
        bot:      conn.user?.name || global.botName || 'Masha Kujou'
    }
}

// Enviar el test con foto de perfil (igual que events/welcome.js)
const sendTest = async (conn, m, text, senderJid, isWelcome) => {
    const ppBuf    = await getProfilePic(conn, senderJid)
    const thumbBuf = ppBuf || await getFallbackThumb()
    const ctx      = buildCtx(thumbBuf, isWelcome)
    const mentions = [senderJid]

    try {
        if (ppBuf) {
            await conn.sendMessage(m.chat, {
                image:       ppBuf,
                caption:     text,
                mentions,
                contextInfo: ctx
            })
        } else {
            await conn.sendMessage(m.chat, {
                text,
                mentions,
                contextInfo: ctx
            })
        }
    } catch {
        await m.reply(text)
    }
}

// ─────────────────────────────────────────────
//  Handler de comandos
// ─────────────────────────────────────────────

const handler = async (m, { conn, command, text, isAdmin, isOwner }) => {
    const cmd       = command.toLowerCase()
    const chat      = m.chat
    const groupData = getGroup(chat)

    // ── #setwelcome ──────────────────────────────────────────────────────────
    if (cmd === 'setwelcome') {
        if (!isAdmin && !isOwner) {
            return m.reply('⟨✦⟩ sᴏʟᴏ ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀᴇs ᴘᴜᴇᴅᴇɴ ᴄᴏɴғɪɢᴜʀᴀʀ ᴇʟ ᴡᴇʟᴄᴏᴍᴇ.')
        }
        // Sin texto → mostrar ayuda
        if (!text || !text.trim()) return m.reply(HELP)

        groupData.welcomeMsg    = text.trim()
        groupData.welcomeActive = true
        await database.save()

        return m.reply(
            '⟨✦⟩ ᴡᴇʟᴄᴏᴍᴇ ᴀᴄᴛɪᴠᴀᴅᴏ ✓\n\n' +
            '◈ ᴜsᴀ *#testwelcome* ᴘᴀʀᴀ ᴠᴇʀ ᴄóᴍᴏ ǫᴜᴇᴅᴀ\n' +
            '◈ ᴜsᴀ *#welcomeinfo* ᴘᴀʀᴀ ᴠᴇʀ ʟᴀ ᴄᴏɴғɪɢ\n' +
            '◈ ᴜsᴀ *#delwelcome* ᴘᴀʀᴀ ᴅᴇsᴀᴄᴛɪᴠᴀʀ'
        )
    }

    // ── #setgoodbye ──────────────────────────────────────────────────────────
    if (cmd === 'setgoodbye') {
        if (!isAdmin && !isOwner) {
            return m.reply('⟨✦⟩ sᴏʟᴏ ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀᴇs ᴘᴜᴇᴅᴇɴ ᴄᴏɴғɪɢᴜʀᴀʀ ᴇʟ ɢᴏᴏᴅʙʏᴇ.')
        }
        if (!text || !text.trim()) return m.reply(HELP)

        groupData.goodbyeMsg    = text.trim()
        groupData.goodbyeActive = true
        await database.save()

        return m.reply(
            '⟨✦⟩ ɢᴏᴏᴅʙʏᴇ ᴀᴄᴛɪᴠᴀᴅᴏ ✓\n\n' +
            '◈ ᴜsᴀ *#testgoodbye* ᴘᴀʀᴀ ᴠᴇʀ ᴄóᴍᴏ ǫᴜᴇᴅᴀ\n' +
            '◈ ᴜsᴀ *#welcomeinfo* ᴘᴀʀᴀ ᴠᴇʀ ʟᴀ ᴄᴏɴғɪɢ\n' +
            '◈ ᴜsᴀ *#delgoodbye* ᴘᴀʀᴀ ᴅᴇsᴀᴄᴛɪᴠᴀʀ'
        )
    }

    // ── #delwelcome ──────────────────────────────────────────────────────────
    if (cmd === 'delwelcome') {
        if (!isAdmin && !isOwner) return m.reply('⟨✦⟩ sᴏʟᴏ ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀᴇs.')
        groupData.welcomeActive = false
        await database.save()
        return m.reply('⟨✦⟩ ᴡᴇʟᴄᴏᴍᴇ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ ✓')
    }

    // ── #delgoodbye ──────────────────────────────────────────────────────────
    if (cmd === 'delgoodbye') {
        if (!isAdmin && !isOwner) return m.reply('⟨✦⟩ sᴏʟᴏ ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀᴇs.')
        groupData.goodbyeActive = false
        await database.save()
        return m.reply('⟨✦⟩ ɢᴏᴏᴅʙʏᴇ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ ✓')
    }

    // ── #welcomeinfo ─────────────────────────────────────────────────────────
    if (cmd === 'welcomeinfo') {
        const wOn  = groupData.welcomeActive ? '🟢 activo'   : '🔴 inactivo'
        const gOn  = groupData.goodbyeActive ? '🟢 activo'   : '🔴 inactivo'
        const wMsg = groupData.welcomeMsg    || DEFAULT_WELCOME
        const gMsg = groupData.goodbyeMsg    || DEFAULT_GOODBYE

        return m.reply(
            '⟨✦⟩ ᴄᴏɴғɪɢᴜʀᴀᴄɪóɴ ᴅᴇʟ ɢʀᴜᴘᴏ\n\n' +
            `*Welcome:* ${wOn}\n` +
            `*Mensaje:*\n${wMsg}\n\n` +
            `*Goodbye:* ${gOn}\n` +
            `*Mensaje:*\n${gMsg}\n\n` +
            '◈ ᴜsᴀ *#setwelcome <texto>* ᴘᴀʀᴀ ᴄᴀᴍʙɪᴀʀʟᴏ'
        )
    }

    // ── #testwelcome ─────────────────────────────────────────────────────────
    if (cmd === 'testwelcome') {
        let groupMeta = null
        try { groupMeta = await conn.groupMetadata(chat) } catch {}

        const vars = await buildVars(conn, m.sender, groupMeta)
        const tpl  = groupData.welcomeMsg || DEFAULT_WELCOME
        const text2 = fillTemplate(tpl, vars)
        await sendTest(conn, m, text2, m.sender, true)
        return
    }

    // ── #testgoodbye ─────────────────────────────────────────────────────────
    if (cmd === 'testgoodbye') {
        let groupMeta = null
        try { groupMeta = await conn.groupMetadata(chat) } catch {}

        const vars  = await buildVars(conn, m.sender, groupMeta)
        const tpl   = groupData.goodbyeMsg || DEFAULT_GOODBYE
        const text2 = fillTemplate(tpl, vars)
        await sendTest(conn, m, text2, m.sender, false)
        return
    }
}

// ─────────────────────────────────────────────
//  Metadata del plugin
// ─────────────────────────────────────────────

handler.command = [
    'setwelcome', 'setgoodbye',
    'delwelcome', 'delgoodbye',
    'welcomeinfo',
    'testwelcome', 'testgoodbye'
]
handler.tags  = ['grupos']
handler.group = true

export default handler
