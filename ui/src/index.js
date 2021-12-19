const Plotly = require('plotly.js-dist');

const generateRange = (min, max) => {
    let precision = 0.1;
    let freqArr = [...new Array((max - min) * (1 / precision))].map((_, idx) => min + idx * precision);
    let ampArr = [...new Array((max - min) * (1 / precision))].map(() => 0);

    freqArr.push(max);
    ampArr.push(0);

    return {
        freq: freqArr,
        amp: ampArr,
        rangeMin: min,
        rangeMax: max
    }
}

const updateSpectrumData = (band, freq, amp, spectrumData) => {
    let freqData = spectrumData.freq;
    let ampData = spectrumData.amp;

    let idx = freqData.indexOf(freq);

    if (idx >= 0) {
        ampData[idx] = amp;
    }

    spectrumData.freq = freqData;
    spectrumData.amp = ampData;

    return spectrumData;
}

const plotOnUpdate = (event, spectrumData) => {
    let wsData = JSON.parse(event.data);
    let band = wsData.band.toLowerCase();
    let amp = wsData.amp;
    let freq = wsData.freq;
    let source = wsData.sourceId;

    spectrumData = updateSpectrumData(band, freq, amp, spectrumData);

    let graphTrace = {
        x: spectrumData.freq,
        y: spectrumData.amp,
        mode: "line",
        name: source,
        type: 'scattergl'
    }

    let layout = {
        title: band.toUpperCase(),
        xaxis: {
            title: 'MHz',
            range: [spectrumData.rangeMin, spectrumData.rangeMax],
            type: 'linear'
        },
        yaxis: {
            title: 'dBm',
            range: [-30, 30],
            type: 'linear'
        }
    }

    let graphData = [graphTrace];

    Plotly.newPlot(`graph-${band}`, graphData, layout);
}

const startGraph = (data) => {
    let band = data.band;
    let rangeMin = data.range.min;
    let rangeMax = data.range.max;
    let wsUrl = `ws://app.poc.local/ws/${band}`;

    let spectrumData = generateRange(rangeMin, rangeMax);

    let ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
        plotOnUpdate(event, spectrumData);
    }
}

startGraph({
    band: 'fm',
    range: {
        min: 88,
        max: 108
    }
});

startGraph({
    band: 'vhf',
    range: {
        min: 174,
        max: 216
    }
});

startGraph({
    band: 'uhf',
    range: {
        min: 470,
        max: 806
    }
});