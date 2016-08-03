function run(tweetStream, chartHelper) {
    let tweetRate = getTweetRate(tweetStream.stream, 1, tweetStream.scheduler);
    let spikes = getSpikes(tweetStream.stream, tweetStream.scheduler, tweetRate, 2);

    plotTweetRate(tweetStream, tweetRate, spikes, true, chartHelper);
    dashboard.updateReplaySpeed(500, tweetStream.schedulerProvider);
}

let dashboard = new Dashboard(run);
window.onload = () => dashboard.setup();