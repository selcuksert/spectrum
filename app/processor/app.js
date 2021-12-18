const {EXCHANGE_NAME} = require("../common/definitions");
const amqplib = require('amqplib');
const {getFormattedTime} = require("../common/functions");
const config = require("../common/config");

const brokerUrl = `${config.broker.protocol}://${config.broker.host}:${config.broker.port}`;

const start = () => {
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
            registerConsumer(channel, result.queue);
        });
    }).catch((err) => {
        if (err.code === 'ECONNREFUSED') {
            console.log(`Unable to connect to broker (${brokerUrl}). Retrying in 2 seconds...`);
            setTimeout(() => start(), 2000);
        } else {
            console.error(err);
        }
    });
}

const registerConsumer = (channel, queueName) => {
    return channel.consume(queueName, (msg) => {
        console.log('<=', getFormattedTime(), msg.content.toString());
    }, {noAck: true});
}

start();