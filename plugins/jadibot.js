// plugins/jadibot.js — Masha Kujou MD
// ✦ Corregido + mejorado — compatible con handler.js, settings.js y database.js actuales

import fs   from 'fs'
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
import { smsg }     from '../lib/simple.js'
import { database } from '../lib/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const SUBBOT_DIR      = './SubBots'
const SUBBOT_LIMIT    = global.subbotlimit     || 20
const SUBBOT_LIMIT_PR = global.subbotlimitPrem || 5

if (!fs.existsSync(SUBBOT_DIR)) fs.mkdirSync(SUBBOT_DIR, { recursive: true })

// ── Helpers ───────────────────────────────────────────────────────────────────

const msToTime = ms => {
    const m = Math.floor((ms / (1000 * 60)) % 60)
    const s = Math.floor((ms / 1000) % 60)
    return `${m}m ${s}s`
}

// FIX #1: Usar global.getIconThumb() de settings.js en lugar de fetch manual
const getThumb = async () => {
    try { return await global.getIconThumb?.() || null } catch { return null }
}

// FIX #2: Usar global.getNewsletterCtx() de settings.js — consistente con handler.js
const send = async (conn, m, txt, mentions = []) => {
    const thumb = await getThumb()
    const ctx   = global.getNewsletterCtx?.(thumb) || {}
    try {
        await conn.sendMessage(
            m.chat,
            { text: txt, mentions, contextInfo: ctx },
            { quoted: m }
        )
    } catch { await m.reply(txt) }
}

// Helper para mensajes con el formato ⟨✦⟩
const msg = lines => lines.map(l => `⟨✦⟩ ${l}`).join('\n')

// Verificar si el socket de un sub-bot sigue vivo
const isAlive = c =>
    c?.user &&
    c?.ws?.socket?.readyState !== undefined &&
    c.ws.socket.readyState === (ws.WebSocket?.OPEN ?? ws.OPEN ?? 1)

