const fs = require('fs');
const path = require('path');

function menu(sock, message) {
    const menupath = path.join(__dirname, '../commands');

    function readConfig() {
        const configPath = path.join(__dirname, '../config.txt'); // Change path to './config.txt'
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
    const footer = config.FOOTER;
    const prefix = config.PREFIX;

    fs.readdir(menupath, (err, files) => {
        if (err) {
            sock.sendMessage(message.key.remoteJid, { text: 'Gagal membaca daftar menu!' });
            return;
        }
        const jsFiles = files.filter(file => file.endsWith('.js'));
        const fileList = jsFiles.map(file => file.replace('.js', '')).join('\n- ');
        sock.sendMessage(message.key.remoteJid, { text: `Menu yang tersedia di CLOVBOT-BASE\n*prefix untuk menjalankan menu adalah (${prefix}) \n\n- ${fileList}\n\n _${footer}_`});
    });
}

module.exports = menu;
