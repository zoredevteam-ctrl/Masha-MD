// plugins/economy.js — Masha Kujou MD
import { database } from '../lib/database.js'

const getThumb = async () => {
    try {
        const res = await fetch(global.icono || global.banner || '')
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer())
    } catch { return null }
}

const send = async (conn, m, txt, mentions = []) => {
    const thumb = await getThumb()
    try {
        await conn.sendMessage(m.chat, {
            text: txt, mentions,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid:   global.newsletterJid,
                    serverMessageId: -1,
                    newsletterName:  global.newsletterName
                },
                externalAdReply: {
                    title:                 global.botName || 'Masha Kujou',
                    body:                  global.newsletterName || '',
                    mediaType:             1,
                    thumbnail:             thumb,
                    renderLargerThumbnail: false,
                    sourceUrl:             global.rcanal || ''
                }
            }
        }, { quoted: m })
    } catch { await m.reply(txt) }
}

const getUser = (jid) => {
    if (!database.data.users) database.data.users = {}
    if (!database.data.users[jid]) database.data.users[jid] = { money: 0, bank: 0, exp: 0, level: 1 }
    return database.data.users[jid]
}

const checkLevel = (user) => {
    const xpNeeded = user.level * 100
    if ((user.exp || 0) >= xpNeeded) { user.level = (user.level || 1) + 1; user.exp -= xpNeeded; return true }
    return false
}

