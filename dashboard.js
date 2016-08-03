function Dashboard(tweetStreamHandler) {

    let replaySpeedSpan = document.getElementById("replaySpeed");
    this.updateReplaySpeed = (speed, scheduler) => {
        scheduler.timeMultiplier = speed;
        replaySpeedSpan.textContent = speed + "x";
    };

    let bindReplaySpeed = scheduler => {
        let pauseButton = document.getElementById("pauseButton");
        let increaseSpeedButton = document.getElementById("increaseSpeedButton");
        let decreaseSpeedButton = document.getElementById("decreaseSpeedButton");

        let speedIncreases = Rx.Observable.fromEvent(increaseSpeedButton, "click")
            .map(_ => Math.max(scheduler.timeMultiplier * 5, 1));

        let speedDecreases = Rx.Observable.fromEvent(decreaseSpeedButton, "click")
            .map(_ => Math.round(scheduler.timeMultiplier / 5));

        let oldSpeed = 1;
        let pauses = Rx.Observable.fromEvent(pauseButton, "click")
            .do(_ => oldSpeed = scheduler.timeMultiplier ? scheduler.timeMultiplier : oldSpeed)
            .map(_ => scheduler.timeMultiplier === 0 ? oldSpeed : 0);

        Rx.Observable.merge(speedIncreases, speedDecreases, pauses)
            .do(speed => pauseButton.textContent = speed === 0 ? "Resume" : "Pause")
            .subscribe(speed => this.updateReplaySpeed(speed, scheduler));
    };

    let updateLabels = (stream, sourceFile) => {
        let fileLabel = document.getElementById("sourceFile");
        let tweetCountLabel = document.getElementById("tweetCount");
        let currentTimeLabel = document.getElementById("currentTime");

        fileLabel.textContent = sourceFile;
        tweetCountLabel.textContent = stream.tweetCount;

        stream.schedulerProvider.now.subscribe(n => currentTimeLabel.textContent = formatTimestamp(n));
    };

    let start = tweetStream => {
        let scheduler = tweetStream.schedulerProvider;
        bindReplaySpeed(scheduler);

        console.log(tweetStream.tweetCount + " tweets");

        tweetStreamHandler(tweetStream, new ChartHelper());
        tweetStream.start();
    };

    let currentStream = null;
    let createDataButtons = () => {
        let sourceDataDiv = document.getElementById("sourceData");

        Object.keys(tweetStreamData).forEach(key => {
            let button = document.createElement("button");
            button.innerHTML = key;
            button.className = "button sourceDataButton";

            button.onclick = () => {
                let data = tweetStreamData[key]();
                data.title = key;

                currentStream && currentStream.stop();
                currentStream = new TwitterStream(data);
                updateLabels(currentStream, key);
                start(currentStream);
            };

            sourceDataDiv.appendChild(button);
        });
    };
    this.setup = createDataButtons;
}

let tweetStreamData = { };

let formatTimestamp = (timestamp) => moment(timestamp).format(timestampFormat);
let currentTimestamp = (scheduler) => formatTimestamp(scheduler.now());