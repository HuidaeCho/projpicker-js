const reAbsoluteURL = /^(?:https?:\/\/|\/)/;
let head = document.getElementsByTagName('head')[0];

function getAbsoluteURL(url){
	if(!url.match(reAbsoluteURL)){
		if(window.location.pathname.match(/^.*?\/u(?:\/.*)?$/))
			url = window.location.pathname.replace(/^(.*?\/)u(?:\/.*)?$/, '$1') + url;
		else
			url = window.location.pathname.replace(/^(.*\/).*$/, '$1') + url;
	}
	return url;
}

function loadJS(js, async, callback){
	let script = document.createElement('script');
	script.src = getAbsoluteURL(js);
	if(async)
		script.async = true;
	if(callback)
		script.onload = callback;
	head.appendChild(script);
}

function loadCSS(css, media){
	let link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = getAbsoluteURL(css);
	if(media)
		link.media = media;
	head.appendChild(link);
}

/* http://developer.mozilla.org/en/docs/AJAX:Getting_Started */
function ajaxRequest(url, data, func, mimeType){
	let xhr = null;

	/* Create an XMLHTTP instance */
	if(window.XMLHttpRequest){ /* Mozilla, Safari, ... */
		xhr = new XMLHttpRequest();
		if(xhr.overrideMimeType)
			/* Some web servers return a non-standard mime type. */
			xhr.overrideMimeType(mimeType || 'text/html');
	}else
	if(window.ActiveXObject){ /* IE */
		try{
			xhr = new ActiveXObject('Msxml2.XMLHTTP');
		}
		catch(e){
		try{
			xhr = new ActiveXObject('Microsoft.XMLHTTP');
		}
		catch(e){}
		}
	}
	if(!xhr){
		alert('Cannot create an XMLHTTP instance.');
		return;
	}

	/* This function has no arguments. */
	xhr.onreadystatechange = function(){
		if(xhr.readyState != 4)
			return;
		if(func)
			func(xhr);
	}

	let method = data == null ? 'GET' : 'POST';

	/* xhr.open(method, url, asynchronous) */
	xhr.open(method, url, true);

	/* xhr.send(POST data) */
	/* required even if the method is not POST. */
	xhr.send(data);
}

/* http://forum.java.sun.com/thread.jspa?threadID=696590&tstart=105 */
function ajaxResponseXML(xhr){
	let xml = null;

	if(xhr.responseXML)
		xml = xhr.responseXML;
	else
	if(xhr.responseText){
		xml = document.createElement('div');
		xml.innerHTML = xhr.responseText;

		/* Huidae Cho <https://idea.isnew.info> */
		xml.getElementByIdRecursively = function(childNodes, id){
			let element = null;
			for(let i = 0; i < childNodes.length; i++){
				if(id == childNodes[i].id)
					element = childNodes[i];
				else
					element = this.getElementByIdRecursively(childNodes[i].childNodes, id);
				if(element)
					break;
			}
			return element;
		}
		xml.getElementById = function(id){
			return this.getElementByIdRecursively(this.childNodes, id);
		}
	}

	return xml;
}

function removeElementsByClassName(className){
	[...document.getElementsByClassName(className)].reverse().forEach(function(element){
		element.remove();
	});
}

function setElementsDisplayByClassName(className, display){
	[...document.getElementsByClassName(className)].forEach(function(element){
		element.style.display = display;
	});
}

function addEvent(el, event, func){
	if(el.addEventListener)
		el.addEventListener(event, func);
	else
	if(el.attachEvent)
		el.attachEvent('on' + event, func);
}

function removeEvent(el, event, func){
	if(el.removeEventListener)
		el.removeEventListener(event, func);
	else
	if(el.detachEvent)
		el.detachhEvent('on' + event, func);
}

function onLoadWindow(func){
	addEvent(window, 'load', func);
}
