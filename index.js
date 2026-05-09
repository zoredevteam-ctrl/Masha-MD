// index.js — Masha Kujou MD
// ✦ Versión mejorada — hot-reload, watcher de plugins, manejo robusto de errores

import './settings.js'
import chalk from 'chalk'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'
import readlineSync from 'readline-sync'
import { fileURLToPath } from 'url'
import {
    Browsers,
    makeWASocket,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    jidDecode,
    DisconnectReason
} from '@whiskeysockets/baileys'
import { handler } from './handler.js'
import { database } from './lib/database.js'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const pluginsDir = path.join(__dirname, 'plugins')

global.conns = []

// ── Paleta cromática de Masha ─────────────────────────────────────────────────
// Rosa nevado / violeta ruso / lavanda / blanco perla
const cW   = chalk.white
const cG   = chalk.gray
const cP1  = chalk.hex('#e2b4f7')   // lavanda claro  — pelo plateado
const cP2  = chalk.hex('#c084fc')   // violeta medio  — ojos celestes de Masha
const cP3  = chalk.hex('#a855f7')   // purpura        — acento principal
const cP4  = chalk.hex('#7c3aed')   // violeta oscuro — bordes
const cR   = chalk.hex('#f0abfc')   // rosa violeta   — nombre
const cI   = chalk.hex('#d8b4fe')   // lila           — subtítulos
const cDim = chalk.hex('#581c87')   // borde oscuro

// ── Logger ────────────────────────────────────────────────────────────────────
const log = {
    info:    txt => console.log(chalk.bgHex('#7c3aed').white.bold('  INFO  ')  + ' ' + cW(txt)),
    success: txt => console.log(chalk.bgHex('#a855f7').white.bold(' SUCCESS ') + ' ' + cP1(txt)),
    warn:    txt => console.log(chalk.bgYellow.black.bold('  WARN  ')          + ' ' + chalk.yellow(txt)),
    error:   txt => console.log(chalk.bgRed.white.bold('  ERROR ')             + ' ' + chalk.redBright(txt)),
    plugin:  txt => console.log(cP2('  ✦ ') + cW(txt)),
}

// ── Banner — estilo María Mijáilovna Kujou ────────────────────────────────────
//
//  Concepto: mezcla del alfabeto cirílico (ella es rusa) con
//  kanji/latín elegante (ella es mitad japonesa).
//  Línea decorativa tipo vitral/encaje ruso.
//  Sin ASCII art de letras copiado — 100% original.
//
const makeBanner = () => {
    const v   = global.botVersion || '1.0.0'
    const ow  = global.ownerName  || 'Owner'
    const pfx = global.prefix     || '#'
    const now = new Date().toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long'
    })

    // Líneas de borde
    const W   = 59  // ancho interior
    const top = cDim('  ╔') + cP4('═'.repeat(W)) + cDim('╗')
    const btm = cDim('  ╚') + cP4('═'.repeat(W)) + cDim('╝')
    const sep = cDim('  ╠') + cP3('─'.repeat(W)) + cDim('╣')
    const emp = () => cDim('  ║') + ' '.repeat(W) + cDim('║')

    // Función para centrar texto (sin contar escapes ANSI)
    const center = (raw, colorFn = s => s) => {
        const visible = raw.replace(/\x1b\[[0-9;]*m/g, '')
        const pad     = Math.max(0, Math.floor((W - visible.length) / 2))
        const rpad    = Math.max(0, W - visible.length - pad)
        return cDim('  ║') + ' '.repeat(pad) + colorFn(raw) + ' '.repeat(rpad) + cDim('║')
    }

    // Función para línea izquierda con sangría
    const left = (raw) => {
        const visible = raw.replace(/\x1b\[[0-9;]*m/g, '')
        const rpad    = Math.max(0, W - visible.length)
        return cDim('  ║') + raw + ' '.repeat(rpad) + cDim('║')
    }

    // ── Contenido del banner ──────────────────────────────────────────────────

    // Nombre cirílico — el personaje habla ruso
    const cyrName  = 'М  А  Ш  А     К  У  Д  Ж  О  У'
    // Kanji decorativo (hermana, elegante, luna — rasgos de Masha)
    const kanjiRow = '姉  ·  優雅  ·  月  ·  雪'
    // Nombre completo en latín
    const fullName = 'María  Mijáilovna  Kujou'
    // Tagline
    const tagline  = 'Roshidere  ·  WhatsApp  MD  Bot'
    // Cita de Masha (en ruso transliterado)
    const quote    = '"Da, solnyshko... aquí estoy para ti."'
    // Encaje decorativo tipo bordado ruso
    const lace     = '✦ ─────── ❧ ─────── ✦ ─────── ❧ ─────── ✦'

    return [
        '',
        top,
        emp(),

        // Nombre cirílico — grande, centrado, rosa
        center(cyrName, cR.bold),
        center(kanjiRow, cDim),

        emp(),
        center(lace, cP4),
        emp(),

        // Nombre completo
        center(fullName, cP1.bold),
        center(tagline,  cI),

        emp(),
        sep,
        emp(),

        // Info técnica — alineada a la izquierda con sangría
        left(cG('   version  ') + cP2(v)   + cG('   ·   node ') + cP2(process.version)),
        left(cG('   owner    ') + cP1(ow)),
        left(cG('   prefix   ') + cP2(pfx) + cG('   ·   ') + cG(now)),

        emp(),
        sep,
        emp(),

        // Cita de Masha
        center(quote, cI.italic),

        emp(),
        btm,
        '',
    ].join('\n')
}

// ─────────────────────────────────────────────
//  Carga y hot-reload de plugins
// ─────────────────────────────────────────────

const plugins = new Map()

async function loadPlugin(file) {
    const filePath = path.resolve(pluginsDir, file)
    try {
        const mod    = await import(`file://${filePath}?t=${Date.now()}`)
        const plugin = mod.default
        if (!plugin) { log.warn(`${file} sin export default, omitido.`); return false }
        plugins.set(file, plugin)
        return true
    } catch (e) {
        log.error(`${file}: ${e.message}`)
        return false
    }
}

async function loadPlugins() {
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true })
    const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))
    if (!files.length) { log.warn('No hay plugins en /plugins'); return }

    let ok = 0, fail = 0
    for (const file of files) {
        const success = await loadPlugin(file)
        success ? ok++ : fail++
        if (success) log.plugin(`${file} ✓`)
    }
    console.log(
        cP3('\n  ✦ Plugins: ') +
        chalk.green(`${ok} cargados`) +
        (fail ? chalk.red(` · ${fail} con error`) : '') + '\n'
    )
}

