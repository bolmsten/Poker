
/*jshint esversion: 6 */
exports = module.exports = HandRange;

function HandRange() {
    if(!(this instanceof HandRange)) return new HandRange();
}

var allHands = ["aa","kk","qq","jj","aks","tt","99","aqs","ako","ajs","kqs","88","ats","aqo","kjs","qjs","kts","ajo","kqo","a9s","qts","77","ato","jts","kjo","a8s","k9s","qjo","a7s","tko","q9s","a5s","66","qto","a6s","j9s","a9o","a4s","t9s","k8s","tjo","a3s","k7s","a8o","q8s","k9o","a2s","j8s","k6s","55","t8s","a7o","98s","q9o","k5s","a5o","j9o","q7s","t9o","k4s","a6o","a4o","k8o","j7s","q6s","t7s","k3s","97s","87s","a3o","44","q5s","k7o","k2s","q8o","q4s","j8o","a2o","t8o","k6o","j6s","76s","t6s","98o","86s","q3s","96s","j5s","k5o","q2s","j4s","33","q7o","65s","k4o","75s","j7o","j3s","t5s","t7o","85s","q6o","87o","95s","97o","k3o","t4s","j2s","54s","5qo","64s","t3s","k2o","22","74s","q4o","t2s","84s","67o","j6o","94s","86o","t6o","53s","96o","93s","q3o","j5o","63s","43s","92s","q2o","73s","j4o","56o","83s","75o","52s","82s","85o","t5o","j3o","95o","42s","54o","62s","t4o","j2o","72s","64o","32s","t3o","74o","84o","t2o","94o","53o","93o","63o","43o","92o","73o","83o","52o","82o","42o","62o","72o","32o"];



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
HandRange.nineRange = ["13 8 1","13 7 1","13 6 1","13 5 1","13 4 1","13 3 1","13 2 1","12 10 0","13 10 0","13 9 0","13 8 0","13 7 0","13 6 0","13 5 0","13 4 0","12 9 0","12 8 0","12 7 0"];

var twentyFive = ":a7o*,k9o*,qto*,jto*,66*,t9*,t8s*,k7s*,k6s*,a2s*";
var fifty = ":22*,a2s*,k2s*,j4s*,t6s*,96s*,86s*,76s*,65s*,a2o*,k5o*,q7o*,j7o*,t8o*,98o";

var threeBetRange = ":jj*,aqo*,a7s*,kts*";
var suitedConnectors = ":45s,65s,76s,87s,98s,t9s,jts,qjs";
var setMineRange = ":22*";
        
HandRange.tightRange = HandRange.oneRange.concat(HandRange.twoRange, HandRange.threeRange, HandRange.fourRange, HandRange.fiveRange, HandRange.sixRange, HandRange.sevenRange, HandRange.eightRange, HandRange.nineRange);

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
