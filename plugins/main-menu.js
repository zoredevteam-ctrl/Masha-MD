import { performance } from 'perf_hooks'
import fs from 'fs'
import path from 'path'
import { database } from '../lib/database.js'

let handler = async (m, { conn, usedPrefix }) => {
    let _package = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
    let { money, level, exp, limit, name } = database.getUser(m.sender)
    
    // Configuración de tiempo y saludo
    let uptime = process.uptime() * 1000
    let muptime = clockString(uptime)
    let greeting = getGreeting()

    const menu = `
${greeting}, *${name || m.pushName}* 🎀

*「 ɪɴғᴏ ᴜsᴜᴀʀɪᴏ 」*
⟨✦⟩ ɴɪᴠᴇʟ : \`${level}\`
⟨✦⟩ ᴇxᴘ : \`${exp}\`
⟨✦⟩ ᴅɪɴᴇʀᴏ : \`$${money}\`
⟨✦⟩ ᴅɪᴀᴍᴀɴᴛᴇs : \`${limit}\`

*「 ɪɴғᴏ ʙᴏᴛ 」*
⟨✦⟩ ᴠᴇʀsɪᴏɴ : \`v${_package.version}\`
⟨✦⟩ ᴘʀᴇғɪᴊᴏ : \`[ ${usedPrefix} ]\`
⟨✦⟩ ᴀᴄᴛɪᴠᴏ : \`${muptime}\`
⟨✦⟩ ᴍᴏᴅᴏ : \`${global.opts?.self ? 'Privado' : 'Público'}\`


  > Vincula un *Socket* con tu número utilizando *$prefixqr* o *$prefixcode*.
‧꒷︶꒷꒥꒷‧₊˚꒷︶꒷꒥꒷︶꒷˚₊‧꒷꒥꒷︶꒷‧`
export const menuObject = {
economia: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *ECONOMY* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Comandos de Economía para ganar dinero y divertirte con tus amigos.
ꕤ *$prefixw » $prefixwork » $prefixtrabajar*
> Ganar coins trabajando.
ꕤ *$prefixbalance » $prefixbal » $prefixcoins* + <mention>
> Ver cuantos coins tienes.
ꕤ *$prefixcoinflip » $prefixflip » $prefixcf* + <cantidad / cara|cruz>
> Apostar coins en un cara o cruz.
ꕤ *$prefixcrime » $prefixcrimen*
> Ganar coins rapido.
ꕤ *$prefixdaily » $prefixdiario*
> Reclamar tu recompensa diaria.
ꕤ *$prefixdeposit » $prefixdep » $prefixdepositar » $prefixd* + <cantidad|all>
> Depositar tus coins en el banco.
ꕤ *$prefixeconomyboard » $prefixeboard » $prefixbaltop* + <page>
> Ver el ranking de usuarios con más coins.
ꕤ *$prefixcasino » $prefixapostar » $prefixslot* + <amount>
> Apostar coins en el casino.
ꕤ *$prefixeconomyinfo » $prefixeinfo*
> Ver tu información de economía en el grupo.
ꕤ *$prefixgivecoins » $prefixpay » $prefixcoinsgive* + <cantidad|all / mention>
> Dar coins a un usuario.
ꕤ *$prefixroulette » $prefixrt » $prefixruleta* + <cantidad / red|black|green>
> Apostar coins en una ruleta.
ꕤ *$prefixslut » $prefixprostituirse*
> Ganar coins prostituyéndote.
ꕤ *$prefixsteal » $prefixrobar » $prefixrob* + <mention>
> Intentar robar coins a un usuario.
ꕤ *$prefixwithdraw » $prefixwith » $prefixretirar* + <cantidad|all>
> Retirar tus coins en el banco.
ꕤ *$prefixminar » $prefixmine*
> Realizar trabajos de minería y ganar coins.
ꕤ *$prefixcofre » $prefixcoffer*
> Reclamar tu cofre diario.
ꕤ *$prefixweekly » $prefixsemanal*
> Reclamar tu recompensa semanal.
ꕤ *$prefixmonthly » $prefixmensual*
> Reclamar tu recompensa mensual.
ꕤ *$prefixaventura » $prefixadventure*
> Ir de Aventuras para ganar coins.
ꕤ *$prefixcurar » $prefixheal*
> Curar salud para salir de aventuras.
ꕤ *$prefixcazar » $prefixhunt*
> Cazar animales para ganar coins.
ꕤ *$prefixfish » $prefixpescar*
> Ganar coins pescando.
ꕤ *$prefixmazmorra » $prefixdungeon*
> Explorar mazmorras para ganar coins.
ꕤ *$prefixmath » $prefixmates* + <difficulty>
> Iniciar un juego de matemáticas.
ꕤ *$prefixppt* + <piedra|papel|tijera>
> Jugar piedra, papel o tijera con el bot y gana o pierde coins.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,
gacha: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *GACHA* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Comandos de Gacha para reclamar y intercambiar personajes.
ꕤ *$prefixbuycharacter » $prefixbuychar » $prefixbuyc* + <waifu>
> Comprar un personaje en venta.
ꕤ *$prefixcharimage » $prefixwaifuimage » $prefixcimage » $prefixwimage* + <waifu>
> Ver una imagen aleatoria de un personaje.
ꕤ *$prefixcharinfo » $prefixwinfo » $prefixwaifuinfo* + <waifu>
> Ver información de un personaje.
ꕤ *$prefixclaim » $prefixc » $prefixreclamar* + <cite / waifu>
> Reclamar un personaje.
ꕤ *$prefixdelclaimmsg*
> Restablecer el mensaje al reclamar un personaje.
ꕤ *$prefixdeletewaifu » $prefixdelwaifu » $prefixdelchar* + <waifu>
> Eliminar un personaje reclamado.
ꕤ *$prefixfavoritetop » $prefixfavtop*
> Ver el top de personajes favoritos.
ꕤ *$prefixgachainfo » $prefixginfo » $prefixinfogacha*
> Ver tu información de gacha.
ꕤ *$prefixgiveallharem* + <mention>
> Regalar todos tus personajes a otro usuario.
ꕤ *$prefixgivechar » $prefixgivewaifu » $prefixregalar* + <waifu / mention>
> Regalar un personaje a otro usuario.
ꕤ *$prefixharem » $prefixwaifus » $prefixclaims* + <mention>
> Ver tus personajes reclamados.
ꕤ *$prefixharemshop » $prefixtiendawaifus » $prefixwshop* + <page>
> Ver los personajes en venta.
ꕤ *$prefixremovesale » $prefixremoverventa* + <waifu>
> Eliminar un personaje en venta.
ꕤ *$prefixrollwaifu » $prefixrw » $prefixroll*
> Waifu o husbando aleatorio.
ꕤ *$prefixsell » $prefixvender* + <value> <waifu>
> Poner un personaje a la venta.
ꕤ *$prefixserieinfo » $prefixainfo » $prefixanimeinfo* <name>
> Información de un anime.
ꕤ *$prefixserielist » $prefixslist » $prefixanimelist*
> Listar series del bot.
ꕤ *$prefixsetclaimmsg » $prefixsetclaim* + <text>
> Modificar el mensaje al reclamar un personaje.
ꕤ *$prefixtrade » $prefixintercambiar* + <tu personaje / personaje 2>
> Intercambiar un personaje con otro usuario.
ꕤ *$prefixvote » $prefixvotar* + <waifu>
> Votar por un personaje para subir su valor.
ꕤ *$prefixwaifusboard » $prefixwaifustop » $prefixtopwaifus » $prefixwtop* + <page>
> Ver el top de personajes con mayor valor.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,
downloads: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *DOWNLOAD* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Comandos de Descargas para descargar archivos de varias fuentes.
ꕤ *$prefixfacebook » $prefixfb* + <url>
> Descargar un video de Facebook.
ꕤ *$prefixmediafire » $prefixmf* + <url|query>
> Descargar un archivo de MediaFire.
ꕤ *$prefixplay » $prefixmp3 » $prefixplayaudio » $prefixytaudio » $prefixytmp3* + <url|query>
> Descargar una canción de YouTube.
ꕤ *$prefixpinterest » $prefixpin* + <url|query>
> Buscar y descargar imagenes de Pinterest.
ꕤ *$prefixplay2 » $prefixmp4 » $prefixplayvideo » $prefixytvideo » $prefixytmp4* + <url|query>
> Descargar un vídeo de YouTube.
ꕤ *$prefixreel » $prefixig » $prefixinstagram* + <url>
> Descargar un reel de Instagram.
ꕤ *$prefixtiktok » $prefixtt* + <url|query>
> Descargar un video de TikTok.
ꕤ *$prefixtwitter » $prefixx* + <url>
> Descargar un video/imagen de Twitter/X.
ꕤ *$prefixytsearch » $prefixsearch* + <query>
> Buscar videos de YouTube.
ꕤ *$prefixwagrupos » $prefixgruposwa* + <query>
> Buscar grupos de WhatsApp.
ꕤ *$prefiximagen » $prefiximg* + <query>
> Buscar y descargar imagenes de Google.
ꕤ *$prefixaptoide » $prefixapk » $prefixapkdl* + <query>
> Buscar y descargar aplicaciones de Aptoide.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,
profile: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *PROFILES* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Comandos de Perfil para ver y configurar tu perfil.
ꕤ *$prefixprofile » $prefixperfil* + <mention>
> Ver tu perfil o el de un usuario.
ꕤ *$prefixleaderboard » $prefixlboard » $prefixlb* + <page>
> Top de usuarios con más experiencia.
ꕤ *$prefixlevel » $prefixlvl* + <mention>
> Ver tu nivel y experiencia actual.
ꕤ *$prefixsetgenre* + <hombre|mujer>
> Establecer tu genero.
ꕤ *$prefixdelgenre*
> Eliminar tu genero.
ꕤ *$prefixsetbirth* + <dia/mes/año|mes/dia>
> Establecer tu fecha de cumpleaños.
ꕤ *$prefixdelbirth*
> Borrar tu fecha de cumpleaños.
ꕤ *$prefixsetdescription » $prefixsetdesc* + <text>
> Establecer tu descripcion.
ꕤ *$prefixdeldescription » $prefixdeldesc*
> Eliminar tu descripción de perfil.
ꕤ *$prefixmarry » $prefixcasarse* <mention>
> Casarte con alguien.
ꕤ *$prefixdivorce*
> Divorciarte de tu pareja.
ꕤ *$prefixsetfavourite » $prefixsetfav* + <waifu>
> Establecer tu claim favorito.
ꕤ *$prefixdeletefav » $prefixdelfav* + <waifu>
> Borrar tu claim favorito.
ꕤ *$prefixsetpasatiempo » $prefixsethobby* 
> Establecer tu pasatiempo.
ꕤ *$prefixdelpasatiempo » $prefixremovehobby*
> Elimina tu pasatiempo del perfil.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,
sockets: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *SOCKETS* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Comandos para registrar tu propio bot.
ꕤ *$prefixbotinfo » $prefixinfobot*
> Obtener informacion del bot.
ꕤ *$prefixjoin* + <link>
> Unir al bot a un grupo.
ꕤ *$prefixleave » $prefixsalir*
> Salir de un grupo.
ꕤ *$prefixlogout*
> Cerrar sesion del bot.
ꕤ *$prefixself* + <on|off>
> Haz privado o público tu bot.
ꕤ *$prefixqr » $prefixcode*
> Crear un Sub-Bot con un codigo Code.
ꕤ *$prefixreload*
> Recargar la sesion del bot
ꕤ *$prefixsetname » $prefixsetbotname*  + <corto / largo>
> Cambiar el nombre del bot.
ꕤ *$prefixsetbanner » setbotbanner*
> Cambiar el banner del menu.
ꕤ *$prefixseticon » $prefixsetboticon*
> Cambiar el icon del bot.
ꕤ *$prefixsetprefix » $prefixsetbotprefix* + <value>
> Cambiar el prefijo del bot.
ꕤ *$prefixsetcurrency » $prefixsetbotcurrency* + <value>
> Cambiar la moneda del bot.
ꕤ *$prefixsetowner » $prefixsetbotowner* + <mention|number>
> Cambiar el dueño del bot.
ꕤ *$prefixsetchannel » $prefixsetbotchannel* + <link>
> Cambiar el canal del bot.
ꕤ *$prefixsetlink » $prefixsetbotlink* + <link>
> Cambiar el enlace del bot.
ꕤ *$prefixsetpfp » $prefixsetimage*
> Cambiar la imagen de perfil.
ꕤ *setstatus* + <value>
> Cambiar el estado del bot.
ꕤ *setusername* + <value>
> Cambiar el nombre de usuario.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,
stickers: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *STICKERS* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜
> ✐ Comandos de *Stickers* para crear y gestionar stickers.
ꕤ *$prefixstickerpack » $prefixspack » $prefixstickers* + <query|url>
> Busca y descarga packs de Stickers.
ꕤ *$prefixdelpack* + <name pack>
> Elimina un paquete de stickers.
ꕤ *$prefixdelstickermeta » $prefixdelmeta*
> Restablecer el pack y autor por defecto para tus stickers.
ꕤ *$prefixgetpack » $prefixstickerpack » $prefixpack* + <name pack>
> Descarga un paquete de stickers.
ꕤ *$prefixnewpack » $prefixnewstickerpack* + <name pack>
> Crea un nuevo paquete de stickers.
ꕤ *$prefixsetpackprivate » $prefixsetpackpriv » $prefixpackprivate* + <name pack>
> Establecer un paquete de stickers como privado.
ꕤ *$prefixsetpackpublic » $prefixsetpackpub » $prefixpackpublic* + <name pack>
> Establecer un paquete de stickers como público.
ꕤ *$prefixsetstickermeta » $prefixsetmeta* + <autor|pack>
> Establecer el pack y autor por defecto para tus stickers.
ꕤ *$prefixsticker » $prefixs* + <cite / image|video>
> Convertir una imagen/video a sticker.
ꕤ *$prefixsetstickerpackdesc » $prefixsetpackdesc » $prefixpackdesc* + <name pack / desc>
> Establece la descripción de un paquete de stickers.
ꕤ *$prefixsetstickerpackname » $prefixsetpackname » $prefixpackname* + <name pack / new name pack>
> Cambia el nombre de un paquete de stickers.
ꕤ *$prefixstickeradd » $prefixaddsticker* + <name pack>
> Agrega un sticker a un paquete de stickers.
ꕤ *$prefixstickerdel » $prefixdelsticker* + <name pack>
> Elimina un sticker de un paquete de stickers.
ꕤ *$prefixstickerpacks » $prefixpacklist*
> Lista de tus paquetes de stickers.
ꕤ *$prefixbrat » $prefixbratv » $prefixqc › $prefixemojimix* + <text|mention>
> Crear stickers con texto.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,
utils: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *UTILITIES* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜
> ✐ Comandos de Útilidades.
ꕤ *$prefixmenu » $prefixhelp » $prefixayuda* + <category>
> Ver el menú de comandos.
ꕤ *$prefixbots » $prefixsockets*
> Ver el numero de bots activos.
ꕤ *$prefixstatus » $prefixestado*
> Ver estado del bot.
ꕤ *$prefixping » $prefixp » $prefixspeed*
> Medir tiempo de respuesta del bot.
ꕤ *$prefixreport » $prefixreporte* + <error>
> Enviar un mensaje de reporte a los moderadores.
ꕤ *$prefixsug » $prefixsuggest* + <suggest>
> Enviar una sugerencia a los moderadores.
ꕤ *$prefixinvitar » $prefixinvite* + <link>
> Invitar el bot a un grupo.
ꕤ *$prefixia » $prefixchatgpt* + <query>
> Realizar peticiones a chatgpt.
ꕤ *$prefixgetpic » $prefixpfp* + <mention>
> Ver la foto de perfil de un usuario.
ꕤ *$prefixtoimage » $prefixtoimg* + <cite / sticker>
> Convertir un sticker/imagen de una vista a imagen.
ꕤ *$prefixtourl* + <cite / image|video>
> Convierte la imagen en un link.
ꕤ *$prefixsay » $prefixdecir* + <text>
> Repetir un mensaje.
ꕤ *$prefixtrad » $prefixtraducir » $prefixtranslate* + <language / text>
> Traducir texto al idioma especificado.
ꕤ *$prefixget » $prefixfetch* + <url>
> Realizar solicitudes get a páginas web.
ꕤ *$prefixhd » $prefixenhance » $prefixremini* + <cite / image>
> Mejorar la calidad de una imagen.
ꕤ *$prefixgitclone » $prefixgit* + <url|query>
> Buscar y descargar un repositorio de Github.
ꕤ *inspect » inspeccionar* + <url>
> Ver información de grupos/canales de WhatsApp.
ꕤ *$prefixread » $prefixreadviewonce* + <cite / image|video>
> Convertir imagen/video de una vista a contenido.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,
grupo: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *GROUPS* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Comandos para administradores de grupos.
ꕤ *$prefixalerts » $prefixalertas* + <on|off>
> Activar/desactivar las alertas de grupo.
ꕤ *$prefixantilinks » $prefixantienlaces* + <on|off>
> Activar/desactivar el antienlaces.
ꕤ *$prefixbot* + <on|off>
> Activar/desactivar al bot.
ꕤ *$prefixclose » $prefixcerrar* + <time>
> Cerrar el grupo para que solo los administradores puedan enviar mensajes.
ꕤ *$prefixgp » $prefixgroupinfo*
> Informacion del grupo.
ꕤ *$prefixdelwarn* + <mention / number|all>
> Eliminar una advertencia de un miembro del grupo.
ꕤ *$prefixdemote* + <mention>
> Descender a un usuario de administrador.
ꕤ *$prefixeconomy » $prefixeconomia* + <on|off>
> Activar/desactivar los comandos de economía
ꕤ *$prefixgacha » $prefixrpg* + <on|off>
> Activar/desactivar los comandos de GACHA
ꕤ *$prefixgoodbye » $prefixdespedida* + <on|off>
> Activar/desactivar la despedida.
ꕤ *$prefixsetgpbaner* + <cite / image>
> Cambiar la imagen del grupo.
ꕤ *$prefixsetgpname* + <value>
> Cambiar el nombre del grupo.
ꕤ *$prefixsetgpdesc* + <value>
> Cambiar la descripción del grupo.
ꕤ *$prefixkick* + <mention>
> Expulsar a un usuario del grupo.
ꕤ *$prefixnsfw* + <on|off>
> Activar/desactivar los comandos NSFW
ꕤ *$prefixonlyadmin » $prefixadminonly* + <on|off>
> Permitir que solo los administradores puedan utilizar los comandos.
ꕤ *$prefixopen » $prefixabrir* + <time>
> Abrir el grupo para que todos los usuarios puedan enviar mensajes.
ꕤ *$prefixpromote* + <mention>
> Ascender a un usuario a administrador.
ꕤ *$prefixsetgoodbye* + <value>
> Establecer un mensaje de despedida personalizado.
ꕤ *$prefixsetprimary* + <mention>
> Establece un bot como primario del grupo.
ꕤ *$prefixsetwarnlimit* + <number>
> Establecer el límite de advertencias para un grupo.
ꕤ *$prefixsetwelcome* + <value>
> Establecer un mensaje de bienvenida personalizado.
ꕤ *$prefixtag » $prefixhidetag » $prefixtagall* + <text>
> Envía un mensaje mencionando a todos los usuarios del grupo.
ꕤ *$prefixmsgcount » $prefixcount » $prefixmessages » $prefixmensajes* + <mention / days>
> Obtener el conteo de mensajes y comandos de un usuario.
ꕤ *$prefixtopcount » $prefixtopmessages » $prefixtopmsgcount » $prefixtopmensajes* + <days>
> Obtener el top de usuarios con más mensajes en el grupo.
ꕤ *$prefixtopinactive » $prefixtopinactivos » $prefixtopinactiveusers* + <days>
> Obtener el top de usuarios más inactivos en el grupo.
ꕤ *$prefixwarn* + <mention / reason>
> Darle una advertencia a un miembro del grupo.
ꕤ *$prefixwarns* + <mention>
> Ver todas las advertencias de un miembro del grupo.
ꕤ *$prefixwelcome » $prefixbienvenida* + <on|off>
> Activar/desactivar la bienvenida.
ꕤ *$prefixlink » $prefixrevoke*
> Obtener o restablecer el enlace del grupo.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,
nsfw: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *NSFW* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Comandos *NSFW* (Contenido para adultos).
ꕤ *$prefixxnxx* + <query|url>
> Buscar y descarga videos de XNXX.
ꕤ *$prefixxvideos* + <query|url>
> Buscar y descarga videos de XVideos.
ꕤ *$prefixdanbooru » $prefixdbooru* + <tag>
> Buscar imágenes en Danbooru.
ꕤ *$prefixgelbooru » $prefixgbooru* + <tag>
> Buscar imágenes en Gelbooru.
ꕤ *$prefixrule34 » $prefixr34* + <tag>
> Buscar imagenes en Rule34.
ꕤ *$prefixanal » $prefixviolar* + <mention>
> Hacer un anal.
ꕤ *$prefixblowjob » $prefixmamada » $prefixbj* + <mention>
> Dar una mamada.
ꕤ *$prefixboobjob* + <mention>
> Hacer una rusa.
ꕤ *$prefixbondage* + <mention>
> Atar sin escapatoria.
ꕤ *$prefixbukkake* + <mention>
> Hacer un bukkake.
ꕤ *$prefixcum* + <mention>
> Venirse en alguien.
ꕤ *$prefixcummouth* + <mention>
> Acabar en la boca de alguien.
ꕤ *$prefixcumshot* + <mention>
> Disparar semen.
ꕤ *$prefixcreampie* + <mention>
> Dejar un creampie.
ꕤ *$prefixdeepthroat* + <mention>
> Hacer una garganta profunda.
ꕤ *$prefixfacesitting* + <mention>
> Sentarse en la cara de alguien.
ꕤ *$prefixfap » $prefixpaja* + <mention>
> Hacerse una paja.
ꕤ *$prefixfingering* + <mention>
> Meter los dedos.
ꕤ *$prefixfootjob* + <mention>
> Hacer una paja con los pies.
ꕤ *$prefixfuck » $prefixcoger* + <mention>
> Follarte a alguien.
ꕤ *$prefixfutanari » $prefixfuta* + <mention>
> Lo mejor de los dos mundos.
ꕤ *$prefixgrabboobs* + <mention>
> Agarrar tetas.
ꕤ *$prefixgrope* + <mention>
> Manosear a alguien.
ꕤ *$prefixhandjob* + <mention>
> Hacer una paja.
ꕤ *$prefixlickass* + <mention>
> Lamer un culo.
ꕤ *$prefixlickdick* + <mention>
> Lamer un pene.
ꕤ *$prefixlickpussy* + <mention>
> Lamer un coño.
ꕤ *$prefixorgy » $prefixorgia* + <mention>
> Organizar una orgía.
ꕤ *$prefixpegging* + <mention>
> Dar por detrás.
ꕤ *$prefixsixnine » $prefix69* + <mention>
> Haz un 69 con alguien.
ꕤ *$prefixspank » $prefixnalgada* + <mention>
> Dar una nalgada.
ꕤ *$prefixsquirt » $prefixsquirting* + <mention>
> Tener un squirt.
ꕤ *$prefixsuckboobs* + <mention>
> Chupar tetas.
ꕤ *$prefixthighjob* + <mention>
> Hacer una entre piernas.
ꕤ *$prefixundress » $prefixencuerar* + <mention>
> Desnudar a alguien.
ꕤ *$prefixyaoi* + <mention>
> Momento muy intenso.
ꕤ *$prefixYuri » $prefixtijeras* + <mention>
> Hacer tijeras.
╰ׅ͜─֟͜─͜─ٞ͜─͜─๊͜─͜─๋͜─⃔═̶፝֟͜═̶⃔─๋͜─͜─͜─๊͜─ٞ͜─͜─֟͜┈ࠢ͜╯ׅ`,
anime: `╭┈ࠢ͜─ׄ֟፝͜─ׄ͜─ׄ͜╴𐔌 *ANIME* 𐦯╶͜─ׄ͜─ׄ֟፝͜─ׄ͜─ׄ͜
> ✐ Comandos de reacciones de Anime.
ꕤ *$prefixwaifu » $prefixneko*
> Buscar una waifu aleatoria.
ꕤ *$prefixppcouple » $prefixppcp* 
> Generar imágenes para amistades o parejas.
ꕤ *$prefixpeek » $prefixmirar* + <mention>
> Mirar a alguien.
ꕤ *$prefixcomfort » $prefixconsolar* + <mention>
> Consolar a alguien.
ꕤ *$prefixthinkhard » $prefixpensar* + <mention>
> Pensar intensamente.
ꕤ *$prefixcurious » $prefixcurioso* + <mention>
> Mostrar curiosidad.
ꕤ *$prefixsniff » $prefixoler* + <mention>
> Oler a alguien.
ꕤ *$prefixstare » $prefixmirar* + <mention>
> Mirar fijamente.
ꕤ *$prefixtrip » $prefixtropezar* + <mention>
> Tropezar con alguien.
ꕤ *$prefixblowkiss » $prefixbesito* + <mention>
> Mandar un besito.
ꕤ *$prefixsnuggle » $prefixacurrucar* + <mention>
> Acurrucarse con alguien.
ꕤ *$prefixangry » $prefixenojado* + <mention>
> Estar enojado.
ꕤ *$prefixbleh » $prefixmeh* + <mention>
> Sacar la lengua.
ꕤ *$prefixbored » $prefixaburrido* + <mention>
> Estar aburrido.
ꕤ *$prefixclap » $prefixaplaudir* + <mention>
> Aplaudir.
ꕤ *$prefixcoffee » $prefixcafe* + <mention>
> Tomar café.
ꕤ *$prefixcold » $prefixfrio* + <mention>
> Tener frío.
ꕤ *$prefixsing » $prefixcantar* + <mention>
> Cantar.
ꕤ *$prefixtickle » $prefixcosquillas* + <mention>
> Hacer cosquillas.
ꕤ *$prefixscream » $prefixgritar* + <mention>
> Gritar.
ꕤ *$prefixpush » $prefixempujar* + <mention>
> Empujar a alguien.
ꕤ *$prefixnope » $prefixno* + <mention>
> Negarse a hacer algo.
ꕤ *$prefixjump » $prefixsaltar* + <mention>
> Saltar.
ꕤ *$prefixheat » $prefixcalor* + <mention>
> Tener calor.
ꕤ *$prefixgaming » $prefixjugar* + <mention>
> Jugar videojuegos.
ꕤ *$prefixdraw » $prefixdibujar* + <mention>
> Dibujar.
ꕤ *$prefixcall » $prefixllamar* + <mention>
> Llamar a alguien.
ꕤ *$prefixdramatic » $prefixdrama* + <mention>
> Drama.
ꕤ *$prefixdrunk » $prefixborracho* + <mention>
> Estar borracho.
ꕤ *$prefiximpregnate » $prefixembarazar* + <mention>
> Embarazar a alguien.
ꕤ *$prefixkisscheek » $prefixbeso* + <mention>
> Beso en la mejilla.
ꕤ *$prefixlaugh » $prefixreir* + <mention>
> Reírse de alguien.
ꕤ *$prefixlove » $prefixamor* + <mention>
> Sentirse enamorado.
ꕤ *$prefixpout » $prefixmueca* + <mention>
> Hacer pucheros.
ꕤ *$prefixpunch » $prefixgolpear* + <mention>
> Dar un puñetazo.
ꕤ *$prefixrun » $prefixcorrer* + <mention>
> Correr.
ꕤ *$prefixsad » $prefixtriste* + <mention>
> Expresar tristeza.
ꕤ *$prefixscared » $prefixasustado* + <mention>
> Estar asustado.
ꕤ *$prefixseduce » $prefixseducir* + <mention>
> Seducir a alguien.
ꕤ *$prefixshy » $prefixtimido* + <mention>
> Sentir timidez.
ꕤ *$prefixsleep » $prefixdormir* + <mention>
> Tumbarse a dormir.
ꕤ *$prefixsmoke » $prefixfumar* + <mention>
> Fumar.
ꕤ *$prefixspit » $prefixescupir* + <mention>
> Escupir.
ꕤ *$prefixstep » $prefixpisar* + <mention>
> Pisar a

---
> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ˚₊· ͟͟͞͞  ɪ ᴀᴍ  Aᴅʀɪᴇɴ
`.trim()

    try {
        // Usamos el global.banner para que se vea en grande
        const banner = global.banner 
        
        const ctx = {
            externalAdReply: {
                title: 'ᴍᴀsʜᴀ ᴋᴜᴊᴏᴜ ᴍᴅ ⏤ sʏsᴛᴇᴍ',
                body: 'Premium WhatsApp Bot Experience',
                mediaType: 1,
                previewType: 0,
                renderLargerThumbnail: true, // ESTO HACE QUE EL BANNER SEA GRANDE
                thumbnailUrl: banner,
                sourceUrl: global.rcanal || 'https://github.com/Zoredevteam-ctrl'
            }
        }

        await conn.sendMessage(m.chat, { 
            text: menu, 
            contextInfo: ctx 
        }, { quoted: m })

    } catch (e) {
        await m.reply(menu)
    }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'comandos'] 

export default handler

// ── Funciones de Ayuda ────────────────────────────────────────────────────────

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

function getGreeting() {
    let hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Buenos días'
    if (hour >= 12 && hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
}
