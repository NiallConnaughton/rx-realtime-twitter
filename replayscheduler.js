function ReplayScheduler(startTime) {
    this.scheduler = new Rx.HistoricalScheduler(startTime);

    this.timeMultiplier = 1;
    this.subscriptions = new Rx.CompositeDisposable();
    this.started = new Rx.Subject();
    this.now = new Rx.Subject();
    this.speedChanged = new Rx.Subject();
}

ReplayScheduler.prototype.start = function () {
    this.started.onNext(0);

    var refreshInterval = 50;

    this.subscriptions.add(
        Rx.Observable
        .interval(refreshInterval)
        .do(() => this.scheduler.advanceBy(refreshInterval * this.timeMultiplier))
        .subscribe(() => this.now.onNext(this.scheduler.now()))
    );
}

ReplayScheduler.prototype.stop = function () {
    this.subscriptions.dispose();
}