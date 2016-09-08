var nutHands = [];
function losingHands (OpenCards, opponentRange, myCards,equity) {

	var allHands = ["aa","kk","qq","jj","aks","tt","99","aqs","ako","ajs","kqs","88","ats","aqo","kjs","qjs","kts","ajo","kqo","a9s","qts","77","ato","jts","kjo","a8s","k9s","qjo","a7s","tko","q9s","a5s","66","qto","a6s","j9s","a9o","a4s","t9s","k8s","tjo","a3s","k7s","a8o","q8s","k9o","a2s","j8s","k6s","55","t8s","a7o","98s","q9o","k5s","a5o","j9o","q7s","t9o","k4s","a6o","a4o","k8o","j7s","q6s","t7s","k3s","97s","87s","a3o","44","q5s","k7o","k2s","q8o","q4s","j8o","a2o","t8o","k6o","j6s","76s","t6s","98o","86s","q3s","96s","j5s","k5o","q2s","j4s","33","q7o","65s","k4o","75s","j7o","j3s","t5s","t7o","85s","q6o","87o","95s","97o","k3o","t4s","j2s","54s","5qo","64s","t3s","k2o","22","74s","q4o","t2s","84s","67o","j6o","94s","86o","t6o","53s","96o","93s","q3o","j5o","63s","43s","92s","q2o","73s","j4o","56o","83s","75o","52s","82s","85o","t5o","j3o","95o","42s","54o","62s","t4o","j2o","72s","64o","32s","t3o","74o","84o","t2o","94o","53o","93o","63o","43o","92o","73o","83o","52o","82o","42o","62o","72o","32o"];
	var losingHands =  [];
	var possibleHands = Math.ceil(allHands.length * opponentRange);
	var opponentHands = allHands.slice(0, possibleHands);
	

	var myCardsIndex = allHands.indexOf(myCards);

	var handEquity = [];

	for (i=0; i <= opponentHands.length; i++) {
		//equity of opponentHands[i] vs myCards
		handEquity[i] = Math.random();
	}

	for (i=0; i <= opponentHands.length-1; i++) {
		if (handEquity[i] > 0.90) {
			nutHands = nutHands.concat(opponentHands[i]);
		} else if (handEquity[i] < 0.5) {
			losingHands = losingHands.concat(opponentHands[i]);
		}
	}

	

	return nutHands;
}



function cBetWillingness (potSize, opponentRange, equity, foldEquity, opponentStacksize, stackSize, flopTexture, numberOfPlayers, draws) {
	var equityParameter = equity*equity;
	var foldEquityParameter = 0;
	var drawsParameter = 0;
	var flopTextureParameter = 0;
	var numberOfPlayersParameter = 0;
	var cBetWillingness = 0;
	var nutParameter = 0;

	losingHands("", 0.25, "ats", "");

	if (numberOfPlayers === 5) {
		numberOfPlayersParameter = 0;
	} else if (numberOfPlayers === 4) {
		numberOfPlayersParameter = 0.05;
	} else if (numberOfPlayers === 3) {
		numberOfPlayersParameter = 0.1;
	} else if (numberOfPlayers === 2) {
		numberOfPlayersParameter = 0.1;
	} else {
		numberOfPlayersParameter = 0.15;
	}



	//draws är en siffra som fås av en funktion där antalet bra relevanta drag räknas
	/*var allInWin = 0;
	if (opponentStacksize >= stackSize) {
		allInWin = stackSize*2;
	} else {
		allInWin = opponentStacksize*2;
	}

	drawsParameter = draws + potSize/allInWin;*/

	if (flopTexture === "wet flop") {
		flopTextureParameter = 0;
	} else if (flopTexture === "semiwet flop") {
		flopTextureParameter = 0.2;
	} else if (flopTexture === "semidry flop") {
		flopTextureParameter = 0.5;
	} else {
		flopTextureParameter = 0.8;
	}

	if (nutHands.length >= 1) {
		nutParameter = 1;
	}

	var cBetWillingness = equityParameter + foldEquityParameter + drawsParameter + flopTextureParameter + numberOfPlayersParameter;
	console.log("equityParameter " + equityParameter);
	console.log("flopTextureParameter " + flopTextureParameter);
	console.log("drawsParameter " + drawsParameter);
	console.log("numberOfPlayersParameter " + numberOfPlayersParameter);
	console.log("nutParameter " + nutParameter);
	console.log("VAD SÄGER KONSTANTEN?");
	console.log(cBetWillingness);
	console.log(nutHands);
	return cBetWillingness;
}

cBetWillingness(300,0.25,0.7,"",1000,1000,"wet flop",2,0);