function watchPlugins() {
    if (!fs.existsSync(pluginsDir)) return
    const debounce = {}
    fs.watch(pluginsDir, async (event, filename) => {
        if (!filename?.endsWith('.js')) return
        clearTimeout(debounce[filename])
        debounce[filename] = setTimeout(async () => {
            const fp = path.join(pluginsDir, filename)
            if (!fs.existsSync(fp)) {
                if (plugins.has(filename)) { plugins.delete(filename); log.warn(`Plugin eliminado: ${filename}`) }
                return
            }
            const wasLoaded = plugins.has(filename)
            const ok        = await loadPlugin(filename)
            if (ok) log.success(`Plugin ${wasLoaded ? 'recargado' : 'cargado'}: ${filename}`)
        }, 300)
    })
    log.info('Watcher de plugins activo.')
}

// ─────────────────────────────────────────────
//  Limpieza de sesión
// ─────────────────────────────────────────────

function cleanSession(sessionDir) {
    try {
        if (!fs.existsSync(sessionDir)) return
        const BAD = ['pre-key-', 'session-', 'sender-key-', 'app-state-sync-']
        const files = fs.readdirSync(sessionDir)
        let n = 0
        for (const f of files) {
            if (BAD.some(p => f.startsWith(p))) { fs.unlinkSync(path.join(sessionDir, f)); n++ }
        }
        if (n) log.info(`Sesion: ${n} archivo(s) de senal limpiados.`)
    } catch (e) { log.warn(`cleanSession: ${e.message}`) }
}

// ─────────────────────────────────────────────
//  Bot principal
// ─────────────────────────────────────────────

global.sessionName = './Sessions/Owner'
if (!fs.existsSync(global.sessionName)) fs.mkdirSync(global.sessionName, { recursive: true })

