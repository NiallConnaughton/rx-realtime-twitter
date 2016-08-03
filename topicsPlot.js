function getListEvents(addButtonId, removeButtonId, inputboxId, listboxId) {
    let addButton = document.getElementById(addButtonId);
    let removeButton = document.getElementById(removeButtonId);
    let adds = Rx.Observable.fromEvent(addButton, "click");
    let removes = Rx.Observable.fromEvent(removeButton, "click");

    let listbox = document.getElementById(listboxId);
    let inputbox = document.getElementById(inputboxId);
    let form = inputbox.parentElement;
    form.onsubmit = () => false;

    let addedTerms = adds.filter(word => word !== "")
                         .map(_ => ({ action: "add", word: inputbox.value }));

    let removedTerms = removes.filter(_ => listbox.selectedOptions.length === 1)
                              .map(_ => ({ action: "remove", word: listbox.selectedOptions[0].value }));

    return addedTerms.merge(removedTerms)
        .do(change => updateList(change, listbox))
        .do(_ => inputbox.value = "");
}

function updateList(listChange, listbox) {
    let word = listChange.word;

    if (listChange.action === "add") {
        let listItem = document.createElement("option");
        listItem.value = word;
        listItem.appendChild(document.createTextNode(word));
        listbox.appendChild(listItem);
    } else {
        let child = _.find(listbox.children, c => c.value === word);
        if (child)
            listbox.removeChild(child);
    }

    listbox.size = listbox.children.length;
}

function plotTrackedWords(wordStats, tweetStream, chartHelper) {
    let wordMentions = {};
    let trackedWords = [];

    let trackedWordsChanges = getListEvents("trackWordButton", "removeTrackedWordButton", "trackedWord", "trackedWordsList");
    trackedWordsChanges.subscribe(change => updateTrackedWords(change, wordMentions, trackedWords));

    let xaxis = chartHelper.createDateAxis(tweetStream);
    let yaxis = chartHelper.createCountedAxis(tweetStream.wordMentionMax);
    let layout = chartHelper.createLayout(xaxis, yaxis, tweetStream.title + " - Discussion topics");
    layout.showlegend = true;

    Plotly.newPlot("topicsLineChart", trackedWords, layout, { showLink: false, displayModeBar: false });
    let redraw = () => Plotly.redraw("topicsLineChart", trackedWords, layout);

    wordStats.subscribe(ws => updateWordMentions(wordMentions, ws));
    Rx.Observable.interval(100)
        .takeUntil(wordStats.last())
        .subscribe(redraw);

    var truncateTopicsButton = document.getElementById("truncateTopics");
    Rx.Observable.fromEvent(truncateTopicsButton, "click")
        .do(_ => truncateTopics(wordMentions, trackedWords))
        .subscribe(_ => redraw());
}

function truncateTopics(wordMentions, trackedWords) {
    let maxTopics = 10;
    if (trackedWords.length > maxTopics) {
        let topWords = _.orderBy(trackedWords, tw => wordMentions[tw.name].max, "desc");
        let threshold = topWords[maxTopics - 1].max;

        _.remove(trackedWords, wordTrace => wordTrace.max < threshold);
    } 
}

function startTrackingWord(word, wordMentions, trackedWords) {
    let newTrace = addWordMentionTrace(word, wordMentions);
    if (!trackedWords.some(w => w.name === word)) {
        trackedWords.push(newTrace);
    }
}

function stopTrackingWord(word, trackedWords) {
    _.remove(trackedWords, wordTrace => wordTrace.name === word);
}

function updateTrackedWords(change, wordMentions, trackedWords) {
    let word = change.word;

    if (change.action === "add") {
        startTrackingWord(word, wordMentions, trackedWords);
    } else {
        stopTrackingWord(word, trackedWords);
    }
}

function setTrackedWords(newWords, wordMentionData, wordTraces) {
    _.remove(wordTraces, w => !newWords.has(w.name));

    let keys = Array.from(newWords.keys());
    let alreadyCharted = wordTraces.map(w => w.name);
    let added = _.difference(keys, alreadyCharted);
    added.forEach(w => wordTraces.push(addWordMentionTrace(w, wordMentionData)));
}

function updateWordMentions(traces, wordStats) {
    Object.keys(wordStats.counts)
        .forEach(word => {
            let trace = traces[word];

            // if it's a new trace, and has at least 50 mentions, start tracking it
            let mentions = wordStats.counts[word];
            if (!trace && mentions > 50)
                trace = addWordMentionTrace(word, traces);

            if (trace) {
                trace.x.push(wordStats.timestamp);
                trace.y.push(mentions);
                trace.max = Math.max(trace.max, mentions);
            }
        });

    return traces;
}

function addWordMentionTrace(word, traces) {
    let trace = traces[word];
    if (trace)
        return trace;

    trace = {
        x: [],
        y: [],
        type: "scatter",
        mode: "lines",
        name: word,
        line: { width: 3 }
    };

    traces[word] = trace;
    return trace;
}

function run(tweetStream, chartHelper) {
    let firstTweet = tweetStream.firstTweet;
    console.log(firstTweet);

    let wordStats = getWordCountStats(tweetStream, 10);
    plotTrackedWords(wordStats, tweetStream, chartHelper);

    dashboard.updateReplaySpeed(300, tweetStream.schedulerProvider);
    tweetStream.scheduler.advanceBy(300000);
}

let dashboard = new Dashboard(run);
window.onload = () => dashboard.setup();
