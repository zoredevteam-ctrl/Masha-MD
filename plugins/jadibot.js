// plugins/jadibot.js — Masha Kujou MD
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import chalk from 'chalk'
import qrcode from 'qrcode'
import * as ws from 'ws'
import { fileURLToPath } from 'url'
import {
    makeWASocket,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    Browsers
} from '@whiskeysockets/baileys'
import { smsg } from '../lib/simple.js'
import { database } from '../lib/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const SUBBOT_DIR      = './SubBots'
const SUBBOT_LIMIT    = global.subbotlimit    || 20
const SUBBOT_LIMIT_PR = global.subbotlimitPrem || 5  // sub-bots por usuario premium

if (!fs.existsSync(SUBBOT_DIR)) fs.mkdirSync(SUBBOT_DIR, { recursive: true })

const msToTime = ms => {
    const m = Math.floor((ms / (1000 * 60)) % 60)
    const s = Math.floor((ms / 1000) % 60)
    return `${m}m ${s}s`
}

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

// ── Conectar sub-bot ──────────────────────────────────────────────────────────
async function conectarSubBot({ botDir, m, conn, usarCode }) {
    const { state, saveCreds } = await useMultiFileAuthState(botDir)
    const { version }          = await fetchLatestBaileysVersion()

    let sock = makeWASocket({
        version,
        logger:            pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser:                        usarCode ? Browsers.ubuntu('Chrome') : ['Masha Kujou Sub-Bot', 'Chrome', '2.0.0'],
        generateHighQualityLinkPreview: true,
        getMessage:                     async () => ({ conversation: 'Masha Kujou.' })
    })

    const onConnection = async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr && !usarCode) {
            const imgBuf = await qrcode.toBuffer(qr, { scale: 8 })
            const sent   = await conn.sendMessage(m.chat, {
                image:   imgBuf,
                caption:
                    `⟨✦⟩ ᴄóᴅɪɢᴏ ǫʀ\n` +
                    `  ◈ ᴇsᴄᴀɴᴇᴀ ᴘᴀʀᴀ ᴄᴏɴᴇᴄᴛᴀʀᴛᴇ\n` +
                    `  ◈ ᴀᴊᴜsᴛᴇs → ᴅɪsᴘᴏsɪᴛɪᴠᴏs ᴠɪɴᴄᴜʟᴀᴅᴏs\n` +
                    `  ◈ ᴇxᴘɪʀᴀ ᴇɴ *45 sᴇɢᴜɴᴅᴏs*`
            }, { quoted: m })
            setTimeout(() => conn.sendMessage(m.chat, { delete: sent.key }).catch(() => {}), 45000)
        }

        if (qr && usarCode) {
            try {
                const code      = await sock.requestPairingCode(m.sender.split('@')[0])
                const formatted = code?.match(/.{1,4}/g)?.join('-') || code
                await send(conn, m,
                    `⟨✦⟩ ᴄóᴅɪɢᴏ ᴅᴇ ᴠɪɴᴄᴜʟᴀᴄɪóɴ\n` +
                    `  ◈ ᴀᴊᴜsᴛᴇs → ᴅɪsᴘᴏsɪᴛɪᴠᴏs ᴠɪɴᴄᴜʟᴀᴅᴏs\n` +
                    `  ◈ ᴇxᴘɪʀᴀ ᴇɴ *45 sᴇɢᴜɴᴅᴏs*`
                )
                const sent = await conn.sendMessage(m.chat, { text: formatted }, { quoted: m })
                setTimeout(() => conn.sendMessage(m.chat, { delete: sent.key }).catch(() => {}), 45000)
            } catch (e) {
                console.error('[SUBBOT CODE ERROR]', e.message)
            }
        }

        if (connection === 'open') {
            sock.isInit = true
            if (!Array.isArray(global.conns)) global.conns = []
            global.conns.push(sock)

            // Aplicar nombre y banner si el usuario premium los tiene configurados
            const userData = database.data?.users?.[m.sender] || {}
            if (userData.subbotName) {
                try { await sock.updateProfileName(userData.subbotName) } catch {}
            }
            if (userData.subbotBanner) {
                try {
                    const res = await fetch(userData.subbotBanner)
                    const buf = Buffer.from(await res.arrayBuffer())
                    await sock.updateProfilePicture(sock.user.id, buf)
                } catch {}
            }

            const nombre = sock.user?.name || 'Sub-Bot'
            console.log(chalk.magentaBright(`✦ [SUB-BOT] ${nombre} conectado ✓`))
            await send(conn, m,
                `⟨✦⟩ sᴜʙ-ʙᴏᴛ ᴄᴏɴᴇᴄᴛᴀᴅᴏ\n` +
                `  ◈ ɴᴏᴍʙʀᴇ   *${nombre}*\n` +
                `  ◈ ʏᴀ ᴇʀᴇs ᴘᴀʀᴛᴇ ᴅᴇ ᴍᴀsʜᴀ ♡`,
                [m.sender]
            )
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode
            console.log(chalk.yellow(`✦ [SUB-BOT] +${path.basename(botDir)} desconectado. código: ${code}`))

            const quitarDeConns = () => {
                if (!Array.isArray(global.conns)) return
                const i = global.conns.indexOf(sock)
                if (i >= 0) global.conns.splice(i, 1)
            }

            if ([428, 408, 500, 515].includes(code)) {
                sock.ev.removeAllListeners()
                quitarDeConns()
                await conectarSubBot({ botDir, m, conn, usarCode })
            } else if ([401, 405, 403].includes(code)) {
                sock.ev.removeAllListeners()
                quitarDeConns()
                try { fs.rmSync(botDir, { recursive: true, force: true }) } catch {}
                await conn.sendMessage(m.sender, {
                    text: `⟨✦⟩ sᴇsɪóɴ ᴄᴇʀʀᴀᴅᴀ.\n  ◈ ᴠᴜᴇʟᴠᴇ ᴀ ᴄᴏɴᴇᴄᴛᴀʀᴛᴇ ᴄᴏɴ *#jadibot*`
                }).catch(() => {})
            } else {
                quitarDeConns()
            }
        }
    }

    sock.ev.on('connection.update', onConnection)
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        const raw = messages[0]
        if (!raw?.message) return
        if (raw.key?.remoteJid === 'status@broadcast') return
        if (raw.key?.remoteJid?.endsWith('@newsletter')) return
        try {
            const m2 = smsg(sock, raw)
            const { handler: mainHandler } = await import('../handler.js')
            await mainHandler(m2, sock, global.plugins)
        } catch {}
    })

    setInterval(() => {
        if (!sock.user) {
            try { sock.ws.close() } catch {}
            sock.ev.removeAllListeners()
            if (Array.isArray(global.conns)) {
                const i = global.conns.indexOf(sock)
                if (i >= 0) global.conns.splice(i, 1)
            }
        }
    }, 60000)
}

