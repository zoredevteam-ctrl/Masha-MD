import fs from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

// ══════════════════════════════════════════
//   ✦  M A S H A  K U J O U  —  C O R E
// ══════════════════════════════════════════

global.botName    = 'Masha Kujou'
global.ownerName  = '˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ'
global.botVersion = '1.0.0'

global.owner = [
  ['573107400303',    '˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ', true],
  ['123613520896125', '˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ LID', true],
  ['51925092348',     'Jhon', true],
  ['162234554671342', 'Jhon LID', true]
]

global.owners = global.owner.map(v => v[0])
global.mods   = []
global.prems  = []
global.prefix = '#'

// ══════════════════════════════════════════
//   ✦  E N L A C E S
// ══════════════════════════════════════════

global.rcanal         = 'https://whatsapp.com/channel/0029Vb85bh7EAKWOM4Zw8N3G'
global.newsletterJid  = '120363407858718331@newsletter'
global.newsletterName = '「✦ 𝐌𝐚𝐬𝐡𝐚 𝐊𝐮𝐣𝐨𝐮 ✦」'

global.banner = 'https://causas-files.vercel.app/fl/hc2x.webp'
global.icono  = 'https://causas-files.vercel.app/fl/8y10.jpg'

// ══════════════════════════════════════════
//   ✦  H E L P E R S  D E  I M A G E N
// ══════════════════════════════════════════

global.getBannerThumb = async () => {
    try {
        const res = await fetch(global.banner)
        return Buffer.from(await res.arrayBuffer())
    } catch { return null }
}

global.getIconThumb = async () => {
    try {
        const res = await fetch(global.icono)
        return Buffer.from(await res.arrayBuffer())
    } catch { return null }
}

// ══════════════════════════════════════════
//   ✦  N E W S L E T T E R  C O N T E X T
// ══════════════════════════════════════════

global.getNewsletterCtx = (thumbnail = null, title = null, body = null, renderLarge = false) => ({
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid:   global.newsletterJid,
        serverMessageId: -1,
        newsletterName:  global.newsletterName
    },
    externalAdReply: {
        title:                 title || `✦ ${global.botName}`,
        body:                  body  || global.ownerName,
        mediaType:             1,
        mediaUrl:              global.rcanal,
        sourceUrl:             global.rcanal,
        thumbnail,
        showAdAttribution:     false,
        containsAutoReply:     true,
        renderLargerThumbnail: renderLarge
    }
})

// ══════════════════════════════════════════
//   ✦  M E N S A J E S  D E  S I S T E M A
// ══════════════════════════════════════════

global.mess = {
    wait:     '◈ un momento...',
    success:  '◈ listo.',
    error:    '◈ algo salió mal.',
    owner:    '◈ solo para el owner.',
    group:    '◈ solo en grupos.',
    admin:    '◈ solo administradores.',
    botAdmin: '◈ necesito ser admin.',
    restrict: '◈ función bloqueada.',
    notReg:   '◈ primero regístrate.'
}

// ══════════════════════════════════════════
//   ✦  A U T O - R E L O A D
// ══════════════════════════════════════════

const file = fileURLToPath(import.meta.url)
fs.watchFile(file, async () => {
    try {
        fs.unwatchFile(file)
        console.log(chalk.magentaBright('\n✦ [SETTINGS] Recargado.'))
        await import(`${file}?update=${Date.now()}`)
    } catch (e) {
        console.error(chalk.red('[!] Error en auto-reload:'), e)
    }
})

export default global
