"use strict";

// --- CALLED EVERY TICK --- //
function Tick(vis = true)
{	// Called once per hour //
	Clock++;										// Clock tick //
	for(let rt = 0; rt < ResTypes.length; rt++)		// Peep production //
	{
		if(ResTypes[rt] == 'Knowledge')
			Research(true);
		else
			Produce(ResTypes[rt], true);
	}
	
	
	// Called once per day //
	if((Clock % 24 == 0) && (Clock > 0))
	{	// Idle peep working //
		for(let rt = 0; rt < ResTypes.length - 1; rt++)
			Convert(ResTypes[rt], true);

		// Peep adjustments //
		FeedPeeps();	// Feed peeps //
		HatchPeeps();	// Hatch chicks //
		
		CheckUnlocks();

		// Timer compensation //
		DayTimer.unshift(new Date().getTime() - Watch);
		if(DayTimer.length > 30) DayTimer.pop();	// Only store a month's worth //
		Watch = new Date().getTime();
	}

	// Update visuals if desired //
	if(vis)
	{	// Update information //
		UpdateInfo();
		UpdateDeltas();
		UpdateStatus();

		// For fun //
		MovePeeps();
	}
	
}
function CatchUp()
{	// Catches up lost time when not active //
	if((LastFocusTime > StartTime) && !document.hidden)
	{	// This is accurate enough for our purposes //
		let ms_out = new Date().getTime() - LastFocusTime;
		let ticks = Math.floor(ms_out / ClockTick);
		if(DayTimer.length > 0)	// Use the actual time taken per tick where possible //
			ticks = Math.floor(ms_out / (Mean(DayTimer)/24));	

		// Run the fundamental parts of the tick function //
		for(let t = 0; t < ticks; t++)
			Tick(false);
			
		// Update visuals *ONCE* //
		UpdateInfo();
		UpdateDeltas();
		UpdateStatus();
	}

	// Update the last focus time //
	LastFocusTime = new Date().getTime();
}
function Mean(arr)
{
	let avg = 0;
	if(arr.length > 0) for(let i = 0; i < arr.length; i++) avg += arr[i] / arr.length;
	return avg;
}

