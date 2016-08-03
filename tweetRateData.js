function getTweetRate(tweets, timeRangeMinutes, scheduler) {
    return tweets
        .windowWithTime(timeRangeMinutes * 60000, 5000, scheduler)
        .flatMap(w => w.count())
        .map(rate => ({ now: scheduler.now(), rate: rate / timeRangeMinutes }))
        .share();
}

function getSpikes(tweets, scheduler, tweetRates, comparisonWindowSize, threshold) {
    // default threshold to 15%
    !threshold && (threshold = 1.15);

    let comparisonRates = getTweetRate(tweets, comparisonWindowSize, scheduler)
                            .delay(60000, scheduler);

    let comparisons = tweetRates.withLatestFrom(comparisonRates,
    (current, comparison) => {
        // is the latest tweets per minute higher than the comparison window by the threshold amount?
        let ratio = current.rate / comparison.rate;
        return { now: current.now, tweetRate: current.rate, isHot: ratio > threshold };
    });

    return comparisons.filter(cmp => cmp.isHot).share();
}