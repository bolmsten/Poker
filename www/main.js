(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var Client = require('../lib/client'),
	Poker = require('../lib/poker'),
	Jinhua = require('../lib/jinhua_poker'),
	Holdem = require('../lib/holdem_poker'),
	Decision = require('../lib/decision');

var client = null;
var BotCmd = null;
var BotCards = null;
var OpenCards = null;
var PlayerPosition = null;
var PlayerBets = [];
var BotPlay = false; // should bot play for you

Poker.toHTML = function(cards) {
	var html = '';
	for(var i=0; i<cards.length; i++) {
		var card = cards[i];
		var color = card >> 4;
		var number = card & 0xf;
		var png = color + '_' + number + '.png';
		html += "<img src='img/" + png + "'/>";
	}
	return html;
};

$(document).ready(function(){
	var socket = io();
	
	socket.log_traffic = false;
	
	client = new Client(socket);
	
	var lang = $.cookie('lang');
	if(lang) {
		$("select#lang option").filter(function() {
		    return $(this).val() == lang; 
		}).prop('selected', true);
		
		hotjs.i18n.setLang( lang );
		hotjs.i18n.translate();
	}

	$('select#lang').change(function(){
		$( "select#lang option:selected" ).each(function() {
			$.cookie('lang', $(this).val());
			location.reload();
		});	
	});

	socket.on('hello', function(data){
		$('#messages').empty();
		$('div#cmds').empty();
		showRoom(null);
		
		addMsg(data.msg);
		
		setTimeout(function(){
			client.rpc('fastsignup', 0, parseSignUpReply);
		}, 1000);
	});

	client.on('prompt', updateCmds);
	
	client.on('shout', function(ret){
		addMsg(ret.who.name + _T_('shout:') + ret.msg);
	});
	
	client.on('look', function(ret){
		showRoom(ret);
	});
	
	client.on('refresh', function(ret){
		showRoom(client.room);
	});
	
	client.on('enter', function(ret){
		addMsg(ret.who.name + _T_('enter') + ret.where);
		showRoom(client.room);
	});
	
	client.on('exit', function(ret){
		addMsg(ret.who.name + _T_('exit') + ret.where);
		if(ret.uid === client.uid) {
			showRoom(null);
			list_games();
		} else {
			showRoom(client.room);
		}
	});

	client.on('takeseat', function(ret){
		addMsg(ret.who.name + _T_('take seat') + ret.where);
		showRoom(client.room);
	});

	client.on('unseat', function(ret){
		addMsg(ret.who.name + _T_('unseat from') + ret.where);
		showRoom(client.room);
	});

	client.on('say', function(ret){
		addMsg(ret.who.name + _T_('say:') + ret.msg);
	});
	
	client.on('gamestart', function(ret){
		addMsg(_T('game start'));
		PlayerBets = []
		if(ret.room) {
			client.room = ret.room;
		}
		
		if(ret.inseats) {
			var seats = client.room.seats;
			var seat = ret.inseats[0];
			var uid = seats[ seat ];
			addMsg( 'first/D button: ' + uid + ' at seat ' + seat );
		}
	});
	
	client.on('deal', function(ret){
		addMsg(_T('dealing cards'));
		PlayerBets = [];
		var room_cards = client.room.cards;
		var deals = ret.deals;
		var item, seat, cards;
		while(deals.length > 0) {
			item = deals.pop();
			seat = item[0];
			cards = item[1];
			if(seat >= 0) {
				room_cards[ seat ] = Poker.sortByNumber( cards );
			} else {
				client.room.shared_cards = Poker.merge(client.room.shared_cards, cards);
			}
		}
		
		showRoom(client.room);
		
		if(ret.delay) {
			addMsg(_T_('delay') + ret.delay + _T_('seconds') + _T_('to bet') );
		}
	});
	
	client.on('moveturn', function(ret){
		var seat = ret.seat;
		$('li.seat').removeClass('active');
		$('li#seat'+seat).addClass('active');
		
		if(ret.uid === client.uid) {
			$('#cmds').removeClass('inactive');
			$('#cmds').addClass('active');
		} else {
			$('#cmds').removeClass('active');
			$('#cmds').addClass('inactive');
		}
		
		addMsg(_T('now:') + seat + ', ' + ret.uid);
	});
	
	client.on('countdown', function(ret){
		if (BotCmd.fold && BotPlay && OpenCards.length === 0) {
			Decision.preFlopPlay(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, client.room.pot, PlayerBets);
		} else if (BotCmd.fold && BotPlay && OpenCards.length === 3) {
			Decision.flopPlay(client, BotCmd, BotCards, OpenCards, PlayerPosition, parseReply, client.room.pot, PlayerBets);
		} else if (BotCmd.fold && BotPlay && OpenCards.length === 4) {
			client.rpc('call', 0, parseReply);
		} else if (BotCmd.fold && BotPlay && OpenCards.length === 5) {
			client.rpc('call', 0, parseReply);
		}	
		addMsg(_T('count down:') + ret.seat + ', ' + ret.sec);
		addMsg(_T('count down:') + ret.seat + ', ' + ret.sec);
	});
	
	client.on('fold', function(ret){
		console.log("fold");
		addMsg( ret.uid + _T_('at seat') + ret.seat + _T_('fold'));
	});
	
	client.on('call', function(ret){
		PlayerBets.push(ret.call)
		console.log("call");
		var seat = parseInt(ret.seat);
		addMsg( ret.uid + _T_('at seat') + seat + _T_('call') + ret.call);
		
		client.room.pot += ret.call;
		
		var chips = client.room.chips;
		if(chips) {
			chips[ seat ] += ret.call;
		}
		
		var gamers = client.room.gamers;
		if(ret.uid in gamers) {
			gamers[ ret.uid ].coins -= ret.call;
		}
		
		showRoom(client.room);
	});

	client.on('raise', function(ret){
		console.log("raise");
		PlayerBets.push(ret.raise);
		var seat = parseInt(ret.seat);
		var raise_sum = (ret.call + ret.raise);
		addMsg( ret.uid + _T_('at seat') + seat + _T_('raise') + ret.raise + ' (' + raise_sum + ')');
		
		client.room.pot += raise_sum;
		
		var chips = client.room.chips;
		if(chips) {
			chips[ seat ] += raise_sum;
		}

		var gamers = client.room.gamers;
		if(ret.uid in gamers) {
			gamers[ ret.uid ].coins -= raise_sum;
		}
		
		showRoom(client.room);
	});

	client.on('pk', function(ret){
		addMsg( ret.uid + _T_('at seat') + ret.seat +  _T('pk') + ret.pk_uid + _T_('at seat') + ret.pk_seat + ', ' + _T('result') + ': ' + (ret.win?_T('win'):_T('fail')));
		
		var gamers = client.room.gamers;
		if(ret.uid in gamers) {
			gamers[ ret.uid ].coins -= ret.pk_cost;
		}
		
		showRoom(client.room);
	});
	
	client.on('seecard', function(ret){
		var seat = parseInt(ret.seat);
		addMsg( ret.uid + _T_('at seat') + seat + _T_('seecard') );
		if(ret.cards) {
			client.room.cards[ seat ] = ret.cards;
			showRoom(client.room);
		}
	});
	
	client.on('showcard', function(ret){
		addMsg( ret.uid + _T_('at seat') + ret.seat + _T_('showcard') );
		if(ret.cards) {
			client.room.cards[ parseInt(ret.seat) ] = ret.cards;
			showRoom(client.room);
		}
	});
	
	client.on('gameover', function(ret){
		addMsg( _T('game over!'));
		
		var shared_cards = client.room.shared_cards;
		var gamers = client.room.gamers;
		var cards = client.room.cards;
		var chips = client.room.chips;
		while(ret.length > 0) {
			var gamer = ret.shift();
			var uid = gamer.uid;
			
			var n = (gamer.prize - gamer.chips);
			if(n > 0) n = '+' + n;
			
			var mycards = gamer.cards;
			var pattern = '';
			if(mycards.length === 3) {
				pattern = Jinhua.patternString(mycards);
				addMsg( '#' + gamer.seat + ', ' + uid + ': ' + n + ', ' + _T_(pattern) );
			} else {
				var maxFive = Holdem.sort( Holdem.maxFive(mycards, shared_cards) );
				pattern = Holdem.patternString( maxFive );
				addMsg( '#' + gamer.seat + ', ' + uid + ': ' + n + ', ' + _T_(pattern) + ' (' + Poker.visualize(maxFive) + ')' );
			}
			
			cards[ gamer.seat ] = gamer.cards;
			chips[ gamer.seat ] = gamer.chips;
			
			// if gamer still in room
			if(uid in gamers) {
				delete gamer.cards;
				delete gamer.chips;
				delete gamer.prize;
				
				gamers[ uid ] = gamer;
			}
		}
		
		showRoom(client.room);
	});

	client.on('bye', function(ret){
		addMsg(ret);
	});

	$('#m').focus();
	$('form').submit(function(e) {
		execCmd();
		return false;
	});
});

/*
 * cmds {
 *     exit: true,
 *     takeseat: true,
 *     unseat: true,
 *     call: true,
 *     raise: [50,100,150],
 *     raise: 'range,0,1000000',
 *     fold: true,
 *     pk: ['zhang3', 'li4', 'wang5'],
 *     seecard: true,
 *     showcard: true,
 *   }
 */
function parseSignUpReply(err,ret){
	parseReply(err,ret);
	if(! err) {
		addMsg(_T('account created:') + ret.uid + '/' + ret.passwd);
		login(ret.uid, ret.passwd);
	}
}

function onBtnClicked(e) {
	var method = $(this).attr('id');
	switch(method) {
	case 'fastsignup':
		client.rpc(method, $(this).attr('arg'), parseSignUpReply);
		break;
	default:
		client.rpc(method, $(this).attr('arg'), parseReply);
	}
}
function onInputBtnClicked(e){
	var method = $(this).attr('id');
	client.rpc(method, $('input#'+method).val(), parseReply);
	$('input#'+method).val('');
}
function onInputBoxEnter(e) {
	if(e.which == 13) onInputBtnClicked.call(this, e);
}
function onDialogBtnClicked(e) {
	var method = $(this).attr('id');
	var dlg = $('div#'+method);
	var x = ($(window).width() - dlg.width()) / 2;
	var y = ($(window).height() - dlg.height()) / 2;
	dlg.show();
	dlg.css({ 
		position:'absolute',
		left: x + 'px', 
		top: y + 'px'
	});
	
	$(this).hide();
}
function onDialogXClicked(e) {
	var method = $(this).attr('X');
	$('div#'+method).hide();
	$('button#'+method).show();
}
function onDialogOKClicked(e) {
	var method = $(this).attr('OK');
	var args = {};
	$('input.' + method).each(function(i, v){
		var input = $(this);
		args[ input.attr('id') ] = input.val();
	});
	switch(method) {
	case 'signup':
		client.rpc(method, args, parseSignUpReply);
		break;
	default:
		client.rpc(method, args, parseReply);
	}
}
function toogleBot(){
	BotPlay = !BotPlay;
	if (BotPlay) {
		client.rpc('ready', 0, parseReply);
	}
}

function updateCmds( cmds ){
	var v, div, btn, words, label, input;
	BotCmd = cmds;
	if (cmds.ready && BotPlay){
		client.rpc('ready', 0, parseReply);
	}

	for(var k in cmds) {
		v = cmds[ k ];
		if(v === null) {
			$('div#'+k).remove();
			$('button#'+k).remove();
			
		} else if(v === true) {
			btn = $('<button>').text(_T(k)).attr('id', k).attr('arg', 0).addClass('cmd');
			$('#cmds').append(btn);
			btn.on('click', onBtnClicked);
			
		} else if(typeof v === 'string') {
			div = $('<div>').attr('id',k).addClass('cmd');
			$('#cmds').append(div);
			input = $('<input>').attr('id', k).addClass('cmd');
			words = v.split(',');
			switch(words[0]) {
			case 'range':
				input.attr('type', 'range');
				if(words[1]) {
					var min = parseInt(words[1]);
					input.attr('min', min).val(min);
				}
				if(words[2]) input.attr('max', parseInt(words[2]));
				break;
			case 'number':
				input.attr('type', 'number').attr('size',5);
				if(words[1]) input.attr('min', parseInt(words[1]));
				if(words[2]) input.attr('max', parseInt(words[2]));
				break;
			case 'password':
				input.attr('type', 'password').attr('size',40);
				break;
			//case 'text':
			default:
				input.attr('type', 'text').attr('size',40);
				break;
			}
			div.append(input);
			btn = $('<button>').text(_T(k)).attr('id', k).addClass('cmd');
			div.append(btn);
			btn.on('click', onInputBtnClicked);
			input.keydown(onInputBoxEnter);
			
		} else if( Object.prototype.toString.call( v ) === '[object Array]' ) {
			div = $('<div>').attr('id',k).addClass('cmd');
			$('#cmds').append(div);
			for(var i=0; i<v.length; i++) {
				var arg = v[i];
				var t_arg = (typeof arg === 'string') ? _T(arg) : arg;
				btn = $('<button>').text(_T(k)+' '+ t_arg).attr('id', k).attr('arg', arg).addClass('cmd');
				div.append(btn);
				btn.on('click', onBtnClicked);
			}
			
		} else if( typeof v === 'object' ) {
			btn = $('<button>').text(_T(k)).attr('id', k).addClass('cmd');
			$('#cmds').append(btn);
			
			var dlg = $('<div>').attr('id',k).addClass('dialog');
			$('body').append(dlg);
			dlg.hide();
			
			var dlgheader = $('<div>').addClass('dlgheader');
			dlg.append(dlgheader);
			dlgheader.append($('<span>').text(_T(k)));
			var X = $('<button>').text('X').attr('X', k).addClass('cmd');
			dlgheader.append(X);
			for(var j in v) {
				label = $('<label>').attr('for', j).text(_T(j)+':').addClass('cmd');
				input = $('<input>').attr('id', j).addClass(k).addClass('cmd');
				
				words = v[j].split(',');
				switch(words[0]) {
				case 'range':
					input.attr('type', 'range');
					if(words[1]) input.attr('min', parseInt(words[1]));
					if(words[2]) input.attr('max', parseInt(words[2]));
					break;
				case 'number':
					input.attr('type', 'number').attr('size',5);
					if(words[1]) input.attr('min', parseInt(words[1]));
					if(words[2]) input.attr('max', parseInt(words[2]));
					break;
				case 'password':
					input.attr('type', 'password').attr('size',40);
					break;
				//case 'text':
				default:
					input.attr('type', 'text').attr('size',40);
					break;
				}
				
				switch(j) { // auto fill if we remember uid & passwd
				case 'uid':
					var u = localStorage.getItem('x_userid');
					if(u) input.val(u);
					break;
				case 'passwd':
					var p = localStorage.getItem('x_passwd');
					if(p) input.val(p);
					break;
				}
				
				dlg.append(label).append(input).append('<br/>');
			}
			var dlgfooter = $('<div>').addClass('dlgfooter');
			dlg.append(dlgfooter);
			var OK = $('<button>').text('OK').attr('OK', k).addClass('cmd');
			dlgfooter.append(OK);
			
			btn.on('click', onDialogBtnClicked);
			OK.on('click', onDialogOKClicked);
			X.on('click', onDialogXClicked);

		} else {
			
		}
	}
	$('#BotPlay').remove();
	if (BotPlay) {
		btn = $('<button>').text(_T("Take Over")).attr('id', "BotPlay").attr('arg', 0).addClass('cmd');
		$('#cmds').append(btn);
	} else {
		btn = $('<button>').text(_T("Bot Play")).attr('id', "BotPlay").attr('arg', 0).addClass('cmd');
		$('#cmds').append(btn);
	}
	btn.on('click', toogleBot);
}

function login(u, p) {
	client.rpc('login', {
		uid: u,
		passwd: p
	}, function(err,ret){
		if(err) {
          localStorage.removeItem('x_userid');
		  localStorage.removeItem('x_passwd');
			echo(ret);
			socket.emit('hello', {});
		} else {
			$('#messages').empty();
			$('div#cmds').empty();
			showRoom(null);

			localStorage.setItem('x_userid', u);
			localStorage.setItem('x_passwd', p);
			addMsg(ret.token.uid + ' (' + ret.profile.name + ') ' + _T('login success'));
			
			if(ret.cmds) {
				updateCmds(ret.cmds);
				
				if('entergame' in ret.cmds) {
					list_games();
				}
			}
		}
		
	});
}

function list_games(){
	client.rpc('games', 0, function(err, ret){
		if(err) echo(ret);
		else {
			$('#roomname').text(_T('available games'));
			var list = $('#seats');
			list.empty();
			for(var i=0; i<ret.length; i++) {
				var game = ret[i];
				var str = (i+1) + ', ' + _T_( game.id ) + ': ' + game.name + ' (' + game.desc + '), ' + game.rooms + ' rooms';
				list.append($('<li>').text(str));
			}
		}
	});
}

function list_rooms( gameid ) {
	client.rpc('rooms', gameid, function(err, ret){
		if(err) echo(ret);
		else {
			var list = $('#seats');
			list.empty();
			for(var i=0; i<ret.length; i++) {
				var room = ret[i];
				var str = 'room id: ' + room.id + 
					', name: "' + room.name +
					'", seats: ' + room.seats_taken + '/' + room.seats_count + 
					', gamers: ' + room.gamers_count;
				list.append($('<li>').text(str));
			}
		}
	});
}

function addMsg(str) {
	$('#messages').append($('<li>').text(str).addClass('msg'));
	var msgs = $('li.msg');
	var n = msgs.length - 20;
	if(n > 0) {
		for(var i=0; i<n; i++) {
			msgs[i].remove();
		}
	}
}

function echo(ret) {
	addMsg( JSON.stringify(ret) );
}

function echoReply(err, ret) {
	addMsg( JSON.stringify(ret) );
}

function parseReply(err, ret) {
	if(err) addMsg(ret);
	else if(ret.cmds) updateCmds(ret.cmds);
}

function showRoom(room) {
	$('#roomname').empty();
	$('#roomdesc').empty();
	$('#sharedcards').empty();
	$('#pot').empty();
	$('#countdown').empty();
	$('#seats').empty();
	$('#mycards').empty();
	if(! room) return;
	
	$('#roomname').text( _T('room number') + ': ' + room.id + ' (' + room.name + ')');
	
	var gamers = room.gamers;
	var seats = room.seats;
	var cards = room.cards;
	var chips = room.chips;
	BotCards = room.cards;
	OpenCards = room.shared_cards;
	$('#roomdesc').text(_T('gamers in room') + ': ' + Object.keys(gamers).join(', '));
	for(var i=0, len=seats.length; i<len; i++) {
		var uid = seats[i];
		var g = uid ? gamers[ uid ] : null;
		var str = "#" + i + ': ';
		if(g) {
			str += g.uid + ' (' + g.name + ') [' + g.coins + ', ' + g.score + ', ' + g.exp + ', ' + g.level + ']';
			if(cards && cards[i]) {
				str += _T_('private cards') + '[ ' + Poker.visualize( cards[i] ) + ' ]';
				
				if(g.uid === client.uid) {
					PlayerPosition = i;
					$('#mycards').html( client.uid + ', ' + _T('my cards') + ': <br/>' + Poker.toHTML(cards[i]) );
				}
			}
			if(chips && chips[i]) {
				str += _T_('bet') + '[ ' + chips[i] + ' ]';
			}
			
		} else {
			str += '(' + _T('empty') + ')';
		}
		$('#seats').append($('<li>').text(str).attr('id', 'seat'+i).addClass('seat'));
	}
	
	if(room.shared_cards) {
		$('#sharedcards').html( _T('shared cards') + ': <br/>' + Poker.toHTML(room.shared_cards) );
	}
	
	if(room.pot) {
		$('#pot').text( _T('pot') + ': ' + room.pot );
	}
	
}

function execCmd() {
	var cmd = $('#m').val() + '';
	if(cmd.length === 0) return false;
	$('#m').val('');
	$('#m').focus();
	
	var words = cmd.split(' ');
	switch(words[0]) {
	case 'clear':
		$('#seats').empty();
		$('#messages').empty();
		break;
	case 'fastsignup':
		client.rpc('fastsignup', 0, parseSignUpReply);
		break;
	case 'signup':
		client.rpc('signup', {
			uid: words[1],
			passwd: words[2]
		}, parseSignUpReply);
		break;
	case 'login':
		login(words[1], words[2]);
		break;
	case 'logout':
		client.rpc('logout', 0, parseReply);
		break;
	case 'games':
		list_games();
		break;
	case 'rooms':
		list_rooms( words[1] );
		break;
	case 'entergame':
		client.rpc('entergame', words[1], parseReply);
		break;
	case 'enter':
		client.rpc('enter', words[1], parseReply);
		break;
	case 'look':
		client.rpc('look', 0, function(err, ret){
			if(err) echo(ret);
			else {
				showRoom(ret);
			}
		});
		break;
	case 'exit':
		client.rpc('exit', 0, function(err, ret){
			if(err) echo(ret);
			else {
				echo(ret);
				showRoom(null);
				list_games();
			}
		});
		break;
	case 'takeseat':
		client.rpc('takeseat', words[1], parseReply);
		break;
	case 'unseat':
		client.rpc('unseat', 0, parseReply);
		break;
	case 'shout':
		words.shift();
		client.rpc('shout', words.join(' '), parseReply );
		break;
	case 'say':
		words.shift();
		client.rpc('say', words.join(' '), parseReply );
		break;
	default:
		//client.say( cmd, parseReply );
	}
}

},{"../lib/client":3,"../lib/decision":4,"../lib/holdem_poker":5,"../lib/jinhua_poker":6,"../lib/poker":7}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
exports = module.exports = Client;

