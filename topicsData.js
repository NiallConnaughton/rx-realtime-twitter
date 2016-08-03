function getWordStream(tweetStream) {
    // build the list of words to filter out
    // include the search terms used to stream the tweets in the first place, as they
    // will be in every tweet we've received
    let filteredWords = stopwords();
    tweetStream.searchTerms.forEach(t => filteredWords[t] = true);

    let words = tweetStream.stream
        .flatMap(t => t.text.split(/[\s,."]+/)) // split words on spaces, punctuation
        .map(w => w.toLowerCase().replace(/[#@:\-\u2013\u2014\u2015!']/g, "")) // remove unwanted chars
        .filter(w => w.length > 2 && // minimum word length of 2, remove urls
            !filteredWords[w] &&
            !w.startsWith("http"));

    return words;
}

function getWordCountStats(tweetStream, maxTopWords) {
    maxTopWords || (maxTopWords = 10);
    let scheduler = tweetStream.scheduler;

    let words = getWordStream(tweetStream);
    let createEmptyStats = () => ({ counts: {}, top: [] });
    let wordCounts = words.windowWithTime(300000, 5000, scheduler)
                          .flatMap(wordWindow => wordWindow.reduce(updateWordCounts, createEmptyStats()))
                          .do(stats => stats.timestamp = currentTimestamp(scheduler));

    let wordStats = wordCounts.map(stats => getTopWords(stats, maxTopWords))
                              .share();

    return wordStats;
}

function updateWordCounts(stats, word) {
    if (!stats.counts[word]) {
        stats.counts[word] = 1;
    } else {
        stats.counts[word]++;
    }

    return stats;
}

function getTopWords(stats, maxTopWords) {
    let words = [];

    for (var word in stats.counts) {
        words.push({ word: word, count: stats.counts[word] });
    }

    words.sort((a, b) => b.count - a.count);
    let topWords = words.slice(0, maxTopWords);
    stats.top = topWords;

    return stats;
}
