const PREFIX = '#'

const DEFAULT_WELCOME = '𓆩♡𓆪 Bienvenid@ {nombre} a {grupo}\n{bot} te da la bienvenida ✨'
const DEFAULT_GOODBYE = '𓆩♡𓆪 {nombre} salió de {grupo}\nHasta pronto.'

export const event = 'messages.upsert'
export const enabled = () => true

function getStore() {
  global.db = global.db || { data: {} }
  global.db.data.chats = global.db.data.chats || {}
  return global.db.data.chats
}

function ensureChatConfig(chat) {
  const store = getStore()
  if (!store[chat]) {
    store[chat] = {
      welcome: { enabled: true, text: DEFAULT_WELCOME },
      goodbye: { enabled: true, text: DEFAULT_GOODBYE }
    }
  }

  store[chat].welcome = store[chat].welcome || { enabled: true, text: DEFAULT_WELCOME }
  store[chat].goodbye = store[chat].goodbye || { enabled: true, text: DEFAULT_GOODBYE }

  if (typeof store[chat].welcome.enabled !== 'boolean') store[chat].welcome.enabled = true
  if (!store[chat].welcome.text) store[chat].welcome.text = DEFAULT_WELCOME

  if (typeof store[chat].goodbye.enabled !== 'boolean') store[chat].goodbye.enabled = true
  if (!store[chat].goodbye.text) store[chat].goodbye.text = DEFAULT_GOODBYE

  return store[chat]
}

function getText(m) {
  const msg = m.message || {}
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.templateButtonReplyMessage?.selectedId ||
    msg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
    ''
  )
}

