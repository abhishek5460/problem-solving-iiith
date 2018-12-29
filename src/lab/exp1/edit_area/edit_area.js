/******
 *
 *	EditArea 
 * 	Developped by Christophe Dolivet
 *	Released under LGPL, Apache and BSD licenses (use the one you want)
 *
******/

	function EditArea(){
		var t=this;
		t.error= false;	// to know if load is interrrupt
		
		t.inlinePopup= [{popupId: "areaSearchReplace", iconId: "search"},
									{popupId: "editAreaHelp", iconId: "help"}];
		t.plugins= {};
	
		t.lineNumber=0;
		
		parent.editAreaLoader.setBrowserInfos(t); 	// navigator identification
		// fix IE8 detection as we run in IE7 emulate mode through X-UA <meta> tag
		if( t.isIE >= 8 )
			t.isIE	= 7;
		
		t.lastSelection={};		
		t.lastTextToHighlight="";
		t.lastHightlightedText= "";
		t.syntaxList= [];
		t.allreadyUsedSyntax= {};
		t.checkLineSelectionTimer= 50;	// the timer delay for modification and/or selection change detection
		
		t.textareaFocused= false;
		t.highlightSelectionLine= null;
		t.previous= [];
		t.next= [];
		t.lastUndo="";
		t.files= {};
		t.filesIdAssoc= {};
		t.currFile= '';
		//t.loaded= false;
		t.assocBracket={};
		t.revertAssocBracket= {};		
		// bracket selection init 
		t.assocBracket["("]=")";
		t.assocBracket["{"]="}";
		t.assocBracket["["]="]";		
		for(var index in t.assocBracket){
			t.revertAssocBracket[t.assocBracket[index]]=index;
		}
		t.isEditable= true;
		
		
		/*t.textArea="";	
		
		t.state="declare";
		t.code = []; // store highlight syntax for languagues*/
		// font datas
		t.lineHeight= 16;
		/*t.default_font_family= "monospace";
		t.default_font_size= 10;*/
		t.tabNbChar= 8;	//nb of white spaces corresponding to a tabulation
		if(t.isOpera)
			t.tabNbChar= 6;

		t.isTabbing= false;
		
		t.fullScreen= {'isFull': false};
		
		t.isResizing=false;	// resize var
		
		// init with settings and ID (areaId is a global var defined by editAreaLoader on iframe creation
		t.id= areaId;
		t.settings= editAreas[t.id]["settings"];
		
		if((""+t.settings['replaceTabBySpaces']).match(/^[0-9]+$/))
		{
			t.tabNbChar= t.settings['replaceTabBySpaces'];
			t.tabulation="";
			for(var i=0; i<t.tabNbChar; i++)
				t.tabulation+=" ";
		}else{
			t.tabulation="\t";
		}
			
		// retrieve the init parameter for syntax
		if(t.settings["syntaxSelectionAllow"] && t.settings["syntaxSelectionAllow"].length>0)
			t.syntax_list= t.settings["syntaxSelectionAllow"].replace(/ /g,"").split(",");
		
		if(t.settings['syntax'])
			t.allreadyUsedSyntax[t.settings['syntax']]=true;
		
		
	};
	EditArea.prototype.init= function(){
		var t=this, a, s=t.settings;
		t.textarea			= _$("textarea");
		t.container			= _$("container");
		t.result			= _$("result");
		t.contentHighlight	= _$("contentHighlight");
		t.selectionField	= _$("selectionField");
		t.selectionFieldText= _$("selectionFieldText");
		t.processingScreen	= _$("processing");
		t.editorArea		= _$("editor");
		t.tabBrowsingArea	= _$("tabBrowsingArea");
		t.testFontSize	= _$("testFontSize");
		a = t.textarea;
		
		if(!s['isEditable'])
			t.setEditable(false);
		
		t.setShowLineColors( s['showLineColors'] );
		
		if(syntaxSelec= _$("syntaxSelection"))
		{
			// set up syntax selection lsit in the toolbar
			for(var i=0; i<t.syntaxList.length; i++) {
				var syntax= t.syntaxList[i];
				var option= document.createElement("option");
				option.value= syntax;
				if(syntax==s['syntax'])
					option.selected= "selected";
				dispSyntax	= parent.editAreaLoader.syntaxDisplayName[ syntax ];
				option.innerHTML= typeof( dispSyntax ) == 'undefined' ? syntax.substring( 0, 1 ).toUpperCase() + syntax.substring( 1 ) : dispSyntax;//t.getTranslation("syntax_" + syntax, "word");
				syntaxSelec.appendChild(option);
			}
		}
		
		// add plugins buttons in the toolbar
		spans= parent.getChildren(_$("toolbar_1"), "span", "", "", "all", -1);
		
		for(var i=0; i<spans.length; i++){
		
			id=spans[i].id.replace(/tmpTool_(.*)/, "$1");
			if(id!= spans[i].id){
				for(var j in t.plugins){
					if(typeof(t.plugins[j].getControlHtml)=="function" ){
						html=t.plugins[j].getControlHtml(id);
						if(html!=false){
							html= t.getTranslation(html, "template");
							var newSpan= document.createElement("span");
							newSpan.innerHTML= html;				
							var father= spans[i].parentNode;
							spans[i].parentNode.replaceChild(newSpan, spans[i]);	
							break; // exit the for loop					
						}
					}
				}
			}
		}
		
		// init datas
		//a.value	= 'a';//editAreas[t.id]["textarea"].value;
	
		if(s["debug"])
		{
			t.debug=parent.document.getElementById("editAreaDebug_"+t.id);
		}
		// init size		
		//this.updateSize();
		
		if(_$("redo") != null)
			t.switchClassSticky(_$("redo"), 'editAreaButtonDisabled', true);
		
		// insert css rules for highlight mode		
		if(typeof(parent.editAreaLoader.syntax[s["syntax"]])!="undefined"){
			for(var i in parent.editAreaLoader.syntax){
				if (typeof(parent.editAreaLoader.syntax[i]["styles"]) != "undefined"){
					t.addStyle(parent.editAreaLoader.syntax[i]["styles"]);
				}
			}
		}
	
		// init key events
		if(t.isOpera)
			_$("editor").onkeypress	= keyDown;
		else
			_$("editor").onkeydown	= keyDown;

		for(var i=0; i<t.inlinePopup.length; i++){
			if(t.isOpera)
				_$(t.inlinePopup[i]["popupId"]).onkeypress	= keyDown;
			else
				_$(t.inlinePopup[i]["popupId"]).onkeydown	= keyDown;
		}
		
		if(s["allowResize"]=="both" || s["allowResize"]=="x" || s["allowResize"]=="y")
			t.allowResize(true);
		
		parent.editAreaLoader.toggle(t.id, "on");
		//a.focus();
		// line selection init
		t.changeSmoothSelectionMode(editArea.smoothSelection);
		// highlight
		t.execCommand("changeHighlight", s["startHighlight"]);
	
		// get font size datas		
		t.setFont(editArea.settings["fontFamily"], editArea.settings["fontSize"]);
		
		// set unselectable text
		children= parent.getChildren(document.body, "", "selec", "none", "all", -1);
		for(var i=0; i<children.length; i++){
			if(t.isIE)
				children[i].unselectable = true; // IE
			else
				children[i].onmousedown= function(){return false};
		/*	children[i].style.MozUserSelect = "none"; // Moz
			children[i].style.KhtmlUserSelect = "none";  // Konqueror/Safari*/
		}
		
		a.spellcheck= s["geckoSpellcheck"];
	
		/** Browser specific style fixes **/
		
		// fix rendering bug for highlighted lines beginning with no tabs
		if( t.isFirefox >= '3' ) {
			t.contentHighlight.style.paddingLeft= "1px";
			t.selectionField.style.paddingLeft= "1px";
			t.selectionFieldText.style.paddingLeft= "1px";
		}
		
		if(t.isIE && t.isIE < 8 ){
			a.style.marginTop= "-1px";
		}
		/*
		if(t.isOpera){
			t.editorArea.style.position= "absolute";
		}*/
		
		if( t.isSafari ){
			t.editorArea.style.position	= "absolute";
			a.style.marginLeft		="-3px";
			if( t.isSafari < 3.2 ) // Safari 3.0 (3.1?)
				a.style.marginTop	="1px";
		}
		
		// si le textarea n'est pas grand, un click sous le textarea doit provoquer un focus sur le textarea
		parent.editAreaLoader.addEvent(t.result, "click", function(e){ if((e.target || e.srcElement)==editArea.result) { editArea.areaSelect(editArea.textarea.value.length, 0);}  });
		
		if(s['isMultiFiles']!=false)
			t.openFile({'id': t.currFile, 'text': ''});
	
		t.setWordWrap( s['wordWrap'] );
	
		setTimeout("editArea.focus();editArea.manageSize();editArea.execCommand('EA_load');", 10);		
		//start checkup routine
		t.checkUndo();
		t.checkLineSelection(true);
		t.scrollToView();
		
		for(var i in t.plugins){
			if(typeof(t.plugins[i].onload)=="function")
				t.plugins[i].onload();
		}
		if(s['fullscreen']==true)
			t.toggleFullScreen(true);
	
		parent.editAreaLoader.addEvent(window, "resize", editArea.updateSize);
		parent.editAreaLoader.addEvent(parent.window, "resize", editArea.updateSize);
		parent.editAreaLoader.addEvent(top.window, "resize", editArea.updateSize);
		parent.editAreaLoader.addEvent(window, "unload", function(){
			// in case where editAreaLoader have been already cleaned
			if( parent.editAreaLoader )
			{
				parent.editAreaLoader.removeEvent(parent.window, "resize", editArea.updateSize);
		  		parent.editAreaLoader.removeEvent(top.window, "resize", editArea.updateSize);
			}
			if(editAreas[editArea.id] && editAreas[editArea.id]["displayed"]){
				editArea.execCommand("EA_unload");
			}
		});
		
		
		/*date= new Date();
		alert(date.getTime()- parent.editAreaLoader.startTime);*/
	};
	
	
	
	//called by the toggleOn
	EditArea.prototype.update_size= function(){
		var d=document,pd=parent.document,height,width,popup,maxLeft,maxTop;
		
		if( typeof editAreas != 'undefined' && editAreas[editArea.id] && editAreas[editArea.id]["displayed"]==true){
			if(editArea.fullscreen['isFull']){	
				pd.getElementById("frame_"+editArea.id).style.width		= pd.getElementsByTagName("html")[0].clientWidth + "px";
				pd.getElementById("frame_"+editArea.id).style.height	= pd.getElementsByTagName("html")[0].clientHeight + "px";
			}
			
			if(editArea.tabBrowsingArea.style.display=='block' && ( !editArea.isIE || editArea.isIE >= 8 ) )
			{
				editArea.tabBrowsingArea.style.height	= "0px";
				editArea.tabBrowsingArea.style.height	= (editArea.result.offsetTop - editArea.tabBrowsingArea.offsetTop -1)+"px";
			}
			
			height	= d.body.offsetHeight - editArea.getAllToolbarHeight() - 4;
			editArea.result.style.height	= height +"px";
			
			width	= d.body.offsetWidth -2;
			editArea.result.style.width		= width+"px";
			//alert("result h: "+ height+" w: "+width+"\ntoolbar h: "+this.getAllToolbarHeight()+"\nbodyH: "+document.body.offsetHeight);
			
			// check that the popups don't get out of the screen
			for( i=0; i < editArea.inlinePopup.length; i++ )
			{
				popup	= _$(editArea.inlinePopup[i]["popupId"]);
				maxLeft	= d.body.offsetWidth - popup.offsetWidth;
				maxTop	= d.body.offsetHeight - popup.offsetHeight;
				if( popup.offsetTop > maxTop )
					popup.style.top		= maxTop+"px";
				if( popup.offsetLeft > maxLeft )
					popup.style.left	= maxLeft+"px";
			}
			
			editArea.manageSize( true );
			editArea.fixLinesHeight( editArea.textarea.value, 0,-1);
		}		
	};
	
	
	EditArea.prototype.manageSize= function(onlyOneTime){
		if(!editAreas[this.id])
			return false;
			
		if(editAreas[this.id]["displayed"]==true && this.textareaFocused)
		{
			var areaHeight,resized= false;
			
			//1) Manage display width
			//1.1) Calc the new width to use for display
			if( !this.settings['wordWrap'] )
			{
				var areaWidth= this.textarea.scrollWidth;
				areaHeight= this.textarea.scrollHeight;
				// bug on old opera versions
				if(this.isOpera && this.isOpera < 9.6 ){
					areaWidth=10000; 								
				}
				//1.2) the width is not the same, we must resize elements
				if(this.textarea.previous_scrollWidth!=areaWidth)
				{	
					this.container.style.width= areaWidth+"px";
					this.textarea.style.width= areaWidth+"px";
					this.contentHighlight.style.width= areaWidth+"px";	
					this.textarea.previous_scrollWidth=areaWidth;
					resized=true;
				}
			}
			// manage wrap width
			if( this.settings['wordWrap'] )
			{
				newW=this.textarea.offsetWidth;
				if( this.isFirefox || this.isIE )
					newW-=2;
				if( this.isSafari )
					newW-=6;
				this.contentHighlight.style.width=this.selectionFieldText.style.width=this.selectionField.style.width=this.testFontSize.style.width=newW+"px";
			}
			
			//2) Manage display height
			//2.1) Calc the new height to use for display
			if( this.isOpera || this.isFirefox || this.isSafari ) { 
				areaHeight= this.getLinePosTop( this.lastSelection["nbLine"] + 1 );
			} else {
				areaHeight = this.textarea.scrollHeight;
			}	
			//2.2) the width is not the same, we must resize elements 
			if(this.textarea.previous_scrollHeight!=areaHeight)	
			{	
				this.container.style.height= (areaHeight+2)+"px";
				this.textarea.style.height= areaHeight+"px";
				this.contentHighlight.style.height= areaHeight+"px";	
				this.textarea.previous_scrollHeight= areaHeight;
				resized=true;
			}
		
			//3) if there is new lines, we add new line numbers in the line numeration area
			if(this.lastSelection["nbLine"] >= this.lineNumber)
			{
				var newLines= '', destDiv=_$("lineNumber"), start=this.lineNumber, end=this.lastSelection["nbLine"]+100;
				for( i = start+1; i < end; i++ )
				{
					newLines+='<div id="line_'+ i +'">'+i+"</div>";
					this.lineNumber++;
				}
				destDiv.innerHTML= destDiv.innerHTML + newLines;
				if(this.settings['wordWrap']){
					this.fixLinesHeight( this.textarea.value, start, -1 );
				}
			}
		
			//4) be sure the text is well displayed
			this.textarea.scrollTop="0px";
			this.textarea.scrollLeft="0px";
			if(resized==true){
				this.scrollToView();
			}
		}
		
		if(!onlyOneTime)
			setTimeout("editArea.manageSize();", 100);
	};
	
	EditArea.prototype.execCommand= function(cmd, param){
		
		for(var i in this.plugins){
			if(typeof(this.plugins[i].execCommand)=="function"){
				if(!this.plugins[i].execCommand(cmd, param))
					return;
			}
		}
		switch(cmd){
			case "save":
				if(this.settings["saveCallback"].length>0)
					eval("parent."+this.settings["saveCallback"]+"('"+ this.id +"', editArea.textarea.value);");
				break;
			case "load":
				if(this.settings["loadCallback"].length>0)
					eval("parent."+this.settings["loadCallback"]+"('"+ this.id +"');");
				break;
			case "onchange":
				if(this.settings["changeCallback"].length>0)
					eval("parent."+this.settings["changeCallback"]+"('"+ this.id +"');");
				break;		
			case "EA_load":
				if(this.settings["EA_loadCallback"].length>0)
					eval("parent."+this.settings["EA_loadCallback"]+"('"+ this.id +"');");
				break;
			case "EA_unload":
				if(this.settings["EA_unload_callback"].length>0)
					eval("parent."+this.settings["EA_unloadCallback"]+"('"+ this.id +"');");
				break;
			case "toggleOn":
				if(this.settings["EA_toggle_on_callback"].length>0)
					eval("parent."+this.settings["EA_toggleOnCallback"]+"('"+ this.id +"');");
				break;
			case "toggleOff":
				if(this.settings["EA_toggleOffCallback"].length>0)
					eval("parent."+this.settings["EA_toggleOffCallback"]+"('"+ this.id +"');");
				break;
			case "reSync":
				if(!this.doHighlight)
					break;
			case "fileSwitchOn":
				if(this.settings["EA_fileSwitchOnCallback"].length>0)
					eval("parent."+this.settings["EA_fileSwitchOnCallback"]+"(param);");
				break;
			case "fileSwitchOff":
				if(this.settings["EA_file_switchOffCallback"].length>0)
					eval("parent."+this.settings["EA_fileSwitchOffCallback"]+"(param);");
				break;
			case "fileClose":
				if(this.settings["EA_fileCloseCallback"].length>0)
					return eval("parent."+this.settings["EA_fileCloseCallback"]+"(param);");
				break;
			
			default:
				if(typeof(eval("editArea."+cmd))=="function")
				{
					if(this.settings["debug"])
						eval("editArea."+ cmd +"(param);");
					else
						try{eval("editArea."+ cmd +"(param);");}catch(e){};
				}
		}
	};
	
	EditArea.prototype.getTranslation= function(word, mode){
		if(mode=="template")
			return parent.editAreaLoader.translate(word, this.settings["language"], mode);
		else
			return parent.editAreaLoader.getWordTranslation(word, this.settings["language"]);
	};
	
	EditArea.prototype.addPlugin= function(plugName, plugObj){
		for(var i=0; i<this.settings["plugins"].length; i++){
			if(this.settings["plugins"][i]==plugName){
				this.plugins[plugName]=plugObj;
				plugObj.baseURL=parent.editAreaLoader.baseURL + "plugins/" + plugName + "/";
				if( typeof(plugObj.init)=="function" )
					plugObj.init();
			}
		}
	};
	
	EditArea.prototype.loadCss= function(url){
		try{
			link = document.createElement("link");
			link.type = "text/css";
			link.rel= "stylesheet";
			link.media="all";
			link.href = url;
			head = document.getElementsByTagName("head");
			head[0].appendChild(link);
		}catch(e){
			document.write("<link href='"+ url +"' rel='stylesheet' type='text/css' />");
		}
	};
	
	EditArea.prototype.loadScript= function(url){
		try{
			script = document.createElement("script");
			script.type = "text/javascript";
			script.src  = url;
			script.charset= "UTF-8";
			head = document.getElementsByTagName("head");
			head[0].appendChild(script);
		}catch(e){
			document.write("<script type='text/javascript' src='" + url + "' charset=\"UTF-8\"><"+"/script>");
		}
	};
	
	// add plugin translation to language translation array
	EditArea.prototype.addLang= function(language, values){
		if(!parent.editAreaLoader.lang[language])
			parent.editAreaLoader.lang[language]={};
		for(var i in values)
			parent.editAreaLoader.lang[language][i]= values[i];
	};
	
	// short cut for document.getElementById()
	function _$(id){return document.getElementById( id );};

	var editArea = new EditArea();	
	parent.editAreaLoader.addEvent(window, "load", init);
	
	function init(){		
		setTimeout("editArea.init();  ", 10);
	};
