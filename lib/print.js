import chalk from 'chalk'

// ── Paleta Masha Kujou (Gold & Crimson) ────────────────────────
const cGold   = chalk.hex('#FFD700') // Oro
const cAmber  = chalk.hex('#FFBF00') // Ámbar para detalles
const cRed    = chalk.hex('#FF4D4D') // Rojo Masha
const cWine   = chalk.hex('#990000') // Vino para bordes
const cg      = chalk.gray
const cWhite  = chalk.white

const printLog = async (hasPrefix, sender, chat, body, pushName, conn = null) => {
    if (!body) return

    try {
        const now       = new Date()
        const time      = now.toLocaleTimeString('es-CO', { hour12: false, timeZone: 'America/Bogota' })
        const date      = now.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
        const num       = (sender || '').split('@')[0].split(':')[0]
        const nombre    = pushName || num
        const bodyShort = (body || '').slice(0, 80)
        
        // Configuración de estilo según tipo (Comando vs Mensaje)
        const tipo      = hasPrefix ? '✦ ᴄᴍᴅ' : '✧ ᴍsɢ'
        const emojiTipo = hasPrefix ? '👑' : '🪄'
        const colorTipo = hasPrefix ? cRed : cGold

        let header = cg('  ╭───────────────────────────────────╮')
        let footer = cg('  ╰───────────────────────────────────╯')
        let line   = cg('  │ ')

        if (chat && chat.endsWith('@g.us')) {
            let groupName = chat.split('@')[0]
            if (conn) {
                try {
                    const meta = await conn.groupMetadata(chat)
                    groupName  = meta.subject || groupName
                } catch {}
            }

            console.log(
                header + '\n' +
                line + cAmber(`${date} 🎀 ${time}`) + ' ' + colorTipo.bold(`[${tipo}]`) + '\n' +
                line + cRed('ɢʀᴜᴘᴏ   ') + cWhite(groupName) + ' ' + emojiTipo + '\n' +
                line + cRed('sᴇɴᴅᴇʀ  ') + cWhite(nombre) + cg(` (${num})`) + '\n' +
                line + cRed('ᴍᴇɴsᴀᴊᴇ ') + cWhite(bodyShort || '(multimedia)') + '\n' +
                footer
            )
        } else {
            console.log(
                header + '\n' +
                line + cAmber(`${date} 🎀 ${time}`) + ' ' + colorTipo.bold(`[${tipo}]`) + '\n' +
                line + cRed('ᴘʀɪᴠᴀᴅᴏ ') + cWhite(nombre) + ' ' + emojiTipo + cg(` (${num})`) + '\n' +
                line + cRed('ᴍᴇɴsᴀᴊᴇ ') + cWhite(bodyShort || '(multimedia)') + '\n' +
                footer
            )
        }
    } catch (e) {
        console.log(
            cg('  ╭── [ ') + chalk.red.bold('ERROR') + cg(' ] ──╮') + '\n' +
            cg('  │ ') + cWhite(e.message) + '\n' +
            cg('  ╰───────────────╯')
        )
    }
}

export default printLog