function Client( socket ) {	
	this.uid = null;
	this.pin = null;
	this.profile = {};
	this.events = {};
	this.room = null;
	this.cmds = {};
	
	this.setUplink( socket );
}

Client.prototype.setUplink = function(socket) {
	var client = this;
	client.uplink = socket;
	
	if(! socket.gamers) {
		socket.gamers = {};
		socket.gamers_count = 0;
		socket.rpc_seq = 0;
		socket.rpc_callbacks = {};
		
		socket.on('push', function( msg ){ // { uid:x, e:xx, args:xxx }
			if(socket.log_traffic) console.log('push', msg);
			
			if(! msg) return;
			if(typeof msg !== 'object') return;
			
			var event = msg.e;
			if(! event) return;
			
			var args = msg.args;
			var target;
			if(msg.uid) {
				target = socket.gamers[ msg.uid ];
				if(target) target.onPush( event, args );
				
			} else {
				var gamers = socket.gamers;
				for(var uid in gamers) {
					target = gamers[ uid ];
					if(target) target.onPush( event, args );				
				}
			}
		});
		
		socket.on('rpc_ret', function(reply){
			if(socket.log_traffic) console.log('rpc_ret', reply);
			
			if(reply && reply.seq) {
				var seq = reply.seq, err = reply.err, ret = reply.ret;
				var callback = socket.rpc_callbacks[ seq ];
				if(callback) {
					if(! err) {
						if(ret && ret.cmds) {
							client.filterCmds( ret.cmds );
						}
					}
					var func = callback.func;
					if(typeof func === 'function') func(err, ret);
					
					delete socket.rpc_callbacks[ seq ];
				}
			}
		});
	}
	
	client.uid = ++ socket.rpc_seq;
	socket.gamers[ client.uid ] = client;
	
	return this;
};

