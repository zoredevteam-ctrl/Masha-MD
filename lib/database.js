import { Low }      from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path          from 'path'
import { fileURLToPath } from 'url'
import chalk         from 'chalk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath    = path.join(__dirname, '../database.json')

const defaultData = {
    users: {},
    groups: {},
    subbots: {},
    settings: {
        mode:      'public',
        welcome:   true,
        antilink:  false,
        antispam:  false,
        modoowner: false,
        prefix:    '#'
    },
    stats: {
        totalCommands: 0,
        startTime:     Date.now()
    }
}

const adapter = new JSONFile(dbPath)
const db      = new Low(adapter, defaultData)

async function initDB() {
    try {
        await db.read()

        // Mezclar con defaults sin pisar datos existentes
        db.data          = { ...defaultData, ...db.data }
        db.data.settings = { ...defaultData.settings, ...(db.data.settings || {}) }
        db.data.stats    = { ...defaultData.stats,    ...(db.data.stats    || {}) }

        await db.write()
        console.log(chalk.hex('#F2A7C3')('  ✦ [DATABASE] Iniciada correctamente.'))
    } catch (e) {
        console.error(chalk.red('  ✦ [DATABASE ERROR]'), e)
    }
}

await initDB()

// Guardado automático cada 60 segundos
setInterval(async () => {
    try { await db.write() } catch {}
}, 60_000)

export const database = {
    data: db.data,

    // Obtener o crear usuario con estructura completa
    getUser(jid) {
        if (!this.data.users) this.data.users = {}
        if (!this.data.users[jid]) {
            this.data.users[jid] = {
                registered:       false,
                premium:          false,
                banned:           false,
                warning:          0,
                exp:              0,
                level:            1,
                money:            0,
                bank:             0,
                limit:            20,
                lastclaim:        0,
                registered_time:  0,
                name:             '',
                age:              null
            }
        }
        return this.data.users[jid]
    },

    async save() {
        try {
            await db.write()
        } catch (e) {
            console.log(chalk.red('  ✦ [DATABASE SAVE ERROR]'), e.message)
        }
    },

    async read() {
        try {
            await db.read()
            if (db.data) this.data = db.data
        } catch (e) {
            console.log(chalk.red('  ✦ [DATABASE READ ERROR]'), e.message)
        }
    },

    async reset() {
        db.data    = { ...defaultData }
        this.data  = db.data
        await db.write()
        console.log(chalk.yellow('  ✦ [DATABASE] Reseteada.'))
    }
}