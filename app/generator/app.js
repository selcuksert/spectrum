const faker = require('faker/index');
const amqplib = require('amqplib');
const Signal = require('../common/models/signal');
const moment = require('moment-timezone');
const bands = require('../common/models/bands');
const config = require('../common/config');
const {exchangeName, precision, amplitude, retryInSecs} = require("../common/definitions");
const express = require('express');
const cors = require('cors');
const app = express();

const brokerUrl = `${config.broker.protocol}://${config.broker.host}:${config.broker.port}`;
const sourceId = faker.datatype.uuid();

let active = true;

app.use(cors({
    origin: '*'
}));

app.listen(config.webPort, () => {
    console.log(`Example app listening at ${config.webPort}`)
});

app.get('/on', (_, res) => {
    active = true;
    res.send('Generator enabled.');
});

app.get('/off', (_, res) => {
    active = false;
    res.send('Generator disabled.')
});

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
        let excOk = channel.assertExchange(exchangeName, 'topic', {durable: false});

        registerQueue(channel, excOk, band);

        excOk.then(() => {
            generateSignal(channel, band);
        });
    }).catch((err) => {
        if (err.code === 'ECONNREFUSED') {
            console.log(`Unable to connect to broker (${brokerUrl}). Retrying in ${retryInSecs} seconds...`);
            setTimeout(() => start(), retryInSecs * 1000);
        } else {
            console.error(err);
        }
    });
}

const generateRange = (min, max, samplesPerMhz) => {
    let freqArr = [...new Array((max - min) * (samplesPerMhz))].map((_, idx) => min + idx * precision);
    let ampArr = [...new Array((max - min) * (samplesPerMhz))].map(() => faker.datatype.float({
        min: amplitude.min,
        max: amplitude.max,
        precision: precision
    }));

    freqArr.push(max);
    ampArr.push(faker.datatype.float({min: amplitude.min, max: amplitude.max, precision: precision}));

    return {
        freqArr: freqArr,
        ampArr: ampArr,
    }
}

const generateSignal = (channel, band) => {
    let min = bands[`${band.toUpperCase()}`].min;
    let max = bands[`${band.toUpperCase()}`].max;
    let samplesPerMhz = bands[`${band.toUpperCase()}`].samplesPerMhz;
    let range = generateRange(min, max, samplesPerMhz);
    let freqArr = range.freqArr;
    let ampArr = range.ampArr;

    let routingKey = `${band}.${sourceId}`;
    let generatedAt = moment().valueOf();
    let signal = new Signal(sourceId, freqArr, ampArr, generatedAt, band);

    if (active) {
        channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(signal)));
    }

    setTimeout(() => generateSignal(channel, band), 1);
}

const registerQueue = (channel, excOk, bandName) => {
    let qok = excOk.then(() => {
        return channel.assertQueue(bandName);
    });

    qok.then((result) => {
        channel.bindQueue(result.queue, exchangeName, bandName + '.#');
    });
}

start();