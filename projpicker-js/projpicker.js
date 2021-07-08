function tidyLines(lines){
	for(let i = lines.length-1; i >= 0; i--){
		if(lines[i].indexOf('#') == 0)
			lines.splice(i, 1);
		else if(i > 0 && lines[i].trim() == '' && lines[i].trim() == lines[i-1].trim())
			lines.splice(i, 1);
		else{
			let commented = false;
			if(lines[i].includes('#')){
				lines[i] = lines[i].split('#')[0];
				commented = true;
			}
			lines[i] = lines[i].trim();
			if(commented && lines[i] == '')
				lines.splice(i, 1);
		}
	}
	if(lines.length > 0 && lines[0] == '')
		lines.splice(0, 1);
	return lines;
}

function setCoordinateSystem(coorSys='latlon'){
	if(!['latlon', 'xy'].includes(coorSys))
		throw coorSys + ': Invalid coordinate system';
}

function setLatlon(){
	setCoordinateSystem();
}

function setXY(){
	setCoordinateSystem('xy');
}

function isLatlon(){
	return true;
}

function parsePolys(polys){
	let outpolys = [];
	let poly = [];

	polys.forEach(point => {
		let c1, c2;
		c1 = c2 = null;
		if(typeof(point) == 'string'){
			let xy = parsePoint(point);
			c1 = xy[0];
			c2 = xy[1];
		}else if(Array.isArray(point)){
			if(point.length == 2){
			}
		}
	});

	if(poly.length > 0)
		outpolys.push(poly);

	return outpolys;
}

function parseBBoxes(bboxes){
	let outbboxes = [];
	bboxes.forEach(bbox => {
		let s, n, w, e;
		s = n = w = e = null;
		if(typeof(bbox) == 'string'){
			let snwe = parseBBox(bbox);
			s = snwe[0];
			n = snwe[1];
			w = snwe[2];
			e = snwe[3];
		}else if(Array.isArray(bbox)){
			if(bbox.length == 4){
				s = parseFloat(bbox[0]);
				n = parseFloat(bbox[1]);
				w = parseFloat(bbox[2]);
				e = parseFloat(bbox[3]);
			}
		}
		if(s != null && n != null && w != null && e != null)
			outbboxes.push([s, n, w, e]);
	});
	return outbboxes;
}

function parseGeom(geom, geomType='point'){
	if(!['point', 'poly', 'bbox'].includes(geomType))
		throw geomType + ': Invalid geometry type';

	switch(geomType){
	case 'point':
		geom = parsePoint(geom);
		break;
	case 'poly':
		geom = parsePoly(geom);
		break;
	default:
		geom = parseBBox(geom);
		break;
	}

	return geom;
}

function parseGeoms(geoms, geomType='point'){
	if(!['point', 'poly', 'bbox'].includes(geomType))
		throw geomType + ': Invalid geometry type';

	switch(geomType){
	case 'point':
		geoms = parsePoints(geoms);
		break;
	case 'poly':
		geoms = parsePolys(geoms);
		break;
	default:
		geoms = parseBBoxes(geoms);
		break;
	}

	return geoms;
}

function parseMixedGeoms(geoms){
	if(typeof(geoms) == 'string'){
		if(geoms.includes('\n'))
			geoms = tidyLines(geoms.split('\n'));
		else
			geoms = geoms.split(/[ \t]+/);
	}

	let outgeoms = [];

	let ngeoms = geoms.length;
	if(ngeoms == 0)
		return outgeoms;

	let queryOp = 'and';
	let firstIndex = 0;
	if(['and', 'or', 'xor', 'postfix'].includes(geoms[0])){
		queryOp = geoms[0];
		firstIndex = 1;
		outgeoms.push(queryOp);
	}

	let queryOps = ['and', 'or', 'xor', 'not', 'match'];
	let specGeoms = ['none', 'all'];
	let geomTypes = ['point', 'poly', 'bbox'];
	let coorSys = ['latlon', 'xy'];
	let keywords = queryOps.concat(specGeoms).concat(geomTypes).concat(coorSys);

	let constraints = ['unit', 'match_tol', 'match_max'];

	let geomType = 'point';

	let wasLatlon = isLatlon();
	try{
		setLatlon();

		let stackSize = 0;
		let g = firstIndex;

		while(g < ngeoms){
			let geom = geoms[g];
			let typ = typeof(geom);
			if(queryOps.includes(geom)){
				if(queryOp == 'postfix'){
					if(geom == 'not' && stackSize > 1)
						;
					else if(stackSize >= 2)
						stackSize--;
					else
						throw 'Not enough operands for ' + geom;
				}else
					throw geom + ': Not in postfix query';
			}else if(geomTypes.includes(geom))
				geomType = geom;
			else if(coorSys.includes(geom)){
				if(geom == 'latlon')
					setLatlon();
				else
					setXY();
			}else if(typ == 'string' && geom.includes('=') && constraints.includes(geom.split('=')[0]))
				;
			else if(['none', 'all'].includes(geom))
				stackSize++;
			else{
				let i = g;
				while(i < ngeoms && !keywords.includes(geoms[i]) &&
					  !(typ == 'string' && geoms[j].includes('=') && constraints.includes(geoms[i].split('=')[0])))
					i++;
				ogeoms = parseGeoms(geoms.slice(g, i), geomType);
				g = i;
				if(ogeoms.length > 0 && !geoms.includes(null)){
					stackSize += ogeoms.length;
					outgeoms.push(...ogeoms);
				}
				continue;
			}
			if(typ == 'string')
				outgeoms.push(geom);
			g++;
		}

		if(queryOp == 'postfix'){
			if(stackSize == 0)
				throw 'Nothing to return from postfix stack';
			else if(stackSize > 1)
				throw 'Excessive stack size for postfix operations';
		}
	}
	finally{
		if(wasLatlon && !isLatlon())
			setLatlon();
		else if(!wasLatlon && isLatlon())
			setXY();
	}

	return outgeoms;
}

function queryMixedGeoms(geoms){
	let output = '';
	geoms = parseMixedGeoms(geoms);
	geoms.forEach(geom => {
		output += geom + '\n';
	});
	return output;
}
