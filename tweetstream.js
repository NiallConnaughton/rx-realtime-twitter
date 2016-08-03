function TwitterStream(tweetData) {
    this.stopped = new Rx.Subject();

    let updateTweet = (tweet) => {
        if (!tweet)
            return;

        tweet.timestamp = moment(tweet.createdAt);
        tweet.displayTimestamp = tweet.timestamp.format(timestampFormat);
        updateTweet(tweet.retweetedTweet);
        updateTweet(tweet.quotedTweet);
    }

    tweetData.tweets.forEach(updateTweet);

    this.tweets = tweetData.tweets;
    this.searchTerms = tweetData.searchTerms;
    this.title = tweetData.title;
    this.tweetCount = this.tweets.length;
    this.firstTweet = this.tweets[0];
    this.lastTweet = this.tweets[this.tweets.length - 1];

    this.tpmMax = tweetData.tpmMax;
    this.activeUsersMax = tweetData.activeUsersMax;
    this.wordMentionMax = tweetData.wordMentionMax;

    this.schedulerProvider = new ReplayScheduler(this.firstTweet.timestamp.toDate().getTime());
    this.scheduler = this.schedulerProvider.scheduler;

    var combinedTweets = Rx.Observable.for(this.tweets, t => Rx.Observable.return(t).delay(t.timestamp.toDate(), this.schedulerProvider.scheduler));

    this.stream = combinedTweets
                    .takeUntil(this.stopped)
                    .finally(() => this.schedulerProvider.stop())
                    .share();
}

TwitterStream.prototype.start = function () {
    this.schedulerProvider.start();
}

TwitterStream.prototype.stop = function () {
    this.stopped.onNext(0);
}

timestampFormat = "YYYY-MM-DD HH:mm:ss";
