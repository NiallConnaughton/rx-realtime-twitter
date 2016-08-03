function plotHistogram(wordStats, tweetStream, chartHelper) {
    let yaxis = chartHelper.createAxis();
    yaxis.autorange = "reversed";

    let xaxis = chartHelper.createCountedAxis(tweetStream.wordMentionMax);
    xaxis.title = "Mentions"
    let layout = chartHelper.createLayout(xaxis, yaxis, tweetStream.title + " - Discussion Topics");
    layout.margin.l = 250;

    let data = [createHistogramData([])];
    Plotly.newPlot("topicsChart", data, layout, { showLink: false, displayModeBar: false });

    let redrawGraph = () => Plotly.redraw("topicsChart", data, layout);
    Rx.Observable.interval(100)
                 .takeUntil(wordStats.last())
                 .subscribe(redrawGraph);

    wordStats.subscribe(ws => data[0] = createHistogramData(ws));
}

function createHistogramData(wordStats) {
    let topicsTrace = {
        x: [],
        y: [],
        type: "bar",
        orientation: "h"
    };

    if (wordStats.top) {
        wordStats.top.forEach(ws => {
            topicsTrace.x.push(ws.count);
            topicsTrace.y.push(ws.word);
        });
    }

    return topicsTrace;
}

function run(tweetStream, chartHelper) {
    let firstTweet = tweetStream.firstTweet;
    console.log(firstTweet);

    let wordStats = getWordCountStats(tweetStream, 10);
    plotHistogram(wordStats, tweetStream, chartHelper);

    dashboard.updateReplaySpeed(200, tweetStream.schedulerProvider);
    tweetStream.scheduler.advanceBy(300000);
}

let dashboard = new Dashboard(run);
window.onload = () => dashboard.setup();
