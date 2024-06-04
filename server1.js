const { Server } = require('socket.io');
const net = require('net');
const https = require('https');
const fs = require('fs');

// Charger les certificats SSL
const options = {
    key: fs.readFileSync('/path/to/your/private-key.pem'),
    cert: fs.readFileSync('/path/to/your/certificate.pem'),
    ca: fs.readFileSync('/path/to/your/ca.pem') // Facultatif, si vous avez un certificat d'autorité
};

// Créer un serveur HTTPS
const httpsServer = https.createServer(options);

const io = new Server(httpsServer, {
    cors: {
        origin: 'http://localhost:4200',
        methods: ["GET", "POST"]
    }
});

const tcpClient = new net.Socket();
const TCP_SERVER_HOST = "51.77.212.166";
const TCP_SERVER_PORT = 5000;

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

io.on('connection', (socket) => {
    console.log('Un client s\'est connecté');

    socket.on('data', (data) => {
        if (!data.perimetre) {
            console.log("premier message");
            console.log(data);
            if (tcpClient.writable) {
                tcpClient.write(data);
                console.log("ok premier connect");
            } else {
                console.log("Connexion TCP non disponible pour l'envoi de données.");
            }
        }else{
            const perimetre = (data.perimetre.position === 'left') ? '00' : '01';
            const status1 = data.perimetre.status ? '01' : '00';
            let dataToSend = data.type + " - " + data.imei + " - 0" + data.position + " - " + perimetre + " - " + status1;

            if (tcpClient.writable) {
                tcpClient.write(dataToSend);
            } else {
                console.log("Connexion TCP non disponible pour l'envoi de données.");
            }
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

tcpClient.on('data', (data) => {
    console.log("ce que j'ai recue " + data);
    let message = data
    try {
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

const PORT = process.env.PORT || 3300;
httpsServer.listen(PORT, () => {
    console.log(`Serveur HTTPS démarré sur le port ${PORT}`);
});