// ── Handler ───────────────────────────────────────────────────────────────────
let handler = async (m, { conn, command, text, args, isOwner, isPremium }) => {
    const cmd      = command.toLowerCase()
    const sender   = m.sender
    const num      = sender.split('@')[0]
    const userData = database.data?.users?.[sender] || {}

    // ── #jadibot / #qr / #code ────────────────────────────────────────────────
    if (['jadibot', 'subbot', 'qr', 'code'].includes(cmd)) {
        const lastSub  = userData.lastSubBot || 0
        const cooldown = 2 * 60 * 1000
        if (Date.now() - lastSub < cooldown) return send(conn, m,
            `⟨✦⟩ ᴇsᴘᴇʀᴀ *${msToTime(cooldown - (Date.now() - lastSub))}* ᴀɴᴛᴇs ᴅᴇ ᴠᴏʟᴠᴇʀ ᴀ ᴄᴏɴᴇᴄᴛᴀʀ.`
        )

        const activos = (global.conns || []).filter(c => c.user && c.ws?.socket?.readyState !== ws.CLOSED)
        if (activos.length >= SUBBOT_LIMIT) return send(conn, m,
            `⟨✦⟩ ʟíᴍɪᴛᴇ ᴀʟᴄᴀɴᴢᴀᴅᴏ: *${activos.length}/${SUBBOT_LIMIT}*\n  ◈ ᴇsᴘᴇʀᴀ ǫᴜᴇ ᴀʟɢᴜɪᴇɴ sᴇ ᴅᴇsᴄᴏɴᴇᴄᴛᴇ.`
        )

        // Sub-bots del usuario
        const misSubBots = activos.filter(c => {
            const subDir = path.join(SUBBOT_DIR, c.user?.id?.split('@')[0]?.split(':')[0] || '')
            return subDir.includes(num)
        })
        const limite = isPremium ? SUBBOT_LIMIT_PR : 1
        if (misSubBots.length >= limite && !isOwner) return send(conn, m,
            `⟨✦⟩ ʏᴀ ᴛɪᴇɴᴇs *${misSubBots.length}/${limite}* sᴜʙ-ʙᴏᴛ${isPremium ? '' : 's'}.\n` +
            `  ◈ ${isPremium ? 'ᴇs ᴛᴜ ʟíᴍɪᴛᴇ ᴘʀᴇᴍɪᴜᴍ.' : 'ᴀᴅǫᴜɪᴇʀᴇ *premium* ᴘᴀʀᴀ ᴍás sᴜʙ-ʙᴏᴛs.'}`
        )

        const botDir   = path.join(SUBBOT_DIR, num)
        const usarCode = cmd === 'code'
        if (!fs.existsSync(botDir)) fs.mkdirSync(botDir, { recursive: true })
        if (!database.data.users[sender]) database.data.users[sender] = {}
        database.data.users[sender].lastSubBot = Date.now()

        await send(conn, m,
            `⟨✦⟩ ɪɴɪᴄɪᴀɴᴅᴏ ᴄᴏɴᴇxɪóɴ...\n` +
            `  ◈ ᴍéᴛᴏᴅᴏ: *${usarCode ? 'ᴄóᴅɪɢᴏ ᴅᴇ 8 ᴅíɢɪᴛᴏs' : 'ᴄóᴅɪɢᴏ ǫʀ'}*\n` +
            `  ◈ ᴛɪᴘᴏ: *${isPremium ? 'ᴘʀᴇᴍɪᴜᴍ ✦' : 'ɴᴏʀᴍᴀʟ'}*`
        )
        await conectarSubBot({ botDir, m, conn, usarCode })
    }

    // ── #setname — cambiar nombre del sub-bot (premium) ───────────────────────
    if (cmd === 'setname') {
        if (!isPremium && !isOwner) return send(conn, m,
            `⟨✦⟩ sᴏʟᴏ ᴜsᴜᴀʀɪᴏs *premium* ᴘᴜᴇᴅᴇɴ ᴄᴀᴍʙɪᴀʀ ᴇʟ ɴᴏᴍʙʀᴇ.`
        )
        const nombre = (text || '').trim()
        if (!nombre) return send(conn, m, `⟨✦⟩ ᴜsᴏ: *#setname <nombre>*`)
        if (!database.data.users[sender]) database.data.users[sender] = {}
        database.data.users[sender].subbotName = nombre
        // Aplicar a sub-bot activo si existe
        const activos = (global.conns || []).filter(c => c.user?.id?.split('@')[0]?.split(':')[0] === num)
        for (const c of activos) {
            try { await c.updateProfileName(nombre) } catch {}
        }
        return send(conn, m, `⟨✦⟩ ɴᴏᴍʙʀᴇ ɢᴜᴀʀᴅᴀᴅᴏ: *${nombre}*`)
    }

    // ── #setbanner — cambiar foto del sub-bot (premium) ───────────────────────
    if (cmd === 'setbanner' || cmd === 'setpp') {
        if (!isPremium && !isOwner) return send(conn, m,
            `⟨✦⟩ sᴏʟᴏ ᴜsᴜᴀʀɪᴏs *premium* ᴘᴜᴇᴅᴇɴ ᴄᴀᴍʙɪᴀʀ ʟᴀ ғᴏᴛᴏ.`
        )
        const quoted = m.quoted || m
        const mime   = quoted?.msg?.mimetype || ''
        if (!mime.startsWith('image')) return send(conn, m,
            `⟨✦⟩ ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ *ɪᴍᴀɢᴇɴ* ᴘᴀʀᴀ ᴜsᴀʀʟᴀ ᴄᴏᴍᴏ ʙᴀɴɴᴇʀ.`
        )
        try {
            const buf = await conn.downloadMediaMessage(quoted)
            if (!database.data.users[sender]) database.data.users[sender] = {}
            database.data.users[sender].subbotBanner = `data:image/jpeg;base64,${buf.toString('base64')}`
            // Aplicar a sub-bot activo
            const activos = (global.conns || []).filter(c => c.user?.id?.split('@')[0]?.split(':')[0] === num)
            for (const c of activos) {
                try { await c.updateProfilePicture(c.user.id, buf) } catch {}
            }
            await m.react('✓')
            return send(conn, m, `⟨✦⟩ ʙᴀɴɴᴇʀ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴏ ᴄᴏʀʀᴇᴄᴛᴀᴍᴇɴᴛᴇ.`)
        } catch (e) {
            return send(conn, m, `⟨✦⟩ ᴇʀʀᴏʀ ᴀʟ ᴄᴀᴍʙɪᴀʀ ʟᴀ ғᴏᴛᴏ: ${e.message}`)
        }
    }

    // ── #bots ─────────────────────────────────────────────────────────────────
    if (cmd === 'bots' || cmd === 'subbots') {
        const activos = (global.conns || []).filter(c => c.user && c.ws?.socket?.readyState !== ws.CLOSED)
        if (!activos.length) return send(conn, m, `⟨✦⟩ ɴᴏ ʜᴀʏ sᴜʙ-ʙᴏᴛs ᴄᴏɴᴇᴄᴛᴀᴅᴏs.`)
        const lista = activos.map((c, i) =>
            `  ◈ ${i + 1}. *${c.user.name || 'sin nombre'}* — +${c.user.id?.split('@')[0]}`
        ).join('\n')
        return send(conn, m, `⟨✦⟩ sᴜʙ-ʙᴏᴛs ᴀᴄᴛɪᴠᴏs: *${activos.length}*\n${lista}`)
    }

    // ── #token ────────────────────────────────────────────────────────────────
    if (cmd === 'token') {
        const credsPath = path.join(SUBBOT_DIR, num, 'creds.json')
        if (!fs.existsSync(credsPath)) return send(conn, m,
            `⟨✦⟩ ɴᴏ ᴛɪᴇɴᴇs sᴇsɪóɴ ᴀᴄᴛɪᴠᴀ.\n  ◈ ᴜsᴀ *#jadibot* ᴘᴀʀᴀ ᴄᴏɴᴇᴄᴛᴀʀᴛᴇ.`
        )
        const token = Buffer.from(fs.readFileSync(credsPath, 'utf-8')).toString('base64')
        await send(conn, m, `⟨✦⟩ ɴᴏ ᴄᴏᴍᴘᴀʀᴛᴀs ᴛᴜ ᴛᴏᴋᴇɴ ᴄᴏɴ ɴᴀᴅɪᴇ.`)
        await conn.sendMessage(m.chat, { text: token }, { quoted: m })
    }

    // ── #deletesub ────────────────────────────────────────────────────────────
    if (cmd === 'deletesub' || cmd === 'delsub') {
        const botDir = path.join(SUBBOT_DIR, num)
        if (!fs.existsSync(botDir)) return send(conn, m, `⟨✦⟩ ɴᴏ ᴛɪᴇɴᴇs sᴇsɪóɴ ᴀᴄᴛɪᴠᴀ.`)
        try {
            fs.rmSync(botDir, { recursive: true, force: true })
            await m.react('🗑️')
            return send(conn, m, `⟨✦⟩ sᴇsɪóɴ ᴇʟɪᴍɪɴᴀᴅᴀ ᴄᴏʀʀᴇᴄᴛᴀᴍᴇɴᴛᴇ.`)
        } catch (e) {
            return send(conn, m, `⟨✦⟩ ᴇʀʀᴏʀ: ${e.message}`)
        }
    }

    // ── #pausesub ─────────────────────────────────────────────────────────────
    if (cmd === 'pausesub' || cmd === 'stopsub') {
        if (global.conn?.user?.jid === conn.user?.jid) return send(conn, m,
            `⟨✦⟩ ɴᴏ ᴘᴜᴇᴅᴇs ᴘᴀᴜsᴀʀ ᴇʟ ʙᴏᴛ ᴘʀɪɴᴄɪᴘᴀʟ.`
        )
        await send(conn, m, `⟨✦⟩ *${conn.user?.name || 'Sub-Bot'}* ᴘᴀᴜsᴀᴅᴏ. ʜᴀsᴛᴀ ʟᴜᴇɢᴏ.`)
        try { conn.ws.close() } catch {}
    }

    // ── #setprimary ───────────────────────────────────────────────────────────
    if (cmd === 'setprimary' || cmd === 'setbot') {
        if (!m.isGroup) return send(conn, m, `⟨✦⟩ sᴏʟᴏ ғᴜɴᴄɪᴏɴᴀ ᴇɴ ɢʀᴜᴘᴏs.`)
        const target = m.mentionedJid?.[0] || m.quoted?.sender
            || (text ? text.replace(/\D/g, '') + '@s.whatsapp.net' : null)
        if (!target) return send(conn, m, `⟨✦⟩ ᴍᴇɴᴄɪᴏɴᴀ ᴇʟ ʙᴏᴛ ǫᴜᴇ ǫᴜɪᴇʀᴇs ᴄᴏᴍᴏ ᴘʀɪᴍᴀʀɪᴏ.`)
        if (!database.data.groups) database.data.groups = {}
        if (!database.data.groups[m.chat]) database.data.groups[m.chat] = {}
        const targetNum = target.split('@')[0]
        if (database.data.groups[m.chat].primaryBot?.split('@')[0] === targetNum) return send(conn, m,
            `⟨✦⟩ @${targetNum} ʏᴀ ᴇs ᴇʟ ʙᴏᴛ ᴘʀɪᴍᴀʀɪᴏ.`, [target]
        )
        database.data.groups[m.chat].primaryBot = target
        return send(conn, m,
            `⟨✦⟩ ʙᴏᴛ ᴘʀɪᴍᴀʀɪᴏ: *@${targetNum}*\n  ◈ ᴜsᴀ *resetbot* ᴘᴀʀᴀ ʀᴇᴠᴇʀᴛɪʀ.`,
            [target]
        )
    }
}

