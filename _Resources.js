"use strict";

// Notation //
const ResTypes = ['Food', 'Material', 'Ore', 'Knowledge'];	// Names of resource types //
const Resources = [											// Names of individual resources //
	['Seeds', 'Bugs', 'Fruit', 'Fish',  'Spices'],
	['Wood',  'Clay', 'Rocks', 'Glass',  'Placeholder'],
	['Coal',  'Iron', 'Steel', 'Gems',   'Placeholder'],
	['Instinct', 'Communication', 'Books', 'Maps']
];
const ResTips = {
	'Seeds':	"A staple. Not worth much, but fundamental for healthy living.",
	'Wood':		"Single-talonedly the best material to build a nest with.",
	'Coal':		"A dark rock that can bring warmth and light.",
	'Instinct': "Knowledge that comes to you naturally.",

	'Bugs':		"Squishy and slimy, yet satisfying!",
	'Clay':		"Malleable enough to adapt to any situation. Make sure you bake it!",
	'Iron':		"A sturdy, shiny metal useful for making tools",
	'Communication': "Idle chit-chat can lead to great advancement.",

	'Fruit':	"Sweet and juicy, the perfect snack that doesn't bite back.",
	'Rocks':	"The most durable material, but can be difficult to extract.",
	'Steel':	"Refining Iron has its benefits.",
	'Books':	"Reading is the best way to consistently share and preserve knowledge",

	'Fish':		"Can grow to enormous sizes, fit for those who can capture them.",
	'Glass':	"Transparent and fragile, but incredibly beautiful.",
	'Gems':		"Shiny, rare, and worth a lot in trade.",
	'Maps':		"You may not know where you're going, but you surely know where you've been.",

	'Spices':	"",
	'Placeholder':		"",
	'Placeholder':		"",
};

// Counters and Limits //
var ResPeeps = [0, 0, 0, 0];	// Peeps assigned to each resource type		//
var ResCarry = [1, 1, 1, 1];	// Amount of resources each peep can carry	//

var ResLims = [400, 400, 400, 120];		// Limit on the total number of resource units	//
var ResVals = [0, 0, 0, 0];			// Total value of resources in storage			//
var ResAmts = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0]];	// Number of resource units for each resource	//
var ResHist = [[[], [], [], [], []], [[], [], [], [], []], [[], [], [], [], []], [[], [], [], []]];

var ResWork = 4;	// The manual work bonus to rng //

// Resource Properties //
const ResMul = [	// Multiplier of each unit of resource //
	[1, 8, 48, 240, 1],	// 1 hour, 1/2 day, 1/2 week, 1/2 month, 1 season //
	[1, 8, 48, 240, 1],
	[1, 8, 48, 240, 1],
	[1, 1, 16, 360]		//  //
];
const ResFocus = [	// The multiplicative penalty for success (1+x) * rng //
	[1, 3, 6, 10, 15],
	[1, 3, 6, 10, 15],
	[1, 3, 6, 10, 15],
	[0, 0, 4, 12]
];
const ResHunger = [	// Seed cost per day for each assigned peep //
	[0, 1, 2, 3,  5],
	[1, 2, 3, 5,  8],
	[2, 3, 5, 8, 13],
	[0, 0, 1, 5]
];

var ResProb = [		// Reciprocal chance to collect per tick, decreases with upgrades //
	[ 8, 72, 360, 1600, 4000],
	[12, 96, 480, 2000, 5000],
	[16,128, 600, 2500, 6000],
	[24, 24, 160, 1200]
];
var ResFail = [		// Number of fails //
	[0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0],
	[0, 0, 0, 0]
];

