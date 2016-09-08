exports = module.exports = HandTranslator;

function HandTranslator() {
	if(!(this instanceof HandTranslator)) return new HandTranslator();
}

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



HandTranslator.card = function(cards) {
	var translatedCards = "";
	var color = "";
	var number = "";
	for (var i = 0; i < cards.length; i++) {
    	color = POKER_COLORS[cards[i] >> 4];
    	number = POKER_NUMBERS[cards[i] & 0xf];
    	translatedCards = translatedCards + number + color;
	}
	return translatedCards;
}

HandTranslator.opponentRange = function(opponentRange) {

	var allHands = ["aa","kk","qq","jj","aks","tt","99","aqs","ako","ajs","kqs","88","ats","aqo","kjs","qjs","kts","ajo","kqo","a9s","qts","77","ato","jts","kjo","a8s","k9s","qjo","a7s","tko","q9s","a5s","66","qto","a6s","j9s","a9o","a4s","t9s","k8s","tjo","a3s","k7s","a8o","q8s","k9o","a2s","j8s","k6s","55","t8s","a7o","98s","q9o","k5s","a5o","j9o","q7s","t9o","k4s","a6o","a4o","k8o","j7s","q6s","t7s","k3s","97s","87s","a3o","44","q5s","k7o","k2s","q8o","q4s","j8o","a2o","t8o","k6o","j6s","76s","t6s","98o","86s","q3s","96s","j5s","k5o","q2s","j4s","33","q7o","65s","k4o","75s","j7o","j3s","t5s","t7o","85s","q6o","87o","95s","97o","k3o","t4s","j2s","54s","5qo","64s","t3s","k2o","22","74s","q4o","t2s","84s","67o","j6o","94s","86o","t6o","53s","96o","93s","q3o","j5o","63s","43s","92s","q2o","73s","j4o","56o","83s","75o","52s","82s","85o","t5o","j3o","95o","42s","54o","62s","t4o","j2o","72s","64o","32s","t3o","74o","84o","t2o","94o","53o","93o","63o","43o","92o","73o","83o","52o","82o","42o","62o","72o","32o"];

	return allHands.slice(0, Math.ceil(allHands.length * opponentRange)).join(",");
}
