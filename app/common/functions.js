const moment = require('moment-timezone');

const getFormattedTime = () => '[' + moment().tz('Europe/Istanbul').format('DD/MM/YYYY HH:mm:ss') + ']';

module.exports = {getFormattedTime}