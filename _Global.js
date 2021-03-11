"use strict";

// --- CLOCK CYCLES --- //
var Clock = 0; 			// Current tick value 		//
const ClockTick = (60/24)*(1000/24);	// ms per tick (1/24 day) 	//
const ClockColors = [	// Colors for background	//
	'#121829', '#1E2743', '#2B375E', '#3B4C82', '#4B62A6', '#5879B6',
	'#6590C7', '#A6AAD4', '#E7C5BE', '#F2D4B9', '#FDE3B4', '#FEEDC3',
	'#FFF8D3', '#F8DE8E', '#F1C54A', '#F5BA39', '#F9AF28', '#E89F20',
	'#D78F19', '#91783E', '#4B6264', '#3B4C50', '#2B373C', '#1E2732'
];

	// Because I'm lazy and don't want to deal with WebWorkers //
var StartTime = new Date().getTime();
var LastFocusTime = new Date().getTime(); 
var Watch = new Date().getTime();
var DayTimer = [];

// --- ACCOUNT RELATED --- //
var Gold = 0; //
var Verbose = false;

// --- FLAGS AND STATES --- //
var StateStore = [-1, -1, -1, -1, -1];	// [Peeps, Resources, ...] //
var StateHouse = -1;
var StateUpg = [[-1, -1, -1, -1, -1], [-1, -1, -1, -1, -1], [-1, -1, -1, -1, -1], [-1, -1, -1, -1]];	// [Resources, ...] //
var StateCap = [-1, -1, -1, -1];	// [Resources, ...] //
var StateCarry = [-1, -1, -1, -1];
var StateAssign = 0;			// Index //

var Unlock = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0]];
var LvUpg = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0]];
var LvCap = [0, 0, 0, 0];
var LvCar = [0, 0, 0, 0];

// Settings //
function ChangeSettings()
{
	Verbose = !Verbose;
	BuildResourceHTML();
}

// Unlocks //
function CheckUnlocks()
{	// Initialize //
	let unlock = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0]];
	for(let rt = 0; rt < ResTypes.length; rt++)
		for(let r = 0; r < Resources[rt].length; r++)
			unlock[rt][r] = Unlock[rt][r];
	let changed = false;

	// Food Unlocks //
	Unlock[0][0] = (Clock / 24 >= 1) && (Peeps[2] >= 1);							// Seeds 	//
	Unlock[0][1] = (Clock / 24 >= 120) && (LvCap[0] >= 2) && (LvUpg[0][0] >= 2); 	// Bugs 	//
	Unlock[0][2] = (Clock / 24 >= 360) && (LvCap[0] >= 5) && (LvUpg[0][1] >= 4);	// Fruit 	//
	Unlock[0][3] = Unlock[3][3] && (LvCap[0] >= 7) && (LvUpg[0][2] >= 6);			// Fish		//

	// Material Unlocks //
	Unlock[1][0] = (Clock / 24 >= 12) && (Peeps[2] >= 3);							// Wood 	//
	Unlock[1][1] = (Clock / 24 >= 120) && (LvCap[1] >= 2) && (LvUpg[1][0] >= 2);	// Clay 	//
	Unlock[1][2] = (Clock / 24 >= 360) && (LvCap[1] >= 5) && (LvUpg[1][0] >= 4);	// Rocks 	//
	Unlock[1][3] = Unlock[3][3] && (LvCap[1] >= 7) && (LvUpg[1][2] >= 6);			// Glass	//
	
	// Ore Unlocks //
	Unlock[2][0] = (Clock / 24 >= 30) && (Peeps[2] >= 10);							// Coal		//
	Unlock[2][1] = (Clock / 24 >= 120) && (LvCap[2] >= 2) && (LvUpg[2][0] >= 2);	// Iron		//
	Unlock[2][2] = (Clock / 24 >= 360) && (LvCap[2] >= 5) && (LvUpg[2][0] >= 4);	// Steel	//
	Unlock[2][3] = Unlock[3][3] && (LvCap[2] >= 7) && (LvUpg[2][2] >= 6);			// Gems		//

	// Knowledge Unlocks //
	Unlock[3][0] = (Clock / 24 >= 0) && (Peeps[2] >= 1);		// Instinct			//
	Unlock[3][1] = (Clock / 24 >= 1) && (Peeps[2] >= 2);		// Communication	//
	Unlock[3][2] = (Clock / 24 >= 180) && (Peeps[2] >= 20);		// Books 			//
	Unlock[3][3] = (Clock / 24 >= 1800) && (Peeps[2] >= 80);	// Maps 			//

	// Make sure to unlock anything that may open up! //
	for(let rt = 0; rt < ResTypes.length; rt++)
	{
		for(let r = 0; r < Resources[rt].length; r++)
			if(Unlock[rt][r] != unlock[rt][r]) { changed = true; break; }
		if(changed) break;
	}
	if(changed) BuildResourceHTML();

	// Update the village //
	if(Housing >= 1) document.getElementById('$vilPeeps1').className = 'overlayImage';
	if(Housing >= 2) document.getElementById('$vilPeeps2').className = 'overlayImage';
	if(Housing >= 4) document.getElementById('$vilPeeps3').className = 'overlayImage';

	if(LvUpg[0][0] >= 1) document.getElementById('$vilSeeds1').className = 'overlayImage';
	if(LvUpg[0][0] >= 2) document.getElementById('$vilSeeds2').className = 'overlayImage';
	if(LvUpg[0][0] >= 3) document.getElementById('$vilSeeds3').className = 'overlayImage';

	if(LvCap[0] >= 1) document.getElementById('$vilSilo').className = 'overlayImage';
	if(LvCap[1] >= 1) document.getElementById('$vilShack').className = 'overlayImage';

	if(Unlock[0][3]) document.getElementById('$vilDock').className = 'overlayImage';
	if(Unlock[3][2]) document.getElementById('$vilLibrary').className = 'overlayImage';
}