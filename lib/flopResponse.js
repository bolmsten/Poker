
/*jshint esversion: 6 */
exports = module.exports = FlopResponse;

function FlopResponse() {
    if(!(this instanceof FlopResponse)) return new FlopResponse();
}

var opponent = {
	numberHands: 100,
	range: 0.25,
	threeBetRange: 0.06,
	agression: 0.05,
	stackSize: 1500
};

var overPair = false;
var set = false;

var flushDraw = false;
var straightDraw = false;

var preFlopAgressor = false;

var equity = 0.4;

var playersBehind = 0;

var threeBet = false;

var POKER_COLORS = {
	4: 's', 		// spade
	3: 'h', 	// heart
	2: 'c', 	// club
	1: 'd' 		// diamond
};

var POKER_NUMBERS = {
	14 : 'A',
	13 : 'K',
	12 : 'Q',
	11 : 'J',
	10 : 'T',
	9 : '9',
	8 : '8',
	7 : '7',
	6 : '6',
	5 : '5',
	4 : '4',
	3 : '3',
	2 : '2',
	0 : '?'
};

// function handleWierdPlay (equity,betSize,potSize,parseReplay,openCards,playersBehind) {
// 	if (openCards === 0 && opponent.stackSize === betSize) {
// 		if (playersBehind === 0 && opponent.stackSize < stackSize/5 && equity > 0.6) {
// 			client.rpc('call', 0, parseReplay);
// 		} else {
// 			client.rpc('fold', 0, parseReplay);
// 		}
// 	} else if (betSize > potSize && equity > 0.85) {
// 		client.rpc('raise', stackSize, parseReplay);
// 	} else if (
// }

FlopResponse.response0 = function (client, BotCmd, BotCards, OpenCards, PlayerPosition, equity,flopTexture,potSize,preFlopAgressor,parseReplay) {
	console.log("-----FlopResponse response0------");

	var color1 = BotCards[PlayerPosition][0] >> 4;
    var number1 = BotCards[PlayerPosition][0] & 0xf;
    var color2 = BotCards[PlayerPosition][1] >> 4;
    var number2 = BotCards[PlayerPosition][1] & 0xf;

   	var openColor1 = OpenCards[0] >> 4;
    var openNumber1 = OpenCards[0] & 0xf;
    var openColor2 = OpenCards[1] >> 4;
    var openNumber2 = OpenCards[1] & 0xf;
    var openColor3 = OpenCards[2] >> 4;
    var openNumber3 = OpenCards[2] & 0xf;

    color1 = POKER_COLORS[color1]
    color2 = POKER_COLORS[color2]
    number1 = POKER_NUMBERS[number1]
    number2 = POKER_NUMBERS[number2]

    openColor1 = POKER_COLORS[openColor1]
    openColor2 = POKER_COLORS[openColor2]
    openColor3 = POKER_COLORS[openColor3]
    openNumber1 = POKER_NUMBERS[openNumber1]
    openNumber2 = POKER_NUMBERS[openNumber2]
    openNumber3 = POKER_NUMBERS[openNumber3]

    var myHand = number1 + color1 + number2 + color2;
    var board = openNumber1 + openColor1 + openNumber2 + openColor2 + openNumber3 + openColor3
	$.get( "/equity?hands=" + myHand + ":a7o*,k9o*,qto*,66*,t8s*,k7s*,k6s*,a2s*&board=" + board, function( data ) {
		console.log("equity");
  		console.log(data[myHand]);
		preFlopAgressor = true;
		//Antingen bet eller check
		if (flopTexture === "dry flop one high" || flopTexture === "dry flop two high") {
			client.rpc('raise', potSize*0.75, parseReplay);
		} else if (flopTexture === "semi dry flop one high" && preFlopAgressor === true || flopTexture === "semi dry flop two high" && preFlopAgressor === true) {
			client.rpc('raise', potSize*0.75, parseReplay);
		} else {
			client.rpc('check', 0, parseReplay);
		}
	});
};

FlopResponse.response1 = function (client, BotCmd, BotCards, OpenCards, PlayerPosition, equity,flopTexture,potSize,preFlopAgressor,parseReplay,betSize,opponent,stackSize) {
	console.log("-----FlopResponse response1------");
	var color1 = BotCards[PlayerPosition][0] >> 4;
    var number1 = BotCards[PlayerPosition][0] & 0xf;
    var color2 = BotCards[PlayerPosition][1] >> 4;
    var number2 = BotCards[PlayerPosition][1] & 0xf;

   	var openColor1 = OpenCards[0] >> 4;
    var openNumber1 = OpenCards[0] & 0xf;
    var openColor2 = OpenCards[1] >> 4;
    var openNumber2 = OpenCards[1] & 0xf;
    var openColor3 = OpenCards[2] >> 4;
    var openNumber3 = OpenCards[2] & 0xf;

    color1 = POKER_COLORS[color1]
    color2 = POKER_COLORS[color2]
    number1 = POKER_NUMBERS[number1]
    number2 = POKER_NUMBERS[number2]

    openColor1 = POKER_COLORS[openColor1]
    openColor2 = POKER_COLORS[openColor2]
    openColor3 = POKER_COLORS[openColor3]
    openNumber1 = POKER_NUMBERS[openNumber1]
    openNumber2 = POKER_NUMBERS[openNumber2]
    openNumber3 = POKER_NUMBERS[openNumber3]

    var myHand = number1 + color1 + number2 + color2;
    var board = openNumber1 + openColor1 + openNumber2 + openColor2 + openNumber3 + openColor3
	$.get( "/equity?hands=" + myHand + ":a7o*,k9o*,qto*,66*,t8s*,k7s*,k6s*,a2s*&board=" + board, function( data ) {
		console.log("equity");
  		console.log(data[myHand]);
	equity = data[myHand];
	var callOdds = betSize/potSize;
	opponent.range = 0.10;

	if (equity>0.85) {
		client.rpc('raise', (potSize*0.75), parseReplay)
	} else if (equity>callOdds) {
		client.rpc('call', 0, parseReplay);
	} else if (flopTexture === "wet flop one high" || flopTexture === "wet flop") {
		client.rpc('raise,', (potSize*0.75), parseReplay);
	} else if (equity < callOdds && (flopTexture === "dry flop one high" || flopTexture === "dry flop two high" || flopTexture === "dry flop")) {
		client.rpc('raise', (potSize*0.75), parseReplay);
	} else {
		client.rpc('fold', 0, parseReplay);
	}
	});
};

FlopResponse.response2 = function (client, BotCmd, BotCards, OpenCards, PlayerPosition, equity,flopTexture,potSize,preFlopAgressor,parseReplay,betSize,opponent,stackSize) {
	console.log("-----FlopResponse response2------");
	opponent.range = 0.05;
	if (equity > 0.8) {
		client.rpc('raise', stackSize, parseReplay);
	} else {
		client.rpc('fold', 0, parseReplay);
	}
};

// function threeBetFlop0 (equity,flopTexture,potSize,preFlopAgressor,parseReplay,potSize) {
// 	if (threeBet)
// }

