
/*jshint esversion: 6 */
exports = module.exports = HandRange;

function HandRange() {
    if(!(this instanceof HandRange)) return new HandRange();
}

HandRange.suitedConnectRange = ["10 9 1","9 8 1","8 7 1","7 6 1","6 5 1"];
HandRange.setMineRange = ["2 2 0","3 3 0","4 4 0","5 5 0","6 6 0", "7 7 0","8 8 0","9 9 0","10 10 0"];

HandRange.oneRange = ["14 14 0", "13 13 0"];
HandRange.twoRange = ["14 13 1", "12 12 0", "11 11 0"];
HandRange.threeRange = ["14 13 0","14 12 1","10 10 0"];
HandRange.fourRange = ["14 11 1","14 10 1","14 9 1","13 12 1","14 12 0","9 9 0"];
HandRange.fiveRange = ["14 8 1","14 7 1","13 11 1","13 10 1","14 11 0","8 8 0"];
HandRange.sixRange = ["14 6 1","14 5 1","14 10 0","13 10 1","13 12 0","12 11 1","11 10 1","7 7 0","6 6 0"];
HandRange.sevenRange = ["14 4 1","14 3 1","14 2 1","14 9 0","13 9 1","12 10 1","5 5 0","4 4 0","3 3 0"];
HandRange.eightRange = ["14 8 0","14 7 0","13 11 0","12 9 1","12 8 1","12 11 0","11 9 1","10 9 1","9 8 1","2 2 0"];
HandRange.nineRange = ["13 8 1","13 7 1","13 6 1","13 5 1","13 4 1"];
        
HandRange.tightRange = HandRange.oneRange.concat(HandRange.twoRange, HandRange.threeRange, HandRange.fourRange, HandRange.fiveRange, HandRange.sixRange, HandRange.sevenRange, HandRange.eightRange);
HandRange.buttonRange = HandRange.oneRange.concat(HandRange.twoRange, HandRange.threeRange, HandRange.fourRange, HandRange.fiveRange, HandRange.sixRange, HandRange.suitedConnectRange);

HandRange.bigBlindRange = HandRange.oneRange.concat(HandRange.twoRange, HandRange.threeRange, HandRange.fourRange);
HandRange.smallBlindRange = HandRange.oneRange.concat(HandRange.twoRange, HandRange.threeRange);

HandRange.threeBetRange = HandRange.oneRange.concat(HandRange.twoRange, HandRange.threeRange, HandRange.fourRange);
HandRange.fourBetRange = HandRange.oneRange.concat(HandRange.oneRange, HandRange.twoRange);

HandRange.checkHandInRange = function (BotCards, range, PlayerPosition) {
    var play = false;
    var color1 = BotCards[PlayerPosition][0] >> 4;
    var number1 = BotCards[PlayerPosition][0] & 0xf;
    var color2 = BotCards[PlayerPosition][1] >> 4;
    var number2 = BotCards[PlayerPosition][1] & 0xf;
    // console.log("Card 1 has nr " + number1 + " and color " + color1);
    // console.log("Card 2 has nr " + number2 + " and color " + color2);
    // console.log(PlayerPosition);

    if (color1 === color2) {
        play  = range.indexOf(number1 + " " + number2 + " 1") !== -1;
        play  = play ||range.indexOf(number2 + " " + number1 + " 1") !== -1;
    } else {
        play  = range.indexOf(number1 + " " + number2 + " 0") !== -1;
        play  = play || range.indexOf(number2 + " " + number1 + " 0") !== -1;
    }
    return play;
};