// ── Conectar sub-bot ──────────────────────────────────────────────────────────
async function conectarSubBot({ botDir, m, conn, usarCode }) {
    const { state, saveCreds } = await useMultiFileAuthState(botDir)
    const { version }          = await fetchLatestBaileysVersion()

    // FIX #3: Recrear sock dentro de la función (no usar variable externa sin let/const)
    const sock = makeWASocket({
        version,
        logger:            pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser:                        usarCode ? Browsers.ubuntu('Chrome') : ['Masha Kujou', 'Chrome', '2.0.0'],
        generateHighQualityLinkPreview: true,
        getMessage:                     async () => ({ conversation: 'Masha Kujou.' })
    })

    // FIX #4: Bandera para evitar que onConnection se llame más de una vez con pairing code
    let pairingCodeSent = false

    const quitarDeConns = () => {
        if (!Array.isArray(global.conns)) return
        const i = global.conns.indexOf(sock)
        if (i >= 0) global.conns.splice(i, 1)
    }

    const onConnection = async (update) => {
        const { connection, lastDisconnect, qr } = update

        // ── QR ────────────────────────────────────────────────────────────────
        if (qr && !usarCode) {
            try {
                const imgBuf = await qrcode.toBuffer(qr, { scale: 8 })
                const sent   = await conn.sendMessage(m.chat, {
                    image:   imgBuf,
                    caption: msg([
                        'ᴄóᴅɪɢᴏ ǫʀ',
                        'ᴇsᴄᴀɴᴇᴀ ᴄᴏɴ ᴡʜᴀᴛsᴀᴘᴘ → ᴅɪsᴘᴏsɪᴛɪᴠᴏs ᴠɪɴᴄᴜʟᴀᴅᴏs',
                        'ᴇxᴘɪʀᴀ ᴇɴ *45 sᴇɢᴜɴᴅᴏs*'
                    ])
                }, { quoted: m })
                setTimeout(() => conn.sendMessage(m.chat, { delete: sent.key }).catch(() => {}), 45_000)
            } catch (e) {
                console.error('[SUBBOT QR ERROR]', e.message)
            }
        }

        // ── Pairing code ──────────────────────────────────────────────────────
        // FIX #5: Guardar bandera para no enviar el código múltiples veces
        if (qr && usarCode && !pairingCodeSent) {
            pairingCodeSent = true
            try {
                const num   = m.sender.split('@')[0].split(':')[0]
                const code  = await sock.requestPairingCode(num)
                const fmtd  = code?.match(/.{1,4}/g)?.join('-') ?? code

                await send(conn, m, msg([
                    'ᴄóᴅɪɢᴏ ᴅᴇ ᴠɪɴᴄᴜʟᴀᴄɪóɴ',
                    'ᴀᴊᴜsᴛᴇs → ᴅɪsᴘᴏsɪᴛɪᴠᴏs ᴠɪɴᴄᴜʟᴀᴅᴏs',
                    'ᴇxᴘɪʀᴀ ᴇɴ *45 sᴇɢᴜɴᴅᴏs*'
                ]))
                const sent = await conn.sendMessage(m.chat, { text: fmtd }, { quoted: m })
                setTimeout(() => conn.sendMessage(m.chat, { delete: sent.key }).catch(() => {}), 45_000)
            } catch (e) {
                console.error('[SUBBOT CODE ERROR]', e.message)
                await send(conn, m, msg([`ᴇʀʀᴏʀ ᴀʟ ɢᴇɴᴇʀᴀʀ ᴇʟ ᴄóᴅɪɢᴏ: ${e.message}`]))
            }
        }

        // ── Conectado ─────────────────────────────────────────────────────────
        if (connection === 'open') {
            sock.isInit = true
            if (!Array.isArray(global.conns)) global.conns = []
            // FIX #6: No duplicar si ya estaba en global.conns
            if (!global.conns.includes(sock)) global.conns.push(sock)

            // Aplicar nombre/foto si el usuario los tiene guardados
            const userData = database.data?.users?.[m.sender] || {}
            if (userData.subbotName) {
                try { await sock.updateProfileName(userData.subbotName) } catch {}
            }
            if (userData.subbotBanner) {
                try {
                    // FIX #7: Soportar tanto URL como base64
                    let buf
                    if (typeof userData.subbotBanner === 'string' && userData.subbotBanner.startsWith('data:')) {
                        buf = Buffer.from(userData.subbotBanner.split(',')[1], 'base64')
                    } else {
                        const res = await fetch(userData.subbotBanner)
                        buf = Buffer.from(await res.arrayBuffer())
                    }
                    await sock.updateProfilePicture(sock.user.id, buf)
                } catch {}
            }

            const nombre = sock.user?.name || 'Sub-Bot'
            console.log(chalk.magentaBright(`✦ [SUB-BOT] ${nombre} conectado ✓`))
            await send(conn, m, msg([
                'sᴜʙ-ʙᴏᴛ ᴄᴏɴᴇᴄᴛᴀᴅᴏ',
                `ɴᴏᴍʙʀᴇ: *${nombre}*`,
                'ʏᴀ ᴇʀᴇs ᴘᴀʀᴛᴇ ᴅᴇ ᴍᴀsʜᴀ ♡'
            ]), [m.sender])
        }

        // ── Desconectado ──────────────────────────────────────────────────────
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode
            const num  = path.basename(botDir)
            console.log(chalk.yellow(`✦ [SUB-BOT] +${num} desconectado. código: ${code}`))

            // FIX #8: Siempre quitar de conns al desconectarse
            sock.ev.removeAllListeners()
            quitarDeConns()

            // Reconexión automática en errores de red
            if ([408, 428, 500, 515].includes(code)) {
                console.log(chalk.cyan(`✦ [SUB-BOT] Reconectando +${num}...`))
                await conectarSubBot({ botDir, m, conn, usarCode })

            // Sesión inválida — limpiar archivos
            } else if ([401, 403, 405].includes(code)) {
                try { fs.rmSync(botDir, { recursive: true, force: true }) } catch {}
                await conn.sendMessage(m.sender, {
                    text: msg([
                        'sᴇsɪóɴ ᴄᴇʀʀᴀᴅᴀ.',
                        'ᴠᴜᴇʟᴠᴇ ᴀ ᴄᴏɴᴇᴄᴛᴀʀᴛᴇ ᴄᴏɴ *#jadibot*'
                    ])
                }).catch(() => {})
            }
            // Otros códigos: no reconectar (logout manual, etc.)
        }
    }

    sock.ev.on('connection.update', onConnection)
    sock.ev.on('creds.update', saveCreds)

    // FIX #9: Pasar global.plugins al sub-bot correctamente
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        const raw = messages[0]
        if (!raw?.message) return
        if (raw.key?.remoteJid === 'status@broadcast') return
        if (raw.key?.remoteJid?.endsWith('@newsletter')) return
        try {
            // FIX #10: smsg en jadibot.js NO es async — no usar await
            const m2             = smsg(sock, raw)
            const { handler }    = await import('../handler.js')
            await handler(m2, sock, global.plugins)
        } catch (e) {
            console.log(chalk.red('[SUBBOT MSG ERROR]'), e.message)
        }
    })

    // FIX #11: Watchdog — verificar cada 60s y limpiar si el socket murió silenciosamente
    const watchdog = setInterval(() => {
        if (isAlive(sock)) return
        clearInterval(watchdog)
        sock.ev.removeAllListeners()
        quitarDeConns()
        console.log(chalk.yellow(`✦ [WATCHDOG] Sub-bot +${path.basename(botDir)} limpiado.`))
    }, 60_000)

    return sock
}

