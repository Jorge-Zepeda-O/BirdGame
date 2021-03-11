"use strict";

// --- PEEPS --- //
var Peeps = [0, 1, 1];	// [Chicks, Available, Adult] 		//
var PeepCap = 10;		// Peep Capacity		 			//
const PeepRate = 0.25;	// Percentage of chicks that grow 	//

const PeepTypes = ['Sparrow', 'BlueTit', 'Robin', 'Wren']
const PeepChance = [0.35, 0.30, 0.20, 0.15]
const VoidRate = 0.005;

const PeepCost = (n) => // Each peep needs more seeds than the last //
	10 + Math.round((n-1)**2/12 + ((1 + Math.sqrt(5)) / 2) ** Math.pow(n-1, 0.5025) / Math.sqrt(5));
const PeepHunger = function ()
{	// Young ones need more food! //
	let cost = Peeps[0] + 2 * (Peeps[2] - 1);
	for(let rt = 0; rt < ResTypes.length; rt++)
	{
		let uidx = Unlock[rt].lastIndexOf(true);
		if(uidx > -1) cost += ResPeeps[rt] * ResHunger[rt][uidx];
	}
	return cost;
};

var Housing = 0;
const HouseCosts = [[0, 100, 0, 0],	//  20 //
	[0, 750, 100, 100],				//  35 //
	[0, 2000, 700, 550],			//  55 //
	[0, 10000, 6000, 2500],			//  80 //
	[0, 35000, 15000, 12500],		// 110 //
	[0, 85000, 50000, 25000],		// 150 //
	[0, 160000, 95000, 42500]];		// 200 //
// total:			20, 35, 55, 80,110,150,200,260,315,405, 525, 655, 810, 999
const HouseBonus = [10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 110, 130, 155, 189];

const PeepMult = [1, 5, 20];	// Multiplier for assignment of peeps //

// --- METHODS --- //
function FeedPeeps()
{	// Get the cost of feed //
	let cost = PeepHunger();

	// Default colors //
	_SetItemColor('$lblPeeps', 'black');
	//for(r = 0; r < ResTypes.length; r++)
	//	_SetItemColor('$lbl' + Resources[r], 'black');

	// Check for starvation //
	if(cost > ResVals[0])
	{
		if((Peeps[1] === Peeps[2]) && (Peeps[0] > 0))
		{	// Nobody is working - Chicks are the first to go //
			Peeps[2] -= Math.ceil(0.2 * Peeps[0]);	// 20% of chicks perish //
			Peeps[0] -= Math.ceil(0.2 * Peeps[0]);
			_SetItemColor('$lblPeeps', 'red');
		}
		else if(Peeps[1] === Peeps[2])
		{	// Nobody is working, but there are no chicks //
			Peeps[2] -= Math.ceil(0.1 * Peeps[1]);	// 10% of adults perish //
			Peeps[1] -= Math.ceil(0.1 * Peeps[1]);
			_SetItemColor('$lblPeeps', 'red');
		}
		/*
		else
		{	// Peeps are working! Tell them to go home! //
			let order = [1, 2, 0];	// Order of professions based on hunger, decending //
			let r = 0;
			while(cost > Amount[0])
			{
				let idx = order[r];
				while((cost > Amount[0]) && (Assignment[idx] > 0))
				{	// Subtract one from this, change the color, and break //
					RemovePeep(Resources[idx]);
					_SetItemColor('$lbl' + Resources[idx], 'red');
					cost = CostPeep();
				}
				r++;

				if(r > ResTypes.length)
					break;
			}
		}
		*/
		cost = ResVals[0];	// Famine is occuring! //
	}

	// Deduct whatever costs remain //
	SpendResource('Food', cost);

	// ALWAYS KEEP GENERAL PIO! //
	if(Peeps[2] <= 0)
	{
		Peeps[1] = 1;
		Peeps[2] = 1;
	}
}
function MakePeep()
{	// Subtract the seeds and create a chick //
	SpendResource('Food', PeepCost(Peeps[2]));
	Peeps[0]++;
	Peeps[2]++;

	// Make the peep visually appear //
	if(Peeps[2] % 5 == 1)
	{
		// Initialize //
		let isvoid = Math.random() < VoidRate;
		let birdtype = Math.random();

		let x = 20 + 60*Math.random();
		let y = 20 + 60*Math.random() + (isvoid ? 100 : 0);
		let z = 48 + (y - 50) / 50 * 24;
		let r = 180 * ((2 * Math.random() - 1) * Math.abs(2 * Math.random() - 1) ** 7);

		// Peep selection //
		let pt = 'icon_Peep_';
		let pc = 0;
		for(let p = 0; p < PeepTypes.length; p++)
		{
			pc += PeepChance[p];
			if(birdtype < pc)
			{
				pt += PeepTypes[p];
				break;
			}
		}

		// Void birb? //
		if(isvoid) pt = 'icon_Peep_Void';
		let tag = isvoid ? 'void' : '';

		// Draw peep //
		document.getElementById('$village').innerHTML += `
			<img id="$peepimg`+ ((Peeps[2]-1)/5) + `" width="` + z + `" style="position:absolute; left:` + x + `%; top:` + y 
			+ `%; transform: rotate(` + r + `deg) scaleX(1)" src="Assets/` + pt + `.png" title="` + tag + `" />`;
	}
	
	// Update Labels //
	UpdateInfo();
	UpdateDeltas();
}
function HatchPeeps()
{	// It's a Binomial random variable, this is probably fastest //
	let hatched = 0;
	for(let c = 0; c < Peeps[0]; c++)
		hatched += (Math.random() < PeepRate);

	// Create new peeps //
	Peeps[0] -= hatched;
	Peeps[1] += hatched;
}
function MovePeeps()
{	// Moves all the peeps around randomly //
	for(let p = 0; p < Peeps[2]/5; p++)
	{	// Get each available peep's location //
		let peepimg = document.getElementById('$peepimg' + p);
		if(peepimg == undefined) continue;

		let tag = peepimg.title;

		let x = parseFloat(peepimg.style.left.split('%')[0]);
		let y = parseFloat(peepimg.style.top.split('%')[0]);
		let r = parseFloat(peepimg.style.transform.split('(')[1].split('deg')[0]);
		let s = parseFloat(peepimg.style.transform.split('(')[2].split(')')[0]);

		// Move each peep slightly - give perspective and make it harder to move if they're not standing //
		let dx = ((tag == 'void') ? 2 : 1) * 2*Math.tan(Math.PI/2 * (Math.random() - 0.5))**7 * (0.1 + y/100) * (1.1 - Math.abs(r)/90);
		let dy = ((tag == 'void') ? 2 : 1) * 2*Math.tan(Math.PI/2 * (Math.random() - 0.5))**7 * (0.1 + y/100) * (1.1 - Math.abs(r)/90);
		if(Math.abs(dx) > 0.05)
		{
			x += dx;
			s = (dx > 0) ? 1 : -1;
		}
		if(Math.abs(dy) > 0.05)
			y += dy;

		// Change rotation slightly as well //
		let r_ = (r/Math.abs(r) * Math.pow(Math.abs(r) / 180, 1/8) + 1)/2;
		r_ += (Math.random() - 0.5)/180;
		r_ = 180*((2*r_ - 1) * Math.abs(2*r_ - 1)**7);

		// Check to make sure that each peep is within the bounds of the image //
		if(x < 0) x = 0;
		else if(x > 90) x = 90;

		if(y < 0) y = 0;
		else if((y > 90) && (tag != 'void')) y = 90;
		else if((y > 200) && (tag == 'void')) y = 200;

		if(r_ < -90) r_ = -90;
		else if(r_ > 90) r_ = 90;

		// Assign other things //
		let z = 48 + (y - 50) / 50 * 24;

		// And put the new values in //
		peepimg.style.left = x + '%';
		peepimg.style.top = y + '%';
		peepimg.width = z;
		peepimg.style.transform = 'rotate(' + r_ + 'deg) scaleX(' + s + ')';
	}
}