const rand = arr => arr[Math.floor(Math.random() * arr.length)]
const msToTime = ms => {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const frasesTrabajo = [
    'ʟɪᴍᴘɪᴀsᴛᴇ ᴠɪᴅʀɪᴏs ᴇɴ ᴜɴ ᴇᴅɪғɪᴄɪᴏ ᴅᴇ 40 ᴘɪsᴏs',
    'ʀᴇᴘᴀʀᴛɪsᴛᴇ ᴠᴏʟᴀɴᴛᴇs ʙᴀᴊᴏ ᴇʟ sᴏʟ ᴅᴇ ʟᴀs 2ᴘᴍ',
    'ᴄᴜɪᴅᴀsᴛᴇ ɴɪñᴏs ʏ ᴀʜᴏʀᴀ ɴᴏ ǫᴜɪᴇʀᴇs sᴀʙᴇʀ ɴᴀᴅᴀ ᴅᴇ ɴɪñᴏs',
    'ᴠᴇɴᴅɪsᴛᴇ ᴀʀᴇᴘᴀs ᴘᴇʀᴏ ᴛᴇ ᴄᴏᴍɪsᴛᴇ ʟᴀ ᴍɪᴛᴀᴅ',
    'ʙᴀɪʟᴀsᴛᴇ ᴇɴ ᴜɴᴀ ʙᴏᴅᴀ ᴅᴇ ᴅᴇsᴄᴏɴᴏᴄɪᴅᴏs ᴘᴏʀ ᴅɪɴᴇʀᴏ',
    'ᴅɪsᴛᴇ ᴄʟᴀsᴇs ᴅᴇ ɪɴɢʟés ʏ ᴛᴜ ɪɴɢʟés ᴇs ᴘésɪᴍᴏ',
    'ᴛʀᴀʙᴀᴊᴀsᴛᴇ ᴅᴇ ɴɪñᴇʀᴏ ʏ ᴘᴇʀᴅɪsᴛᴇ ᴜɴ ɴɪñᴏ',
    'ғᴜɪsᴛᴇ ᴄᴏᴍᴘᴀʀsᴀ ᴇɴ ᴜɴᴀ ᴘᴇʟíᴄᴜʟᴀ ᴅᴇ ᴛᴇʀᴄᴇʀᴀ'
]

const frasesRobo = [
    'ᴛʀᴏᴘᴇᴢᴀsᴛᴇ ᴀɴᴛᴇs ᴅᴇ ʟʟᴇɢᴀʀ',
    'ᴇʟ ɢᴜᴀʀᴅɪᴀ ᴇʀᴀ ᴛᴜ ᴠᴇᴄɪɴᴏ... ᴀᴡᴋᴡᴀʀᴅ',
    'sᴇ ᴅɪᴏ ᴄᴜᴇɴᴛᴀ ᴘᴏʀǫᴜᴇ ɴᴏ ᴛᴇ ᴄᴀʟʟᴀsᴛᴇ',
    'ᴛᴇ ʀᴇsʙᴀʟᴀsᴛᴇ ᴄᴏɴ ᴜɴᴀ ᴄásᴄᴀʀᴀ ᴅᴇ ʙᴀɴᴀɴᴏ',
    'ʟᴀ ᴠíᴄᴛɪᴍᴀ ᴇʀᴀ ᴋᴀʀᴀᴛᴇᴄᴀ ʏ ᴛᴜ ɴᴏ'
]

const frasesDaily = [
    'ᴛᴏᴍᴀ, ɴᴏ ʟᴏ ɢᴀsᴛᴇs ᴇɴ ᴛᴏɴᴛᴇʀíᴀs... ʙᴜᴇɴᴏ sí, ʜᴀᴢʟᴏ',
    'ᴍᴀsʜᴀ ᴛᴇ ʟᴏ ᴅᴀ ᴀ ʀᴇɢᴀñᴀᴅɪᴇɴᴛᴇs ♡',
    'ᴇʟ ᴜɴɪᴠᴇʀsᴏ ᴅᴇᴄɪᴅɪó sᴇʀ ᴀᴍᴀʙʟᴇ ʜᴏʏ... ᴘᴏʀ ᴀᴄᴄɪᴅᴇɴᴛᴇ',
    'sᴜᴘᴏɴɢᴏ ǫᴜᴇ ᴛᴇ ʟᴏ ᴍᴇʀᴇᴄᴇs... ᴛᴀʟ ᴠᴇᴢ'
]

let handler = async (m, { conn, command, text, args, isOwner }) => {
    const cmd    = command.toLowerCase()
    const sender = m.sender
    const user   = getUser(sender)

    const getRandomParticipant = async (excluir = []) => {
        if (!m.isGroup) return null
        try {
            const meta = await conn.groupMetadata(m.chat)
            const ps   = meta.participants.map(p => p.id || p.jid).filter(j => !excluir.includes(j))
            return ps.length ? ps[Math.floor(Math.random() * ps.length)] : null
        } catch { return null }
    }

    // ── #bal ──────────────────────────────────────────────────────────────────
    if (cmd === 'bal' || cmd === 'balance' || cmd === 'dinero') {
        const total = (user.money || 0) + (user.bank || 0)
        return send(conn, m,
            `⟨✦⟩ ʙᴀʟᴀɴᴄᴇ\n` +
            `  ◈ ᴇғᴇᴄᴛɪᴠᴏ   $${(user.money || 0).toLocaleString()}\n` +
            `  ◈ ʙᴀɴᴄᴏ     $${(user.bank  || 0).toLocaleString()}\n` +
            `  ◈ ᴛᴏᴛᴀʟ     $${total.toLocaleString()}\n` +
            `  ◈ ɴɪᴠᴇʟ     ${user.level || 1}\n` +
            `  ↳ ${total === 0 ? 'ᴇsᴛás ᴇɴ ǫᴜɪᴇʙʀᴀ. ᴄʟásɪᴄᴏ.' : total < 500 ? 'ᴄᴜᴀᴛʀᴏ ᴘᴇsᴏs. ɴᴏ ᴛᴇ ɪʟᴜsɪᴏɴᴇs.' : 'ɴᴏ ᴇsᴛá ᴍᴀʟ. sɪɢᴜᴇ ᴀsí.'}`
        )
    }

    // ── #chamba ───────────────────────────────────────────────────────────────
    if (cmd === 'chamba' || cmd === 'trabajar' || cmd === 'work') {
        const cooldown = 30 * 60 * 1000
        const diff     = Date.now() - (user.lastwork || 0)
        if (diff < cooldown) return send(conn, m,
            `⟨✦⟩ ᴀᴜɴ ɴᴏ\n  ◈ ᴇsᴘᴇʀᴀ *${msToTime(cooldown - diff)}* ᴀɴᴛᴇs ᴅᴇ ᴠᴏʟᴠᴇʀ ᴀ ᴄʜᴀᴍʙᴇᴀʀ.`
        )
        const ganado  = Math.floor(Math.random() * 400) + 100
        const expGain = Math.floor(Math.random() * 20) + 5
        user.money    = (user.money || 0) + ganado
        user.exp      = (user.exp   || 0) + expGain
        user.lastwork = Date.now()
        const subio   = checkLevel(user)
        return send(conn, m,
            `⟨✦⟩ ᴄʜᴀᴍʙᴀ\n` +
            `  ◈ ${rand(frasesTrabajo)}\n` +
            `  ◈ ɢᴀɴᴀsᴛᴇ    $${ganado.toLocaleString()}\n` +
            `  ◈ ᴇxᴘ        +${expGain}\n` +
            (subio ? `  ◈ ɴɪᴠᴇʟ ${user.level}! ɴᴏ ᴇsᴛá ᴍᴀʟ.\n` : '') +
            `  ↳ ᴠᴜᴇʟᴠᴇ ᴇɴ 30 ᴍɪɴ.`
        )
    }

    // ── #daily ────────────────────────────────────────────────────────────────
    if (cmd === 'daily' || cmd === 'diario') {
        const cooldown = 24 * 60 * 60 * 1000
        const diff     = Date.now() - (user.lastdaily || 0)
        if (diff < cooldown) return send(conn, m,
            `⟨✦⟩ ʏᴀ ʀᴇᴄʟᴀᴍᴀsᴛᴇ\n  ◈ ᴠᴜᴇʟᴠᴇ ᴇɴ *${msToTime(cooldown - diff)}*`
        )
        const ganado   = Math.floor(Math.random() * 300) + 200
        user.money     = (user.money || 0) + ganado
        user.lastdaily = Date.now()
        return send(conn, m,
            `⟨✦⟩ ᴅᴀɪʟʏ\n` +
            `  ◈ ɢᴀɴᴀsᴛᴇ   $${ganado.toLocaleString()}\n` +
            `  ◈ ${rand(frasesDaily)}\n` +
            `  ◈ sᴀʟᴅᴏ     $${(user.money).toLocaleString()}`
        )
    }

    // ── #dep ──────────────────────────────────────────────────────────────────
    if (cmd === 'dep' || cmd === 'depositar') {
        const cantidad = args[0] === 'all' ? user.money : parseInt(args[0])
        if (!cantidad || isNaN(cantidad) || cantidad <= 0) return send(conn, m,
            `⟨✦⟩ ᴜsᴏ: *#dep <cantidad>* o *#dep all*`
        )
        if (cantidad > (user.money || 0)) return send(conn, m,
            `⟨✦⟩ ɴᴏ ᴛɪᴇɴᴇs $${cantidad.toLocaleString()} ᴇɴ ᴇғᴇᴄᴛɪᴠᴏ.`
        )
        user.money -= cantidad
        user.bank   = (user.bank || 0) + cantidad
        return send(conn, m,
            `⟨✦⟩ ᴅᴇᴘᴏsɪᴛᴀᴅᴏ\n` +
            `  ◈ ᴅᴇᴘᴏsɪᴛᴏ  $${cantidad.toLocaleString()}\n` +
            `  ◈ ʙᴀɴᴄᴏ     $${(user.bank).toLocaleString()}\n` +
            `  ↳ ǫᴜé ʀᴇsᴘᴏɴsᴀʙʟᴇ... ɴᴏ ᴛᴇ ᴄᴏɴᴏᴄíᴀ ᴇsᴇ ʟᴀᴅᴏ.`
        )
    }

    // ── #retirar ──────────────────────────────────────────────────────────────
    if (cmd === 'retirar' || cmd === 'withdraw') {
        const cantidad = args[0] === 'all' ? user.bank : parseInt(args[0])
        if (!cantidad || isNaN(cantidad) || cantidad <= 0) return send(conn, m,
            `⟨✦⟩ ᴜsᴏ: *#retirar <cantidad>* o *#retirar all*`
        )
        if (cantidad > (user.bank || 0)) return send(conn, m,
            `⟨✦⟩ ʙᴀɴᴄᴏ: $${(user.bank || 0).toLocaleString()}. ɴᴏ ᴛɪᴇɴᴇs ᴇsᴏ.`
        )
        user.bank  -= cantidad
        user.money  = (user.money || 0) + cantidad
        return send(conn, m,
            `⟨✦⟩ ʀᴇᴛɪʀᴀᴅᴏ\n` +
            `  ◈ ᴄᴀɴᴛɪᴅᴀᴅ  $${cantidad.toLocaleString()}\n` +
            `  ◈ ᴇғᴇᴄᴛɪᴠᴏ  $${(user.money).toLocaleString()}\n` +
            `  ↳ ʏᴀ ᴛᴇ ɢᴀsᴛᴀsᴛᴇ ᴛᴏᴅᴏ ¿ᴠᴇʀᴅᴀᴅ?`
        )
    }

    // ── #transferir ───────────────────────────────────────────────────────────
    if (cmd === 'transferir' || cmd === 'transfer' || cmd === 'pagar') {
        const target   = m.mentionedJid?.[0] || m.quoted?.sender
        const cantidad = parseInt(args.find(a => !isNaN(a)))
        if (!target) return send(conn, m, `⟨✦⟩ ᴜsᴏ: *#transferir @usuario <cantidad>*`)
        if (!cantidad || isNaN(cantidad) || cantidad <= 0) return send(conn, m, `⟨✦⟩ ɪɴᴅɪᴄᴀ ᴜɴᴀ ᴄᴀɴᴛɪᴅᴀᴅ ᴠáʟɪᴅᴀ.`)
        if (cantidad > (user.money || 0)) return send(conn, m, `⟨✦⟩ ɴᴏ ᴛɪᴇɴᴇs sᴜғɪᴄɪᴇɴᴛᴇ ᴇғᴇᴄᴛɪᴠᴏ.`)
        const targetUser    = getUser(target)
        user.money         -= cantidad
        targetUser.money    = (targetUser.money || 0) + cantidad
        return send(conn, m,
            `⟨✦⟩ ᴛʀᴀɴsғᴇʀᴇɴᴄɪᴀ\n` +
            `  ◈ ᴇɴᴠɪᴀsᴛᴇ   $${cantidad.toLocaleString()}\n` +
            `  ◈ ᴘᴀʀᴀ       @${target.split('@')[0]}\n` +
            `  ◈ sᴀʟᴅᴏ      $${(user.money).toLocaleString()}\n` +
            `  ↳ ǫᴜé ɢᴇɴᴇʀᴏsᴏ... ᴏ ʟᴇ ᴅᴇʙᴇs ᴀʟɢᴏ.`,
            [target]
        )
    }

    // ── #robar ────────────────────────────────────────────────────────────────
    if (cmd === 'robar' || cmd === 'rob') {
        const cooldown = 60 * 60 * 1000
        const diff     = Date.now() - (user.lastrob || 0)
        if (diff < cooldown) return send(conn, m,
            `⟨✦⟩ ʟᴀ ᴘᴏʟɪᴄíᴀ ᴀúɴ ᴛᴇ ʙᴜsᴄᴀ.\n  ◈ ᴇsᴘᴇʀᴀ *${msToTime(cooldown - diff)}*`
        )
        user.lastrob = Date.now()
        let target       = m.mentionedJid?.[0] || m.quoted?.sender
        let randomVictim = false
        if (!target && m.isGroup) { target = await getRandomParticipant([sender]); randomVictim = true }
        if (!target || target === sender) return send(conn, m, `⟨✦⟩ ɴᴇᴄᴇsɪᴛᴏ ᴀʟɢᴜɪᴇɴ ᴀ ǫᴜɪᴇɴ ʀᴏʙᴀʀ.`)

        const targetUser = getUser(target)
        const targetNum  = target.split('@')[0]
        const exito      = Math.random() > 0.45

        if (!exito || (targetUser.money || 0) <= 0) {
            const multa = Math.floor(Math.random() * 100) + 50
            user.money  = Math.max(0, (user.money || 0) - multa)
            return send(conn, m,
                `⟨✦⟩ ʀᴏʙᴏ ғᴀʟʟɪᴅᴏ\n` +
                `  ◈ @${targetNum} — ${rand(frasesRobo)}\n` +
                `  ◈ ᴍᴜʟᴛᴀ   $${multa}\n` +
                `  ↳ ᴘáᴛᴇᴛɪᴄᴏ. ᴇɴ sᴇʀɪᴏ.`,
                [target]
            )
        }

        let robado
        if (randomVictim) { robado = targetUser.money || 0; targetUser.money = 0 }
        else { robado = Math.floor(Math.random() * ((targetUser.money || 0) * 0.3)) + 50; targetUser.money = Math.max(0, (targetUser.money || 0) - robado) }
        user.money = (user.money || 0) + robado

        return send(conn, m,
            `⟨✦⟩ ʀᴏʙᴏ ᴇxɪᴛᴏsᴏ\n` +
            `  ◈ ᴠíᴄᴛɪᴍᴀ    @${targetNum}\n` +
            `  ◈ ʀᴏʙᴀsᴛᴇ   $${robado.toLocaleString()}\n` +
            (randomVictim ? `  ◈ ʟᴇ ʀᴏʙᴀsᴛᴇ ᴛᴏᴅᴏ... @${targetNum} sɪɴ ᴜɴ ᴘᴇsᴏ.\n` : '') +
            `  ◈ sᴀʟᴅᴏ      $${(user.money).toLocaleString()}`,
            [target]
        )
    }

    // ── #chiste ───────────────────────────────────────────────────────────────
    if (cmd === 'chiste' || cmd === 'joke') {
        const chistes = [
            '¿ᴘᴏʀ ǫᴜé @{} ɴᴜɴᴄᴀ ᴘɪᴇʀᴅᴇ ᴀʟ ᴀᴊᴇᴅʀᴇᴢ? ᴘᴏʀǫᴜᴇ ᴇs ᴜɴ ᴄᴀʙᴀʟʟᴏ ʏ ᴄᴏʀʀᴇ.',
            '¿sᴀʙᴇɴ ᴘᴏʀ ǫᴜé @{} ɴᴏ ᴘᴜᴇᴅᴇ ᴜsᴀʀ ɪɴᴛᴇʀɴᴇᴛ? ᴘᴏʀǫᴜᴇ ᴇʟ ᴄᴀᴘᴛᴄʜᴀ ʟᴏ ᴅᴇᴛᴇᴄᴛᴀ ᴄᴏᴍᴏ ʙᴏᴛ.',
            'ᴍᴇ ᴅɪᴊᴇʀᴏɴ ǫᴜᴇ @{} ʟᴇᴇ 50 ʟɪʙʀᴏs ᴀʟ ᴀñᴏ... ᴅᴇ ᴘásᴛᴀ ᴅᴇ ᴅɪᴇɴᴛᴇs.',
            'ᴅɪᴄᴇɴ ǫᴜᴇ @{} ᴇs ᴛᴀɴ ʟᴇɴᴛᴏ ǫᴜᴇ ɢᴏᴏɢʟᴇ ʟᴇ ᴍᴀɴᴅᴀ ʟᴏs ʀᴇsᴜʟᴛᴀᴅᴏs ᴘᴏʀ ᴄᴀʀᴛᴀ.',
            '¿ᴄóᴍᴏ sᴀʙᴇs ǫᴜᴇ @{} ᴇsᴛá ᴇɴ ᴅɪᴇᴛᴀ? ᴄᴏᴍᴇ ʀápɪᴅᴏ ᴘᴀʀᴀ ǫᴜᴇ ɴᴀᴅɪᴇ ʟᴏ ᴠᴇᴀ.',
            'ʟᴇ ᴘʀᴇɢᴜɴᴛᴇ ᴀ @{} ᴄᴜáɴᴛᴏ ᴇs 2+2 ʏ ᴍᴇ ᴅɪᴊᴏ: "ᴅᴇᴘᴇɴᴅᴇ ᴅᴇ ᴄóᴍᴏ ᴍᴇ sɪᴇɴᴛᴀ".'
        ]
        const target = m.mentionedJid?.[0] || m.quoted?.sender || await getRandomParticipant([sender])
        if (!target) return send(conn, m, `⟨✦⟩ ɴᴏ ʜᴀʏ ɴᴀᴅɪᴇ ᴀ ǫᴜɪᴇɴ ᴄᴏɴᴛᴀʀʟᴇ ᴇʟ ᴄʜɪsᴛᴇ.`)
        const num    = target.split('@')[0]
        return send(conn, m,
            `⟨✦⟩ ᴍᴀsʜᴀ ᴄᴜᴇɴᴛᴀ ᴜɴ ᴄʜɪsᴛᴇ\n\n  ${rand(chistes).replace('@{}', `@${num}`)}`,
            [target]
        )
    }

    // ── #donar ────────────────────────────────────────────────────────────────
    if (cmd === 'donar' || cmd === 'donate') {
        if (!isOwner) return send(conn, m, `⟨✦⟩ sᴏʟᴏ ᴇʟ ᴏᴡɴᴇʀ ᴘᴜᴇᴅᴇ ᴅᴏɴᴀʀ.`)
        const target   = m.mentionedJid?.[0] || m.quoted?.sender
        const cantidad = parseInt(args.find(a => !isNaN(a)))
        if (!target) return send(conn, m, `⟨✦⟩ ᴍᴇɴᴄɪᴏɴᴀ ᴀ ǫᴜɪᴇɴ ǫᴜɪᴇʀᴇs ᴅᴏɴᴀʀ.`)
        if (!cantidad || isNaN(cantidad) || cantidad <= 0) return send(conn, m, `⟨✦⟩ ᴜsᴏ: *#donar @usuario <cantidad>*`)
        const targetUser    = getUser(target)
        targetUser.money    = (targetUser.money || 0) + cantidad
        return send(conn, m,
            `⟨✦⟩ ᴅᴏɴᴀᴄɪóɴ\n` +
            `  ◈ ᴘᴀʀᴀ      @${target.split('@')[0]}\n` +
            `  ◈ ᴄᴀɴᴛɪᴅᴀᴅ  $${cantidad.toLocaleString()}\n` +
            `  ↳ ᴇʟ ᴏᴡɴᴇʀ ᴅᴏɴó ʏ ᴍᴀsʜᴀ ᴀᴘʀᴜᴇʙᴀ ♡`,
            [target]
        )
    }

    // ── #top ──────────────────────────────────────────────────────────────────
    if (cmd === 'top' || cmd === 'ranking') {
        const users  = database.data?.users || {}
        const sorted = Object.entries(users)
            .sort((a, b) => ((b[1].money || 0) + (b[1].bank || 0)) - ((a[1].money || 0) + (a[1].bank || 0)))
            .slice(0, 10)
        if (!sorted.length) return send(conn, m, `⟨✦⟩ ɴᴀᴅɪᴇ ᴇɴ ᴇʟ ʀᴀɴᴋɪɴɢ ᴀúɴ.`)
        const medals = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']
        const lista  = sorted.map(([jid, u], i) =>
            `  ${medals[i]} *${u.name || jid.split('@')[0]}* — $${((u.money || 0) + (u.bank || 0)).toLocaleString()}`
        ).join('\n')
        return send(conn, m, `⟨✦⟩ ᴛᴏᴘ ʀɪᴄᴏs\n${lista}\n  ↳ ¿ɴᴏ ᴇsᴛás? ᴀ ᴛʀᴀʙᴀᴊᴀʀ.`)
    }
}

handler.command = [
    'bal', 'balance', 'dinero',
    'chamba', 'trabajar', 'work',
    'daily', 'diario',
    'dep', 'depositar',
    'retirar', 'withdraw',
    'transferir', 'transfer', 'pagar',
    'robar', 'rob',
    'chiste', 'joke',
    'donar', 'donate',
    'top', 'ranking'
]
export default handler
