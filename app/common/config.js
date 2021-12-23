module.exports = {
    broker: {
        host: process.env.BROKER_HOST || 'localhost',
        port: process.env.BROKER_PORT || 5672,
        protocol: process.env.BROKER_PROTOCOL || 'amqp',
    },
    webPort: process.env.WEB_PORT || 8080
}