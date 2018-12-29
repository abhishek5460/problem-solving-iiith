/******
 *
 *	EditArea 
 * 	Developped by Christophe Dolivet
 *	Released under LGPL, Apache and BSD licenses (use the one you want)
 *
******/

function EditAreaLoader(){
	var t=this;
	t.version= "0.8.2";
	date= new Date();
	t.startTime=date.getTime();
	t.win= "loading";	// window loading state
	t.error= false;	// to know if load is interrrupt
	t.baseURL="";
	//t.suffix="";
	t.template="";
	t.lang= {};	// array of loaded speech language
	t.loadSyntax= {};	// array of loaded syntax language for highlight mode
	t.syntax= {};	// array of initilized syntax language for highlight mode
	t.loadedFiles= [];
	t.waitingLoading= {}; 	// files that must be loaded in order to allow the script to really start
	// scripts that must be loaded in the iframe
	t.scriptsToLoad= ["elementsFunctions", "resizeArea", "regSyntax"];
	t.subScriptsToLoad= ["editArea", "manageArea" ,"editAreaFunctions", "keyboard", "searchReplace", "highlight", "regexp"];
	t.syntaxDisplayName= { /*syntaxDisplayNameAUTO-FILL-BY-COMPRESSOR*/ };
	
	t.resize= []; // contain resizing datas
	t.hidden= {};	// store datas of the hidden textareas
	
	t.defaultSettings= {
		//id: "src"	// id of the textarea to transform
		debug: false
		,smoothSelection: true
		,fontSize: "10"		// not for IE
		,fontFamily: "monospace"	// can be "verdana,monospace". Allow non monospace font but Firefox get smaller tabulation with non monospace fonts. IE doesn't change the tabulation width and Opera doesn't take this option into account... 
		,startHighlight: false	// if start with highlight
		,toolbar: "search, goToLine, fullscreen, |, undo, redo, |, selectFont,|, changeSmoothSelection, highlight, resetHighlight, wordWrap, |, help"
		,beginToolbar: ""		//  "newDocument, save, load, |"
		,endToolbar: ""		// or endToolbar
		,isMultiFiles: false		// enable the multi file mode (the textarea content is ignored)
		,allowResize: "both"	// possible values: "no", "both", "x", "y"
		,showLineColors: false	// if the highlight is disabled for the line currently beeing edited (if enabled => heavy CPU use)
		,minWidth: 400
		,minHeight: 125
		,replaceTabBySpaces: false
		,allowToggle: true		// true or false
		,language: "en"
		,syntax: ""
		,syntaxSelectionAllow: "basic,brainfuck,c,coldfusion,cpp,css,html,java,js,pas,perl,php,python,ruby,robotstxt,sql,tsql,vb,xml"
		,display: "onload" 		// onload or later
		,maxUndo: 30
		,browsers: "known"	// all or known
		,plugins: "" // comma separated plugin list
		,geckoSpellcheck: false	// enable/disable by default the geckoSpellcheck
		,fullscreen: false
		,isEditable: true
		,cursorPosition: "begin"
		,wordWrap: false		// define if the text is wrapped of not in the textarea
		,autocompletion: false	// NOT IMPLEMENTED			
		,loadCallback: ""		// click on load button (function name)
		,saveCallback: ""		// click on save button (function name)
		,changeCallback: ""	// textarea onchange trigger (function name)
		,submitCallback: ""	// form submited (function name)
		,EAInitCallback: ""	// EditArea initiliazed (function name)
		,EADeleteCallback: ""	// EditArea deleted (function name)
		,EALoadCallback: ""	// EditArea fully loaded and displayed (function name)
		,EAUnloadCallback: ""	// EditArea delete while being displayed (function name)
		,EAToggleOnCallback: ""	// EditArea toggled on (function name)
		,EAToggleOffCallback: ""	// EditArea toggled off (function name)
		,EAFileSwitchOnCallback: ""	// a new tab is selected (called for the newly selected file)
		,EAFileSwitchOffCallback: ""	// a new tab is selected (called for the previously selected file)
		,EAFileCloseCallback: ""		// close a tab
	};
	
	t.advancedButtons = [
			// id, button img, command (it will try to find the translation of "id"), isFileSpecific
			['newDocument', 'newdocument.gif', 'newDocument', false],
			['search', 'search.gif', 'showSearch', false],
			['goToLine', 'goToLine.gif', 'goToLine', false],
			['undo', 'undo.gif', 'undo', true],
			['redo', 'redo.gif', 'redo', true],
			['changeSmoothSelection', 'smoothSelection.gif', 'changeSmoothSelectionMode', true],
			['resetHighlight', 'resetHighlight.gif', 'resyncHighlight', true],
			['highlight', 'highlight.gif','changeHighlight', true],
			['help', 'help.gif', 'showHelp', false],
			['save', 'save.gif', 'save', false],
			['load', 'load.gif', 'load', false],
			['fullscreen', 'fullscreen.gif', 'toggleFullScreen', false],
			['wordWrap', 'wordWrap.gif', 'toggleWordWrap', true],
			['autocompletion', 'autocompletion.gif', 'toggleAutocompletion', true]
		];
			
	// navigator identification
	t.setBrowserInfos(t);

	if(t.isIE>=6 || t.isGecko || ( t.isWebKit && !t.isSafari<3 ) || t.isOpera>=9  || t.isCamino )
		t.isValidBrowser=true;
	else
		t.isValidBrowser=false;

	t.setBaseUrl();		
	
	for(var i=0; i<t.scriptsToLoad.length; i++){
		setTimeout("editAreaLoader.loadScript('"+t.baseURL + t.scriptsToLoad[i]+ ".js');", 1);	// let the time to Object editAreaLoader to be created before loading additionnal scripts
		t.waitingLoading[t.scriptsToLoad[i]+ ".js"]= false;
	}
	t.addEvent(window, "load", EditAreaLoader.prototype.windowLoaded);
};
	
