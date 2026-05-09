const DEFAULT_WELCOME = '𓆩♡𓆪 Bienvenid@ {nombre} a {grupo}\n{bot} te da la bienvenida ✨'
const DEFAULT_GOODBYE = '𓆩♡𓆪 {nombre} salió de {grupo}\nHasta pronto.'

export const event = 'group-participants.update'

function getStore() {
  global.db = global.db || { data: {} }
  global.db.data.chats = global.db.data.chats || {}
  return global.db.data.chats
}

function ensure(chat) {
  const db = getStore()

  if (!db[chat]) {
    db[chat] = {}
  }

  if (!db[chat].welcome) {
    db[chat].welcome = {
      enabled: true,
      text: DEFAULT_WELCOME
    }
  }

  if (!db[chat].goodbye) {
    db[chat].goodbye = {
      enabled: true,
      text: DEFAULT_GOODBYE
    }
  }

  return db[chat]
}

function format(str, data) {
  return str.replace(/\{(\w+)\}/g, (_, key) => data[key] || `{${key}}`)
}

export async function run(conn, update) {
  const chat = update.id
  if (!chat.endsWith('@g.us')) return

  const cfg = ensure(chat)

  const meta = await conn.groupMetadata(chat)

  for (const jid of update.participants) {
    const vars = {
      nombre: '@' + jid.split('@')[0],
      grupo: meta.subject,
      miembros: meta.participants.length,
      desc: meta.desc || 'Sin descripción',
      mencion: '@' + jid.split('@')[0],
      fecha: new Date().toLocaleDateString('es-CO'),
      hora: new Date().toLocaleTimeString('es-CO'),
      bot: 'María Kujou',
      usuario: '@' + jid.split('@')[0]
    }

    if (update.action === 'add' && cfg.welcome.enabled) {
      await conn.sendMessage(chat, {
        text: format(cfg.welcome.text, vars),
        mentions: [jid]
      })
    }

    if (update.action === 'remove' && cfg.goodbye.enabled) {
      await conn.sendMessage(chat, {
        text: format(cfg.goodbye.text, vars),
        mentions: [jid]
      })
    }
  }
}