Client.prototype.on = function(event, func) {
	this.events[ event ] = func;
	return this;
};

Client.prototype.filterCmds = function(cmds) {
	for(var i in cmds) {
		if(cmds[i] !== null) this.cmds[i] = 1;
	}
	var login = cmds.login;
	var signup = cmds.signup;
	var fastsignup = cmds.fastsignup;
	if(login) {
		for(i in this.cmds) {
			cmds[i] = null;
		}
		cmds.login = login;
		if(signup) cmds.signup = signup;
		if(fastsignup) cmds.fastsignup = fastsignup;
	}
	for(i in this.cmds){
		if(this.cmds[i] === null) delete this.cmds[i];
	}
};

Client.prototype.onPush = function(event, args) {
	switch(event) {
	case 'prompt':
		this.filterCmds(args);
		break;
	case 'look':
		this.room = args;
		break;
	case 'enter':
		this.room.gamers[ args.who.uid ] = args.who;
		break;
	case 'exit':
		args.who = this.room.gamers[ args.uid ];
		break;
	case 'takeseat':
		this.room.seats[ args.where ] = args.uid;
		args.who = this.room.gamers[ args.uid ];
		break;
	case 'unseat':
		this.room.seats[ args.where ] = null;
		args.who = this.room.gamers[ args.uid ];
		break;
	case 'say':
		args.who = this.room.gamers[ args.uid ];
		break;
	case 'refresh':
		var uid = args.uid;
		if(uid === this.uid) {
			this.profile = args.profile;
		}
		var room = this.room;
		if(room && (uid in room.gamers)) {
			room.gamers[ uid ] = args.profile;
		}
	}
	
	var func;
	if(typeof (func = this.events[event]) === 'function') {
		func(args);
	} else if(typeof (func = this.events['else']) === 'function') {
		func(args);
	}
	
	switch(event) {
	case 'bye':
		this.pin = null;
		this.profile = {};
		this.room = null;
		this.cmds = {};
		break;
	}
};

