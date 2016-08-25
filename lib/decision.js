/*jshint esversion: 6 */
exports = module.exports = Decision;

var boardTexture = require('./boardTexture');

const suitedConnectRange = ["10 9 1","9 8 1","8 7 1","7 6 1","6 5 1"];
const setMineRange = ["2 2 0","3 3 0","4 4 0","5 5 0","6 6 0", "7 7 0","8 8 0","9 9 0","10 10 0"];

const oneRange = ["14 14 0", "13 13 0"];
const twoRange = ["14 13 1", "12 12 0", "11 11 0"];
const threeRange = ["14 13 0","14 12 1","10 10 0"];
const fourRange = ["14 11 1","14 10 1","14 9 1","13 12 1","14 12 0","9 9 0"];
const fiveRange = ["14 8 1","14 7 1","13 11 1","13 10 1","14 11 0","8 8 0"];
const sixRange = ["14 6 1","14 5 1","14 10 0","13 10 1","13 12 0","12 11 1","11 10 1","7 7 0","6 6 0"];
const sevenRange = ["14 4 1","14 3 1","14 2 1","14 9 0","13 9 1","12 10 1","5 5 0","4 4 0","3 3 0"];
const eightRange = ["14 8 0","14 7 0","13 11 0","12 9 1","12 8 1","12 11 0","11 9 1","10 9 1","9 8 1","2 2 0"];
const nineRange = ["13 8 1","13 7 1","13 6 1","13 5 1","13 4 1"];
        
const tightRange = oneRange.concat(twoRange, threeRange, fourRange, fiveRange, sixRange, sevenRange, eightRange);
const buttonRange = oneRange.concat(twoRange, threeRange, fourRange, fiveRange, sixRange, suitedConnectRange);

const bigBlindRange = oneRange.concat(twoRange, threeRange, fourRange);
const smallBlindRange = oneRange.concat(twoRange, threeRange);

const threeBetRange = oneRange.concat(twoRange, threeRange, fourRange);
const fourBetRange = oneRange.concat(oneRange, twoRange);


var parameter1 = 1;
var paramater2 = 1;
var parameter3 = 0;

var stackSize = 1000;
var equity = 1; //call some function
var position = 0; //maybe call some function?
var potSize = 1; //maybe we could call another function?
//var playerBet = [betSize,playerIdentity];

function Decision() {
	if(!(this instanceof Decision)) return new Decision();
}

function checkHandInRange(BotCards, range, PlayerPosition) {
    var play = false;
    var color1 = BotCards[PlayerPosition][0] >> 4;
    var number1 = BotCards[PlayerPosition][0] & 0xf;
    var color2 = BotCards[PlayerPosition][1] >> 4;
    var number2 = BotCards[PlayerPosition][1] & 0xf;
    console.log("Card 1 has nr " + number1 + " and color " + color1);
    console.log("Card 2 has nr " + number2 + " and color " + color2);
    console.log(PlayerPosition);

    if (color1 === color2) {
        play  = range.indexOf(number1 + " " + number2 + " 1") !== -1;
        play  = play ||range.indexOf(number2 + " " + number1 + " 1") !== -1;
    } else {
        play  = range.indexOf(number1 + " " + number2 + " 0") !== -1;
        play  = play || range.indexOf(number2 + " " + number1 + " 0") !== -1;
    }
    return play;
}

Decision.preFlopPlay = function(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    console.log("this.tightRange");
    console.log(tightRange);
    switch(PlayerBets.length) {
        case 0:
            response0(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        case 1:
            response1(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        case 2:
            response2(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        case 3:
            response3(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        default:
            response3(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
    }

}

Decision.flopPlay = function(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    boardTexture(OpenCards);
    switch(PlayerBets.length) {
        case 0:
            response0(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        case 1:
            response1(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        case 2:
            response2(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        case 3:
            response3(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        default:
            response3(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
    }

}



//3 bet function, eller kallar vi den för raise function typ
function threeBet (client, BotCards, PlayerPosition, potSize, parseReply) {
    console.log("Threebet");
    if (checkHandInRange(BotCards, threeBetRange, PlayerPosition)) {
        client.rpc('raise', (potSize*3/4), parseReply);
        return true;
    } else {
        return false;
    }
}

//4 bet function, kommer mest behandla all-in eller inte
function fourBet (client, BotCards, PlayerPosition, potSize, parseReply) {
    if (checkHandInRange(BotCards, fourBetRange, PlayerPosition)) {
        client.rpc('raise', (potSize*3/4), parseReply);
    } else {
        return 0;
    }
}

//call function
function call (client, BotCards, PlayerPosition, parseReply) {
    console.log("call");
    // var equity = (equity/100);
    // var potOdds = 1 - playerBet(0) / (potSize + playerBet senaste bettet);
    
    // var callPrediction = parameter1*equity + parameter2*potOdds;
        
    if (checkHandInRange(BotCards, tightRange, PlayerPosition)) {
        client.rpc('call', 0, parseReply);
    } else {
        client.rpc('fold', 0, parseReply);
    }
};

//response function if 1 bet is played
function response0 (client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {

    // BOT UTG, UTG+1, UTG+2
    if (PlayerPosition <= 2) {
        
        if (checkHandInRange(BotCards, tightRange, PlayerPosition)){
            client.rpc('raise', potSize, parseReply);
        } else {
            client.rpc('fold', 0, parseReply); 
        }
    //BOT IN BUTTON
    } else if (PlayerPosition === 3) {
        if (checkHandInRange(BotCards, this.buttonRange, PlayerPosition)) {
            client.rpc('raise', potSize, parseReply);
        } else if (checkHandInRange(BotCards, setMineRange, PlayerPosition)) {
            client.rpc('call', 0, parseReply);
        } else {
            client.rpc('fold', 0, parseReply);
        }
    //BOT IN SMALL BLIND
    } else if (PlayerPosition === 4) {
        if (checkHandInRange(BotCards, smallBlindRange, PlayerPosition)) {
            client.rpc('raise', potSize, parseReply);
        } else {
            client.rpc('fold', 0, parseReply);
        }
        
    //BOT IN BIG BLIND    
    } else {
        if (checkHandInRange(BotCards, bigBlindRange, PlayerPosition)) {
            client.rpc('raise', potSize, parseReply);
        } else {
            client.rpc('fold', 0, parseReply);
        }
    }
};

//response function if 1 bet is played
function response1 (client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    if (!threeBet(client, BotCards, PlayerPosition, potSize, parseReply)) {
        call(client, BotCards, PlayerPosition, parseReply);
    }
};

//response function if 2 bets are played
function response2(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    
    if (PlayerBets[0] === PlayerBets[1]) {
        if (!threeBet(client, BotCards, PlayerPosition, potSize, parseReply)) {
            call(client, BotCards, PlayerPosition, parseReply);
        }
    }else {
        if (!fourBet(client, BotCards, PlayerPosition, potSize, parseReply)) {
            call(client, BotCards, PlayerPosition, parseReply);
        } 
    }
}

//response om 3 bets are played
function response3(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    var same = true;
    for (var i = 0; i < PlayerBets.length - 1; i++) {
        if (PlayerBets[i] !== PlayerBets[i + 1]) {
            same = false;
        }
    }
    if (same) {
        if (!threeBet(client, BotCards, PlayerPosition, potSize, parseReply)) {
            call(client, BotCards, PlayerPosition, parseReply);
        }
    } else {
        if (!fourBet(client, BotCards, PlayerPosition, potSize, parseReply)) {
            call(client, BotCards, PlayerPosition, parseReply);
        } 
     }
}
