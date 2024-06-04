const { Server } = require('socket.io');
const net = require('net');

const fs = require('fs');
const https = require('https');


const io = new Server({
    cors: {
        origin: 'https://sukali.nautx.sn',
        methods: ["GET", "POST"]
    }
});

const tcpClient = new net.Socket();
const TCP_SERVER_HOST = "51.77.212.166";
const TCP_SERVER_PORT = 5000;

// Tentative de connexion au serveur TCP et gestion des reconnexions
function connectTCP() {
    tcpClient.connect(TCP_SERVER_PORT, TCP_SERVER_HOST, () => {
        console.log('Connecté au serveur TCP');
        clearTimeout(tcpReconnectionTimer);
    });

    tcpClient.on('error', (error) => {
        console.log('Erreur de connexion TCP:', error.message);
        tcpClient.end();
        tcpReconnectionTimer = setInterval(connectTCP, 5000); // Tenter une reconnexion après 5 secondes
    });
}

let tcpReconnectionTimer = setTimeout(connectTCP, 5000);
connectTCP();

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
    console.log('Un client s\'est connecté');

    // Écouter les données envoyées par les clients pour les transférer au serveur TCP
    socket.on('data', (data) => {
        const perimetre = (data.perimetre.position === 'left') ? '00' : '01';
        const status1 = data.perimetre.status ? '01' : '00';
        let dataToSend = data.type + " - " + data.imei + " - 0" + data.position + " - " + perimetre + " - " + status1;
        // console.log("Données à envoyer au serveur TCP:", dataToSend);

        // Envoi des données au serveur TCP
        if (tcpClient.writable) {
            tcpClient.write(dataToSend);
        } else {
            console.log("Connexion TCP non disponible pour l'envoi de données.");
        }
    });

    socket.on('join_room', (data) => {
        if (data && data.imei) {
            const roomName = `${data.imei}`;
            socket.join(roomName);
            console.log(`Client ${socket.id} joined room: ${roomName}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client ${socket.id} s\'est déconnecté`);
    });
});

//Réception des données du serveur TCP et envoi aux rooms appropriées
tcpClient.on('data', (data) => {
    console.log("ce que j'ai recue "+data);
    let message = data
    try {
        // console.log(data);
        message = JSON.parse(message);
        console.log(message.imei);
        if (message && message.imei) {
            let roomName = `${message.imei}`;
	    let canal = roomName +  "update";
	    console.log("Canal name" , roomName);
	    io.emit( canal,  message);
            io.to(roomName).emit('update', message); // Envoyer les données à tous les clients dans cette room
        }
    } catch (error) {
        console.error('Erreur de parsing JSON:', error);
    }
});

tcpClient.on('close', () => {
    console.log('Connexion TCP fermée');
    connectTCP();
});

// Démarrer le serveur Socket.IO sur le port spécifié
const PORT = process.env.PORT || 3300;
io.listen(PORT);
console.log(`Serveur Socket.IO démarré sur le port ${PORT}`);

