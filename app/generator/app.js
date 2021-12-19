const faker = require('faker/index');
const amqplib = require('amqplib');
const Signal = require('../common/models/signal');
const moment = require('moment-timezone');
const bands = require('../common/models/bands');
const config = require('../common/config');
const {EXCHANGE_NAME} = require("../common/definitions");

const brokerUrl = `${config.broker.protocol}://${config.broker.host}:${config.broker.port}`;
const sourceId = faker.datatype.uuid();

const start = () => {
    let band = process.env.BAND || undefined;

    if (!band) {
        console.error(`No band specified!`);
        process.exit();
    }

    band = band.toUpperCase();

    let amqpConn = amqplib.connect(brokerUrl);
    amqpConn.then((conn) => {
        console.log(`Connected to broker (${brokerUrl})`);

        process.once('SIGINT', () => {
            conn.close();
        });

        conn.on("close", () => {
            console.log('Connection closed');
            process.exit();
        });

        return conn.createChannel();
    }).then((channel) => {
        let excOk = channel.assertExchange(EXCHANGE_NAME, 'topic', {durable: false});

        registerQueue(channel, excOk, band);

        excOk.then(() => {
            generateSignal(channel, band);
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

const generateSignal = (channel, band) => {
    let freq = undefined

    if (band === bands.FM.name) {
        freq = faker.datatype.float({min: bands.FM.min, max: bands.FM.max, precision: 0.1});
    }

    if (band === bands.UHF.name) {
        freq = faker.datatype.float({min: bands.UHF.min, max: bands.UHF.max, precision: 0.1});
    }

    if (band === bands.VHF.name) {
        freq = faker.datatype.float({min: bands.VHF.min, max: bands.VHF.max, precision: 0.1});
    }

    if (freq) {
        let amp = faker.datatype.float({min: -30, max: 30, precision: 0.1});
        let routingKey = `${band}.${sourceId}`;
        let generatedAt = moment().valueOf();
        let signal = new Signal(sourceId, freq, amp, generatedAt, band);

        channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(signal)));

        setTimeout(() => generateSignal(channel, band), 10);
    }
}

const registerQueue = (channel, excOk, bandName) => {
    let qok = excOk.then(() => {
        return channel.assertQueue(bandName);
    });

    qok.then((result) => {
        channel.bindQueue(result.queue, EXCHANGE_NAME, bandName + '.#');
    });
}

start();