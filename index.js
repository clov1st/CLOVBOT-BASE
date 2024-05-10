const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const Pino = require('pino');
const chalk = require('chalk'); 

// Control Logger, ubah level menjadi error untuk mempermudah debugging saat penambahan command
const logger = Pino({ level: 'silent' });

// Read config
function readConfig() {
    const configPath = path.join(__dirname, 'config.txt');
    const configText = fs.readFileSync(configPath, 'utf-8');
    const configLines = configText.split('\n');
    const config = {};
    configLines.forEach(line => {
        const [key, value] = line.split('=');
        config[key.trim()] = value.trim();
    });
    return config;
}
const config = readConfig();
const prefix = config.PREFIX;
const nameBot = config.BOT_NAME;

const processedMessages = new Set();

// Load commands
const commands = {};
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands[file.replace('.js', '')] = command;
}

// Connect to whatsapp
async function startClovBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const sock = makeWASocket({
        printQRInTerminal: true,  // Print QR code in terminal
        auth: state,
        browser: ['ClovBot-Base','Safari','1.0.0'],
        logger: logger
    });

    // save session
    sock.ev.on('creds.update', saveCreds);

    // Connection update
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('Koneksi ditutup, mencoba kembali: '), shouldReconnect);
            if (shouldReconnect) {
                startClovBot();
            }
        } else if (connection === 'open') {
            console.log(chalk.bold.green(`${nameBot} Active, Bot created by CLOV\n`));
        }
        if (qr) {
            console.log(chalk.bgBlue('QR Code:'), qr); // Cetak QR code
        }
    });
    
    // Load message from user
    sock.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (!message || !message.message) {
            console.error(chalk.white.bgRed('➢ Pesan tidak valid\n'));
            return;
        }
    
        const messageContent = message.message.conversation || message.message.extendedTextMessage?.text;
        const messageId = message.key.id;
    
        if (processedMessages.has(messageId) || !messageContent || typeof messageContent !== 'string') {
            return;
        }
    
        const args = messageContent.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
    
        if (commands[command]) {
            console.log(chalk.white.bgBlue(`➢ Command diterima: ${command}`)); // Log command yang diterima
            processedMessages.add(messageId);
            await commands[command](sock, message, args);
            console.log(chalk.black.bgGreen(`➢ Respons untuk command ${command} telah dikirim\n`)); // Log respons yang dikirim
        }
    });
}

startClovBot();
