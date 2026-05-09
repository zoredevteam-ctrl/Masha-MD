// events/welcome.js — Masha Kujou MD
// ✦ Welcome & Goodbye personalizable por sub-bot
//
// Variables disponibles en el mensaje:
//   {nombre}    → nombre push del usuario
//   {numero}    → número sin @s.whatsapp.net
//   {grupo}     → nombre del grupo
//   {miembros}  → cantidad de miembros tras el evento
//   {desc}      → descripción del grupo (primeras 80 letras)
//   {mencion}   → mención @usuario
//   {fecha}     → fecha local dd/mm/yyyy
//   {hora}      → hora local hh:mm
//   {bot}       → nombre del bot conectado
//
// Comandos (con prefijo del bot):
//   #setwelcome <mensaje>   → activa y guarda el welcome del grupo
//   #setgoodbye <mensaje>   → activa y guarda el goodbye del grupo
//   #delwelcome             → desactiva el welcome
//   #delgoodbye             → desactiva el goodbye
//   #testwelcome            → simula un welcome para ver cómo queda
//   #testgoodbye            → simula un goodbye
//   #welcomeinfo            → muestra la configuración actual
//
// Usa #setwelcome sin texto para ver la ayuda con todas las variables.

import { database } from '../lib/database.js'

// ─────────────────────────────────────────────
//  Mensajes por defecto
// ─────────────────────────────────────────────

const DEFAULT_WELCOME = (
    '✦ ʙɪᴇɴᴠᴇɴɪᴅᴏ/ᴀ, {mencion} 🌸\n' +
    '◈ ɴᴏᴍʙʀᴇ   *{nombre}*\n' +
    '◈ ɢʀᴜᴘᴏ    *{grupo}*\n' +
    '◈ ᴍɪᴇᴍʙʀᴏs *{miembros}*\n\n' +
    '_Bienvenido/a a la familia. Eres parte de algo especial._ 💛'
)

const DEFAULT_GOODBYE = (
    '✦ ʜᴀsᴛᴀ ʟᴜᴇɢᴏ, *{nombre}* 🌙\n' +
    '◈ ɢʀᴜᴘᴏ    *{grupo}*\n' +
    '◈ ᴍɪᴇᴍʙʀᴏs *{miembros}*\n\n' +
    '_Te deseamos lo mejor en tu camino._ 💛'
)

const HELP_TEXT = (
    '⟨✦⟩ ᴠᴀʀɪᴀʙʟᴇs ᴅɪsᴘᴏɴɪʙʟᴇs\n\n' +
    '  {nombre}   → nombre del usuario\n' +
    '  {numero}   → número sin @\n' +
    '  {grupo}    → nombre del grupo\n' +
    '  {miembros} → cantidad de miembros\n' +
    '  {desc}     → descripción del grupo\n' +
    '  {mencion}  → mención @usuario\n' +
    '  {fecha}    → fecha dd/mm/yyyy\n' +
    '  {hora}     → hora hh:mm\n' +
    '  {bot}      → nombre del bot\n\n' +
    '⟨✦⟩ ᴇᴊᴇᴍᴘʟᴏ\n' +
    '  #setwelcome Hola {mencion}! Bienvenido a *{grupo}* 🌸\n' +
    '  Somos {miembros} miembros. ¡Disfruta!'
)

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

// Obtener o crear datos del grupo de forma segura
const getGroup = (chat) => {
    if (!database.data.groups)        database.data.groups = {}
    if (!database.data.groups[chat])  database.data.groups[chat] = {}
    return database.data.groups[chat]
}

