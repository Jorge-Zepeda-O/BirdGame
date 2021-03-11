"use strict";

// These scripts are when basically the same thing needs to be repeated a lot //
function BuildResourceHTML()
{	// Build the peep menu //
	let cap_tip = `<span id="$capPeepstip" class="tiptxt"><b>Cost:</b>`;
	for(let rt = 0; rt < ResTypes.length; rt++)
	{
		cap_tip += `<br /><img width="24" src="Assets/icon_` + ResTypes[rt] + `.png" />
			<label id="$capPeeps` + ResTypes[rt] + `" style="font-size: 16px;">0</label>`;
	}
	cap_tip += `</span >`;
	let menu = `<li>
		<div class="ResHeader">
			<label id="$lblPeeps" data-toggle="collapse" data-target="#lstPeeps" style="grid-area: 2/1/span 1/span 1; font-weight: bold;">Peeps:</label>
			<button type="button" class="BtnUpgUnavailable" id="$capPeepsbtn" onclick="IncHouse()" style="grid-area: 2/7/span 1/span 1;">
				<span class="tip"><label id="$capPeepslbl">Max +10</label>` + cap_tip + `</span>
			</button>
		</div>
		<ul class="ResItem">
			<li id="lstPeeps">
				<img style="grid-area: 1 / 1 / span 2 / span 1;"
					width="64" onclick="ClearData()" src="Assets/symb_Peeps.png" />
				<label style="grid-area: 1 / 2 / span 1 / span 3;" id="$lblIdle">Idle:</label>
				<label style="grid-area: 2 / 2 / span 1 / span 3;" id="$lblChicks">Chicks:</label>
				<span style="grid-area: 1 / 6 / span 1 / span 2;">
					<img width="24" src="Assets/icon_Food.png" />
					<label style="color: red" id="$lblHunger">-0/day</label>
				</span>
				
				<button style="grid-area: 2 / 5 / span 1 / span 1;" type="button" class="ButtonAssign"
					id="$btnChick+" onclick="MakePeep()">
					<img id="$imgChick+" width="20" src="Assets/icon_plus.png" />
				</button>
				<span style="grid-area: 2 / 6 / span 1 / span 2;">
					<img width="24" src="Assets/icon_Food.png" />
					<label id="$lblChick">10</label>
				</span>
			</li>
		</ul>
	</li>`;
	for(let rt = 0; rt < ResTypes.length; rt++)
	{
		let menu_type = BuildMenuType(ResTypes[rt]);
		for(let r = 0; r < Resources[rt].length; r++)
			menu_type += BuildMenuItem(Resources[rt][r]);
		menu += menu_type + '</li>';
	}
	document.getElementById('$ResMenu').innerHTML = menu;
}

