async function tes(sock, message) {
    const botMessage = `Hello, Bot Active!`;
    (async () => {
        await sock.sendMessage(message.key.remoteJid, { text: botMessage });
    })();
}

module.exports = tes;