// Capacity Properties //
const CapCosts = {	// TODO: REBALANCE //
	'Food': [[0, 100, 0, 30],
		[0, 500, 0, 120],
		[0, 1250, 0, 300],
		[0, 2050, 100, 640],
		[0, 3000, 300, 1000],
		[0, 4500, 800, 1450]],
	'Material': [[0, 100, 0, 30],
		[0, 400, 0, 120],
		[0, 1050, 150, 300],
		[0, 1800, 350, 640],
		[0, 2750, 600, 1000],
		[0, 4000, 1150, 1450]],
	'Ore': [[0, 100, 0, 30],
		[0, 450, 0, 120],
		[0, 950, 300, 300],
		[0, 1650, 600, 640],
		[0, 2400, 900, 1000],
		[0, 3500, 1400, 1450]],
	'Knowledge': [[0, 50, 0, 50],
		[0, 200, 0, 250],
		[0, 650, 100, 500],
		[0, 1400, 400, 900],
		[0, 2100, 750, 1250],
		[0, 3000, 1200, 1800]]
};
const CapBonus = {
	//				x1	 |		  x6	   |	 x30	 |  	x120 
	// Total:	 900,1500, 2300, 3500, 5250,  8000, 12000,  17500,  25000
	// Max:		 900,1500,13800,21000,31500,240000,360000,2100000,3000000
	'Food':		[500, 600,  800, 1200, 1750,  2750,  4000,   5500,   7500],
	'Material': [500, 600,  800, 1200, 1750,  2750,  4000,   5500,   7500],
	'Ore':		[500, 600,  800, 1200, 1750,  2750,  4000,   5500,   7500],

	//				   x1	   |    x10    		 |     x100    
	// Total:	 300, 550, 1000, 1600, 2500, 3800,  6000, 10000
	// Max:		 300, 550, 1000,16000,25000,38000,600000,999999
	'Knowledge':[180, 250,  450,  600,  900, 1300,  2200,  4000]
};

// Carry Properties //
const CarryCosts = {
	'Food': [[8000, 6000, 3000, 6000],
		[90000, 75000, 50000, 60000],
		[600000, 480000, 350000, 400000]],
	'Material': [[3000, 8000, 6000, 6000],
		[50000, 90000, 75000, 60000],
		[350000, 600000, 480000, 400000]],
	'Ore': [[6000, 3000, 8000, 6000],
		[75000, 50000, 90000, 60000],
		[480000, 350000, 600000, 400000]],
	'Knowledge': [[5000, 5000, 5000, 10000],
		[60000, 60000, 60000, 100000],
		[750000, 750000, 750000, 999999]]
};		
const CarryBonus = {
	// Total:	 2, 3, 4
	'Food':		[1, 1, 1],
	'Material': [1, 1, 1],
	'Ore':		[1, 1, 1],
	'Knowledge':[1, 1, 1]
};

