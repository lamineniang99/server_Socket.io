const { Server } = require('socket.io');
const net = require('net');

const io = new Server({
    cors: {
        origin: 'http://localhost:4200',
        methods: ["GET", "POST"]
    }
});

const tcpClient = new net.Socket();
const TCP_SERVER_HOST = "51.77.212.1666";
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
            const roomName = `imei_${data.imei}`;
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
            let roomName = `imei_${message.imei}`;
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





































// const { Server } = require('socket.io');
// const net = require('net');


// const server = new Server({ cors: { 'origin': 'http://localhost:4200' } });

// // Créer une connexion TCP vers le serveur cible
// const tcpClient = new net.Socket();
// const TCP_SERVER_HOST = "44.204.65.69";  // Modifier l'hôte du serveur TCP cible
// const TCP_SERVER_PORT = 3000; // Modifier le port du serveur TCP cible

// // tcpClient.connect(TCP_SERVER_PORT, TCP_SERVER_HOST, () => {
// //     console.log('Connecté au serveur TCP');
// // });


// let tcpReconnectionTimer;

// function connectTCP() {
//     tcpClient.connect(TCP_SERVER_PORT, TCP_SERVER_HOST, () => {
//       console.log('Connecté au serveur TCP');
//       clearTimeout(tcpReconnectionTimer);
//     });
    
//     tcpClient.on('error', (error) => {
//       console.log('Erreur de connexion TCP:', error.message);
//       tcpClient.end();
//       tcpReconnectionTimer = setTimeout(connectTCP, 5000); // Tenter une reconnexion après 5 secondes
//     });
//   }
  
//   connectTCP();
  

     
// // Gestion des connexions Socket.IO
// server.on('connection', (socket) => {

//     console.log('Un client s\'est connecté');

//     // Gestion des messages Socket.IO
//     socket.on('data', (data) => {
//         //console.log('Message reçu:', data);
//         const perimetre = (data.perimetre.position == 'left')? '00':'01'
//         const status1 = data.perimetre.status? '01':'00'
//         let dataToSend = data.type+" - "+data.imei+" - 0"+data.position+" - "+perimetre+" - "+status1
//         console.log("les données a envoyer cote server",dataToSend);
//         // let message = JSON.parse(data) ;
//         // console.log("data after filtrage", message);
//         // Transférer les données au serveur TCP
//         tcpClient.write(dataToSend);
//     });
 
       
//     // Gestion de la déconnexion Socket.IO
//     socket.on('disconnect', () => {
//         console.log('Un client s\'est déconnecté');
//     });
// });

// // Gestion des événements du serveur TCP
// tcpClient.on('data', (data) => {
//     console.log('Données reçues du serveur TCP:', data.toString());
// });

// tcpClient.on('close', () => {
//     console.log('Connexion TCP fermée')
//     connectTCP();
// });

// // Démarrer le serveur Socket.IO
// const PORT = process.env.PORT || 3300;
// server.listen(PORT);
// console.log(`Serveur Socket.IO démarré sur le port ${PORT}`);