function formatTemplate(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{${key}}`
  })
}

function normalizeText(text) {
  return String(text || '').replace(/\n/g, ' ').trim()
}

async function isAdmin(conn, chat, jid) {
  try {
    const meta = await conn.groupMetadata(chat)
    const p = meta.participants.find(v => v.id === jid)
    return p?.admin === 'admin' || p?.admin === 'superadmin'
  } catch {
    return false
  }
}

async function sendWelcomeOrGoodbye(conn, update) {
  const chat = update.id
  if (!chat?.endsWith('@g.us')) return

  const cfg = ensureChatConfig(chat)
  const action = update.action
  const participants = update.participants || []

  let meta
  try {
    meta = await conn.groupMetadata(chat)
  } catch {
    return
  }

  const groupName = meta.subject || 'el grupo'
  const desc = meta.desc || 'Sin descripción'
  const members = meta.participants?.length || 0

  for (const jid of participants) {
    const name = '@' + jid.split('@')[0]
    const time = new Date()
    const fecha = time.toLocaleDateString('es-CO')
    const hora = time.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

    const vars = {
      nombre: name,
      grupo: groupName,
      miembros: members,
      desc,
      mencion: name,
      fecha,
      hora,
      bot: 'María Kujou',
      usuario: name
    }

    if (action === 'add' && cfg.welcome.enabled) {
      const text = formatTemplate(cfg.welcome.text, vars)
      await conn.sendMessage(
        chat,
        { text, mentions: [jid] },
        { quoted: null }
      )
    }

    if (action === 'remove' && cfg.goodbye.enabled) {
      const text = formatTemplate(cfg.goodbye.text, vars)
      await conn.sendMessage(
        chat,
        { text, mentions: [jid] },
        { quoted: null }
      )
    }
  }
}

function helpText() {
  return `
*Comandos de welcome*
• ${PREFIX}setwelcome <texto>
• ${PREFIX}setgoodbye <texto>
• ${PREFIX}welcomeon
• ${PREFIX}welcomeoff
• ${PREFIX}goodbyeon
• ${PREFIX}goodbyeoff
• ${PREFIX}welcomevars
• ${PREFIX}resetwelcome
• ${PREFIX}resetgoodbye

*Placeholders*
{nombre} {grupo} {miembros} {desc} {mencion} {fecha} {hora} {bot} {usuario}
`.trim()
}

export async function run(conn, data) {
  if (!conn.__welcomeModuleReady) {
    conn.__welcomeModuleReady = true
    conn.ev.on('group-participants.update', async update => {
      try {
        await sendWelcomeOrGoodbye(conn, update)
      } catch (e) {
        console.error('Welcome module error:', e)
      }
    })
  }

  const messages = data?.messages || []
  if (!messages.length) return

  for (const m of messages) {
    if (!m?.message || m.key?.fromMe) continue

    const chat = m.key.remoteJid
    if (!chat?.endsWith('@g.us')) continue

    const text = normalizeText(getText(m))
    if (!text.startsWith(PREFIX)) continue

    const body = text.slice(PREFIX.length).trim()
    if (!body) continue

    const [cmdRaw, ...args] = body.split(/\s+/)
    const cmd = cmdRaw.toLowerCase()
    const argText = body.slice(cmdRaw.length).trim()

    const cfg = ensureChatConfig(chat)

    const canEdit = await isAdmin(conn, chat, m.key.participant || m.sender || m.key.remoteJid)
    if (!canEdit) {
      await conn.sendMessage(chat, { text: 'Solo admins o el owner pueden cambiar el welcome.' }, { quoted: m })
      continue
    }

    if (cmd === 'welcomevars') {
      await conn.sendMessage(chat, { text: helpText() }, { quoted: m })
      continue
    }

    if (cmd === 'setwelcome') {
      if (!argText) {
        await conn.sendMessage(
          chat,
          {
            text:
              `*Welcome actual:*\n${cfg.welcome.text}\n\n` +
              `*Ejemplo:*\n${PREFIX}setwelcome 𓆩♡𓆪 Bienvenid@ {nombre} a {grupo}\n{bot} te da la bienvenida ✨`
          },
          { quoted: m }
        )
        continue
      }

      cfg.welcome.text = argText
      cfg.welcome.enabled = true
      await conn.sendMessage(chat, { text: 'Welcome actualizado correctamente.' }, { quoted: m })
      continue
    }

    if (cmd === 'setgoodbye') {
      if (!argText) {
        await conn.sendMessage(
          chat,
          {
            text:
              `*Goodbye actual:*\n${cfg.goodbye.text}\n\n` +
              `*Ejemplo:*\n${PREFIX}setgoodbye 𓆩♡𓆪 {nombre} salió de {grupo}\nHasta pronto.`
          },
          { quoted: m }
        )
        continue
      }

      cfg.goodbye.text = argText
      cfg.goodbye.enabled = true
      await conn.sendMessage(chat, { text: 'Goodbye actualizado correctamente.' }, { quoted: m })
      continue
    }

    if (cmd === 'welcomeon') {
      cfg.welcome.enabled = true
      await conn.sendMessage(chat, { text: 'Welcome activado.' }, { quoted: m })
      continue
    }

    if (cmd === 'welcomeoff') {
      cfg.welcome.enabled = false
      await conn.sendMessage(chat, { text: 'Welcome desactivado.' }, { quoted: m })
      continue
    }

    if (cmd === 'goodbyeon') {
      cfg.goodbye.enabled = true
      await conn.sendMessage(chat, { text: 'Goodbye activado.' }, { quoted: m })
      continue
    }

    if (cmd === 'goodbyeoff') {
      cfg.goodbye.enabled = false
      await conn.sendMessage(chat, { text: 'Goodbye desactivado.' }, { quoted: m })
      continue
    }

    if (cmd === 'resetwelcome') {
      cfg.welcome.text = DEFAULT_WELCOME
      cfg.welcome.enabled = true
      await conn.sendMessage(chat, { text: 'Welcome restablecido al valor por defecto.' }, { quoted: m })
      continue
    }

    if (cmd === 'resetgoodbye') {
      cfg.goodbye.text = DEFAULT_GOODBYE
      cfg.goodbye.enabled = true
      await conn.sendMessage(chat, { text: 'Goodbye restablecido al valor por defecto.' }, { quoted: m })
      continue
    }
  }
}