// Upgrade Properties //
const UpgCosts = {
	'Seeds': [[20, 0, 0, 5],
		[750, 0, 0, 200],
		[3000, 0, 0, 1000],
		[12000, 0, 0, 4800]],
	'Wood': [[0, 40, 0, 10],
		[0, 750, 0, 200],
		[0, 3000, 0, 1000],
		[0, 12000, 0, 4800]],
	'Coal': [[0, 0, 40, 10],
		[0, 0, 750, 200],
		[0, 0, 3000, 1000],
		[0, 0, 12000, 4800]],

	'Bugs': [[1500, 750, 0, 450],
		[5750, 3000, 0, 2000],
		[13500, 7150, 0, 6000], 
		[46500, 25000, 0, 26000],
		[82500, 45000, 0, 55000],
		[150000, 85000, 0, 125000]],
	'Clay': [[0, 1500, 750, 450],
		[0, 5750, 3000, 2000],
		[0, 13500, 7150, 6000],
		[0, 46500, 25000, 26000],
		[0, 82500, 45000, 55000],
		[0, 150000, 85000, 125000]],
	'Iron': [[750, 0, 1500, 450],
		[3000, 0, 5750, 2000],
		[7150, 0, 13500, 6000],
		[25000, 0, 46500, 26000],
		[45000, 0, 82500, 55000],
		[85000, 0, 150000, 125000]],

	'Books': [[0, 0, 2500, 500],
		[0, 0, 6000, 3500],
		[0, 0, 17500, 9000],
		[0, 16000, 32500, 25000],
		[0, 42000, 65000, 54000],
		[0, 85000, 100000, 95000],
		[120000, 150000, 150000, 180000]],
	'Fruit': [[6600, 1700, 900, 2200],
		[14250, 5600, 3000, 5400],
		[26500, 16500, 6500, 11500],
		[48000, 28500, 13000, 24000],
		[90000, 48500, 26000, 50000],
		[145000, 90000, 45500, 110000],
		[240000, 150000, 78500, 200000]
		[360000, 265000, 135000, 320000]],
	'Rocks': [[900, 6600, 1700, 2200],
		[3000, 14250, 5600, 5400],
		[6500, 26500, 16500, 11500],
		[13000, 48000, 28500, 24000],
		[26000, 90000, 48500, 50000],
		[45500, 145000, 90000, 110000],
		[78500, 240000, 150000, 200000]
		[135000, 360000, 265000, 320000]],
	'Steel': [[1700, 900, 6600, 2200],
		[5600, 3000, 14250, 5400],
		[16500, 6500, 26500, 11500],
		[28500, 13000, 48000, 24000],
		[48500, 26000, 90000, 50000],
		[90000, 45500, 145000, 110000],
		[150000, 78500, 240000, 200000]
		[265000, 135000, 360000, 320000]],

	'Maps': [[0, 0, 0, 0]],
	'Fish':  [[0, 0, 0, 0]],
	'Glass': [[0, 0, 0, 0]],
	'Gems':  [[0, 0, 0, 0]],
	
	'Spices': [[0, 0, 0, 0]],
	'Placeholder':	  [[0, 0, 0, 0]],
	'Placeholder':	  [[0, 0, 0, 0]]
};
const UpgBonus = {	// Increases the chance of obtaining a resource unit //
	'Seeds': [2, 1, 1, 1],	// min: 3	(8.0 / day)
	'Wood':  [3, 2, 1, 1],	// min: 5	(4.8 / day)
	'Coal':  [4, 3, 2, 1],	// min: 6	(4.0 / day)
	
	'Bugs':  [14, 12, 10,  9,  8,  7],	// min: 15 (16.0 / day)
	'Clay':  [18, 16, 14, 12, 10,  8],	// min: 24 (10.7 / day)
	'Iron':	 [23, 21, 19, 17, 15, 13],	// min: 32 ( 9.6 / day)

	'Books': [27, 24, 21, 19, 17, 15, 13],		// min: 24 (16.0 / day)
	'Fruit': [58, 53, 48, 43, 38, 33, 28, 23],	// min: 36 (32.0 / day)
	'Rocks': [75, 69, 63, 57, 51, 45, 39, 33],	// min: 48 (24.0 / day)
	'Steel': [95, 87, 79, 71, 63, 55, 48, 42],	// min: 60 (19.2 / day)
	
	'Maps':	 [189, 174, 159, 144, 129, 114,  99,  84],		// min: 108 (80.0 / day)
	'Fish':	 [243, 224, 205, 186, 167, 148, 129, 110,  91],	// min:  97 (59.4 / day)
	'Glass': [304, 280, 256, 232, 208, 184, 160, 137, 114],	// min: 125 (46.1 / day)
	'Gems':	 [380, 350, 320, 290, 260, 231, 202, 173, 144],	// min: 150 (38.4 / day)

	'Spices':[580, 535, 490, 445, 400, 310, 310, 265, 220, 204],	// min: 196 (88.2 / day)
	'Placeholder':	 [724, 668, 612, 556, 500, 444, 388, 332, 276, 256],	// min: 244 (70.8 / day)
	'Placeholder':	 [868, 801, 734, 667, 600, 533, 466, 399, 332, 308]		// min: 292 (59.2 / day)
};

