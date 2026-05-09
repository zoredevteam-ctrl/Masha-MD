import { database } from '../lib/database.js'

const DEFAULT_WELCOME =
'𓆩♡𓆪 Bienvenid@ {nombre} a {grupo}\nMaría Kujou te da la bienvenida ✨'

const DEFAULT_GOODBYE =
'𓆩♡𓆪 {nombre} salió de {grupo}\nHasta pronto.'

function ensure(chat) {
    if (!database.data.groups) database.data.groups = {}

    if (!database.data.groups[chat]) {
        database.data.groups[chat] = {}
    }

    const group = database.data.groups[chat]

    if (!group.welcome) {
        group.welcome = {
            enabled: false,
            text: DEFAULT_WELCOME
        }
    }

    if (!group.goodbye) {
        group.goodbye = {
            enabled: false,
            text: DEFAULT_GOODBYE
        }
    }

    return group
}

function format(text, data) {
    return text.replace(/\{(\w+)\}/g, (_, key) => {
        return data[key] ?? `{${key}}`
    })
}

let handler = async (m, { command, text }) => {

    const group = ensure(m.chat)

    if (command === 'welcome') {
        group.welcome.enabled = !group.welcome.enabled

        return m.reply(
            `⟨✦⟩ Welcome ${group.welcome.enabled ? 'activado' : 'desactivado'}.`
        )
    }

    if (command === 'goodbye') {
        group.goodbye.enabled = !group.goodbye.enabled

        return m.reply(
            `⟨✦⟩ Goodbye ${group.goodbye.enabled ? 'activado' : 'desactivado'}.`
        )
    }

    if (command === 'setwelcome') {

        if (!text) {
            return m.reply(`
⟨✦⟩ Ejemplo:

#setwelcome 𓆩♡𓆪 Bienvenid@ {nombre} a {grupo}

Variables:
{nombre}
{grupo}
{miembros}
{desc}
{mencion}
{fecha}
{hora}
{bot}
{usuario}
`.trim())
        }

        group.welcome.text = text
        group.welcome.enabled = true

        return m.reply('⟨✦⟩ Welcome actualizado.')
    }

    if (command === 'setgoodbye') {

        if (!text) {
            return m.reply(`
⟨✦⟩ Ejemplo:

#setgoodbye Adiós {nombre}

Variables:
{nombre}
{grupo}
{miembros}
{desc}
{mencion}
{fecha}
{hora}
{bot}
{usuario}
`.trim())
        }

        group.goodbye.text = text
        group.goodbye.enabled = true

        return m.reply('⟨✦⟩ Goodbye actualizado.')
    }

    if (command === 'welcomevars') {
        return m.reply(`
{nombre}
{grupo}
{miembros}
{desc}
{mencion}
{fecha}
{hora}
{bot}
{usuario}
`.trim())
    }
}

handler.help = [
    'welcome',
    'goodbye',
    'setwelcome',
    'setgoodbye',
    'welcomevars'
]

handler.tags = ['group']

handler.command = [
    'welcome',
    'goodbye',
    'setwelcome',
    'setgoodbye',
    'welcomevars'
]

handler.group = true
handler.admin = true

handler.before = async (m, { conn }) => {

    if (!m.isGroup) return false

    if (m.messageStubType !== 27 && m.messageStubType !== 28) {
        return false
    }

    const group = ensure(m.chat)

    const metadata = await conn.groupMetadata(m.chat)

    const users = m.messageStubParameters || []

    for (const user of users) {

        const vars = {
            nombre: '@' + user.split('@')[0],
            grupo: metadata.subject,
            miembros: metadata.participants.length,
            desc: metadata.desc || 'Sin descripción',
            mencion: '@' + user.split('@')[0],
            fecha: new Date().toLocaleDateString('es-CO'),
            hora: new Date().toLocaleTimeString('es-CO'),
            bot: 'María Kujou',
            usuario: '@' + user.split('@')[0]
        }

        if (m.messageStubType === 27 && group.welcome.enabled) {

            const txt = format(group.welcome.text, vars)

            await conn.sendMessage(m.chat, {
                text: txt,
                mentions: [user]
            })
        }

        if (m.messageStubType === 28 && group.goodbye.enabled) {

            const txt = format(group.goodbye.text, vars)

            await conn.sendMessage(m.chat, {
                text: txt,
                mentions: [user]
            })
        }
    }

    return false
}

export default handler