// ── Handler principal ─────────────────────────────────────────────────────────
const handler = async (m, { conn, command, text, args, isOwner, isPremium }) => {
    const cmd    = command.toLowerCase()
    const sender = m.sender
    const num    = sender.split('@')[0].split(':')[0]

    // FIX #12: Usar database.getUser() para garantizar que el objeto existe
    const userData = database.getUser(sender)

    // ── #jadibot / #qr / #code ─────────────────────────────────────────────────
    if (['jadibot', 'subbot', 'qr', 'code'].includes(cmd)) {
        const cooldown = 2 * 60 * 1000
        const lastSub  = userData.lastSubBot || 0

        if (Date.now() - lastSub < cooldown) {
            return send(conn, m, msg([
                `ᴇsᴘᴇʀᴀ *${msToTime(cooldown - (Date.now() - lastSub))}* ᴀɴᴛᴇs ᴅᴇ ᴠᴏʟᴠᴇʀ ᴀ ᴄᴏɴᴇᴄᴛᴀʀ.`
            ]))
        }

        const activos = (global.conns || []).filter(isAlive)
        if (activos.length >= SUBBOT_LIMIT) {
            return send(conn, m, msg([
                `ʟíᴍɪᴛᴇ ᴀʟᴄᴀɴᴢᴀᴅᴏ: *${activos.length}/${SUBBOT_LIMIT}*`,
                'ᴇsᴘᴇʀᴀ ǫᴜᴇ ᴀʟɢᴜɪᴇɴ sᴇ ᴅᴇsᴄᴏɴᴇᴄᴛᴇ.'
            ]))
        }

        // Sub-bots activos del mismo usuario
        const misSubBots = activos.filter(c => {
            const cNum = c.user?.id?.split('@')[0]?.split(':')[0] || ''
            return cNum === num
        })
        const limite = isOwner ? Infinity : isPremium ? SUBBOT_LIMIT_PR : 1

        if (misSubBots.length >= limite) {
            return send(conn, m, msg([
                `ʏᴀ ᴛɪᴇɴᴇs *${misSubBots.length}/${limite === Infinity ? '∞' : limite}* sᴜʙ-ʙᴏᴛ(s).`,
                isPremium
                    ? 'ᴇs ᴛᴜ ʟíᴍɪᴛᴇ ᴘʀᴇᴍɪᴜᴍ.'
                    : 'ᴀᴅǫᴜɪᴇʀᴇ *premium* ᴘᴀʀᴀ ᴍás sᴜʙ-ʙᴏᴛs.'
            ]))
        }

        const botDir   = path.join(SUBBOT_DIR, num)
        const usarCode = cmd === 'code'
        if (!fs.existsSync(botDir)) fs.mkdirSync(botDir, { recursive: true })

        // FIX #13: Guardar cooldown correctamente
        userData.lastSubBot = Date.now()
        await database.save()

        await send(conn, m, msg([
            'ɪɴɪᴄɪᴀɴᴅᴏ ᴄᴏɴᴇxɪóɴ...',
            `ᴍéᴛᴏᴅᴏ: *${usarCode ? 'ᴄóᴅɪɢᴏ ᴅᴇ 8 ᴅíɢɪᴛᴏs' : 'ᴄóᴅɪɢᴏ ǫʀ'}*`,
            `ᴛɪᴘᴏ: *${isOwner ? 'owner ✦' : isPremium ? 'ᴘʀᴇᴍɪᴜᴍ ✦' : 'ɴᴏʀᴍᴀʟ'}*`
        ]))

        await conectarSubBot({ botDir, m, conn, usarCode })
        return
    }

    // ── #setname ──────────────────────────────────────────────────────────────
    if (cmd === 'setname') {
        if (!isPremium && !isOwner) {
            return send(conn, m, msg(['sᴏʟᴏ ᴜsᴜᴀʀɪᴏs *premium* ᴘᴜᴇᴅᴇɴ ᴄᴀᴍʙɪᴀʀ ᴇʟ ɴᴏᴍʙʀᴇ.']))
        }
        const nombre = (text || '').trim()
        if (!nombre) return send(conn, m, msg(['ᴜsᴏ: *#setname <nombre>*']))

        userData.subbotName = nombre

        // Aplicar a sub-bots activos del usuario
        const activos = (global.conns || []).filter(c =>
            c.user?.id?.split('@')[0]?.split(':')[0] === num && isAlive(c)
        )
        for (const c of activos) {
            try { await c.updateProfileName(nombre) } catch {}
        }

        await database.save()
        return send(conn, m, msg([`ɴᴏᴍʙʀᴇ ɢᴜᴀʀᴅᴀᴅᴏ: *${nombre}*`]))
    }

    // ── #setbanner / #setpp ───────────────────────────────────────────────────
    if (['setbanner', 'setpp'].includes(cmd)) {
        if (!isPremium && !isOwner) {
            return send(conn, m, msg(['sᴏʟᴏ ᴜsᴜᴀʀɪᴏs *premium* ᴘᴜᴇᴅᴇɴ ᴄᴀᴍʙɪᴀʀ ʟᴀ ғᴏᴛᴏ.']))
        }

        const quoted = m.quoted || m
        const mime   = quoted?.msg?.mimetype || ''

        if (!mime.startsWith('image')) {
            return send(conn, m, msg(['ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ *ɪᴍᴀɢᴇɴ* ᴘᴀʀᴀ ᴜsᴀʀʟᴀ ᴄᴏᴍᴏ ʙᴀɴɴᴇʀ.']))
        }

        try {
            const buf = await conn.downloadMediaMessage(quoted)

            // FIX #14: Guardar como base64 para persistencia — ya lo leemos bien en conectarSubBot
            userData.subbotBanner = `data:image/jpeg;base64,${buf.toString('base64')}`

            const activos = (global.conns || []).filter(c =>
                c.user?.id?.split('@')[0]?.split(':')[0] === num && isAlive(c)
            )
            for (const c of activos) {
                try { await c.updateProfilePicture(c.user.id, buf) } catch {}
            }

            await database.save()
            await m.react('✓')
            return send(conn, m, msg(['ʙᴀɴɴᴇʀ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴏ ᴄᴏʀʀᴇᴄᴛᴀᴍᴇɴᴛᴇ.']))
        } catch (e) {
            return send(conn, m, msg([`ᴇʀʀᴏʀ ᴀʟ ᴄᴀᴍʙɪᴀʀ ʟᴀ ғᴏᴛᴏ: ${e.message}`]))
        }
    }

    // ── #bots / #subbots ──────────────────────────────────────────────────────
    if (['bots', 'subbots'].includes(cmd)) {
        const activos = (global.conns || []).filter(isAlive)
        if (!activos.length) return send(conn, m, msg(['ɴᴏ ʜᴀʏ sᴜʙ-ʙᴏᴛs ᴄᴏɴᴇᴄᴛᴀᴅᴏs.']))

        const lista = activos
            .map((c, i) => `  ◈ ${i + 1}. *${c.user.name || 'sin nombre'}* — +${c.user.id?.split('@')[0]?.split(':')[0]}`)
            .join('\n')

        return send(conn, m, `⟨✦⟩ sᴜʙ-ʙᴏᴛs ᴀᴄᴛɪᴠᴏs: *${activos.length}/${SUBBOT_LIMIT}*\n${lista}`)
    }

    // ── #token ────────────────────────────────────────────────────────────────
    if (cmd === 'token') {
        const credsPath = path.join(SUBBOT_DIR, num, 'creds.json')
        if (!fs.existsSync(credsPath)) {
            return send(conn, m, msg([
                'ɴᴏ ᴛɪᴇɴᴇs sᴇsɪóɴ ᴀᴄᴛɪᴠᴀ.',
                'ᴜsᴀ *#jadibot* ᴘᴀʀᴀ ᴄᴏɴᴇᴄᴛᴀʀᴛᴇ.'
            ]))
        }
        const token = Buffer.from(fs.readFileSync(credsPath, 'utf-8')).toString('base64')
        await send(conn, m, msg(['ɴᴏ ᴄᴏᴍᴘᴀʀᴛᴀs ᴛᴜ ᴛᴏᴋᴇɴ ᴄᴏɴ ɴᴀᴅɪᴇ.']))
        await conn.sendMessage(m.chat, { text: token }, { quoted: m })
        return
    }

    // ── #deletesub / #delsub ──────────────────────────────────────────────────
    if (['deletesub', 'delsub'].includes(cmd)) {
        const botDir = path.join(SUBBOT_DIR, num)
        if (!fs.existsSync(botDir)) {
            return send(conn, m, msg(['ɴᴏ ᴛɪᴇɴᴇs sᴇsɪóɴ ᴀᴄᴛɪᴠᴀ.']))
        }

        // FIX #15: Desconectar el socket antes de borrar archivos
        const activos = (global.conns || []).filter(c =>
            c.user?.id?.split('@')[0]?.split(':')[0] === num && isAlive(c)
        )
        for (const c of activos) {
            try { c.ws.close() } catch {}
            c.ev.removeAllListeners()
            const i = global.conns.indexOf(c)
            if (i >= 0) global.conns.splice(i, 1)
        }

        try {
            fs.rmSync(botDir, { recursive: true, force: true })
            await m.react('🗑️')
            return send(conn, m, msg(['sᴇsɪóɴ ᴇʟɪᴍɪɴᴀᴅᴀ ᴄᴏʀʀᴇᴄᴛᴀᴍᴇɴᴛᴇ.']))
        } catch (e) {
            return send(conn, m, msg([`ᴇʀʀᴏʀ ᴀʟ ʙᴏʀʀᴀʀ: ${e.message}`]))
        }
    }

    // ── #pausesub / #stopsub ──────────────────────────────────────────────────
    if (['pausesub', 'stopsub'].includes(cmd)) {
        // FIX #16: Comparar correctamente el JID del bot principal
        const mainJid = global.conn?.user?.id?.split(':')[0] + '@s.whatsapp.net'
        const connJid = conn.user?.id?.split(':')[0] + '@s.whatsapp.net'
        if (mainJid === connJid) {
            return send(conn, m, msg(['ɴᴏ ᴘᴜᴇᴅᴇs ᴘᴀᴜsᴀʀ ᴇʟ ʙᴏᴛ ᴘʀɪɴᴄɪᴘᴀʟ.']))
        }
        await send(conn, m, msg([`*${conn.user?.name || 'Sub-Bot'}* ᴘᴀᴜsᴀᴅᴏ. ʜᴀsᴛᴀ ʟᴜᴇɢᴏ.`]))
        try { conn.ws.close() } catch {}
        return
    }

    // ── #setprimary / #setbot ─────────────────────────────────────────────────
    if (['setprimary', 'setbot'].includes(cmd)) {
        if (!m.isGroup) return send(conn, m, msg(['sᴏʟᴏ ғᴜɴᴄɪᴏɴᴀ ᴇɴ ɢʀᴜᴘᴏs.']))

        const target =
            m.mentionedJid?.[0] ||
            m.quoted?.sender ||
            (text ? text.replace(/\D/g, '') + '@s.whatsapp.net' : null)

        if (!target) return send(conn, m, msg(['ᴍᴇɴᴄɪᴏɴᴀ ᴏ ʀᴇsᴘᴏɴᴅᴇ ᴀʟ ʙᴏᴛ ǫᴜᴇ ǫᴜɪᴇʀᴇs ᴄᴏᴍᴏ ᴘʀɪᴍᴀʀɪᴏ.']))

        if (!database.data.groups)           database.data.groups = {}
        if (!database.data.groups[m.chat])   database.data.groups[m.chat] = {}

        const targetNum = target.split('@')[0].split(':')[0]
        const current   = database.data.groups[m.chat].primaryBot?.split('@')[0]?.split(':')[0]

        if (current === targetNum) {
            return send(conn, m, msg([`@${targetNum} ʏᴀ ᴇs ᴇʟ ʙᴏᴛ ᴘʀɪᴍᴀʀɪᴏ.`]), [target])
        }

        database.data.groups[m.chat].primaryBot = targetNum + '@s.whatsapp.net'
        await database.save()

        return send(conn, m, msg([
            `ʙᴏᴛ ᴘʀɪᴍᴀʀɪᴏ: *@${targetNum}*`,
            'ᴜsᴀ *resetbot* ᴘᴀʀᴀ ʀᴇᴠᴇʀᴛɪʀ.'
        ]), [target])
    }
}

// ── handler.before — resetbot sin prefijo ─────────────────────────────────────
handler.before = async (m, { conn }) => {
    if (!m.isGroup) return
    const body = (m.body || '').trim().toLowerCase()
    if (!['resetbot', 'resetprimario'].includes(body)) return

    if (!database.data.groups)         database.data.groups = {}
    if (!database.data.groups[m.chat]) return

    database.data.groups[m.chat].primaryBot = null
    await database.save()

    const thumb = await getThumb()
    const ctx   = global.getNewsletterCtx?.(thumb) || {}

    try {
        await conn.sendMessage(m.chat, {
            text: msg(['ʙᴏᴛ ᴘʀɪᴍᴀʀɪᴏ ᴇʟɪᴍɪɴᴀᴅᴏ.', 'ᴛᴏᴅᴏs ʟᴏs ʙᴏᴛs ʀᴇsᴘᴏɴᴅᴇɴ ɴᴜᴇᴠᴀᴍᴇɴᴛᴇ.']),
            contextInfo: ctx
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
