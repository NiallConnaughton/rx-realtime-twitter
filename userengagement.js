function run(tweetStream, chartHelper) {
    let scheduler = tweetStream.scheduler;

    // how many users were engaged over 3 minute sliding windows?
    let distinctUsers = tweetStream.stream
        .windowWithTime(180000, 5000, scheduler)
        .flatMap(w => w.distinct(t => t.screenName).count())
        .share();

    let usersTrace = {
        x: [],
        y: [],
        type: "scatter",
        mode: "lines",
        line: {
            color: "#00acff",
            width: 3
        }
    };
    let usersData = [usersTrace];

    let xaxis = chartHelper.createDateAxis(tweetStream);
    let yaxis = chartHelper.createCountedAxis(tweetStream.activeUsersMax);
    let layout = chartHelper.createLayout(xaxis, yaxis, tweetStream.title + " - Active users");
    Plotly.newPlot("engagedUsersChart", usersData, layout, { showLink: false, displayModeBar: false });

    distinctUsers.map(count => ({ timestamp: currentTimestamp(scheduler), users: count }))
        .subscribe(c => {
            usersTrace.x.push(c.timestamp);
            usersTrace.y.push(c.users);
        });

    Rx.Observable.interval(100)
        .takeUntil(distinctUsers.last())
        .subscribe(_ => Plotly.redraw("engagedUsersChart", usersData, layout));

    dashboard.updateReplaySpeed(500, tweetStream.schedulerProvider);
    scheduler.advanceBy(180000);
}

let dashboard = new Dashboard(run);
window.onload = () => dashboard.setup();