function AssignPeep(res)
{	// Assign peeps to collecting the resource //
	let rt = _GetResType(res);

	// Check if the current assignment multiplier is too high //
	let delta = PeepMult[StateAssign];
	if(PeepMult[StateAssign] > Peeps[1])
		delta = Peeps[1];	// If so, drop it to what's left //

	// Assign peeps /
	ResPeeps[rt] += delta;
	Peeps[1] -= delta;

	// Update //
	UpdateInfo();
	UpdateDeltas();
}
function RemovePeep(res)
{	//  //
	let rt = _GetResType(res);

	// Check if there are any peeps available //
	if(ResPeeps[rt] > 0)
	{	
		let delta = PeepMult[StateAssign];
		if(PeepMult[StateAssign] > ResPeeps[rt])
			delta = ResPeeps[rt];

		// Change assignment //
		ResPeeps[rt] -= delta;
		Peeps[1] += delta;
	}

	// Update //
	UpdateInfo();
	UpdateDeltas();
}
function ChangeMultiplier(res)
{	// Rotates the mulitplier for assignment from x1, x5, x20 //
	// Change the assignment multiplier used //
	StateAssign = (StateAssign + 1) % PeepMult.length;

	// Get the button value and change the inner text //
	let btns = document.getElementsByName('$btnAssignX')
	for(let b = 0; b < btns.length; b++)
		btns[b].innerText = 'Assign x' + PeepMult[StateAssign];

	// Update //
	UpdateInfo();
}
function WorkPeep(res)
{	// Called when a resource icon is clicked - Gives results immediately but causes hunger //
	let rt = _GetResType(res);
	let r = Resources[rt].indexOf(res);

	// Grant an appropriate amount of resources based on the amount of work performed //
	Produce(ResTypes[rt], false);
	//Amount[rt] += 4 * (ResGain[rt][r] / 24) * Peeps[1];

	// Deplete the appropriate amount of seeds //
	SpendResource('Food', (ResHunger[rt][r] + 1) * Peeps[1]);

	// Update //
	UpdateInfo();
}

function IncHouse()
{	// Increase the peepulation limit //
	PeepCap += HouseBonus[Housing];

	// Enact the costs //
	SpendResources(HouseCosts[Housing]);

	// Update //
	Housing++;
	StateHouse = 1;
	UpdateInfo();
}