// ── resetbot sin prefijo ──────────────────────────────────────────────────────
handler.before = async (m, { conn }) => {
    if (!m.isGroup) return
    const body = (m.body || '').trim().toLowerCase()
    if (!['resetbot', 'resetprimario'].includes(body)) return
    if (!database.data.groups) database.data.groups = {}
    if (!database.data.groups[m.chat]) return
    database.data.groups[m.chat].primaryBot = null
    const thumb = await getThumb()
    try {
        await conn.sendMessage(m.chat, {
            text: `⟨✦⟩ ʙᴏᴛ ᴘʀɪᴍᴀʀɪᴏ ᴇʟɪᴍɪɴᴀᴅᴏ. ᴛᴏᴅᴏs ʟᴏs ʙᴏᴛs ʀᴇsᴘᴏɴᴅᴇɴ ɴᴜᴇᴠᴀᴍᴇɴᴛᴇ.`,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid: global.newsletterJid, serverMessageId: -1, newsletterName: global.newsletterName },
                externalAdReply: { title: global.botName || 'Masha Kujou', body: global.newsletterName || '', mediaType: 1, thumbnail: thumb, renderLargerThumbnail: false, sourceUrl: global.rcanal || '' }
            }
        }, { quoted: m })
    } catch {}
    return true
}

handler.command = [
    'jadibot', 'subbot', 'qr', 'code',
    'setname', 'setbanner', 'setpp',
    'bots', 'subbots',
    'token', 'deletesub', 'delsub',
    'pausesub', 'stopsub',
    'setprimary', 'setbot'
]
handler.tags = ['serbot']
export default handler