const methodCodeQR = process.argv.includes('--qr')
const methodCode   = process.argv.includes('--code')
let opcion      = ''
let phoneNumber = ''
let reconnectCount    = 0
const MAX_RECONNECT_DELAY = 30_000

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(global.sessionName)
    const { version }          = await fetchLatestBaileysVersion()

    if (!methodCodeQR && !methodCode && !state.creds.registered && !opcion) {
        console.clear()
        console.log(makeBanner())
        console.log(cP2.bold('\n  ✦ MÉTODO DE VINCULACIÓN\n'))
        console.log(cI('     [ 1 ]') + cW('  Código QR'))
        console.log(cI('     [ 2 ]') + cW('  Código de 8 dígitos\n'))
        opcion = readlineSync.question(cP3.bold('  ✦ Elige (1 o 2): ')).trim()

        if (opcion === '2') {
            phoneNumber = readlineSync
                .question(cP1('\n  ✦ Número (con código de país, sin +): '))
                .replace(/\D/g, '')
            if (!phoneNumber || phoneNumber.length < 7) {
                log.error('Número inválido. Reinicia e intenta de nuevo.')
                process.exit(1)
            }
        }
    }

    const conn = makeWASocket({
        version,
        logger:            pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser:           Browsers.ubuntu('Chrome'),
        auth: {
            creds: state.creds,
            keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        markOnlineOnConnect:            true,
        generateHighQualityLinkPreview: true,
        emitOwnEvents:                  false,
        getMessage:                     async () => ({ conversation: 'Masha Kujou.' })
    })

    global.conn = conn

    conn.decodeJid = jid => {
        if (!jid) return jid
        const { user, server } = jidDecode(jid) || {}
        return user && server ? `${user}@${server}` : jid
    }

    conn.ev.on('creds.update', saveCreds)

    if ((opcion === '2' || methodCode) && !state.creds.registered) {
        setTimeout(async () => {
            try {
                const code      = await conn.requestPairingCode(phoneNumber)
                const formatted = code?.match(/.{1,4}/g)?.join('-') ?? code
                console.log(
                    cP3.bold('\n  ✦ TU CÓDIGO: ') +
                    chalk.bgHex('#3b0764').white.bold(` ${formatted} `) +
                    '\n'
                )
            } catch (e) { log.error(`Error al generar código: ${e.message}`) }
        }, 3_000)
    }

    conn.ev.on('connection.update', async update => {
        const { qr, connection, lastDisconnect } = update

        if (qr && (opcion === '1' || methodCodeQR)) {
            console.clear()
            console.log(makeBanner())
            console.log(cP1('\n  ✦ Escanea el código QR:\n'))
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'open') {
            reconnectCount = 0
            const name = conn.user?.name || 'Masha Kujou'
            const num  = conn.user?.id?.split(':')[0] || ''
            console.clear()
            console.log(makeBanner())
            log.success(`Conectada: ${name}  (+${num})  ✓`)
            console.log(cP3('  ✦ ') + cI(`Plugins activos: ${plugins.size}`))
            console.log(cP4('  ✦ ') + cG('Escuchando mensajes...\n'))
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const reason     = lastDisconnect?.error?.message || 'desconocida'

            if (statusCode === DisconnectReason.loggedOut) {
                log.error(`Sesión cerrada (logout). Borra ${global.sessionName} y reinicia.`)
                return
            }

            reconnectCount++
            const delay = Math.min(1_000 * 2 ** reconnectCount, MAX_RECONNECT_DELAY)
            log.warn(`Desconectada (${statusCode} — ${reason}). Reconectando en ${delay / 1000}s... (intento ${reconnectCount})`)
            setTimeout(() => startBot(), delay)
        }
    })

    conn.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        for (const raw of messages) {
            if (!raw?.message) continue
            const jid = raw.key?.remoteJid || ''
            if (jid === 'status@broadcast' || jid.endsWith('@newsletter')) continue
            try { await handler(raw, conn, plugins) } catch (e) { log.error(`handler: ${e.message}`) }
        }
    })

    conn.ev.on('group-participants.update', ({ id, participants, action }) => {
        if (action !== 'remove') return
        const botJid = conn.user?.id?.split(':')[0] + '@s.whatsapp.net'
        if (participants.some(p => p.split(':')[0] + '@s.whatsapp.net' === botJid)) {
            log.warn(`Bot removido del grupo ${id}`)
        }
    })
}

// ─────────────────────────────────────────────
//  Manejo global de errores
// ─────────────────────────────────────────────

process.on('uncaughtException',  err    => { log.error(`uncaughtException: ${err.message}`); console.error(err.stack) })
process.on('unhandledRejection', reason => { log.error(`unhandledRejection: ${reason?.message ?? reason}`) })

const gracefulShutdown = async signal => {
    log.warn(`${signal} — Guardando base de datos...`)
    try { await database.save() } catch {}
    process.exit(0)
}
process.on('SIGINT',  () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

// ─────────────────────────────────────────────
//  Arranque
// ─────────────────────────────────────────────

;(async () => {
    console.clear()
    console.log(makeBanner())

    cleanSession(global.sessionName)
    await database.read()
    if (database.data?.settings?.prefix) global.prefix = database.data.settings.prefix

    await loadPlugins()
    global.plugins = plugins

    watchPlugins()
    await startBot()
})()