Client.prototype.removeUplink = function() {
	var socket = client.uplink;
	if(socket) {
		client.socket = null;
		delete socket.gamers[ this.uid ];
		socket.gamers_count --;
	}
	
	return this;
};

/*
 * accepted methods and args:
 * 
 * signup, {uid, passwd, name, email, phone, uuid}
 * login, {uid, passwd}
 * logout, 0
 * 
 * games, 0
 * rooms, gameid
 * shout, msg
 * entergame, gameid
 * enter, roomid
 * say, msg
 * look, 0
 * takeseat, seat or ''
 * unseat, 0
 * exit, 0
 * 
 * follow, 0
 * addchip, n
 * giveup, 0
 * pk, uid
 * checkcard, 0
 * showcard, 0
 * 
 */

Client.prototype.rpc = function(method, args, func) {
	var client = this;
	var socket = client.uplink;
	
	if(typeof func !== 'function') {
		throw 'need a callback func(err,ret)';
	}

	var callback_func = func;
	
	switch(method) {
	case 'fastsignup':
	case 'signup':
		break;
	case 'login':
		callback_func = function(err, ret){
			if(! err) {
				if(client.uid !== ret.token.uid) {
					delete socket.gamers[ client.uid ];
				}
				
				client.uid = ret.token.uid;
				client.pin = ret.token.pin;
				client.profile = ret.profile;
				
				socket.gamers[ client.uid ] = client;
			}
			func(err, ret);
		};
		break;
	default:
		if(! client.pin) {
			func(400, 'need login first');
			return this;
		}
	}
	
	var callback = {
			seq: ++ socket.rpc_seq,
			func: callback_func,
			t: Date.now()
		};
	socket.rpc_callbacks[ callback.seq ] = callback;
	
	var req = {
		seq: callback.seq,
		uid: client.uid,
		pin: client.pin,
		f: method,
		args: args
	};
	socket.emit('rpc', req);

	if(socket.log_traffic) console.log('rpc', req);
	
	return this;
};


},{}],4:[function(require,module,exports){
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

},{"./boardTexture":2}],5:[function(require,module,exports){
var Poker = require('./poker');

var POKER_CARDS = Poker.CARDS;

var HIGH_CARD		= 1, // 高牌, AQ953
	ONE_PAIR		= 2, // 一对, KK854
	TWO_PAIR		= 3, // 两对, KKJJ9
	THREE			= 4, // 三条, KKK98
	STRAIGHT		= 5, // 顺子, 98765
	FLUSH			= 6, // 同花, 
	FULLHOUSE		= 7, // 葫芦, KKK99
	FOUR			= 8, // 四条, KKKK9
	STRAIGHT_FLUSH	= 9, // 同花顺, 98765
	ROYAL_FLUSH		= 10; // 皇家同花顺, AKQJ10

var HOLDEM_PATTERNS = {
	0: 'invalid',		// 错误
	1: 'high card',		// 高牌
	2: 'one pair',		// 一对
	3: 'two pair',		// 两对
	4: 'three of a kind', // 三条
	5: 'straight', 		// 顺子
	6: 'flush', 		//  同花
	7: 'fullhouse', 	// 葫芦
	8: 'four of a kind', // 四条
	9: 'straight flush', // 同花顺
	10: 'royal flush' 	// 皇家同花顺
};

var Holdem = {
	HIGH_CARD: 		1,
	ONE_PAIR: 		2,
	TWO_PAIR: 		3,
	THREE: 			4,
	STRAIGHT: 		5,
	FLUSH: 			6,
	FULLHOUSE: 		7,
	FOUR: 			8,
	STRAIGHT_FLUSH: 9,
	ROYAL_FLUSH: 	10,
	
	PATTERNS: HOLDEM_PATTERNS,
};

exports = module.exports = Holdem;

Holdem.sort = function(cards) {
	if(cards.length != 5) return cards;
	Poker.sortByNumber(cards);

	var n0 = cards[0] & 0xf,
		n1 = cards[1] & 0xf,
		n2 = cards[2] & 0xf,
		n3 = cards[3] & 0xf,
		n4 = cards[4] & 0xf;
	
	var d0 = n0 - n1,
		d1 = n1 - n2,
		d2 = n2 - n3,
		d3 = n3 - n4;

	if((d1 === 0) && (d2 === 0)) {
		if(d0 === 0) { 
			// XXXXM
		} else if(d3 === 0) { 
			// MXXXX -> XXXXM
			cards.push( cards.shift() );
		} else { 
			// MXXXN
			var c0 = cards.shift();
			cards.splice(3, 0, c0);
		}
	} else if((d0 === 0) && (d1 === 0)) { 
		// XXXMN, or XXXMM
	} else if((d2 === 0) && (d3 === 0)) { 
		// MNXXX -> XXXMN
		cards.push( cards.shift() );
		cards.push( cards.shift() );
	} else if((d0 === 0) && (d1 === 0)) { 
		// XXYYM
	} else if((d0 === 0) && (d3 === 0)) {
		// XXMYY -> XXYYM
		var c2 = cards[2];
		cards.splice(2, 1);
		cards.push( c2 );
	} else if((d1 === 0) && (d3 === 0)) {
		// MXXYY -> XXYYM
		cards.push( cards.shift() );
	} else if(d0 === 0) {
		// XXABC
	} else if(d1 === 0) {
		// AXXBC -> XXABC
		var c_0 = cards.shift();
		cards.splice(2, 0, c_0);
	} else if(d2 === 0) {
		// ABXXC -> XXABC
		var c_2 = cards[2], c_3 = cards[3];
		cards.splice(2, 2);
		cards.unshift(c_3);
		cards.unshift(c_2);
	} else {
		// ABCDE
	}
	
	return cards;
};

Holdem.rank = function(cards) {
	if(cards.length != 5) return 0;
	Holdem.sort(cards);
	
	var c0 = cards[0] >> 4,
		c1 = cards[1] >> 4,
		c2 = cards[2] >> 4,
		c3 = cards[3] >> 4,
		c4 = cards[4] >> 4;
		
	var n0 = cards[0] & 0xf,
		n1 = cards[1] & 0xf,
		n2 = cards[2] & 0xf,
		n3 = cards[3] & 0xf,
		n4 = cards[4] & 0xf;

	var d0 = n0 - n1,
		d1 = n1 - n2,
		d2 = n2 - n3,
		d3 = n3 - n4;
	
	var isFlush = ((c0 === c1) && (c1 === c2) && (c2 === c3) && (c3 === c4));
	var isStraight = ((d0 === 1) && (d1 === 1) && (d2 === 1) && (d3 === 1));
	var rank = (n0 << 16) | (n1 << 12) | (n2 << 8) | (n3 << 4) | n4;
	var pattern = 0;
	
	if(isFlush && isStraight) {
		if(n0 === 14) { // Poker.NUMBER_RANK['A']
			pattern = ROYAL_FLUSH;
		} else {
			pattern = STRAIGHT_FLUSH;
		}
	} else if((d0 === 0) && (d1 === 0) && (d2 === 0)) {
		pattern = FOUR;
		
	} else if((d0 === 0) && (d1 === 0) && (d3 === 0)) {
		pattern = FULLHOUSE;
		
	} else if(isFlush) {
		pattern = FLUSH;
		
	} else if(isStraight) {
		pattern = STRAIGHT;
		
	} else if((d0 === 0) && (d1 === 0)) {
		pattern = THREE;
		
	} else if((d0 === 0) && (d2 === 0)) {
		pattern = TWO_PAIR;
		
	} else if((d0 === 0)) {
		pattern = ONE_PAIR;
		
	} else {
		pattern = HIGH_CARD;
	}
	
	return (pattern << 20) | rank;
};

/*
 * 如有两名以上的牌手在最后一轮下注结束时仍未盖牌，则须进行斗牌。
 * 斗牌时，每名牌手以自己的两张底牌，加上桌面五张公共牌，共七张牌中，取最大的五张牌组合决定胜负.
 * 当中可包括两张或一张底牌，甚至只有公共牌。
 */
Holdem.maxFive = function(private_cards, shared_cards) {
	var cards = Poker.sort( Poker.merge( Poker.clone(private_cards), shared_cards ) );
	var len = cards.length;
	if(len < 5 || len > 7 ) return private_cards;
	
	var maxrank = 0, maxcards = null, i, j, tmp, tmprank;
	
	if(len === 5) {
		return cards;
		
	} else if(len === 6) {
		for(j=0; j<6; j++) {
			tmp = Poker.clone(cards);
			tmp.splice(j, 1);
			tmprank = Holdem.rank( tmp );
			if(tmprank > maxrank) {
				maxrank = tmprank;
				maxcards = tmp;
			}
		}
		
	} else if(len === 7) {
		for(i=0; i<7; i++) {
			for(j=0; j<6; j++) {
				tmp = Poker.clone(cards);
				tmp.splice(i, 1);
				tmp.splice(j, 1);
				tmprank = Holdem.rank( tmp );
				if(tmprank > maxrank) {
					maxrank = tmprank;
					maxcards = tmp;
				}
			}
		}
	}
	
	return maxcards;
};

Holdem.pattern = function(cards) {
	return Holdem.rank(cards) >> 20;
};

Holdem.patternString = function(cards) {
	return HOLDEM_PATTERNS[ Holdem.rank(cards) >> 20 ];
};

Holdem.compare = function(a, b) {
	return Holdem.rank(a) - Holdem.rank(b);
};

Holdem.view = function(cards) {
	var rank = Holdem.rank(cards);
	var pattern = rank >> 20;
	var str = Poker.visualize(cards).join(',') + ' -> ' + HOLDEM_PATTERNS[ pattern ] + ', rank:' + rank;
	console.log( str );
};


},{"./poker":7}],6:[function(require,module,exports){
var Poker = require('./poker');

var POKER_CARDS = Poker.CARDS;

var HIGH_CARD		= 1, // 单张
	PAIR			= 2, // 对子
	STRAIGHT		= 3, // 顺子
	FLUSH			= 4, // 同花
	STRAIGHT_FLUSH	= 5, // 同花顺
	THREE			= 6; // 豹子

var JINHUA_PATTERNS = {
	0: 'invalid',
	1: 'danzhang',
	2: 'duizi',
	3: 'shunzi',
	4: 'tonghua',
	5: 'tonghuashun',
	6: 'baozi'
};

var Jinhua = {
	HIGH_CARD: 	1,
	PAIR: 		2,
	STRAIGHT: 	3,
	FLUSH: 	4,
	STRAIGHT_FLUSH: 5,
	THREE: 		6,
	
	PATTERNS: JINHUA_PATTERNS,
};

exports = module.exports = Jinhua;

Jinhua.sort = function(cards) {
	if(cards.length != 3) return cards;
	Poker.sortByNumber(cards);
	
	var n1 = cards[1] & 0xf, n2 = cards[2] & 0xf;
	if(n1 === n2) { // avoid pair at end
		cards.push( cards.shift() );
	}
	return cards;
};

Jinhua.rank = function(cards) {
	if(cards.length != 3) return 0;
	Jinhua.sort(cards);
	
	var c0 = cards[0] >> 4, c1 = cards[1] >> 4, c2 = cards[2] >> 4;
	var n0 = cards[0] & 0xf, n1 = cards[1] & 0xf, n2 = cards[2] & 0xf;
	var d0 = n0 - n1, d1 = n1 - n2;
	
	var rank = (n0 << 8) | (n1 << 4) | n2;
	var pattern = 0;
	
	if((d0 === 0) && (d1 === 0)) {
		pattern = THREE;
		
	} else if((c0 === c1) && (c1 === c2)) {
		if((d0 === 1) && (d1 === 1)) {
			pattern = STRAIGHT_FLUSH;
			
		} else {
			pattern = FLUSH;
		}
		
	} else if((d0 === 1) && (d1 === 1)) {
		pattern = STRAIGHT;
		
	} else if((d0 === 0) || (d1 === 0)) {
		pattern = PAIR;
		
	} else {
		pattern = HIGH_CARD;
	}

	return (pattern << 12) | rank;
};

Jinhua.pattern = function(cards) {
	return Jinhua.rank(cards) >> 12;
};

Jinhua.patternString = function(cards) {
	return JINHUA_PATTERNS[ Jinhua.rank(cards) >> 12 ];
};

Jinhua.compare = function(a, b) {
	return Jinhua.rank(a) - Jinhua.rank(b);
};

Jinhua.view = function(cards) {
	var rank = Jinhua.rank(cards);
	var pattern = rank >> 12;
	var str = Poker.visualize(cards).join(',') + ' -> ' + JINHUA_PATTERNS[ pattern ] + ', rank:' + rank;
	console.log( str );
};


},{"./poker":7}],7:[function(require,module,exports){

var POKER_COLORS = {
	4: '♠', 		// spade
	3: '♥', 	// heart
	2: '♣', 	// club
	1: '♦' 		// diamond
};

var POKER_NUMBERS = {
	14 : 'A',
	13 : 'K',
	12 : 'Q',
	11 : 'J',
	10 : '10',
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

var POKER_NUMBER_RANK = {
	'A': 14,
	'K': 13,
	'Q': 12,
	'J': 11,
	'10': 10,
	'9': 9,
	'8': 8,
	'7': 7,
	'6': 6,
	'5': 5,
	'4': 4,
	'3': 3,
	'2': 2,
	'?': 0,
	'': 0
};

var POKER_COLOR_RANK = {
	'S': 4,
	'H': 3,
	'C': 2,
	'D': 1,
	'': 0
};

var RED_JOKER = (6 << 4) | 15;
var BLACK_JOKER = (5 << 4) | 15;

var POKER_CARDS = {};
for(var color=1; color<=4; color++) {
	for(var number=2; number<=14; number++) {
		var card = (color << 4) | number;
		POKER_CARDS[ card ] = POKER_NUMBERS[ number ] + '' + POKER_COLORS[ color ];
	}
}
POKER_CARDS[ RED_JOKER ] = '@';
POKER_CARDS[ BLACK_JOKER ] = '*';
POKER_CARDS[ 0 ] = '?';

exports = module.exports = Poker;

function Poker(str){
	if(typeof str === 'string') {
		var c = POKER_COLOR_RANK[ str.charAt(0) ];
		var n = POKER_NUMBER_RANK[ str.substring(1) ];
		if(c && n) {
			return (c << 4) | n;
		} else {
			return 0;
		}
	} else if(typeof str === 'object') {
		var cards = [];
		for(var i=0; i<str.length; i++) {
			cards.push( Poker(str[i]) );
		}
		return cards;
	} else {
		return 0;
	}
}

Poker.RED_JOKER = RED_JOKER;
Poker.BLACK_JOKER = BLACK_JOKER;
	
Poker.SPADE = 4;
Poker.HEART = 3;
Poker.CLUB	= 2;
Poker.DIAMOND = 1;
	
Poker.COLORS = POKER_COLORS;
Poker.NUMBERS = POKER_NUMBERS;
Poker.CARDS = POKER_CARDS;
Poker.NUMBER_RANK = POKER_NUMBER_RANK;

Poker.visualize = function( cards ) {
	if(typeof cards === 'number') return POKER_CARDS[ cards ];
	
	var v_cards = [];
	for(var i=0, len=cards.length; i<len; i++) {
		v_cards.push( POKER_CARDS[ cards[i] ] );
	}
	return v_cards;
};

Poker.newSet = function( options ) {
	var no_joker = true, no_color = [], no_number = [], no_card = [];
	if(options) {
		if(typeof options.no_joker === 'boolean') no_joker = options.no_joker;
		if(typeof options.no_color === 'object') no_color = options.no_color;
		if(typeof options.no_number === 'object') no_number = options.no_number;
		if(typeof options.no_card === 'object') no_card = options.no_card;
	}
	
	var cards = [];
	for(var color=1; color<=4; color++) {
		if(no_color.indexOf(color) >= 0) continue;
		
		for(var number=2; number<=14; number++) {
			if(no_number.indexOf(number) >= 0) continue;
			
			var card = (color << 4) | number;
			if(no_card.indexOf(card) >= 0) continue;
			
			cards.push( card );
		}
	}
	
	if(! no_joker) {
		cards.push( RED_JOKER );
		cards.push( BLACK_JOKER );
	}
	
	return cards;
};

Poker.clone = function(cards) {
	var cloned = [];
	for(var i=0; i<cards.length; i++) {
		cloned[i] = cards[i];
	}
	return cloned;
};

Poker.draw = function(cards, n) {
	var len = cards.length;
	if(len < n) return [];
	
	var subset = [];
	while(n -- > 0) {
		var i = Math.floor( Math.random() * len );
		subset.push( cards[i] );
		cards.splice(i,1); // NOTICE: splice will return an array
		len --;
	}
	return subset;
};

Poker.randomize = function( cards ) {
	var randomized = this.draw(cards, cards.length);
	while(randomized.length > 0) {
		cards.push( randomized.shift() );
	}
	return cards;
};

Poker.compareColorNumber = function(a, b) {
	if(a == b) return 0;
	else {
		var aColor = a >> 4, aNumber = a & 0x0f;
		var bColor = b >> 4, bNumber = b & 0x0f;
		if(aColor == bColor) return aNumber - bNumber;
		else return aColor - bColor;
	}
};

Poker.compareNumberColor = function(a, b) {
	if(a == b) return 0;
	else {
		var aColor = a >> 4, aNumber = a & 0x0f;
		var bColor = b >> 4, bNumber = b & 0x0f;
		if(aNumber == bNumber) return aColor - bColor;
		else return aNumber - bNumber;
	}
};

Poker.compare = function(a, b) {
	return (a & 0xff) - (b & 0xff);
};

Poker.sort =
Poker.sortByColor = function( cards ) {
	return cards.sort( Poker.compareColorNumber ).reverse();
};

Poker.sortByNumber = function( cards ) {
	return cards.sort( Poker.compareNumberColor ).reverse();
};

Poker.merge = function( a, b ) {
	return a.concat(b);
};

Poker.print = function( cards ) {
	var str = cards.join(',');
	console.log( str );
};

Poker.view = function( cards ) {
	var str = Poker.visualize(cards).join(',');
	console.log( str );
};

},{}]},{},[1]);
