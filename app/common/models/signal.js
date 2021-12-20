class Signal {
    constructor(sourceId, freqArr, ampArr, generatedAt, band) {
        this.sourceId = sourceId;
        this.freqArr = freqArr;
        this.ampArr = ampArr;
        this.generatedAt = generatedAt;
        this.band = band;
    }
}

module.exports = Signal;