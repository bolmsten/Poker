/*jshint esversion: 6 */
exports = module.exports = Decision;

function Decision() {
	if(!(this instanceof Decision)) return new Decision();
	
	this.uid = null;
	this.profile = {};
	this.room = null;
	this.seat = -1;
}

function checkHandInRange(BotCards,range,PlayerPosition) {
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

Decision.preFlopPlay = function(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply,potSize,round) {

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
	        
	var tightRange = oneRange.concat(twoRange, threeRange, fourRange);
	var buttonRange = oneRange.concat(twoRange, threeRange, fourRange, fiveRange, sixRange, suitedConnectRange);

	var bigBlindRange = oneRange.concat(twoRange, threeRange, fourRange);
	var smallBlindRange = oneRange.concat(twoRange, threeRange);
    console.log("raise range" + BotCmd.raise);

    // BOT UTG, UTG+1, UTG+2
    if (PlayerPosition <= 2) {
        
        if (checkHandInRange(BotCards,tightRange, PlayerPosition)){
            client.rpc('raise', potSize, parseReply);
        } else {
            client.rpc('fold', 0, parseReply); 
        }
    //BOT IN BUTTON
    } else if (PlayerPosition === 3) {
        if (checkHandInRange(BotCards,buttonRange, PlayerPosition)) {
            client.rpc('raise', potSize, parseReply);
        } else if (checkHandInRange(BotCards,setMineRange, PlayerPosition)) {
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
}






// function Decision(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply){

// 		console.log("Decision called");

// 		const oneRange = ["14 14 0", "13 13 0"]
// 		const twoRange = ["14 13 1", "12 12 0", "11 11 0"]
// 		const threeRange = ["14 13 0","14 12 1","10 10 0"]
// 		const fourRange = ["14 11 1","14 10 1","14 9 1","13 12 1","14 12 0","9 9 0"]
// 		const fiveRange = ["14 8 1","14 7 1","13 11 1","13 10 1","14 11 0","8 8 0"]
// 		const sixRange = ["14 6 1","14 5 1","14 10 0","13 10 1","13 12 0","12 11 1","11 10 1","7 7 0","6 6 0"]
// 		const sevenRange = ["14 4 1","14 3 1","14 2 1","14 9 0","13 9 1","12 10 1","5 5 0","4 4 0","3 3 0"]
// 		const eightRange = ["14 8 0","14 7 0","13 11 0","12 9 1","12 8 1","12 11 0","11 9 1","10 9 1","9 8 1","2 2 0"]
// 		const nineRange = ["13 8 1","13 7 1","13 6 1","13 5 1","13 4 1"]

// 		const range = oneRange.concat(twoRange, threeRange, fourRange, fiveRange, sixRange, sevenRange, eightRange, nineRange);
// 		var play = false;
// 		if (BotCmd.fold) { // Check if it is our turn (a player can always fold)
// 			console.log("-------BOT PLAYING-------")
// 			console.log(BotCmd);
// 			var color1 = BotCards[PlayerPosition][0] >> 4;
// 			var number1 = BotCards[PlayerPosition][0] & 0xf;
// 			var color2 = BotCards[PlayerPosition][1] >> 4;
// 			var number2 = BotCards[PlayerPosition][1] & 0xf;
// 			console.log("Card 1 has nr " + number1 + " and color " + color1);
// 			console.log("Card 2 has nr " + number2 + " and color " + color2);
// 			console.log(PlayerPosition)
// 			console.log(OpenCards);

// 			if (color1 === color2) {
// 				play  = range.indexOf(number1 + " " + number2 + " 1") !== -1;
// 				play  = play ||range.indexOf(number2 + " " + number1 + " 1") !== -1;
// 			} else {
// 				play  = range.indexOf(number1 + " " + number2 + " 0") !== -1;
// 				play  = play || range.indexOf(number2 + " " + number1 + " 0") !== -1;
// 			}

// 			if (play) {
// 				if (BotCmd.raise) {
// 					client.rpc('raise', BotCmd.raise[0], parseReply);
// 				} else if (BotCmd.check){
// 					client.rpc('check', 0 , parseReply);
// 				} else {
// 					client.rpc('call', 0 , parseReply);
// 				}
// 			}else {
// 				client.rpc('fold', 0, parseReply);
// 			}
// 		}
// 	}