// --- Helper Functions --- //
function BuildMenuType(rtype)
{	// NOTE: It needs the </li> at the end! //

	// Get the assigned targets to minimize on click with the counters //
	let collapse_targets = "";
	let val_lbls = "";
	let rt = _GetResType(rtype);
	for(let r = 0; r < Resources[rt].length; r++)
	{
		if(!Unlock[rt][r]) continue;
		collapse_targets += "#lst" + Resources[rt][r] + ", ";
	}
	collapse_targets = collapse_targets.slice(0, collapse_targets.length - 2);

	// Make little icons for each unlocked resource //
	for(let r = 0; r < Resources[rt].length; r++)
	{
		if(!Unlock[rt][r]) continue;
		val_lbls += `<img class="imageWrapper" width="24" src="Assets/symb_` + Resources[rt][r] + `.png"
			data-toggle="collapse" data-target="` + collapse_targets + `" 
			style="grid-area: 1/1/span 2/span 1; margin-left: ` + (24 * r + 4) + `px; margin-top: 4px; border-radius: 4px;" />`;
	}

	// Make labels for current # of resources //
	val_lbls += `<label id="$lbl` + rtype + `" style="grid-area: 2/1/span 1/span 1; font-weight:bold;">` + rtype + `:</label>
		<label id="$lbl` + rtype + `Carry" style="grid-area: 2/6/span 1/span 1;">Carry:</label>
		<div class="progress" style="grid-area: 1/6/span 1/span 1; height: 20px">`
	for(let r = 0; r < Resources[rt].length; r++)
		val_lbls += `<div class="progress-bar Res` + (r + 1) + `" style="width: 0%;" id="$barCap` + Resources[rt][r] + `"></div>`;
	val_lbls += `</div><label class="`+ (!Verbose ? 'invisible' : '') + `" id="$lbl` + rtype + `Units" style="grid-area: 1/6/span 1/span 1; text-align: center; font-size: 14px">Units: / </label>`;

	// Make the buttons for assigning peeps to this resource type //
	let btnclass = ((ResTypes[rt] == 'Knowledge') && (!Unlock[rt][2])) ? 'invisible' : '';
	let btn_peeps = `
		<button style="grid-area: 1/2/span 1/span 3;" type="button" class="` + btnclass + `"
			name="$btnAssignX" onclick="ChangeMultiplier('` + rtype + `')">
			Assign x` + PeepMult[StateAssign] + `
		</button>
		<button style="grid-area: 2/2/span 1/span 1;" type="button" class="` + (ResPeeps[rt] > 0 ? 'ButtonRemove' : 'ButtonDisabled') + btnclass + `"
			id="$btn` + rtype + `-" onclick="RemovePeep('` + rtype + `')">
			<img id="$img` + rtype + `-" width="20" src="Assets/icon_minus` + (ResPeeps[rt] > 0 ? '' : '_') + `.png" />
		</button>
		<span style="grid-area: 2/3/span 1/span 1; text-align: center;" class="` + btnclass + `">
			<label id="$btn` + rtype + `">0</label>
		</span>
		<button style="grid-area: 2/4/span 1/span 1;" type="button" class="` + (Peeps[1] > 0 ? 'ButtonAssign' : 'ButtonDisabled') + btnclass + `"
			id="$btn` + rtype + `+" onclick="AssignPeep('` + rtype + `')">
			<img id="$img` + rtype + `+" width="20" src="Assets/icon_plus` + (Peeps[1] > 0 ? '' : '_') + `.png" />
		</button>`;

	// Build the capacity upgrade button and tooltip //
	let cap_tip = `<span id="$cap` + rtype + `tip" class="tiptxt"><b>Cost:</b>`;
	for(let rt = 0; rt < ResTypes.length; rt++)
	{
		cap_tip += `<br /><img width="24" src="Assets/icon_` + ResTypes[rt] + `.png" />
			<label id="$cap` + rtype + ResTypes[rt] + `" style="font-size: 16px;">0</label>`;
	}
	cap_tip += `</span >`;
	let cap_btn = `<button type="button" class="BtnUpgUnavailable" id="$cap` + rtype
		+ `btn" onclick="IncCap('` + rtype + `')" style="grid-area: 1/7/span 1/span 1;">
		<span class="tip"><label id="$cap` + rtype + `lbl">Units +0</label>` + cap_tip + `</span></button>`;

	// Build the carry upgrade button and tooltip //
	let carry_tip = `<span id="$carry` + rtype + `tip" class="tiptxt"><b>Cost:</b>`;
	for(let rt = 0; rt < ResTypes.length; rt++)
	{
		carry_tip += `<br /><img width="24" src="Assets/icon_` + ResTypes[rt] + `.png" />
			<label id="$carry` + rtype + ResTypes[rt] + `" style="font-size: 16px;">0</label>`;
	}
	carry_tip += `</span >`;
	let carry_btn = `<button type="button" class="BtnUpgUnavailable" id="$carry` + rtype
		+ `btn" onclick="IncCarry('` + rtype + `')" style="grid-area: 2/7/span 1/span 1;">
		<span class="tip"><label id="$carry` + rtype + `lbl">Carry +0</label>` + carry_tip + `</span></button>`;

	// Put it all together //
	let lstclass = "collapse";
	for(let r = 0; r < ResTypes[rt].length; r++)
		if(Unlock[rt][r]) { lstclass += " show"; break; }
			
	let menu_type = `<li id="$lst` + rtype + `" class="` + lstclass + `">
		<div  class="ResHeader">` + val_lbls + btn_peeps + cap_btn + carry_btn + `</div>`;
	return menu_type;
}
function BuildMenuItem(res)
{	
	let lstclass = "collapse";
	if(Unlock[_GetResType(res)][Resources[_GetResType(res)].indexOf(res)])
		lstclass += " show";

	// Build the labels and info //
	let itemtip = ResTips[res];
	let menu_item = `<ul class="ResItem">
		<li id="lst` + res + `" class="` + lstclass + `">
			<img style="grid-area: 1/1/span 2/span 1;"
				width="64" onclick="WorkPeeps('` + res + `')" src="Assets/symb_` + res + `.png" />
			<label style="grid-area: 1/2/span 1/span 2;" id="$inc` + res + `">` + res + `:</label>
			<label style="grid-area: 2/2/span 1/span 4; font-size: 16px; font-style: italic;" id="$tip` + res + `">` + itemtip + `</label>`;

	// Build the upgrades //
	if((res != 'Instinct') && (res != 'Communication'))
	{
		// Research Progress //
		if((res == 'Books') || (res == 'Maps'))
		{
			menu_item += `<div class="progress" style="grid-area: 1/3/span 1/span 2; height: 20px">
				<div class="progress-bar" style="background-color: skyblue; width: 0%; transition: none;" id="$barRes` + res + `"></div>
			</div>`;
		}

		// Upgrade button //
		let upg_tip = `<span id="$upg` + res + `tip" class="tiptxt"><b>Cost:</b>`;
		for(let rt = 0; rt < ResTypes.length; rt++)
		{
			upg_tip += `<br /><img width="24" src="Assets/icon_` + ResTypes[rt] + `.png" />
			<label id="$upg` + res + ResTypes[rt] + `" style="font-size: 16px;">0</label>`;
		}
		upg_tip += `</span >`;
		menu_item += `<button class="BtnUpgUnavailable" id="$upg` + res + `btn" onclick="IncUpg('` + res + `')"
				style="grid-area: 1/-1/span 1/span 1;">
				<span class="tip">
					<label style="font-size: 20px;" id="$upg` + res + `lbl">+0/day</label>` + upg_tip + `
				</span>
			</button>`;
	}
	return menu_item + '</li></ul>';
}