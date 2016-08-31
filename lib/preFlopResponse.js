
/*jshint esversion: 6 */
exports = module.exports = PreFlopResponse;
var handRange = require('./handRange');

function PreFlopResponse() {
    if(!(this instanceof PreFlopResponse)) return new PreFlopResponse();
}

//3 bet function, eller kallar vi den för raise function typ
function threeBet (client, BotCards, PlayerPosition, potSize, parseReply) {
    console.log("----preFlopPlay Threebet------");
    if (handRange.checkHandInRange(BotCards, handRange.threeBetRange, PlayerPosition)) {
        client.rpc('raise', (potSize*3/4), parseReply);
        return true;
    } else {
        return false;
    }
}

//4 bet function, kommer mest behandla all-in eller inte
function fourBet (client, BotCards, PlayerPosition, potSize, parseReply) {
    console.log("----preFlopPlay FourBet------");
    if (handRange.checkHandInRange(BotCards, handRange.fourBetRange, PlayerPosition)) {
        client.rpc('raise', (potSize*3/4), parseReply);
    } else {
        return 0;
    }
}

//call function
function call (client, BotCards, PlayerPosition, parseReply) {
    console.log("----preFlopPlay Call------");
    // var equity = (equity/100);
    // var potOdds = 1 - playerBet(0) / (potSize + playerBet senaste bettet);
    
    // var callPrediction = parameter1*equity + parameter2*potOdds;
        
    if (handRange.checkHandInRange(BotCards, handRange.tightRange, PlayerPosition)) {
        client.rpc('call', 0, parseReply);
    } else {
        client.rpc('fold', 0, parseReply);
    }
};

//response function if 1 bet is played
PreFlopResponse.response0 = function (client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    console.log("-----preFlopPlay response0------");
    // BOT UTG, UTG+1, UTG+2
    if (PlayerPosition <= 2) {
        
        if (handRange.checkHandInRange(BotCards, handRange.tightRange, PlayerPosition)){
            client.rpc('raise', potSize, parseReply);
        } else {
            client.rpc('fold', 0, parseReply); 
        }
    //BOT IN BUTTON
    } else if (PlayerPosition === 3) {
        if (handRange.checkHandInRange(BotCards, handRange.buttonRange, PlayerPosition)) {
            client.rpc('raise', potSize, parseReply);
        } else if (handRange.checkHandInRange(BotCards, checkHandInRange.setMineRange, PlayerPosition)) {
            client.rpc('call', 0, parseReply);
        } else {
            client.rpc('fold', 0, parseReply);
        }
    //BOT IN SMALL BLIND
    } else if (PlayerPosition === 4) {
        if (handRange.checkHandInRange(BotCards, handRange.smallBlindRange, PlayerPosition)) {
            client.rpc('raise', potSize, parseReply);
        } else {
            client.rpc('fold', 0, parseReply);
        }
        
    //BOT IN BIG BLIND    
    } else {
        if (handRange.checkHandInRange(BotCards, handRange.bigBlindRange, PlayerPosition)) {
            client.rpc('raise', potSize, parseReply);
        } else {
            client.rpc('fold', 0, parseReply);
        }
    }
};

//response function if 1 bet is played
PreFlopResponse.response1 = function (client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    console.log("-----preFlopPlay response1------");
    if (!threeBet(client, BotCards, PlayerPosition, potSize, parseReply)) {
        call(client, BotCards, PlayerPosition, parseReply);
    }
};

//response function if 2 bets are played
PreFlopResponse.response2 = function (client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    console.log("-----preFlopPlay response2------");
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
PreFlopResponse.response3 = function (client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    console.log("-----preFlopPlay response3------");
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