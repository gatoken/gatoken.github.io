console.log("nothing to see here, move along");

function decodeStats(response, price) {
    if (response == null) return null;

    var result = response.result;
    if (result == null || result.length == null || result.length < 193) return null;

    var weiPerEther = new BigNumber("1000000000000000000", 10);

    var totalContributionExact = new BigNumber(result.substr(2, 64), 16).div(weiPerEther);
    var totalContributionUSDExact = totalContributionExact.times(new BigNumber(price));

    return {
        totalContribution: totalContributionExact.round(3, BigNumber.ROUND_DOWN),
        totalContributionUSD: totalContributionUSDExact.round(0, BigNumber.ROUND_DOWN),
        totalSupply: new BigNumber(result.substr(66, 64), 16).div(weiPerEther).round(3, BigNumber.ROUND_DOWN),
        totalBonusTokensIssued: new BigNumber(result.substr(130, 64), 16).div(weiPerEther).round(3, BigNumber.ROUND_DOWN),
        purchasingAllowed: new BigNumber(result.substr(194, 64), 16).isZero() == false
    };
}

function getStats(price) {
    var url = "https://api.etherscan.io/api?module=proxy&action=eth_call&to=xxx&data=0xc59d48470000000000000000000000000000000000000000000000000000000000000000&tag=latest";
    return $.ajax(url, {
        cache: false,
        dataType: "json"
    }).then(function (data) { return decodeStats(data, price); });
}

function getPrice() {
    var url = "https://api.etherscan.io/api?module=stats&action=ethprice";
    return $.ajax(url, {
        cache: false,
        dataType: "json"
    }).then(function (data) {
        if (data == null) return null;
        if (data.result == null) return null;
        if (data.result.ethusd == null) return null;

        return parseFloat(data.result.ethusd);
    });
}

function updatePage(stats) {
    if (stats == null) return;


    $("#total-ether").text(stats.totalContribution.toFixed(3));
    if (stats.totalContribution.toNumber() <= 0) {
        $("#total-ether-message").text("Looks like everyone read the warnings so far.");
    } else {
        $("#total-ether-message").text("I had a feeling someone would be very happy with donations.");
    }

    $("#total-usd").text("$" + stats.totalContributionUSD.toFixed(0));
    if (stats.totalContributionUSD.toNumber() <= 0) {
        $("#total-usd-message").text("No Ether yet, so no cash either.");
    } else if (stats.totalContributionExact.toNumber() <= 10) {
        $("#total-usd-message").text("Not enough to donate.");
    } else if (stats.totalContributionExact.toNumber() <= 100) {
        $("#total-usd-message").text("Enough to donate.");
    } else {
        $("#total-usd-message").text("Enough to make a big donations!");
    }

    $("#total-tokens").text(stats.totalSupply.toFixed(3));
    if (stats.totalSupply <= 0) {
        $("#total-tokens-message").text("No give away tokens issued yet either.");
    } else if (stats.totalBonusTokensIssued.toNumber() <= 0) {
        $("#total-tokens-message").text("Look at all those give away tokens!");
    } else {
        $("#total-tokens-message").text("Including " + stats.totalBonusTokensIssued.toFixed(3) + " bonus tokens!");
    }

    $("#stats").show();
}

function refresh() { getPrice().then(getStats).then(updatePage); }

$(function() {
    try {
        refresh();
        setInterval(refresh, 1000 * 60 * 5);
    } catch (err) { }
});