// Methods //
function Research(tick = true)
{	// For Knowledge - Note, cannot be gained manually! //
	// Update the history //
	for(let r = 0; r < Resources[3].length; r++)
	{
		ResHist[3][r].unshift(0);
		if(ResHist[3][r].length > 24) ResHist[3][r].pop();	// 1 day's average //
	}

	// Produce Maps and Books first (But this is different than normal production) //
	for(let p = 0; p < ResPeeps[3]; p++)
	{	// Determine if this peep is going to work on books or explore //
		let carry = ResCarry[3];
		let rng = Math.floor(Math.random() * (1 + Unlock[3][3]) + 2);

		// Consume temporary Knowledge (Communication first, Instinct second) //
		if(ResAmts[3][1] > 0)
		{
			SpendResource(Resources[3][1], 1);
			ResFail[3][rng]++;
		}
		else if(ResAmts[3][0] > 0)
		{
			SpendResource(Resources[3][0], 1);
			ResFail[3][rng]++;
		}

		// Check if progress is full //
		if(ResFail[3][rng] >= ResProb[3][rng])
		{	// If so, award a resource to the pile and reset //
			ResAmts[3][rng] += carry;
			ResHist[3][rng][0] += carry;
			ResFail[3][rng] = 0;
		}
	}
	
	// Then, Communication has a relatively high chance to proc, but uses idle Peeps //
	for(let p = 0; p < Peeps[1] - 1; p++)
	{	// Let the limit be 5 * (Total Peeps * Idle Peeps) //
		if(ResAmts[3][0] >= 5 * (Peeps[2] * Peeps[1])) continue;

		// Initialize //
		let carry = Peeps[1] - p;	// The number of peeps you can talk to decreases with each peep //
		let rng = Math.random();

		// First check if we should even be trying this //
		if(!Unlock[3][1]) continue;

		// Make sure that we can still carry something //
		while(carry > 0)
		{	// Check if we are at capacity //
			if(CountUnits(ResTypes[3]) >= ResLims[3]) break;

			// Check if resources are gathered - no forgiveness! //
			if(rng < carry / (ResAmts[3][1]))
			{	// This peep rolled under the requirement, get a resource //
				ResAmts[3][1]++;
				ResHist[3][1][0]++;
				ResFail[3][1] = 0;
				carry--;

				// Penalize future successes //
				rng += 1 / ResProb[3][1];
			}
			else
			{	// Increment the fail counter and break out //
				ResFail[3][1]++;
				break;
			}
		}
	}

	// Finally, Instinct has a chance to proc, but will always proc once per day to a limit //
	for(let p = 0; p < Peeps[2]; p++)
	{	// Let the limit be 10 * Total Peeps //
		if(ResAmts[3][0] >= 10 * Peeps[2]) break;
		if(CountUnits(ResTypes[3]) >= ResLims[3]) break;

		let rng = Math.random();
		if(Clock % 24 == 0)
		{	// If we've failed every time today, then guarantee one instinct by the end //
			if(ResFail[3][0] >= ResProb[3][0] - 2)
			{
				ResAmts[3][0]++;
				ResHist[3][0][0]++;
			}
			// Reset the fail counter //
			ResFail[3][0] = 0;
		}
		else if(rng < 1 / (ResProb[3][0] + ResAmts[3][0]))
		{	// Else, try the roll - note there's no forgiveness nor penalty for success //
			// However, the probability of success decreases with each Instinct collected //
			ResAmts[3][0]++;
			ResHist[3][0][0]++;
		}
		else
			ResFail[3][0]++;	// You failed the roll //
	}
	
	// Update the Storage //
	ResVals[3] = 0;
	for(let r = 0; r < Resources[3].length; r++)
		ResVals[3] += ResAmts[3][r] * ResMul[3][r];

	// Update the progress bars //
	document.getElementById('$barRes' + Resources[3][2]).style.width = (ResFail[3][2]/ResProb[3][2] * 100) + '%';
	document.getElementById('$barRes' + Resources[3][3]).style.width = (ResFail[3][3]/ResProb[3][3] * 100) + '%';
}
function Produce(restype, tick = true, manual = false)
{	// Produce non-knowledge resources each tick //
	let rt = _GetResType(restype);

	// Update the history //
	for(let r = 0; r < Resources[rt].length; r++)
	{
		ResHist[rt][r].unshift(0);
		if(ResHist[rt][r].length > 24) ResHist[rt][r].pop();
	}

	// Roll for each peep assigned to this resource type //
	for(let p = 0; p < ResPeeps[rt]; p++)
	{	// Initialize //
		let carry = ResCarry[rt];
		let rng = Math.random();
		if(manual) rng /= ResWork;	// Incentive to manually work peeps //

		// Collect resources from rarest to least rare //
		for(let r = Resources[rt].length - 1; r > -1; r--)
		{	// First check if we should even be trying this //
			if(!Unlock[rt][r]) continue;

			// Make sure that we can still carry something //
			while(carry > 0)
			{	// Check if we are at capacity //
				if(CountUnits(ResTypes[rt]) >= ResLims[rt])	break;

				// Check if resources are gathered //
				if(Math.sqrt(ResFail) >= ResProb[rt][r])
				{	// Then the collection is guaranteed - do not augment the roll //
					ResAmts[rt][r]++;
					ResHist[rt][r][0]++;
					ResFail[rt][r] = 0;
					carry--;
				}
				else if(rng < carry / (ResProb[rt][r] - Math.sqrt(ResFail[rt][r])))
				{	// This peep rolled under the requirement, get a resource //
					ResAmts[rt][r]++;
					ResHist[rt][r][0]++;
					ResFail[rt][r] = 0;
					carry--;

					// Penalize future successes //
					rng *= 1 + ResFocus[rt][r];
				}
				else
				{	// Increment the fail counter and break out //
					ResFail[rt][r]++;
					break;
				}
			}
		}
	}

	// Update the Storage for this resource type //
	ResVals[rt] = 0;
	for(let r = 0; r < Resources[rt].length; r++)
		ResVals[rt] += ResAmts[rt][r] * ResMul[rt][r];
}
function Convert(restype, tick = true)
{	// Convert lower value resources at the end of the day if available - Expensive though! //
	let rt = _GetResType(restype);
	if((CountUnits(ResTypes[rt]) >= ResLims[rt]) && (Clock % 24 == 0))
	{
		let conv = Peeps[1] * ResCarry[rt];	// Number of resources capable of converting //
		for(let r = 0; r < Resources[rt][r].length - 1; r++)
		{
			if(!Unlock[rt][r + 1]) break;
			if(conv == 0) break;
			let amt = Math.min(Math.floor(ResAmts[rt][r] / (ResProb[rt][r + 1] / ResMul[rt][r])), conv);

			ResAmts[rt][r] -= Math.ceil(amt * ResProb[rt][r + 1] / ResMul[rt][r]);
			ResAmts[rt][r + 1] += amt;
		}
	}
}

