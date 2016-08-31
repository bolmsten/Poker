/*jshint esversion: 6 */
exports = module.exports = Decision;

var boardTexture = require('./boardTexture');
var preFlopDecision = require('./preFlopResponse');
var flopDecision = require('./flopResponse');

function Decision() {
	if(!(this instanceof Decision)) return new Decision();
}

Decision.preFlopPlay = function(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    console.log("-----PreFlopPlay------");
    console.log("PlayerBets " + PlayerBets[PlayerBets.length - 1])
    switch(PlayerBets.length) {
        case 0:
            preFlopDecision.response0(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        case 1:
            preFlopDecision.response1(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        case 2:
            preFlopDecision.response2(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        case 3:
            preFlopDecision.response3(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
            break;
        default:
            preFlopDecision.response3(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets)
    }

}

Decision.flopPlay = function(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, potSize, PlayerBets) {
    console.log("-----FlopPlay------");
    console.log("PlayerBets " + PlayerBets[PlayerBets.length - 1 ])
    switch(PlayerBets.length) {
        case 0:
            flopDecision.response0(client, BotCmd, BotCards, OpenCards, PlayerPosition, 0.4 , boardTexture(OpenCards), potSize, 1, parseReply)
            break;
        case 1:
            flopDecision.response1(client, BotCmd, BotCards, OpenCards, PlayerPosition, 0.4 , boardTexture(OpenCards), potSize, 1, parseReply, PlayerBets[PlayerBets.length - 1], {}, 1000)
            break;
        case 2:
            flopDecision.response2(client, BotCmd, BotCards, OpenCards, PlayerPosition, 0.4 , boardTexture(OpenCards), potSize, 1, parseReply, PlayerBets[PlayerBets.length - 1], {}, 1000)
            break;
        default:
            flopDecision.response2(client, BotCmd, BotCards, OpenCards, PlayerPosition, 0.4 , boardTexture(OpenCards), potSize, 1, parseReply, PlayerBets[PlayerBets.length - 1], {}, 1000)
    }

}