// Information updates //
function UpdateInfo()
{	// Run through everything that needs to get updated //
	UpdateLabels();
	UpdateAssign();
	UpdateStore();
}
function UpdateLabels()
{	// For the peeps //
	_SetLabelValue('$lblPeeps', Peeps[2] + ' / ' + PeepCap, true);
	_SetLabelValue('$lblIdle', Peeps[1] + ' / ' + Peeps[2], true);
	_SetLabelValue('$lblChicks', Peeps[0], true);

	// For each resource type //
	for(let rt = 0; rt < ResTypes.length; rt++)
	{
		_SetLabelValue('$lbl' + ResTypes[rt], ResVals[rt], true);
		_SetLabelValue('$lbl' + ResTypes[rt] + 'Units', 'Units: ' + CountUnits(ResTypes[rt]) + ' / ' + ResLims[rt]);
		for(let r = 0; r < Resources[rt].length; r++)
			document.getElementById('$barCap' + Resources[rt][r]).style.width = (ResAmts[rt][r] / ResLims[rt] * 100) + '%';

		let carryimgs = '';
		for(let c = 0; c < ResCarry[rt]; c++)
			carryimgs += '<img width="20" style="margin-bottom: 4px;" src="Assets/icon_' + ResTypes[rt] + '.png" />';
		_SetLabelHTML('$lbl' + ResTypes[rt] + 'Carry', 'Carry: ' + carryimgs);
	}
}
function UpdateDeltas()
{	// Assign each incrementer/decrementer its value //
	for(let rt = 0; rt < ResTypes.length; rt++)
		for(let r = 0; r < Resources[rt].length; r++)
		{	// Get the expected peep production per day //
			let delta = Mean(ResHist[rt][r]);
			if(ResHist[rt][r].length == 24) delta *= 24;

			_SetLabelValue('$inc' + Resources[rt][r],
				ResMul[rt][r] * ResAmts[rt][r], true);
				//Resources[rt][r] + ' (x' + ResMul[rt][r] + '): ' + ResMul[rt][r] * ResAmts[rt][r] + 
				//' (Units ' + ResAmts[rt][r] + ' @ ' + delta.toFixed(1) + '/day)', false);
		}
			
	// Feed peeps! //
	document.getElementById('$lblHunger').innerText = '-' + Math.round(PeepHunger()) + '/day';
}
function UpdateAssign()
{	// Sets the ability to assign or collect peeps //
	if(StateStore[0] !== (Peeps[1] === 0))
	{	// Update the assignment ability //
		for(let rt = 0; rt < ResTypes.length; rt++)
		{
			_SetDisabled('$btn' + ResTypes[rt] + '+', Peeps[1] === 0);
			if((ResTypes[rt] == 'Knowledge') && (!Unlock[rt][2]))
				document.getElementById('$btn' + ResTypes[rt] + '+').className += ' collapse';

			if(Peeps[1] === 0)
				_SetImage('$img' + ResTypes[rt] + '+', 'Assets/icon_plus_.png');
			else
				_SetImage('$img' + ResTypes[rt] + '+', 'Assets/icon_plus.png');
		}
		StateStore[0] = (Peeps[1] === 0);
	}
	for(let rt = 0; rt < ResTypes.length; rt++)
	{	// Update the collection ability //
		if(StateStore[rt + 1] !== (ResPeeps[rt] === 0))
		{	// Check if collections can be made //
			_SetDisabled('$btn' + ResTypes[rt] + '-', ResPeeps[rt] === 0);
			if((ResTypes[rt] == 'Knowledge') && (!Unlock[rt][2]))
				document.getElementById('$btn' + ResTypes[rt] + '-').className += ' collapse';

			if(ResPeeps[rt] === 0)
				_SetImage('$img' + ResTypes[rt] + '-', 'Assets/icon_minus_.png');
			else
				_SetImage('$img' + ResTypes[rt] + '-', 'Assets/icon_minus.png');
			StateStore[rt + 1] = (ResPeeps[rt] === 0);
		}
		// Update the assignment values //
		document.getElementById('$btn' + ResTypes[rt]).innerText = ResPeeps[rt];
	}
	// Check if peeps can be made //
	let chickPossible = (PeepCost(Peeps[2]) < ResVals[0]) && (Peeps[2] < PeepCap);
	document.getElementById('$lblChick').innerText = PeepCost(Peeps[2]);
	_SetDisabled('$btnChick+', !chickPossible);
}
function UpdateStore()
{	// -- HOUSING -- //
	// Get the button //
	let btn = document.getElementById('$capPeepsbtn');

	// Check if an upgrade is even possible //
	if(Housing >= HouseCosts.length)
	{	// There are no more upgrades for this tree! //
		document.getElementById('$capPeepslbl').innerText = 'Sold Out';
		document.getElementById('$capPeepstip').hidden = true;
		_SetDisabled('$capPeepsbtn', true);
		StateHouse = 0;
	}
	else
	{	// Make sure the button is active when available //
		let active = true;
		for(let c = 0; c < ResTypes.length; c++)
			active &= (ResVals[c] >= HouseCosts[Housing][c]);
		btn.disabled = !active;
		btn.className = (active ? 'BtnUpgAvailable' : 'BtnUpgUnavailable');

		// Acquire data for each //
		document.getElementById('$capPeepslbl').innerText = 
			Verbose ? 'Pop. +' + HouseBonus[Housing] : '+ Housing';
		for(let c = 0; c < ResTypes.length; c++)
		{
			let lbl = document.getElementById('$capPeeps' + ResTypes[c]);
			lbl.style.color = (ResVals[c] >= HouseCosts[Housing][c] ? 'white' : 'red');
			lbl.innerText = HouseCosts[Housing][c];
		}
	}

	// -- CAPACITIES -- //
	for(let rt = 0; rt < ResTypes.length; rt++)
	{	// Get the button //
		let cap_btn = document.getElementById('$cap' + ResTypes[rt] + 'btn');

		// Check if an upgrade is even possible //
		if(LvCap[rt] == CapCosts[ResTypes[rt]].length)
		{	// There are no more upgrades for this tree! //
			document.getElementById('$cap' + ResTypes[rt] + 'lbl').innerText = 'Sold Out';
			document.getElementById('$cap' + ResTypes[rt] + 'tip').hidden = true;
			_SetDisabled('$cap' + ResTypes[rt] + 'btn', true);
			StateCap[rt] = 0;
		}
		else
		{	// Make sure the button is active when available //
			let active = true;
			for(let c = 0; c < ResTypes.length; c++)
				active &= (ResVals[c] >= CapCosts[ResTypes[rt]][LvCap[rt]][c]);
			cap_btn.disabled = !active;
			cap_btn.className = (active ? 'BtnUpgAvailable' : 'BtnUpgUnavailable');

			// Write to the button //
			document.getElementById('$cap' + ResTypes[rt] + 'lbl').innerText = 
				Verbose ? 'Units +' + CapBonus[ResTypes[rt]][LvCap[rt]] : '+ Capacity';
			for(let c = 0; c < ResTypes.length; c++)
			{
				let lbl = document.getElementById('$cap' + ResTypes[rt] + ResTypes[c]);
				lbl.style.color = (ResVals[c] >= CapCosts[ResTypes[rt]][LvCap[rt]][c] ? 'white' : 'red');
				lbl.innerText = CapCosts[ResTypes[rt]][LvCap[rt]][c];
			}
		}

		// -- CARRIES -- //
		// Get the button //
		let carry_btn = document.getElementById('$carry' + ResTypes[rt] + 'btn');

		// Check if an upgrade is even possible //
		if(LvCar[rt] == CarryCosts[ResTypes[rt]].length)
		{	// There are no more upgrades for this tree! //
			document.getElementById('$carry' + ResTypes[rt] + 'lbl').innerText = 'Sold Out';
			document.getElementById('$carry' + ResTypes[rt] + 'tip').hidden = true;
			_SetDisabled('$carry' + ResTypes[rt] + 'btn', true);
			StateCarry[rt] = 0;
		}
		else
		{	// Make sure the button is active when available //
			let active = true;
			for(let c = 0; c < ResTypes.length; c++)
				active &= (ResVals[c] >= CarryCosts[ResTypes[rt]][LvCar[rt]][c]);
			carry_btn.disabled = !active;
			carry_btn.className = (active ? 'BtnUpgAvailable' : 'BtnUpgUnavailable');

			// Write to the button //
			document.getElementById('$carry' + ResTypes[rt] + 'lbl').innerText = 
				Verbose ? 'Carry +' + CarryBonus[ResTypes[rt]][LvCar[rt]] : '+ Carry';
			for(let c = 0; c < ResTypes.length; c++)
			{
				let lbl = document.getElementById('$carry' + ResTypes[rt] + ResTypes[c]);
				lbl.style.color = (ResVals[c] >= CarryCosts[ResTypes[rt]][LvCar[rt]][c] ? 'white' : 'red');
				lbl.innerText = CarryCosts[ResTypes[rt]][LvCar[rt]][c];
			}
		}

		// -- UPGRADES -- //
		for(let r = 0; r < Resources[rt].length; r++)
		{	// Get the button //
			if((Resources[rt][r] == 'Instinct') || (Resources[rt][r] == 'Communication')) continue;
			let upg_btn = document.getElementById('$upg' + Resources[rt][r] + 'btn');

			// Check if the upgrade is possible //
			if(LvUpg[rt][r] == UpgCosts[Resources[rt][r]].length)
			{
				document.getElementById('$upg' + Resources[rt][r] + 'lbl').innerText = 'Sold Out';
				document.getElementById('$upg' + Resources[rt][r] + 'tip').hidden = true;
				_SetDisabled('$upg' + Resources[rt][r] + 'btn', true);
				StateUpg[rt][r] = 0;
			}
			else
			{	// Make sure the button is active when available //
				let active = true;
				for(let c = 0; c < ResTypes.length; c++)
					active &= (ResVals[c] >= UpgCosts[Resources[rt][r]][LvUpg[rt][r]][c]);
				upg_btn.disabled = !active;
				upg_btn.className = (active ? 'BtnUpgAvailable' : 'BtnUpgUnavailable');

				// Calculate the upgrade bonus //
				let expect = ResMul[rt][r] * ResPeeps[rt] / ResProb[rt][r] * 24.0;
				let improved = ResMul[rt][r] * ResPeeps[rt] / (ResProb[rt][r] - UpgBonus[Resources[rt][r]][LvUpg[rt][r]]) * 24.0;

				// Write to the button //
				document.getElementById('$upg' + Resources[rt][r] + 'lbl').innerText = 
					Verbose ? '+' + (improved - expect).toFixed(1) + '/day' : 'Upgrade';

				for(let c = 0; c < ResTypes.length; c++)
				{
					let lbl = document.getElementById('$upg' + Resources[rt][r] + ResTypes[c]);
					lbl.style.color = (ResVals[c] >= UpgCosts[Resources[rt][r]][LvUpg[rt][r]][c] ? 'white' : 'red');
					lbl.innerText = UpgCosts[Resources[rt][r]][LvUpg[rt][r]][c];
				}
			}
		}
	}
	
}
function UpdateStatus()
{	// Get the status for simplicity //
	let status = document.getElementById('$Status');

	// Display the clock //
	status.innerText = 'Day ' + Math.floor(Clock / 24);
	status.style.backgroundColor = ClockColors[Clock % 24];
}

// --- Helper Functions --- //
function _SetLabelValue(id, value, res=false)
{
	if(res)
		document.getElementById(id).innerText = id.slice(4) + ': ' + value;
	else
		document.getElementById(id).innerText = value;
}
function _SetLabelHTML(id, html, res = false)
{ document.getElementById(id).innerHTML = html; }
function _SetIncrementerValue(id, value)
{ document.getElementById(id).innerText = '+ ' + Math.floor(value); }
function _SetDecrementerValue(id, value)
{ document.getElementById(id).innerText = '- ' + Math.floor(value); }
function _SetItemColor(id, color)
{ document.getElementById(id).style.color = color; }
function _SetDisabled(id, value)
{	// Get the button for ease of reading //
	let btn = document.getElementById(id);

	// Change its enabled/disabled status //
	btn.disabled = value;
	if(value)
		document.getElementById(id).className = 'ButtonDisabled';
	else if(id.slice(-1) === '-')
		document.getElementById(id).className = 'ButtonRemove';
	else
		document.getElementById(id).className = 'ButtonAssign';
}
function _SetImage(id, value)
{ document.getElementById(id).src = value; }

function _ShowIcon(id)
{ return '<img src="Assets/icon_' + id + '.png" width="20" valign="center"/>'; }