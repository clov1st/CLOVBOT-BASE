const fs = require('fs');
const path = require('path');

async function bot(sock, message) {
    // Read config
    function readConfig() {
        const configPath = path.join(__dirname, '../config.txt'); 
        const configText = fs.readFileSync(configPath, 'utf-8');
        const configLines = configText.split('\n');
        const config = {};
        configLines.forEach(line => {
            const [key, value] = line.split('=');
            config[key.trim()] = value.trim();
        });
        return config;
    }

    const os = require('os');
    const config = readConfig();
    const botName = config.BOT_NAME;

    // Get uptime
    const uptime = formatUptime(os.uptime());
    const footer = config.FOOTER;

    // Create message
    const botMessage = `*${botName} Active!*\n\n- uptime : ${uptime}\n\n_${footer}_`;

    // Send respond to user
    (async () => {
        await sock.sendMessage(message.key.remoteJid, { text: botMessage });
    })();
}

module.exports = bot;

function formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor(seconds % (3600 * 24) / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secondsLeft = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secondsLeft}s`;
}