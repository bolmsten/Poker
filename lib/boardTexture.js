exports = module.exports = boardTexture;


function boardTexture (openCards) {

	var color1 = openCards[0] >> 4;
    var number1 = openCards[0] & 0xf;
    var color2 = openCards[1] >> 4;
    var number2 = openCards[1] & 0xf;
    var color3 = openCards[2] >> 4;
    var number3 = openCards[2] & 0xf;

    var flopCards = [number1,number2,number3];
	
	//sort cards
	flopCards = flopCards.sort(function(a, b){return b-a;});


	var connection = [flopCards[0]-flopCards[2],flopCards[0]-flopCards[1],flopCards[1]-flopCards[2]];

	//Kollar om det finns kort som är lika
	if (connection[0] === 0 && connection[1] === 0 && connection[2] === 0) {
		flopCards = flopCards.concat("triple");
	} else if (connection[1] === 0 || connection[2] === 0) {
		flopCards = flopCards.concat("pair");
	} else {
		flopCards = flopCards.concat("no pair");
	}

	//Kollar stegchanser
	if (connection[0] === 2 && connection[1] === 1) {
		flopCards = flopCards.concat("three straight");
	} else if (connection[1] === 1 || connection[2] === 1) {
		flopCards = flopCards.concat("two straight");
	} else if (connection[0] === 2 || connection[1] === 2 || connection[2] === 2) {
		flopCards = flopCards.concat("gutshot");
	} else {
		flopCards = flopCards.concat("no straight");
	}

	//suited
	if (color1 === color2 && color2 === color3) {
    	flopCards = flopCards.concat("three suit");
    } else if (color1 === color2 || color2 === color3 || color1 === color3) {
    	flopCards = flopCards.concat("two suit");
    }
    
	console.log("---------- BORDTEXTURE CALLED------------");
    console.log(flopCards);

    flopCards = flopCards.slice(3);
    flopCards = flopCards.join(" ");


    
	var flop1 = "triple";
	var flop2 = "pair two straight two suit";
	var flop3 = "pair two straight";
	var flop4 = "pair gutshot two suit";
	var flop5 = "pair gutshot";	
	var flop6 = "pair no gutshot two suit";
	var flop7 = "pair no gutshot";
	var flop8 = "pair no straight two suit";
	var flop9 = "pair no straight";
	var flop10 = "no pair three straight three suit";
	var flop11 = "no pair three straight two suit";
	var flop12 = "no pair three straight";
	var flop13 = "no pair two straight three suit";
	var flop14 = "no pair two straight two suit";
	var flop15 = "no pair two straight";
	var flop16 = "no pair gutshot three suit";
	var flop17 = "no pair gutshot two suit";
	var flop18 = "no pair gutshot";
	var flop19 = "no pair no straight three suit";
	var flop20 = "no pair no straight two suit";
	var flop21 = "no pair no straight";

	var flopTexture = [];

	if ((flop7 + flop9 + flop18 + flop21).includes(flopCards) ) {
		flopTexture = "dry flop";
	} else if ((flop3 + flop15 + flop5 + flop6 + flop18).includes(flopCards)) {
		flopTexture = "semi dry flop";
	} else if ((flop4 + flop8 + flop1 + flop2 + flop15).includes(flopCards)) {
		flopTexture = "semi wet flop";
	} else if ((flop10 + flop11 + flop12 + flop13 + flop14 + flop16 + flop17 + flop19 + flop20).includes(flopCards)) {
		flopTexture = "wet flop";
	}

	//high cards
	if (number1 > 10 && number2 > 10 && number3 > 10) {
		flopTexture = flopTexture.concat("three high");
	} else if (number1 > 10 && number2 > 10) {
		flopTexture = flopTexture.concat("two high");
	} else if (number1 > 10) {
		flopTexture = flopTexture.concat("one high");
	}

	return flopTexture;


}