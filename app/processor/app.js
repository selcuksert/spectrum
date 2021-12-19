const {EXCHANGE_NAME} = require("../common/definitions");
const amqplib = require('amqplib');
const config = require("../common/config");
const WebSocketServer = require("ws").WebSocketServer;

const brokerUrl = `${config.broker.protocol}://${config.broker.host}:${config.broker.port}`;

const wssPort = process.env.WSS_PORT || 9080;

const start = () => {
    startWebSocketServer();
}

const startAmqp = (ws) => {
    let band = process.env.BAND || undefined;

    if (!band) {
        console.error(`No band specified!`);
        process.exit();
    }

    band = band.toUpperCase();

    let amqpConn = amqplib.connect(brokerUrl);
    amqpConn.then((conn) => {
        process.once('SIGINT', () => {
            conn.close();
        });

        conn.on("close", () => {
            console.log('Connection closed');
            process.exit();
        });

        console.log(`Connected to broker (${brokerUrl})`);
        return conn.createChannel();
    }).then((channel) => {
        let excOk = channel.assertExchange(EXCHANGE_NAME, 'topic', {durable: false});

        let qok = excOk.then(() => {
            return channel.assertQueue(band);
        });

        qok.then((result) => {
            registerConsumer(channel, result.queue, ws);
        });
    }).catch((err) => {
        if (err.code === 'ECONNREFUSED') {
            console.log(`Unable to connect to broker (${brokerUrl}). Retrying in 2 seconds...`);
            setTimeout(() => startAmqp(ws), 2000);
        } else {
            console.error(err);
        }
    });
}

const startWebSocketServer = () => {
    let wss = new WebSocketServer({port: wssPort});

    wss.on('connection', (ws) => {
        console.log(`Started WebSocket Server`);
        startAmqp(ws);
    });

    process.once('SIGINT', () => {
        if (wss) {
            wss.close();
            console.log(`Stopped WebSocket Server`);
        }
    });
}

const registerConsumer = (channel, queueName, ws) => {
    return channel.consume(queueName, (msg) => {
        let data = msg.content.toString();
        ws.send(data);
    }, {noAck: true});
}

start();