function ChartHelper() {

}

ChartHelper.prototype.createAxis = function() {
	return {
		color: "#eeeeee"
	}
}

ChartHelper.prototype.createDateAxis = function(tweetStream) {
	let axis = this.createAxis();

	axis.range = [tweetStream.firstTweet.timestamp.valueOf(), tweetStream.lastTweet.timestamp.valueOf()];
	axis.type = "date";
	axis.title = "Time";

	return axis;
};

ChartHelper.prototype.createCountedAxis = function(maxValue) {
    let axis = this.createAxis();

    if (maxValue)
        axis.range = [0, maxValue];
    else
        axis.autorange = true;

	axis.rangemode = "tozero";

	return axis;
}

ChartHelper.prototype.createLayout = function(xaxis, yaxis, title) {
    return {
        title: title,
        showlegend: false,
        xaxis: xaxis,
        yaxis: yaxis,
        font: {
        	family: "arial",
        	size: 28,
        	color: "#eeeeee"
        },
        titlefont: {
        	size: 42
        },
        paper_bgcolor: "#212121",
        plot_bgcolor: "#212121",
		margin: { pad: 15, l: 120, b: 100 }
    };
}