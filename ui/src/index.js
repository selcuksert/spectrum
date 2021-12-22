const Plotly = require('plotly.js-dist');
require('bootstrap/dist/css/bootstrap.min.css');

let ws = undefined;

const plotOnUpdate = (event, range) => {
    let wsData = JSON.parse(event.data);
    let band = wsData.band.toLowerCase();
    let ampArr = wsData.ampArr;
    let freqArr = wsData.freqArr;
    let source = wsData.sourceId;

    let graphTrace = {
        x: freqArr,
        y: ampArr,
        mode: "line",
        name: source,
        type: 'scattergl'
    }

    let layout = {
        title: band.toUpperCase(),
        xaxis: {
            title: 'MHz',
            range: [range.min, range.max],
            type: 'linear'
        },
        yaxis: {
            title: 'dBm',
            range: [-40, 40],
            type: 'linear'
        }
    }

    let graphData = [graphTrace];

    Plotly.newPlot(`graph`, graphData, layout);
}

const startGraph = (band, range) => {
    if(ws) {
        ws.close();
    }

    let wsUrl = '';

    if(window.location.hostname.indexOf('apps-crc') > 0) {
        wsUrl=`ws://processor${band}-spectrum.apps-crc.testing`
    }
    else {
        wsUrl = `ws://app.poc.local/ws/${band}`;
    }

    ws = new WebSocket(wsUrl);

    ws.onopen = (e) => {
        console.log('WebSocket opened', e.currentTarget.url);
    }

    ws.onmessage = (event) => {
        plotOnUpdate(event, range);
    }

    ws.onclose = (e) => {
        console.log('WebSocket closed', e.currentTarget.url);
    }
}

const toggleActive = (band) => {
    $('#mf').removeClass('active');
    $('#hf').removeClass('active');
    $('#vhf').removeClass('active');
    $('#uhf').removeClass('active');
    $('#stop').removeClass('active');

    $(`#${band}`).addClass('active');
}

const clickHandler = (band, min, max) => {
    toggleActive(band);
    startGraph(band, {min: min, max: max});
}

(() => {
    clickHandler('mf', 0.3, 3);

    $('#mf').click(() => {
        clickHandler('mf', 0.3, 3);
    });

    $('#hf').click(() => {
        clickHandler('hf', 3, 30);
    });

    $('#vhf').click(() => {
        clickHandler('vhf', 30, 300);
    });

    $('#uhf').click(() => {
        clickHandler('uhf', 300, 3000);
    });

    $('#stop').click(() => {
        toggleActive('stop');
        if(ws) {
            ws.close();
        }
    });
})();
