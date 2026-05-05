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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pluginsDir = path.join(__dirname, 'plugins')
global.conns = []

// ── Logger ────────────────────────────────────────────────────────────────────
const log = {
    info:    msg => console.log(chalk.bgHex('#9B59B6').white.bold('  INFO  ')  + ' ' + chalk.white(msg)),
    success: msg => console.log(chalk.bgHex('#8E44AD').white.bold(' SUCCESS ') + ' ' + chalk.hex('#D7BDE2')(msg)),
    warn:    msg => console.log(chalk.bgYellow.black.bold('  WARN  ')          + ' ' + chalk.yellow(msg)),
    error:   msg => console.log(chalk.bgRed.white.bold('  ERROR ')             + ' ' + chalk.redBright(msg))
}

// ── Paleta Masha ──────────────────────────────────────────────────────────────
const m1 = chalk.hex('#D7BDE2'); const m2 = chalk.hex('#BB8FCE'); const m3 = chalk.hex('#8E44AD'); const m4 = chalk.hex('#F5EEF8'); const mG = chalk.hex('#EBD5F7')

// ── Banner ────────────────────────────────────────────────────────────────────
const banner = `\n${m3('╭──────────────────────────────────────────────────╮')}\n${m3('│')}                                                  ${m3('│')}\n${m3('│')}   ${m2('███╗   ███╗ █████╗ ███████╗██╗  ██╗ █████╗')}    ${m3('│')}\n${m3('│')}   ${m2('████╗ ████║██╔══██╗██╔════╝██║  ██║██╔══██╗')}   ${m3('│')}\n${m3('│')}   ${m2('██╔████╔██║███████║███████╗███████║███████║')}    ${m3('│')}\n${m3('│')}   ${m2('██║╚██╔╝██║██╔══██║╚════██║██╔══██║██╔══██║')}   ${m3('│')}\n${m3('│')}   ${m1('██║ ╚═╝ ██║██║  ██║███████║██║  ██║██║  ██║')}   ${m3('│')}\n${m3('│')}   ${m1('╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝')}  ${m3('│')}\n${m3('│')}                                                  ${m3('│')}\n${m3('│')}   ${mG('✦ ──── K  U  J  O  U  ─────────────── ✦')}        ${m3('│')}\n${m3('│')}   ${m4.bold('  ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ  |  Z0RT SYSTEMS       ')}  ${m3('│')}\n${m3('│')}   ${chalk.gray('  Version: ' + (global.botVersion || '1.0.0') + '  |  Premium Edition              ')}  ${m3('│')}\n${m3('╰──────────────────────────────────────────────────╯')}\n`

// ── Carga de plugins ──────────────────────────────────────────────────────────
const plugins = new Map()
async function loadPlugins() {
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true })
    const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))
    for (const file of files) {
        try {
            const filePath = path.resolve(pluginsDir, file)
            const plugin   = (await import(`file://${filePath}?t=${Date.now()}`)).default
            if (plugin) { plugins.set(file, plugin); log.success(`Cargado: ${file}`) }
        } catch (e) { log.error(`Error en ${file}: ${e.message}`) }
    }
}

global.sessionName = './Sessions/Owner'
if (!fs.existsSync(global.sessionName)) fs.mkdirSync(global.sessionName, { recursive: true })

const methodCodeQR = process.argv.includes('--qr'); const methodCode = process.argv.includes('--code')
let opcion = ''; let phoneNumber = ''

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(global.sessionName)
    const { version } = await fetchLatestBaileysVersion()

    if (!methodCodeQR && !methodCode && !state.creds.registered && !opcion) {
        console.clear(); console.log(banner)
        console.log(chalk.bold.hex('#BB8FCE')('✦ SELECCIONA TU MÉTODO DE VINCULACIÓN:\n'))
        console.log(chalk.hex('#D7BDE2')('   [ 1 ]') + chalk.white(' Código QR'))
        console.log(chalk.hex('#D7BDE2')('   [ 2 ]') + chalk.white(' Código de 8 dígitos'))
        opcion = readlineSync.question(chalk.bold.hex('#8E44AD')('\n ✦ Elige una opción (1 o 2): ')).trim()
        if (opcion === '2') phoneNumber = readlineSync.question(chalk.hex('#BB8FCE')('\n ✦ Ingresa tu número: ')).replace(/\D/g, '')
    }

    const conn = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        // Evita que los errores de "Bad MAC" detengan el proceso
        emitOwnEvents: false,
        getMessage: async () => ({ conversation: 'Masha Kujou.' })
    })

    global.conn = conn
    conn.decodeJid = jid => {
        if (!jid) return jid
        const decode = jidDecode(jid) || {}
        return (decode.user && decode.server) ? `${decode.user}@${decode.server}` : jid
    }

    conn.ev.on('creds.update', saveCreds)

    if ((opcion === '2' || methodCode) && !state.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await conn.requestPairingCode(phoneNumber)
                const formatted = code?.match(/.{1,4}/g)?.join('-') || code
                console.log(chalk.bgHex('#8E44AD').white.bold('\n ✦ TU CÓDIGO: ') + chalk.bgBlack.white.bold(` ${formatted} `) + '\n')
            } catch (e) { log.error(`Error de código: ${e.message}`) }
        }, 3000)
    }

    conn.ev.on('connection.update', async update => {
        const { qr, connection, lastDisconnect } = update
        if (qr && (opcion === '1' || methodCodeQR)) {
            console.log(chalk.hex('#BB8FCE')('\n ✦ Escanea este código QR:')); qrcode.generate(qr, { small: true })
        }
        if (connection === 'open') log.success(`Online: ${conn.user?.name || 'Masha Kujou'} ✓`)
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            if (statusCode !== DisconnectReason.loggedOut) {
                log.warn(`Reconectando...`); startBot()
            } else { log.error('Sesión cerrada.') }
        }
    })

    conn.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]; if (!m?.message) return
        const jid = m.key?.remoteJid || ''
        if (jid === 'status@broadcast' || jid.endsWith('@newsletter')) return
        try { await handler(m, conn, plugins) } catch (e) { log.error(`handler: ${e.message}`) }
    })
}

// ── Arranque con Limpieza Automatizada ────────────────────────────────────────
;(async () => {
    try {
        const files = fs.readdirSync(global.sessionName)
        // Eliminamos solo archivos de sesión corruptos (Bad MAC), NO el creds.json
        const toDelete = files.filter(f => f.startsWith('pre-key-') || f.startsWith('session-') || f.startsWith('sender-key-'))
        for (const file of toDelete) {
            fs.unlinkSync(path.join(global.sessionName, file))
        }
    } catch {}

    await database.read()
    if (database.data?.settings?.prefix) global.prefix = database.data.settings.prefix
    await loadPlugins()
    global.plugins = plugins
    await startBot()
})()
