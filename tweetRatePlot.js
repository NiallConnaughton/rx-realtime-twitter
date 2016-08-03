function plotTweetRate(tweetStream, tweetRates, spikes, showSpikes, chartHelper) {
    let tweetRateTrace = {
        x: [],
        y: [],
        mode: "lines",
        type: "scatter",
        line: {
            color: "#00acff",
            width: 3
        }
    };

    let spikesTrace = {
        x: [],
        y: [],
        mode: "markers",
        type: "scatter",
        marker: {
            color: "rgba(230, 50, 50, 0.5)",
            size: 18
        },
        visible: showSpikes
    }

    let xAxis = chartHelper.createDateAxis(tweetStream);
    let yAxis = chartHelper.createCountedAxis(tweetStream.tpmMax);
    let layout = chartHelper.createLayout(xAxis, yAxis, tweetStream.title + " - Tweets per minute");

    let data = [tweetRateTrace, spikesTrace];
    Plotly.newPlot("tweetRateChart", data, layout, { showLink: false, displayModeBar: false });
    let redrawGraph = () => Plotly.redraw("tweetRateChart", data, layout);

    tweetRates.subscribe(tweetRate => {
        tweetRateTrace.x.push(tweetRate.now);
        tweetRateTrace.y.push(tweetRate.rate);
    });

    spikes.subscribe(s => {
        spikesTrace.x.push(s.now);
        spikesTrace.y.push(s.tweetRate);
    });

    // redraw graph 20 times per real second, rather than every time the data
    // ticks, to reduce load on browser when replaying at high speed
    Rx.Observable.interval(50)
                 .takeUntil(tweetRates.last())
                 .finally(redrawGraph)
                 .subscribe(redrawGraph);

    tweetStream.scheduler.advanceBy(60000);
}