EditAreaLoader.prototype ={
	hasError : function(){
		this.error= true;
		// set to empty all EditAreaLoader functions
		for(var i in EditAreaLoader.prototype){
			EditAreaLoader.prototype[i]=function(){};		
		}
	},
	
	// add browser informations to the object passed in parameter
	setBrowserInfos : function(o){
		ua= navigator.userAgent;
		
		// general detection
		o.isWebKit	= /WebKit/.test(ua);
		o.isGecko	= !o.isWebKit && /Gecko/.test(ua);
		o.isMac		= /Mac/.test(ua);
		
		o.isIE	= (navigator.appName == "Microsoft Internet Explorer");
		if(o.isIE){
			o.isIE = ua.replace(/^.*?MSIE\s+([0-9\.]+).*$/, "$1");
			if(o.isIE<6)
				o.hasError();
		}

		if(o.isOpera = (ua.indexOf('Opera') != -1)){	
			o.isOpera= ua.replace(/^.*?Opera.*?([0-9\.]+).*$/i, "$1");
			if(o.isOpera<9)
				o.hasError();
			o.isIE=false;			
		}

		if(o.isFirefox =(ua.indexOf('Firefox') != -1))
			o.isFirefox = ua.replace(/^.*?Firefox.*?([0-9\.]+).*$/i, "$1");
		// Firefox clones 	
		if( ua.indexOf('Iceweasel') != -1 )
			o.isFirefox	= ua.replace(/^.*?Iceweasel.*?([0-9\.]+).*$/i, "$1");
		if( ua.indexOf('GranParadiso') != -1 )
			o.isFirefox	= ua.replace(/^.*?GranParadiso.*?([0-9\.]+).*$/i, "$1");
		if( ua.indexOf('BonEcho') != -1 )
			o.isFirefox	= ua.replace(/^.*?BonEcho.*?([0-9\.]+).*$/i, "$1");
		if( ua.indexOf('SeaMonkey') != -1)
			o.isFirefox = (ua.replace(/^.*?SeaMonkey.*?([0-9\.]+).*$/i, "$1") ) + 1;
			
		if(o.isCamino =(ua.indexOf('Camino') != -1))
			o.isCamino = ua.replace(/^.*?Camino.*?([0-9\.]+).*$/i, "$1");
			
		if(o.isSafari =(ua.indexOf('Safari') != -1))
			o.isSafari= ua.replace(/^.*?Version\/([0-9]+\.[0-9]+).*$/i, "$1");
	
		if(o.isChrome =(ua.indexOf('Chrome') != -1)) {
			o.isChrome = ua.replace(/^.*?Chrome.*?([0-9\.]+).*$/i, "$1");
			o.isSafari	= false;
		}
		
	},
	
	windowLoaded : function(){
		editAreaLoader.win="loaded";
		
		// add events on forms
		if (document.forms) {
			for (var i=0; i<document.forms.length; i++) {
				var form = document.forms[i];
				form.editAreaReplacedSubmit=null;
				try {
					
					form.editAreaReplacedSubmit = form.onsubmit;
					form.onsubmit="";
				} catch (e) {// Do nothing
				}
				editAreaLoader.addEvent(form, "submit", EditAreaLoader.prototype.submit);
				editAreaLoader.addEvent(form, "reset", EditAreaLoader.prototype.reset);
			}
		}
		editAreaLoader.addEvent(window, "unload", function(){for(var i in editAreas){editAreaLoader.deleteInstance(i);}});	// ini callback
	},
	
	// init the checkup of the selection of the IE textarea
	initIeTextarea : function(id){
		var a=document.getElementById(id);
		try{
			if(a && typeof(a.focused)=="undefined"){
				a.focus();
				a.focused=true;
				a.selectionStart= a.selectionEnd= 0;			
				getIESelection(a);
				editAreaLoader.addEvent(a, "focus", IETextareaFocus);
				editAreaLoader.addEvent(a, "blur", IETextareaBlur);
				
			}
		}catch(ex){}
	},
		
	init : function(settings){
		var t=this,s=settings,i;
		
		if(!s["id"])
			t.hasError();
		if(t.error)
			return;
		// if an instance of the editor already exists for this textarea => delete the previous one
		if(editAreas[s["id"]])
			t.deleteInstance(s["id"]);
	
		// init settings
		for(i in t.defaultSettings){
			if(typeof(s[i])=="undefined")
				s[i]=t.defaultSettings[i];
		}
		
		if(s["browsers"]=="known" && t.isValidBrowser==false){
			return;
		}
		
		if(s["beginToolbar"].length>0)
			s["toolbar"]= s["beginToolbar"] +","+ s["toolbar"];
		if(s["endToolbar"].length>0)
			s["toolbar"]= s["toolbar"] +","+ s["endToolbar"];
		s["tabToolbar"]= s["toolbar"].replace(/ /g,"").split(",");
		
		s["plugins"]= s["plugins"].replace(/ /g,"").split(",");
		for(i=0; i<s["plugins"].length; i++){
			if(s["plugins"][i].length==0)
				s["plugins"].splice(i,1);
		}
	//	alert(settings["plugins"].length+": "+ settings["plugins"].join(","));
		t.getTemplate();
		t.loadScript(t.baseURL + "langs/"+ s["language"] + ".js");
		
		if(s["syntax"].length>0){
			s["syntax"]=s["syntax"].toLowerCase();
			t.loadScript(t.baseURL + "regSyntax/"+ s["syntax"] + ".js");
		}
		//alert(this.template);
		
		editAreas[s["id"]]= {"settings": s};
		editAreas[s["id"]]["displayed"]=false;
		editAreas[s["id"]]["hidden"]=false;
		
		//if(settings["display"]=="onload")
		t.start(s["id"]);
	},
	
	// delete an instance of an EditArea
	deleteInstance : function(id){
		var d=document,fs=window.frames,span,iframe;
		editAreaLoader.execCommand(id, "EADelete");
		if(fs["frame_"+id] && fs["frame_"+id].editArea)
		{
			if(editAreas[id]["displayed"])
				editAreaLoader.toggle(id, "off");
			fs["frame_"+id].editArea.execCommand("EAUnload");
		}

		// remove toggle infos and debug textarea
		span= d.getElementById("EditAreaArroundInfos_"+id);
		if(span)
			span.parentNode.removeChild(span);

		// remove the iframe
		iframe= d.getElementById("frame_"+id);
		if(iframe){
			iframe.parentNode.removeChild(iframe);
			//delete iframe;
			try {
				delete fs["frame_"+id];
			} catch (e) {// Do nothing
			}
		}	

		delete editAreas[id];
	},

	
	start : function(id){
		var t=this,d=document,f,span,father,next,html='',htmlToolbarContent='',template,content,i;
		
		// check that the window is loaded
		if(t.win!="loaded"){
			setTimeout("editAreaLoader.start('"+id+"');", 50);
			return;
		}
		
		// check that all needed scripts are loaded
		for( i in t.waitingLoading){
			if(t.waitingLoading[i]!="loaded" && typeof(t.waitingLoading[i])!="function"){
				setTimeout("editAreaLoader.start('"+id+"');", 50);
				return;
			}
		}
		
		// wait until language and syntax files are loaded
		if(!t.lang[editAreas[id]["settings"]["language"]] || (editAreas[id]["settings"]["syntax"].length>0 && !t.loadSyntax[editAreas[id]["settings"]["syntax"]]) ){
			setTimeout("editAreaLoader.start('"+id+"');", 50);
			return;
		}
		// init the regexp for syntax highlight
		if(editAreas[id]["settings"]["syntax"].length>0)
			t.initSyntaxRegexp();
		
			
		// display toggle option and debug area
		if(!d.getElementById("EditAreaArroundInfos_"+id) && (editAreas[id]["settings"]["debug"] || editAreas[id]["settings"]["allowToggle"]))
		{
			span= d.createElement("span");
			span.id= "EditAreaArroundInfos_"+id;
			if(editAreas[id]["settings"]["allowToggle"]){
				checked=(editAreas[id]["settings"]["display"]=="onload")?"checked='checked'":"";
				html+="<div id='editAreaToggle_"+i+"'>";
				html+="<input id='editAreaToggleCheckbox_"+ id +"' class='toggle_"+ id +"' type='checkbox' onclick='editAreaLoader.toggle(\""+ id +"\");' accesskey='e' "+checked+" />";
				html+="<label for='editAreaToggleCheckbox_"+ id +"'>{$toggle}</label></div>";	
			}
			if(editAreas[id]["settings"]["debug"])
				html+="<textarea id='editAreaDebug_"+ id +"' spellcheck='off' style='z-index: 20; width: 100%; height: 120px;overflow: auto; border: solid black 1px;'></textarea><br />";				
			html= t.translate(html, editAreas[id]["settings"]["language"]);				
			span.innerHTML= html;				
			father= d.getElementById(id).parentNode;
			next= d.getElementById(id).nextSibling;
			if(next==null)
				father.appendChild(span);
			else
				father.insertBefore(span, next);
		}
		
		if(!editAreas[id]["initialized"])
		{
			t.execCommand(id, "EAInit");	// ini callback
			if(editAreas[id]["settings"]["display"]=="later"){
				editAreas[id]["initialized"]= true;
				return;
			}
		}
		
		if(t.isIE){	// launch IE selection checkup
			t.initIeTextarea(id);
		}
				
		// get toolbar content
		var area=editAreas[id];
		
		for(i=0; i<area["settings"]["tabToolbar"].length; i++){
		//	alert(this.tabToolbar[i]+"\n"+ this.getControlHtml(this.tabToolbar[i]));
			htmlToolbarContent+= t.getControlHtml(area["settings"]["tabToolbar"][i], area["settings"]["language"]);
		}
		// translate toolbar text here for chrome 2
		htmlToolbarContent = t.translate(htmlToolbarContent, area["settings"]["language"], "template"); 
		
		
		// create javascript import rules for the iframe if the javascript has not been already loaded by the compressor
		if(!t.iframeScript){
			t.iframeScript="";
			for(i=0; i<t.subScriptsToLoad.length; i++)
				t.iframeScript+='<script language="javascript" type="text/javascript" src="'+ t.baseURL + t.subScriptsToLoad[i] +'.js"></script>';
		}
		
		// add plugins scripts if not already loaded by the compressor (but need to load language in all the case)
		for(i=0; i<area["settings"]["plugins"].length; i++){
			//if(typeof(area["settings"]["plugins"][i])=="function") continue;
			if(!t.allPluginsLoaded)
				t.iframeScript+='<script language="javascript" type="text/javascript" src="'+ t.baseURL + 'plugins/' + area["settings"]["plugins"][i] + '/' + area["settings"]["plugins"][i] +'.js"></script>';
			t.iframeScript+='<script language="javascript" type="text/javascript" src="'+ t.baseURL + 'plugins/' + area["settings"]["plugins"][i] + '/langs/' + area["settings"]["language"] +'.js"></script>';
		}
	
		
		// create css link for the iframe if the whole css text has not been already loaded by the compressor
		if(!t.iframeCss){
			t.iframeCss="<link href='"+ t.baseURL +"editArea.css' rel='stylesheet' type='text/css' />";
		}
		
		
		// create template
		template= t.template.replace(/\[_BASEURL__\]/g, t.baseURL);
		template= template.replace("[_TOOLBAR__]",htmlToolbarContent);
			
		
		// fill template with good language sentences
		template= t.translate(template, area["settings"]["language"], "template");
		
		// add cssCode
		template= template.replace("[_CSSRULES__]", t.iframeCss);				
		// add jsCode
		template= template.replace("[_JSCODE__]", t.iframeScript);
		
		// add versionCode
		template= template.replace("[_EAVERSION__]", t.version);
		//template=template.replace(/\{\$([^\}]+)\}/gm, this.traducTemplate);
		
		//editAreas[area["settings"]["id"]]["template"]= template;
		
		area.textarea=d.getElementById(area["settings"]["id"]);
		editAreas[area["settings"]["id"]]["textarea"]=area.textarea;
	
		// if removing previous instances from DOM before (fix from Marcin)
		if(typeof(window.frames["frame_"+area["settings"]["id"]])!='undefined') 
			delete window.frames["frame_"+area["settings"]["id"]];
		
		// insert template in the document after the textarea
		father= area.textarea.parentNode;
	/*	var container= document.createElement("div");
		container.id= "EditAreaFrameContainer_"+area["settings"]["id"];
	*/	
		content= d.createElement("iframe");
		content.name= "frame_"+area["settings"]["id"];
		content.id= "frame_"+area["settings"]["id"];
		content.style.borderWidth= "0px";
		setAttribute(content, "frameBorder", "0"); // IE
		content.style.overflow="hidden";
		content.style.display="none";

		
		next= area.textarea.nextSibling;
		if(next==null)
			father.appendChild(content);
		else
			father.insertBefore(content, next) ;		
		f=window.frames["frame_"+area["settings"]["id"]];
		f.document.open();
		f.editAreas=editAreas;
		f.areaId= area["settings"]["id"];	
		f.document.areaId= area["settings"]["id"];	
		f.document.write(template);
		f.document.close();

	//	frame.editAreaLoader=this;
		//editAreas[area["settings"]["id"]]["displayed"]=true;
		
	},
	
	toggle : function(id, toggleTo){

	/*	if((editAreas[id]["displayed"]==true  && toggleTo!="on") || toggleTo=="off"){
			this.toggleOff(id);
		}else if((editAreas[id]["displayed"]==false  && toggleTo!="off") || toggleTo=="on"){
			this.toggleOn(id);
		}*/
		if(!toggleTo)
			toggleTo= (editAreas[id]["displayed"]==true)?"off":"on";
		if(editAreas[id]["displayed"]==true  && toggleTo=="off"){
			this.toggleOff(id);
		}else if(editAreas[id]["displayed"]==false  && toggleTo=="on"){
			this.toggleOn(id);
		}
	
		return false;
	},
	
	// static function
	toggleOff : function(id){
		var fs=window.frames,f,t,parNod,nxtSib,selStart,selEnd,scrollTop,scrollLeft;
		if(fs["frame_"+id])
		{	
			f	= fs["frame_"+id];
			t	= editAreas[id]["textarea"];
			if(f.editArea.fullscreen['isFull'])
				f.editArea.toggleFullScreen(false);
			editAreas[id]["displayed"]=false;
			
			// set wrap to off to keep same display mode (some browser get problem with this, so it need more complex operation		
			t.wrap = "off";	// for IE
			setAttribute(t, "wrap", "off");	// for Firefox	
			parNod = t.parentNode;
			nxtSib = t.nextSibling;
			parNod.removeChild(t); 
			parNod.insertBefore(t, nxtSib);
			
			// restore values
			t.value= f.editArea.textarea.value;
			selStart	= f.editArea.lastSelection["selectionStart"];
			selEnd		= f.editArea.lastSelection["selectionEnd"];
			scrollTop	= f.document.getElementById("result").scrollTop;
			scrollLeft	= f.document.getElementById("result").scrollLeft;
			
			
			document.getElementById("frame_"+id).style.display='none';
		
			t.style.display="inline";

			try{	// IE will give an error when trying to focus an invisible or disabled textarea
				t.focus();
			} catch(e){};
			if(this.isIE){
				t.selectionStart= selStart;
				t.selectionEnd	= selEnd;
				t.focused		= true;
				setIESelection(t);
			}else{
				if(this.isOpera && this.isOpera < 9.6 ){	// Opera bug when moving selection start and selection end
					t.setSelectionRange(0, 0);
				}
				try{
					t.setSelectionRange(selStart, selEnd);
				} catch(e) {};
			}
			t.scrollTop= scrollTop;
			t.scrollLeft= scrollLeft;
			f.editArea.execCommand("toggleOff");

		}
	},	
	
	// static function
	toggleOn : function(id){
		var fs=window.frames,f,t,selStart=0,selEnd=0,scrollTop=0,scrollLeft=0,curPos,elem;
			
		if(fs["frame_"+id])
		{
			f	= fs["frame_"+id];
			t	= editAreas[id]["textarea"];
			area= f.editArea;
			area.textarea.value= t.value;
			
			// store display values;
			curPos	= editAreas[id]["settings"]["cursorPosition"];

			if(t.useLast==true)
			{
				selStart	= t.lastSelectionStart;
				selEnd		= t.lastSelectionEnd;
				scrollTop	= t.lastScrollTop;
				scrollLeft	= t.lastScrollLeft;
				t.useLast=false;
			}
			else if( curPos == "auto" )
			{
				try{
					selStart	= t.selectionStart;
					selEnd		= t.selectionEnd;
					scrollTop	= t.scrollTop;
					scrollLeft	= t.scrollLeft;
					//alert(scrollTop);
				}catch(ex){}
			}
			
			// set to good size
			this.setEditareaSizeFromTextarea(id, document.getElementById("frame_"+id));
			t.style.display="none";			
			document.getElementById("frame_"+id).style.display="inline";
			area.execCommand("focus"); // without this focus opera doesn't manage well the iframe body height
			
			
			// restore display values
			editAreas[id]["displayed"]=true;
			area.execCommand("updateSize");
			
			f.document.getElementById("result").scrollTop= scrollTop;
			f.document.getElementById("result").scrollLeft= scrollLeft;
			area.areaSelect(selStart, selEnd-selStart);
			area.execCommand("toggleOn");

			
		}
		else
		{
		/*	if(this.isIE)
				getIESelection(document.getElementById(id));	*/	
			elem= document.getElementById(id);	
			elem.lastSelectionStart= elem.selectionStart;
			elem.lastSelectionEnd= elem.selectionEnd;
			elem.lastScrollTop= elem.scrollTop;
			elem.lastScrollLeft= elem.scrollLeft;
			elem.useLast=true;
			editAreaLoader.start(id);
		}
	},	
	
	setEditareaSizeFromTextarea : function(id, frame){	
		var elem,width,height;
		elem	= document.getElementById(id);
		
		width	= Math.max(editAreas[id]["settings"]["minWidth"], elem.offsetWidth)+"px";
		height	= Math.max(editAreas[id]["settings"]["minHeight"], elem.offsetHeight)+"px";
		if(elem.style.width.indexOf("%")!=-1)
			width	= elem.style.width;
		if(elem.style.height.indexOf("%")!=-1)
			height	= elem.style.height;
		//alert("h: "+height+" w: "+width);
	
		frame.style.width= width;
		frame.style.height= height;
	},
		
	setBaseUrl : function(){
		var t=this,elems,i,docBasePath;

		if( !this.baseURL ){
			elems = document.getElementsByTagName('script');
	
			for( i=0; i<elems.length; i++ ){
				if (elems[i].src && elems[i].src.match(/editArea_[^\\\/]*$/i) ) {
					var src = unescape( elems[i].src ); // use unescape for utf-8 encoded urls
					src = src.substring(0, src.lastIndexOf('/'));
					this.baseURL = src;
					this.fileName= elems[i].src.substr(elems[i].src.lastIndexOf("/")+1);
					break;
				}
			}
		}
		
		docBasePath	= document.location.href;
		if (docBasePath.indexOf('?') != -1)
			docBasePath	= docBasePath.substring(0, docBasePath.indexOf('?'));
		docBasePath	= docBasePath.substring(0, docBasePath.lastIndexOf('/'));
	
		// If not HTTP absolute
		if (t.baseURL.indexOf('://') == -1 && t.baseURL.charAt(0) != '/') {
			// If site absolute
			t.baseURL = docBasePath + "/" + t.baseURL;
		}
		t.baseURL	+="/";	
	},
	
	getButtonHtml : function(id, img, exec, isFileSpecific, baseURL) {
		var cmd,html;
		if(!baseURL)
			baseURL= this.baseURL;
		cmd	= 'editArea.execCommand(\'' + exec + '\')';
		html	= '<a id="a_'+ id +'" href="javascript:' + cmd + '" onclick="' + cmd + ';return false;" onmousedown="return false;" target="Self" fileSpecific="'+ (isFileSpecific?'yes':'no') +'">';
		html	+= '<img id="' + id + '" src="'+ baseURL +'images/' + img + '" title="{$' + id + '}" width="20" height="20" class="editAreaButtonNormal" onmouseover="editArea.switchClass(this,\'editAreaButtonOver\');" onmouseout="editArea.restoreClass(this);" onmousedown="editArea.restoreAndSwitchClass(this,\'editAreaButtonDown\');" /></a>';
		return html;
	},

	getControlHtml : function(buttonName, lang) {		
		var t=this,i,but,html,si;
		for (i=0; i<t.advancedButtons.length; i++)
		{
			but = t.advancedButtons[i];			
			if (but[0] == buttonName)
			{
				return t.getButtonHtml(but[0], but[1], but[2], but[3]);
			}	
		}		
				
		switch (buttonName){
			case "*":
			case "return":
				return "<br />";
			case "|":
		  	case "separator":
				return '<img src="'+ t.baseURL +'images/spacer.gif" width="1" height="15" class="editAreaSeparatorLine">';
			case "selectFont":
				html= "<select id='areaFontSize' onchange='javascript:editArea.execCommand(\"changeFontSize\")' fileSpecific='yes'>";
				html+="<option value='-1'>{$fontSize}</option>";
				si=[8,9,10,11,12,14];
				for( i=0;i<si.length;i++){
					html+="<option value='"+si[i]+"'>"+si[i]+" pt</option>";
				}
				html+="</select>";
				return html;
			case "syntaxSelection":
				html= "<select id='syntaxSelection' onchange='javascript:editArea.execCommand(\"changeSyntax\", this.value)' fileSpecific='yes'>";
				html+="<option value='-1'>{$syntaxSelection}</option>";
				html+="</select>";
				return html;
		}
		
		return "<span id='tmpTool_"+buttonName+"'>["+buttonName+"]</span>";		
	},
	
	
	getTemplate : function(){
		if(this.template=="")
		{
			var xhrObject = null; 
			if(window.XMLHttpRequest) // Firefox 
				xhrObject = new XMLHttpRequest(); 
			else if(window.ActiveXObject) // Internet Explorer 
				xhrObject = new ActiveXObject("Microsoft.XMLHTTP"); 
			else { // XMLHttpRequest not supported
				alert("XMLHTTPRequest not supported. EditArea not loaded"); 
				return; 
			} 
			 
			xhrObject.open("GET", this.baseURL+"template.html", false); 
			xhrObject.send(null); 
			if(xhrObject.readyState == 4) 
				this.template=xhrObject.responseText;
			else
				this.hasError();
		}
	},
	
	// translate text
	translate : function(text, lang, mode){
		if(mode=="word")
			text=editAreaLoader.getWordTranslation(text, lang);
		else if(mode="template"){
			editAreaLoader.currentLanguage= lang;
			text=text.replace(/\{\$([^\}]+)\}/gm, editAreaLoader.translateTemplate);
		}
		return text;
	},
	
	translateTemplate : function(){
		return editAreaLoader.getWordTranslation(EditAreaLoader.prototype.translateTemplate.arguments[1], editAreaLoader.currentLanguage);
	},
	
	getWordTranslation : function(val, lang){
		var i;
		
		for( i in editAreaLoader.lang[lang]){
			if(i == val)
				return editAreaLoader.lang[lang][i];
		}
		return "_"+val;
	},
	
	loadScript : function(url){
		var t=this,d=document,script,head;
		
		if( t.loadedFiles[url] )
			return;	
		//alert("load: "+url);
		try{
			script= d.createElement("script");
			script.type= "text/javascript";
			script.src= url;
			script.charset= "UTF-8";
			d.getElementsByTagName("head")[0].appendChild(script);
		}catch(e){
			d.write('<sc'+'ript language="javascript" type="text/javascript" src="' + url + '" charset="UTF-8"></sc'+'ript>');
		}
		
		t.loadedFiles[url] = true;
	},
	
	addEvent : function(obj, name, handler) {
		try{
			if (obj.attachEvent) {
				obj.attachEvent("on" + name, handler);
			} else{
				obj.addEventListener(name, handler, false);
			}
		}catch(e){}
	},
	
	removeEvent : function(obj, name, handler){
		try{
			if (obj.detachEvent)
				obj.detachEvent("on" + name, handler);
			else
				obj.removeEventListener(name, handler, false);
		}catch(e){}
	},


	// reset all the editareas in the form that have been reseted
	reset : function(e){
		var formObj,isChild,i,x;
		
		formObj = editAreaLoader.isIE ? window.event.srcElement : e.target;
		if(formObj.tagName!='FORM')
			formObj= formObj.form;
		
		for( i in editAreas ){			
			isChild= false;
			for( x=0;x<formObj.elements.length;x++ ) {
				if(formObj.elements[x].id == i)
					isChild=true;
			}
			
			if(window.frames["frame_"+i] && isChild && editAreas[i]["displayed"]==true){
			
				var exec= 'window.frames["frame_'+ i +'"].editArea.textarea.value= document.getElementById("'+ i +'").value;';
				exec+= 'window.frames["frame_'+ i +'"].editArea.execCommand("focus");';
				exec+= 'window.frames["frame_'+ i +'"].editArea.checkLineSelection();';
				exec+= 'window.frames["frame_'+ i +'"].editArea.execCommand("reset");';
				window.setTimeout(exec, 10);
			}
		}		
		return;
	},
	
	
	// prepare all the textarea replaced by an editarea to be submited
	submit : function(e){		
		var formObj,isChild,fs=window.frames,i,x;
		formObj = editAreaLoader.isIE ? window.event.srcElement : e.target;
		if(formObj.tagName!='FORM')
			formObj= formObj.form;
		
		for( i in editAreas){
			isChild= false;
			for( x=0;x<formObj.elements.length;x++ ) {
				if(formObj.elements[x].id == i)
					isChild=true;
			}
		
			if(isChild)
			{
				if(fs["frame_"+i] && editAreas[i]["displayed"]==true)
					document.getElementById(i).value= fs["frame_"+ i].editArea.textarea.value;
				editAreaLoader.execCommand(i,"EASubmit");
			}
		}				
		if( typeof(formObj.editAreaReplacedSubmit) == "function" ){
			res= formObj.editAreaReplacedSubmit();
			if(res==false){
				if(editAreaLoader.isIE)
					return false;
				else
					e.preventDefault();
			}
		}
		return;
	},
	
	// allow to get the value of the editarea
	getValue : function(id){
        if(window.frames["frame_"+id] && editAreas[id]["displayed"]==true){
            return window.frames["frame_"+ id].editArea.textarea.value;       
        }else if(elem=document.getElementById(id)){
        	return elem.value;
        }
        return false;
    },
    
    // allow to set the value of the editarea
    setValue : function(id, newVal){
    	var fs=window.frames;
    	
        if( ( f=fs["frame_"+id] ) && editAreas[id]["displayed"]==true){
			f.editArea.textarea.value= newVal;     
			f.editArea.execCommand("focus"); 
			f.editArea.checkLineSelection(false);  
			f.editArea.execCommand("onchange");
        }else if(elem=document.getElementById(id)){
        	elem.value= newVal;
        }
    },
	    
    // allow to get infos on the selection: array(start, end)
    getSelectionRange : function(id){
    	var sel,eA,fs=window.frames;
    	
    	sel= {"start": 0, "end": 0};
        if(fs["frame_"+id] && editAreas[id]["displayed"]==true){
        	eA= fs["frame_"+ id].editArea;

			sel["start"]	= eA.textarea.selectionStart;
			sel["end"]		= eA.textarea.selectionEnd;
		
        }else if( elem=document.getElementById(id) ){
        	sel= getSelectionRange(elem);
        }
        return sel;
    },
    
    // allow to set the selection with the given start and end positions
    setSelectionRange : function(id, newStart, newEnd){
    	var fs=window.frames;
    	
        if(fs["frame_"+id] && editAreas[id]["displayed"]==true){
            fs["frame_"+ id].editArea.areaSelect(newStart, newEnd-newStart);  
			// make an auto-scroll to the selection
			if(!this.isIE){
				fs["frame_"+ id].editArea.checkLineSelection(false); 
				fs["frame_"+ id].editArea.scrollToView();
			}   
        }else if(elem=document.getElementById(id)){
        	setSelectionRange(elem, newStart, newEnd);
        }
    },
    
    getSelectedText : function(id){
    	var sel= this.getSelectionRange(id);
    	
        return this.getValue(id).substring(sel["start"], sel["end"]);
    },
	
	setSelectedText : function(id, newVal){
		var fs=window.frames,d=document,sel,text,scrollTop,scrollLeft,newSelEnd;
		
		newVal	= newVal.replace(/\r/g, ""); 
		sel		= this.getSelectionRange(id);
		text	= this.getValue(id);
		if(fs["frame_"+id] && editAreas[id]["displayed"]==true){
			scrollTop	= fs["frame_"+ id].document.getElementById("result").scrollTop;
			scrollLeft	= fs["frame_"+ id].document.getElementById("result").scrollLeft;
		}else{
			scrollTop	= d.getElementById(id).scrollTop;
			scrollLeft	= d.getElementById(id).scrollLeft;
		}
		
		text	= text.substring(0, sel["start"])+ newVal +text.substring(sel["end"]);
		this.setValue(id, text);
		newSelEnd	= sel["start"]+ newVal.length;
		this.setSelectionRange(id, sel["start"], newSelEnd);
		
		
		// fix \r problem for selection length count on IE & Opera
		if(newVal != this.getSelectedText(id).replace(/\r/g, "")){
			this.setSelectionRange(id, sel["start"], newSelEnd+ newVal.split("\n").length -1);
		}
		// restore scrolling position
		if(fs["frame_"+id] && editAreas[id]["displayed"]==true){
			fs["frame_"+ id].document.getElementById("result").scrollTop= scrollTop;
			fs["frame_"+ id].document.getElementById("result").scrollLeft= scrollLeft;
			fs["frame_"+ id].editArea.execCommand("onchange");
		}else{
			d.getElementById(id).scrollTop= scrollTop;
			d.getElementById(id).scrollLeft= scrollLeft;
		}
    },
    
    insertTags : function(id, openTag, closeTag){
    	var oldSel,newSel;
    	
    	oldSel	= this.getSelectionRange(id);
    	text	= openTag + this.getSelectedText(id) + closeTag;
    	 
		editAreaLoader.setSelectedText(id, text);
		
    	newSel	= this.getSelectionRange(id);
    	if(oldSel["end"] > oldSel["start"])	// if text was selected, cursor at the end
    		this.setSelectionRange(id, newSel["end"], newSel["end"]);
    	else // cursor in the middle
    		this.setSelectionRange(id, oldSel["start"]+openTag.length, oldSel["start"]+openTag.length);
    },
    
    // hide both EditArea and normal textarea
	hide : function(id){
		var fs= window.frames,d=document,t=this,scrollTop,scrollLeft,span;
		if(d.getElementById(id) && !t.hidden[id])
		{
			t.hidden[id]= {};
			t.hidden[id]["selectionRange"]= t.getSelectionRange(id);
			if(d.getElementById(id).style.display!="none")
			{
				t.hidden[id]["scrollTop"]= d.getElementById(id).scrollTop;
				t.hidden[id]["scrollLeft"]= d.getElementById(id).scrollLeft;
			}
					
			if(fs["frame_"+id])
			{
				t.hidden[id]["toggle"]= editAreas[id]["displayed"];
				
				if(fs["frame_"+id] && editAreas[id]["displayed"]==true){
					scrollTop	= fs["frame_"+ id].document.getElementById("result").scrollTop;
					scrollLeft	= fs["frame_"+ id].document.getElementById("result").scrollLeft;
				}else{
					scrollTop	= d.getElementById(id).scrollTop;
					scrollLeft	= d.getElementById(id).scrollLeft;
				}
				t.hidden[id]["scrollTop"]= scrollTop;
				t.hidden[id]["scrollLeft"]= scrollLeft;
				
				if(editAreas[id]["displayed"]==true)
					editAreaLoader.toggleOff(id);
			}
			
			// hide toggle button and debug box
			span= d.getElementById("EditAreaArroundInfos_"+id);
			if(span){
				span.style.display='none';
			}
			
			// hide textarea
			d.getElementById(id).style.display= "none";
		}
	},
	
	// restore hidden EditArea and normal textarea
	show : function(id){
		var fs= window.frames,d=document,t=this,span;
		if((elem=d.getElementById(id)) && t.hidden[id])
		{
			elem.style.display= "inline";
			elem.scrollTop= t.hidden[id]["scrollTop"];
			elem.scrollLeft= t.hidden[id]["scrollLeft"];
			span= d.getElementById("EditAreaArroundInfos_"+id);
			if(span){
				span.style.display='inline';
			}
			
			if(fs["frame_"+id])
			{
								
				// restore toggle button and debug box
			
				
				// restore textarea
				elem.style.display= "inline";
				
				// restore EditArea
				if(t.hidden[id]["toggle"]==true)
					editAreaLoader.toggleOn(id);
				
				scrollTop	= t.hidden[id]["scrollTop"];
				scrollLeft	= t.hidden[id]["scrollLeft"];
				
				if(fs["frame_"+id] && editAreas[id]["displayed"]==true){
					fs["frame_"+ id].document.getElementById("result").scrollTop	= scrollTop;
					fs["frame_"+ id].document.getElementById("result").scrollLeft	= scrollLeft;
				}else{
					elem.scrollTop	= scrollTop;
					elem.scrollLeft	= scrollLeft;
				}
			
			}
			// restore selection
			sel	= t.hidden[id]["selectionRange"];
			t.setSelectionRange(id, sel["start"], sel["end"]);
			delete t.hidden[id];	
		}
	},
	
	// get the current file datas (for multi file editing mode)
	getCurrentFile : function(id){
		return this.execCommand(id, 'getFile', this.execCommand(id, 'currFile'));
	},
	
	// get the given file datas (for multi file editing mode)
	getFile : function(id, fileId){
		return this.execCommand(id, 'getFile', fileId);
	},
	
	// get all the openned files datas (for multi file editing mode)
	getAllFiles : function(id){
		return this.execCommand(id, 'getAllFiles()');
	},
	
	// open a file (for multi file editing mode)
	openFile : function(id, fileInfos){
		return this.execCommand(id, 'openFile', fileInfos);
	},
	
	// close the given file (for multi file editing mode)
	closeFile : function(id, fileId){
		return this.execCommand(id, 'closeFile', fileId);
	},
	
	// close the given file (for multi file editing mode)
	setFileEditedMode : function(id, fileId, to){
		var reg1,reg2;
		reg1	= new RegExp('\\\\', 'g');
		reg2	= new RegExp('"', 'g');
		return this.execCommand(id, 'setFileEditedMode("'+ fileId.replace(reg1, '\\\\').replace(reg2, '\\"') +'", '+ to +')');
	},
	
	
	// allow to access to editarea functions and datas (for advanced users only)
	execCommand : function(id, cmd, fctParam){
		switch(cmd){
			case "EAInit":
				if(editAreas[id]['settings']["EAInitCallback"].length>0)
					eval(editAreas[id]['settings']["EAInitCallback"]+"('"+ id +"');");
				break;
			case "EADelete":
				if(editAreas[id]['settings']["EADeleteCallback"].length>0)
					eval(editAreas[id]['settings']["EADeleteCallback"]+"('"+ id +"');");
				break;
			case "EASubmit":
				if(editAreas[id]['settings']["submitCallback"].length>0)
					eval(editAreas[id]['settings']["submitCallback"]+"('"+ id +"');");
				break;
		}
        if(window.frames["frame_"+id] && window.frames["frame_"+ id].editArea){
			if(fctParam!=undefined)
				return eval('window.frames["frame_'+ id +'"].editArea.'+ cmd +'(fctParam);');
			else
				return eval('window.frames["frame_'+ id +'"].editArea.'+ cmd +';');       
        }
        return false;
    }
};
	
	var editAreaLoader= new EditAreaLoader();
	var editAreas= {};