// Formatear fecha y hora local
const now = () => {
    const d = new Date()
    const pad = n => String(n).padStart(2, '0')
    return {
        fecha: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
        hora:  `${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
}

// Reemplazar todas las variables en el template
const fillTemplate = (template, vars) =>
    template
        .replace(/\{nombre\}/gi,   vars.nombre   ?? '')
        .replace(/\{numero\}/gi,   vars.numero   ?? '')
        .replace(/\{grupo\}/gi,    vars.grupo    ?? '')
        .replace(/\{miembros\}/gi, vars.miembros ?? '')
        .replace(/\{desc\}/gi,     vars.desc     ?? '')
        .replace(/\{mencion\}/gi,  vars.mencion  ?? '')
        .replace(/\{fecha\}/gi,    vars.fecha    ?? '')
        .replace(/\{hora\}/gi,     vars.hora     ?? '')
        .replace(/\{bot\}/gi,      vars.bot      ?? '')

// Obtener thumbnail del icono del bot (para externalAdReply)
const getThumb = async () => {
    try { return await global.getIconThumb?.() || null } catch { return null }
}

// Enviar mensaje con el contexto del canal (igual que el resto del bot)
const sendWelcome = async (conn, jid, text, mentionJid) => {
    const thumb = await getThumb()
    const ctx   = global.getNewsletterCtx?.(thumb) || {}
    try {
        await conn.sendMessage(jid, {
            text,
            mentions:    mentionJid ? [mentionJid] : [],
            contextInfo: ctx
        })
    } catch {
        await conn.sendMessage(jid, { text })
    }
}

// Enviar welcome/goodbye con foto de perfil del usuario como imagen
const sendWithPhoto = async (conn, jid, text, userJid, mentionJid) => {
    const thumb = await getThumb()
    const ctx   = global.getNewsletterCtx?.(thumb) || {}

    // Intentar obtener foto de perfil del usuario
    let ppBuf = null
    try {
        const ppUrl = await conn.profilePictureUrl(userJid, 'image')
        const res   = await fetch(ppUrl)
        ppBuf       = Buffer.from(await res.arrayBuffer())
    } catch { /* sin foto — enviar solo texto */ }

    try {
        if (ppBuf) {
            await conn.sendMessage(jid, {
                image:       ppBuf,
                caption:     text,
                mentions:    mentionJid ? [mentionJid] : [],
                contextInfo: ctx
            })
        } else {
            await conn.sendMessage(jid, {
                text,
                mentions:    mentionJid ? [mentionJid] : [],
                contextInfo: ctx
            })
        }
    } catch {
        await conn.sendMessage(jid, { text })
    }
}

// ─────────────────────────────────────────────
//  Construir variables para un participante
// ─────────────────────────────────────────────

const buildVars = async (conn, participantJid, groupMeta) => {
    const num    = participantJid.split('@')[0].split(':')[0]
    const { fecha, hora } = now()

    // Nombre push — intentar obtenerlo del store
    let nombre = num
    try {
        const contact = await conn.store?.contacts?.[participantJid]
        if (contact?.name || contact?.notify) nombre = contact.name || contact.notify
    } catch {}

    const desc = (groupMeta?.desc || groupMeta?.description || '')
        .toString()
        .slice(0, 80)
        .trim()

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

// ─────────────────────────────────────────────
//  Exportaciones del evento
// ─────────────────────────────────────────────

// El evento de Baileys que dispara este archivo
export const event = 'group-participants.update'

// Solo actúa en grupos (todos los chats que terminen en @g.us)
export const enabled = (id) => id?.endsWith('@g.us') ?? false

// ─────────────────────────────────────────────
//  Lógica principal del evento
// ─────────────────────────────────────────────

export const run = async (conn, update) => {
    const { id: chat, participants, action } = update

    // Solo nos interesan entradas y salidas/kicks
    if (!['add', 'remove'].includes(action)) return

    const groupData = getGroup(chat)

    // ── Obtener metadata del grupo ────────────────────────────────────────────
    let groupMeta = null
    try { groupMeta = await conn.groupMetadata(chat) } catch { return }

    const isWelcome = action === 'add'
    const isGoodbye = action === 'remove'

    // Verificar si el evento está activo para este grupo
    if (isWelcome && !groupData.welcomeActive) return
    if (isGoodbye && !groupData.goodbyeActive) return

    // ── Procesar cada participante ────────────────────────────────────────────
    for (const participantJid of participants) {
        // No saludar al propio bot
        const botNum = conn.user?.id?.split(':')[0]
        if (participantJid.split('@')[0].split(':')[0] === botNum) continue

        const vars = await buildVars(conn, participantJid, groupMeta)

        if (isWelcome) {
            const template = groupData.welcomeMsg || DEFAULT_WELCOME
            const text     = fillTemplate(template, vars)

            // Usar foto de perfil si el usuario la activó
            if (groupData.welcomeWithPhoto) {
                await sendWithPhoto(conn, chat, text, participantJid, participantJid)
            } else {
                await sendWelcome(conn, chat, text, participantJid)
            }
        }

        if (isGoodbye) {
            const template = groupData.goodbyeMsg || DEFAULT_GOODBYE
            const text     = fillTemplate(template, vars)

            if (groupData.goodbyeWithPhoto) {
                await sendWithPhoto(conn, chat, text, participantJid, null)
            } else {
                await sendWelcome(conn, chat, text, null)
            }
        }
    }
}

// ─────────────────────────────────────────────
//  Plugin de comandos — se registra en /plugins
//  handler.js lo llama como cualquier otro plugin
// ─────────────────────────────────────────────

const PREFIXES = ['#', '.', '/', '$']

// Exportamos también el handler de comandos como default
// para que index.js lo cargue como plugin normal
const cmdHandler = async (m, { conn, command, text, isAdmin, isOwner }) => {
    const cmd       = command.toLowerCase()
    const chat      = m.chat
    const groupData = getGroup(chat)

    // ── #setwelcome ──────────────────────────────────────────────────────────
    if (cmd === 'setwelcome') {
        if (!isAdmin && !isOwner) {
            return m.reply('⟨✦⟩ sᴏʟᴏ ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀᴇs ᴘᴜᴇᴅᴇɴ ᴄᴏɴғɪɢᴜʀᴀʀ ᴇʟ ᴡᴇʟᴄᴏᴍᴇ.')
        }

        if (!text.trim()) return m.reply(HELP_TEXT)

        groupData.welcomeMsg    = text.trim()
        groupData.welcomeActive = true
        await database.save()

        return m.reply(
            '⟨✦⟩ ᴡᴇʟᴄᴏᴍᴇ ᴀᴄᴛɪᴠᴀᴅᴏ ✓\n\n' +
            '◈ ᴍᴇɴsᴀᴊᴇ ɢᴜᴀʀᴅᴀᴅᴏ.\n' +
            '◈ ᴜsᴀ *#testwelcome* ᴘᴀʀᴀ ᴠᴇʀ ᴄóᴍᴏ ǫᴜᴇᴅᴀ.\n' +
            '◈ ᴜsᴀ *#delwelcome* ᴘᴀʀᴀ ᴅᴇsᴀᴄᴛɪᴠᴀʀ.'
        )
    }

    // ── #setgoodbye ──────────────────────────────────────────────────────────
    if (cmd === 'setgoodbye') {
        if (!isAdmin && !isOwner) {
            return m.reply('⟨✦⟩ sᴏʟᴏ ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀᴇs ᴘᴜᴇᴅᴇɴ ᴄᴏɴғɪɢᴜʀᴀʀ ᴇʟ ɢᴏᴏᴅʙʏᴇ.')
        }

        if (!text.trim()) return m.reply(HELP_TEXT)

        groupData.goodbyeMsg    = text.trim()
        groupData.goodbyeActive = true
        await database.save()

        return m.reply(
            '⟨✦⟩ ɢᴏᴏᴅʙʏᴇ ᴀᴄᴛɪᴠᴀᴅᴏ ✓\n\n' +
            '◈ ᴍᴇɴsᴀᴊᴇ ɢᴜᴀʀᴅᴀᴅᴏ.\n' +
            '◈ ᴜsᴀ *#testgoodbye* ᴘᴀʀᴀ ᴠᴇʀ ᴄóᴍᴏ ǫᴜᴇᴅᴀ.\n' +
            '◈ ᴜsᴀ *#delgoodbye* ᴘᴀʀᴀ ᴅᴇsᴀᴄᴛɪᴠᴀʀ.'
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
        const wStatus = groupData.welcomeActive ? '🟢 activo'   : '🔴 inactivo'
        const gStatus = groupData.goodbyeActive ? '🟢 activo'   : '🔴 inactivo'
        const wPhoto  = groupData.welcomeWithPhoto ? 'sí' : 'no'
        const gPhoto  = groupData.goodbyeWithPhoto ? 'sí' : 'no'

        return m.reply(
            '⟨✦⟩ ᴄᴏɴғɪɢᴜʀᴀᴄɪóɴ ᴀᴄᴛᴜᴀʟ\n\n' +
            `◈ ᴡᴇʟᴄᴏᴍᴇ   ${wStatus}\n` +
            `◈ ᴄᴏɴ ғᴏᴛᴏ  ${wPhoto}\n` +
            `◈ ᴍᴇɴsᴀᴊᴇ:\n${groupData.welcomeMsg || DEFAULT_WELCOME}\n\n` +
            `◈ ɢᴏᴏᴅʙʏᴇ   ${gStatus}\n` +
            `◈ ᴄᴏɴ ғᴏᴛᴏ  ${gPhoto}\n` +
            `◈ ᴍᴇɴsᴀᴊᴇ:\n${groupData.goodbyeMsg || DEFAULT_GOODBYE}`
        )
    }

    // ── #welcomephoto / #goodbyephoto — toggle foto de perfil ────────────────
    if (cmd === 'welcomephoto') {
        if (!isAdmin && !isOwner) return m.reply('⟨✦⟩ sᴏʟᴏ ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀᴇs.')
        groupData.welcomeWithPhoto = !groupData.welcomeWithPhoto
        await database.save()
        return m.reply(
            groupData.welcomeWithPhoto
                ? '⟨✦⟩ ᴡᴇʟᴄᴏᴍᴇ ᴄᴏɴ ғᴏᴛᴏ ᴅᴇ ᴘᴇʀғɪʟ ✓'
                : '⟨✦⟩ ᴡᴇʟᴄᴏᴍᴇ sɪɴ ғᴏᴛᴏ ᴅᴇ ᴘᴇʀғɪʟ ✓'
        )
    }

    if (cmd === 'goodbyephoto') {
        if (!isAdmin && !isOwner) return m.reply('⟨✦⟩ sᴏʟᴏ ᴀᴅᴍɪɴɪsᴛʀᴀᴅᴏʀᴇs.')
        groupData.goodbyeWithPhoto = !groupData.goodbyeWithPhoto
        await database.save()
        return m.reply(
            groupData.goodbyeWithPhoto
                ? '⟨✦⟩ ɢᴏᴏᴅʙʏᴇ ᴄᴏɴ ғᴏᴛᴏ ᴅᴇ ᴘᴇʀғɪʟ ✓'
                : '⟨✦⟩ ɢᴏᴏᴅʙʏᴇ sɪɴ ғᴏᴛᴏ ᴅᴇ ᴘᴇʀғɪʟ ✓'
        )
    }

    // ── #testwelcome ─────────────────────────────────────────────────────────
    if (cmd === 'testwelcome') {
        let groupMeta = null
        try { groupMeta = await conn.groupMetadata(chat) } catch {}

        const vars = await buildVars(conn, m.sender, groupMeta)
        const template = groupData.welcomeMsg || DEFAULT_WELCOME
        const text     = fillTemplate(template, vars)

        if (groupData.welcomeWithPhoto) {
            await sendWithPhoto(conn, chat, text, m.sender, m.sender)
        } else {
            await sendWelcome(conn, chat, text, m.sender)
        }
        return
    }

    // ── #testgoodbye ─────────────────────────────────────────────────────────
    if (cmd === 'testgoodbye') {
        let groupMeta = null
        try { groupMeta = await conn.groupMetadata(chat) } catch {}

        const vars = await buildVars(conn, m.sender, groupMeta)
        const template = groupData.goodbyeMsg || DEFAULT_GOODBYE
        const text     = fillTemplate(template, vars)

        if (groupData.goodbyeWithPhoto) {
            await sendWithPhoto(conn, chat, text, m.sender, null)
        } else {
            await sendWelcome(conn, chat, text, null)
        }
        return
    }
}

// ─────────────────────────────────────────────
//  Metadata del plugin (para handler.js)
// ─────────────────────────────────────────────

cmdHandler.command = [
    'setwelcome', 'setgoodbye',
    'delwelcome', 'delgoodbye',
    'welcomeinfo',
    'welcomephoto', 'goodbyephoto',
    'testwelcome', 'testgoodbye'
]
cmdHandler.tags    = ['grupos']
cmdHandler.group   = true   // solo funciona en grupos

export default cmdHandler
