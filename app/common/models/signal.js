class Signal {
    constructor(sourceId, freq, amp, generatedAt, band) {
        this.sourceId = sourceId;
        this.freq = freq;
        this.amp = amp;
        this.generatedat = generatedAt;
        this.band = band;
    }
}

module.exports = Signal;