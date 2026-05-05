import './settings.js'
import chalk from 'chalk'
import printLog from './lib/print.js'
import { smsg } from './lib/simple.js'
import { database } from './lib/database.js'
import { readdirSync } from 'fs'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'

const toNum         = v => (v + '').replace(/[^0-9]/g, '')
const localPart     = v => (v + '').split('@')[0].split(':')[0].split('/')[0].split(',')[0]
const normalizeCore = v => toNum(localPart(v))

const normalizeJid = v => {
    if (!v) return ''
    if (typeof v === 'number') v = String(v)
    v = (v + '').trim()
    if (v.startsWith('@')) v = v.slice(1)
    if (v.endsWith('@g.us')) return v
    if (v.includes('@s.whatsapp.net')) {
        const n = toNum(v.split('@')[0])
        return n ? n + '@s.whatsapp.net' : v
    }
    const n = toNum(v)
    return n ? n + '@s.whatsapp.net' : v
}

function pickOwners() {
    const arr  = Array.isArray(global.owner) ? global.owner : []
    const flat = []
    for (const v of arr) {
        if (Array.isArray(v)) flat.push({ num: normalizeCore(v[0]), root: !!v[2] })
        else flat.push({ num: normalizeCore(v), root: false })
    }
    return flat
}

const isOwnerJid     = jid => pickOwners().some(o => o.num === normalizeCore(jid))
const isRootOwnerJid = jid => pickOwners().some(o => o.num === normalizeCore(jid) && o.root)
const isPremiumJid   = jid => {
    const num   = normalizeCore(jid)
    const prems = Array.isArray(global.prems) ? global.prems.map(normalizeCore) : []
    if (prems.includes(num)) return true
    const u = database.data?.users?.[normalizeJid(jid)]
    return !!u?.premium
}

const PREFIXES = ['#', '.', '/', '$']
const getPrefix = body => PREFIXES.find(p => body.startsWith(p)) || null

const similarity = (a, b) => {
    let matches = 0
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) matches++
    return Math.floor((matches / Math.max(a.length, b.length)) * 100)
}

// ── Reply estilo Masha ────────────────────────────────────────────────────────
const mashaReply = async (conn, m, txt) => {
    try {
        const thumb = await global.getIconThumb?.() || null
        const ctx   = global.getNewsletterCtx?.(thumb) || {}
        await conn.sendMessage(m.chat, { text: txt, contextInfo: ctx }, { quoted: m })
    } catch {
        try { await m.reply(txt) } catch {}
    }
}

const msg = (lines) =>
    lines.map(l => `⟨✦⟩ ${l}`).join('\n')

// ── Events ────────────────────────────────────────────────────────────────────
const eventsLoadedFor = new WeakSet()

export const loadEvents = async (conn) => {
    if (!conn?.ev?.on) return
    if (eventsLoadedFor.has(conn)) return
    eventsLoadedFor.add(conn)

    const eventsPath = resolve('./events')
    let files = []
    try {
        files = readdirSync(eventsPath).filter(f => f.endsWith('.js'))
    } catch {
        console.log(chalk.yellow('✦ [EVENTS] Carpeta ./events no encontrada.'))
        return
    }

    for (const file of files) {
        try {
            const url = pathToFileURL(join(eventsPath, file)).href
            const mod = await import(url)
            if (!mod.event || !mod.run) continue
            conn.ev.on(mod.event, data => {
                const id = data?.id || data?.key?.remoteJid || null
                if (mod.enabled && id && !mod.enabled(id)) return
                mod.run(conn, data)
            })
            console.log(chalk.hex('#BB8FCE')(`✦ [EVENTS] ${file} → ${mod.event}`))
        } catch (e) {
            console.log(chalk.red(`[EVENTS ERROR] ${file}:`), e.message)
        }
    }
}

