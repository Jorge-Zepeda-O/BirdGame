"use strict";

// I/O //
function SaveData()
{	// Account related //
	_setCookie('Clock', Clock);		// #	//
	_setCookie('Gold', Gold);		// #	//

	// Peep related //
	_setCookie('Peeps', Peeps);			// []	//
	_setCookie('Housing', Housing);		// #	//

	// Resource related //
	_setCookie('ResPeeps', ResPeeps);		// [[]]	//
	_setCookie('ResAmts', ResAmts);			// []	//
	_setCookie('LvUpg', LvUpg);	// [[]]	//
	_setCookie('LvCap', LvCap);	// []	//
	_setCookie('LvCar', LvCar);	// []	//
	
	// Display //
	document.getElementById('$Status').innerText = 'Saved...';
	window.setTimeout(resetstatus, 24 * ClockTick);
}
function LoadData()
{	// Account related //
	Clock = _getCookieNumber('Clock', Clock);
	Gold = _getCookieNumber('Gold', Gold);

	// Peep related //
	Peeps = _getCookieArray('Peeps', Peeps);
	Housing = _getCookieNumber('Housing', Housing);

	// Resource related //
	ResPeeps = _getCookieArray('ResPeeps', ResPeeps);
	ResAmts = _getCookieMatrix('ResAmts', ResAmts);
	Unlock = _getCookieMatrix('Unlock', Unlock);

	LvUpg = _getCookieMatrix('LvUpg', LvUpg);
	LvCap = _getCookieArray('LvCap', LvCap);
	LvCar = _getCookieArray('LvCar', LvCar);

	// Apply upgrades //
	for(let u = 0; u < Housing; u++)
		PeepCap += HouseBonus[u];

	for(let rt = 0; rt < ResTypes.length; rt++)
	{	// Production //
		for(let r = 0; r < Resources[rt].length; r++)
			for(let u = 0; u < LvUpg[rt][r]; u++)
				ResProb[rt][r] -= UpgBonus[Resources[rt][r]][u];
		// Capacity //
		for(let u = 0; u < LvCap[rt]; u++)
			ResLims[rt] += CapBonus[ResTypes[rt]][u];

		// Carry //
		for(let u = 0; u < LvCar[rt]; u++)
			ResCarry[rt] += CarryBonus[ResTypes[rt]][u];
	}

	// Make resources that you have dammit //
	for(let rt = 0; rt < ResTypes.length; rt++)
	{
		ResVals[rt] = 0;
		for(let r = 0; r < Resources[rt].length; r++)
			ResVals[rt] += ResAmts[rt][r] * ResMul[rt][r];
	}
	
	// Peep Visualization //
	for(let p = 0; p < Peeps[2]/5; p++)
	{
		let isvoid = Math.random() < VoidRate;
		let birdtype = Math.random();

		let x = 10 + 80 * Math.random();
		let y = 10 + 80 * Math.random() + (isvoid ? 100 : 0);
		let z = 48 + (y - 50) / 50 * 24;
		let r = 180 * ((2 * Math.random() - 1) * Math.abs(2 * Math.random() - 1) ** 7);

		// Peep selection //
		let pt = 'icon_';
		let pc = 0;
		for(let p = 0; p < PeepTypes.length; p++)
		{
			pc += PeepChance[p];
			if(birdtype < pc)
			{
				pt += PeepTypes[p] + "_S"; // Side by default //
				break;
			}
		}

		// Void birb? //
		if(isvoid) pt = 'icon_Void_S';
		let tag = isvoid ? 'void' : '';

		// Draw peep //
		document.getElementById('$village').innerHTML += `
			<img id="$peepimg` + p + `" width="` + z + `" style="position:absolute; left:` + x + `%; top:` + y 
			+ `%; transform: rotate(` + r + `deg) scaleX(1); ` + (isvoid ? `z-index:10000;` : ``) + `" src="Assets/Peeps/` + pt + `.png" title="` + tag + `" />`;
	}
}
function ClearData()
{	// Header //
	_clearCookie('Clock');		// #	//
	_clearCookie('Gold');		// #	//

	// Peep related //
	_clearCookie('Peeps');		// []	//
	_clearCookie('Housing');	// #	//

	// Resource related //
	_clearCookie('ResPeeps');	// [[]]	//
	_clearCookie('ResAmts');	// []	//

	// Unlocks //
	_clearCookie('LvUpg');	// [[]]	//
	_clearCookie('LvCap');	// []	//
	_clearCookie('LvCar');	// []	//

	// Reload //
	location.reload();
}

// --- Helper Functions --- //
function resetstatus()
{ document.getElementById('$Status').innerText = ''; }

function _setCookie(cname, cvalue)
{	// Get the expiration date //
	let date = new Date();
	date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
	let expiration = 'expires=' + date.toUTCString();
	let samesite = 'samesite=Strict'

	// Set the cookie //
	document.cookie = cname + '=' + cvalue + ';' + expiration + ';' + samesite + ';tagname=secure;';
}
function _getCookieString(cname)
{	// Decode the Cookie //
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');

	// Search for the value prompted //
	for(let i = 0; i < ca.length; i++)
	{
		let c = ca[i];
		while(c.charAt(0) === ' ')
			c = c.substring(1);

		if(c.indexOf(name) === 0)
			return c.substring(name.length, c.length);
	}
	return "";
}
function _getCookieNumber(cname, cdef)
{
	let str = _getCookieString(cname);
	return (str == "" ? cdef : parseFloat(str));
}
function _getCookieArray(cname, cdef)
{	// Decode the Cookie //
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');

	// Search for the value prompted //
	let str = "";
	for(let i = 0; i < ca.length; i++)
	{
		let c = ca[i];
		while(c.charAt(0) === ' ')
			c = c.substring(1);

		if(c.indexOf(name) === 0)
		{
			str = c.substring(name.length, c.length);
			break;
		}
	}

	// Parse the string into a default array //
	var arr = cdef;
	if(str !== "")
	{
		let strsplit = str.split(',');
		for(let s = 0; s < strsplit.length; s++)
			arr[s] = parseFloat(strsplit[s]);
	}

	// Output //
	return arr;
}
function _getCookieMatrix(cname, cdef)
{	// Decode the Cookie //
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');

	// Search for the value prompted //
	let str = "";
	for(let i = 0; i < ca.length; i++)
	{
		let c = ca[i];
		while(c.charAt(0) === ' ')
			c = c.substring(1);

		if(c.indexOf(name) === 0)
		{
			str = c.substring(name.length, c.length);
			break;
		}
	}

	// Parse the string into a default array //
	var mat = cdef;
	if(str !== "")
	{
		let strsplit = str.split(',');
		let s = 0;
		for(let rt = 0; rt < ResTypes.length; rt++)
		{
			for(let r = 0; r < Resources[rt].length; r++)
			{
				mat[rt][r] = parseFloat(strsplit[s]);
				s++;
			}
		}	
	}

	// Output //
	return mat;
}
function _clearCookie(cname)
{	// Get the expiration date //
	let date = new Date();
	date.setTime(date.getTime() - 24 * 60 * 60 * 1000);
	let expiration = 'expires=' + date.toUTCString();

	// Set the cookie to a blank value //
	document.cookie = cname + '=' + ';' + expiration + ';path=/';
}