function IncUpg(res)
{	// Increase the production of this resource //
	let rt = _GetResType(res);
	let r = Resources[rt].indexOf(res);
	ResProb[rt][r] -= UpgBonus[res][LvUpg[rt][r]];
	
	// Enact the costs //
	SpendResources(UpgCosts[res][LvUpg[rt][r]]);

	// Update //
	LvUpg[rt][r]++;
	StateUpg[rt][r] = 1;
	UpdateInfo();
}
function IncCap(res)
{	// Increase the capacity of this resource //
	let rt = ResTypes.indexOf(res);
	ResLims[rt] += CapBonus[res][LvCap[rt]];

	// Enact the costs //
	SpendResources(CapCosts[res][LvCap[rt]]);

	// Update //
	LvCap[rt]++;
	StateCap[rt] = 1;
	UpdateInfo();
}
function IncCarry(res)
{	// Increase the carrying capacity of this resource //
	let rt = ResTypes.indexOf(res);
	ResCarry[rt] += CarryBonus[res][LvCar[rt]];

	// Enact the costs //
	SpendResources(CarryCosts[res][LvCar[rt]]);

	// Update //
	LvCar[rt]++;
	StateCarry[rt] = 1;
	UpdateInfo();
}

// --- HELPER FUNCTIONS --- //
function _GetResType(res)
{	// Check if we were given a resource type //
	let idx = ResTypes.indexOf(res);
	if(idx > -1) return idx;

	// Check if we were given a resource //
	for(let rt = 0; rt < ResTypes.length; rt++)
	{
		let idx = Resources[rt].indexOf(res);
		if(idx > -1) return rt;
	}

	// We didn't find anything //
	return -1;
}

function CountUnits(restype)
{
	let rt = _GetResType(restype);
	let units = 0;
	for(let r = 0; r < Resources[rt].length; r++)
		units += ResAmts[rt][r];
	return units;
}

function CheckCost(costs)
{	// Check if we have enough resources on hand to make the purchase //
	let valid = true;
	for(let rt = 0; rt < ResTypes.length; rt++)
		valid = valid & (ResVals[rt] > costs[rt]);
	return valid;
}
function SpendResources(costs)
{	// costs = [food, material, ore, knowledge] //
	for(let rt = 0; rt < ResTypes.length; rt++)
		SpendResource(ResTypes[rt], costs[rt]);
}
function SpendResource(restype, amount)
{	// Spend less valuable resources first //
	let rt = _GetResType(restype);
	let debt = amount;

	for(let r = 0; r < Resources[rt].length; r++)
	{	// Don't sacrifice permanent resources //
		if((rt == 3) && (r > 1)) continue;

		// Check if you can pay the debt using this resource type //
		if(ResAmts[rt][r] * ResMul[rt][r] > debt)
		{	// You have to pay in whole numbers, sorry //
			ResAmts[rt][r] -= Math.ceil(debt / ResMul[rt][r]);
			break;	// No need to continue! //
		}
		else
		{	// Subtract everything and move on to the next resource //
			debt -= ResAmts[rt][r] * ResMul[rt][r];
			ResAmts[rt][r] = 0;
		}
	}

	// Update the Storage for this resource type //
	ResVals[rt] = 0;
	for(let r = 0; r < Resources[rt].length; r++)
		ResVals[rt] += ResAmts[rt][r] * ResMul[rt][r];
}