function displayHotTopics(hotTopics, tweetStream) {
    let hotTopicsDiv = document.getElementById("hotTopics");

    while (hotTopicsDiv.firstChild)
        hotTopicsDiv.removeChild(hotTopicsDiv.firstChild);

    hotTopics.subscribe(stats => {
        let topicsNode = document.createElement("div");

        let timestamp = document.createElement("span");
        timestamp.textContent = moment(tweetStream.scheduler.now()).format("HH:mm:ss");
        timestamp.className = "timestamp";

        let words = document.createElement("span");
        words.textContent = stats.topics.join(", ");
        words.className = "topics";

        topicsNode.appendChild(timestamp);
        topicsNode.appendChild(words);
        hotTopicsDiv.appendChild(topicsNode);
    });
}

function getImportantTopics(topics) {
    // take all topics with counts up to 70% of the top topic
    let topTopicCount = topics[0].count;
    let cutoff = 0.7 * topTopicCount;
    let cutoffIndex = _.findIndex(topics, topic => topic.count < cutoff);

    // take at least 2 topics
    cutoffIndex = Math.max(2, cutoffIndex);

    // we only need the word, not the { word, count } object
    let importantTopics = topics.slice(0, cutoffIndex)
        .map(topic => topic.word);

    return importantTopics;
}

function getHotTopics(spikes, topics, tweetStream) {
    // wait until spike signal pauses for 30 seconds to summarise the whole spike with one set of words
    // for each spike, take the latest set of topics and get the most important ones

    return spikes.debounce(30000, tweetStream.scheduler)
        .withLatestFrom(topics,
        (spike, wordStats) => ({
            tweetsPerMinute: spike.tweetRate,
            topics: getImportantTopics(wordStats.top)
        }));
}

function run(tweetStream, chartHelper) {
    let tweetRate = getTweetRate(tweetStream.stream, 1, tweetStream.scheduler);
    let spikes = getSpikes(tweetStream.stream, tweetStream.scheduler, tweetRate, 2);
    let topics = getWordCountStats(tweetStream);
    let hotTopics = getHotTopics(spikes, topics, tweetStream);

    plotTweetRate(tweetStream, tweetRate, spikes, true, chartHelper);
    displayHotTopics(hotTopics, tweetStream);

    dashboard.updateReplaySpeed(500, tweetStream.schedulerProvider);
}

let dashboard = new Dashboard(run);
window.onload = () => dashboard.setup();