export const handler = async (m, conn, plugins) => {
    try {
        if (!m) return
        await loadEvents(conn)
        m = await smsg(conn, m)

        if (global.botOff && !m.fromMe) {
            const sc = (m.sender || '').replace(/:[0-9A-Za-z]+(?=@s\.whatsapp\.net)/, '')
            if (!isOwnerJid(sc)) return
        }

        // ── Primary Bot ───────────────────────────────────────────────────────
        if (m.isGroup) {
            const groupData  = database.data?.groups?.[m.chat]
            const primaryBot = groupData?.primaryBot
            if (primaryBot) {
                const botJid     = (conn.user?.id || '').split(':')[0] + '@s.whatsapp.net'
                const esPrimario = primaryBot.split('@')[0] === botJid.split('@')[0]
                if (!esPrimario) {
                    const body = (m.body || '').trim().toLowerCase()
                    const ok   = ['#setprimary', '#setbot', '.setprimary', '.setbot', 'resetbot', 'resetprimario']
                    if (!ok.some(c => body.startsWith(c))) return
                }
            }
        }

        if (m.isGroup) {
            const muted = database.data?.groups?.[m.chat]?.muted || []
            if (muted.includes(m.sender)) {
                try { await conn.sendMessage(m.chat, { delete: m.key }) } catch {}
                return
            }
        }

        if (!m.body) return

        const prefix = getPrefix(m.body)
        if (m.body && !m.fromMe) {
            printLog(!!prefix, m.sender, m.isGroup ? m.chat : null, m.body, m.pushName)
        }

        if (m.isGroup) {
            const bodyCheck   = (m.body || '').trim()
            const tienePrefix = PREFIXES.some(p => bodyCheck.startsWith(p))
            if (!tienePrefix) {
                for (const [, plugin] of plugins) {
                    if (typeof plugin?.before === 'function') {
                        try {
                            const senderB  = (m.sender || '').replace(/:[0-9A-Za-z]+(?=@s\.whatsapp\.net)/, '')
                            const isOwnerB = isOwnerJid(senderB)
                            let isAdminB   = isOwnerB
                            if (!isAdminB) {
                                try {
                                    const gMeta = await conn.groupMetadata(m.chat)
                                    isAdminB = gMeta.participants.some(p =>
                                        normalizeCore(p.id || p.jid) === normalizeCore(senderB) &&
                                        (p.admin || p.isAdmin || p.isSuperAdmin)
                                    )
                                } catch {}
                            }
                            const stop = await plugin.before(m, { conn, isAdmin: isAdminB, isOwner: isOwnerB })
                            if (stop === true) return
                        } catch (e) {
                            console.log(chalk.red('[BEFORE ERROR]'), e.message)
                        }
                    }
                }
            }
        }

        if (!prefix) return

        const body        = m.body.slice(prefix.length).trim()
        const args        = body.split(/ +/).filter(Boolean)
        const commandName = args.shift()?.toLowerCase()
        if (!commandName) return

        let senderJid         = m.sender || ''
        const senderCanonical = senderJid.replace(/:[0-9A-Za-z]+(?=@s\.whatsapp\.net)/, '')
        if (senderCanonical !== senderJid) { m.realSender = senderJid; senderJid = senderCanonical }

        if (senderJid.endsWith('@lid') && m.isGroup) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                const rawNum    = normalizeCore(senderJid)
                const found     = groupMeta.participants.find(p => normalizeCore(p.id || p.jid) === rawNum)
                if (found && (found.jid || found.id)?.endsWith('@s.whatsapp.net')) {
                    senderJid = (found.jid || found.id).includes(':')
                        ? (found.jid || found.id).split(':')[0] + '@s.whatsapp.net'
                        : (found.jid || found.id)
                    m.sender = senderJid
                }
            } catch {}
        }

        const isROwner = isRootOwnerJid(senderJid)
        const isOwner  = isROwner || isOwnerJid(senderJid)

        let cmd = null
        if (prefix === '$') {
            for (const [, plugin] of plugins) {
                if (plugin.customPrefix?.includes?.('$')) { cmd = plugin; args.unshift(commandName); break }
            }
        } else {
            for (const [, plugin] of plugins) {
                if (!plugin.command) continue
                const cmds = Array.isArray(plugin.command) ? plugin.command
                    : plugin.command instanceof RegExp ? [] : [plugin.command]
                if (cmds.map(c => c.toLowerCase()).includes(commandName)) { cmd = plugin; break }
            }
        }

        if (!cmd) {
            const allCmds = []
            for (const [, plugin] of plugins) {
                if (!plugin.command) continue
                const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
                for (const c of cmds) if (typeof c === 'string') allCmds.push(c.toLowerCase())
            }
            const similares = allCmds
                .map(c => ({ cmd: c, score: similarity(commandName, c) }))
                .filter(o => o.score >= 45)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)

            let txt = msg([
                `*${prefix + commandName}* no existe.`,
                `usa *${prefix}menu* para ver los comandos disponibles.`
            ])
            if (similares.length) {
                txt += `\n\n` + similares.map(s => `⟨✦⟩ ¿quisiste decir \`${prefix + s.cmd}\`? — ${s.score}%`).join('\n')
            }
            return mashaReply(conn, m, txt)
        }

        const isPremium    = isOwner || isPremiumJid(senderJid)
        const isRegistered = isOwner || !!database.data?.users?.[senderJid]?.registered

        const isGroup  = m.isGroup
        let isAdmin    = false
        let isBotAdmin = false

        if (isGroup) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat)
                isAdmin = groupMeta.participants.some(p =>
                    (p.id === senderJid || p.jid === senderJid) && (p.admin || p.isAdmin || p.isSuperAdmin)
                ) || isOwner
                const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net'
                isBotAdmin   = groupMeta.participants.some(p =>
                    (p.id === botJid || p.jid === botJid) && (p.admin || p.isAdmin || p.isSuperAdmin)
                )
            } catch (err) {
                console.log(chalk.red('[ERROR GROUP META]'), err.message)
            }
        }

        if (!database.data.users)  database.data.users  = {}
        if (!database.data.groups) database.data.groups = {}

        if (!database.data.users[senderJid]) {
            database.data.users[senderJid] = {
                registered: false, premium: false, banned: false,
                warning: 0, exp: 0, level: 1, limit: 20,
                lastclaim: 0, registered_time: 0,
                name: m.pushName || '', age: null
            }
        }

        if (isGroup && !database.data.groups[m.chat]) {
            database.data.groups[m.chat] = { modoadmin: false, muted: [] }
        }

        let who = null
        if (m.mentionedJid?.[0]) who = m.mentionedJid[0]
        else if (m.quoted?.sender) who = m.quoted.sender

        if (who) {
            const rawNum = who.split('@')[0].split(':')[0]
            const isLid  = who.endsWith('@lid') || rawNum.length > 13
            if (isLid && m.isGroup) {
                try {
                    const groupMeta = await conn.groupMetadata(m.chat)
                    const found     = groupMeta.participants.find(p => normalizeCore(p.id || p.jid) === rawNum)
                    if (found?.jid?.endsWith('@s.whatsapp.net')) {
                        who = found.jid.includes(':') ? found.jid.split(':')[0] + '@s.whatsapp.net' : found.jid
                    } else if (found?.id?.endsWith('@s.whatsapp.net')) {
                        who = found.id
                    } else { who = rawNum + '@s.whatsapp.net' }
                } catch { who = rawNum + '@s.whatsapp.net' }
            } else { who = rawNum + '@s.whatsapp.net' }
        }

        // ── Registro obligatorio ──────────────────────────────────────────────
        const cmdsSinReg = ['reg', 'registro', 'register', 'menu', 'help', 'comandos', 'owner', 'creador', 'dev', 'ping', 'speed']
        if (!isRegistered && !cmdsSinReg.includes(commandName)) {
            return mashaReply(conn, m, `⟨✦⟩ regístrate con *#reg* para usar mis comandos.`)
        }

        // ── Validaciones ──────────────────────────────────────────────────────
        if (isGroup && database.data.groups[m.chat]?.modoadmin && !isAdmin && !isOwner)
            return mashaReply(conn, m, msg(['modo administrador activo.', 'comando ignorado.']))

        if (database.data.settings?.modoowner && !isOwner)
            return mashaReply(conn, m, msg(['sistema en modo estricto.', 'solo el owner puede operar.']))

        if (database.data.users[senderJid]?.banned && !isOwner)
            return mashaReply(conn, m, msg(['usuario en lista de exclusión.', 'acceso denegado.']))

        if (cmd.rowner && !isROwner) {
            if (isOwner) return mashaReply(conn, m, `⟨✦⟩ ejecutando.`)
            return mashaReply(conn, m, msg(['se requieren privilegios de owner root.']))
        }

        if (cmd.owner && !isOwner)
            return mashaReply(conn, m, msg(['permisos insuficientes.', 'comando exclusivo del owner.']))

        if (cmd.premium && !isPremium)
            return mashaReply(conn, m, msg(['se requiere suscripción premium.']))

        if (cmd.register && !isRegistered)
            return mashaReply(conn, m, msg(['usuario no registrado.', `usa *${prefix}reg nombre.edad* para proceder.`]))

        if (cmd.group && !isGroup)
            return mashaReply(conn, m, msg(['este comando es exclusivo de grupos.']))

        if (cmd.admin && !isAdmin) {
            if (isOwner) return mashaReply(conn, m, `⟨✦⟩ ejecutando con privilegios.`)
            return mashaReply(conn, m, msg(['se requiere rol de administrador.']))
        }

        if (cmd.botAdmin && !isBotAdmin)
            return mashaReply(conn, m, msg(['necesito permisos de administrador en este grupo.']))

        if (cmd.private && isGroup)
            return mashaReply(conn, m, msg(['este comando requiere chat privado.']))

        if (cmd.limit && !isPremium && !isOwner) {
            const userLimit = database.data.users[senderJid].limit ?? 0
            if (userLimit < 1) return mashaReply(conn, m, msg(['cuota de peticiones agotada.', 'vuelve mañana o adquiere premium.']))
            database.data.users[senderJid].limit -= 1
        }

        // ── Ejecución ─────────────────────────────────────────────────────────
        try {
            const fn = typeof cmd === 'function' ? cmd
                : typeof cmd.run === 'function' ? cmd.run.bind(cmd) : null
            if (!fn) throw new TypeError(`Plugin "${commandName}" sin función válida`)

            await fn(m, {
                conn, args,
                text: args.join(' '),
                command: commandName,
                usedPrefix: prefix,
                isOwner, isROwner, isPremium, isRegistered,
                isAdmin, isBotAdmin, isGroup,
                who, db: database.data, prefix, plugins
            })
        } catch (e) {
            console.log(chalk.red('\n[!] ERROR EN PLUGIN:'), e)
            const name       = e?.name    || 'Error'
            const message    = e?.message || String(e)
            const stackLines = e?.stack?.split('\n') || []
            let file = 'desconocido', line = '?'
            for (const l of stackLines) {
                const match = l.match(/\((.*plugins.*[\\/]([^:\\/]+)):(\d+):(\d+)\)/)
                if (match) { file = match[2]; line = match[3]; break }
            }
            if (isOwner) {
                await mashaReply(conn, m, msg([
                    `comando: *${prefix + commandName}*`,
                    `archivo: ${file} (línea: ${line})`,
                    `tipo: ${name}`,
                    `detalle: ${message.slice(0, 280)}`
                ]))
            }
        }

    } catch (err) {
        console.log(chalk.red('[HANDLER ERROR]'), err)
        const sc = (m?.sender || '').replace(/:[0-9A-Za-z]+(?=@s\.whatsapp\.net)/, '')
        if (m?.reply && isOwnerJid(sc)) {
            await mashaReply(conn, m, msg([`error crítico: ${String(err).slice(0, 280)}`]))
        }
    }
}
