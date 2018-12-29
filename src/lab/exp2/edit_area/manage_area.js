	EditArea.prototype.focus = function() {
		this.textarea.focus();
		this.textareaFocused=true;
	};


	EditArea.prototype.checkLineSelection= function(timerCheckup){
		var changes, infos, newTop, newWidth,i;
		
		var t1=t2=t2_1=t3=tLines=tend= new Date().getTime();
		// l'editeur n'existe plus => on quitte
		if(!editAreas[this.id])
			return false;
		
		if(!this.smoothSelection && !this.doHighlight)
		{
			//do nothing
		}
		else if(this.textareaFocused && editAreas[this.id]["displayed"]==true && this.isResizing==false)
		{
			infos	= this.getSelectionInfos();
			changes	= this.checkTextEvolution( typeof( this.lastSelection['fullText'] ) == 'undefined' ? '' : this.lastSelection['fullText'], infos['fullText'] );
		
			t2= new Date().getTime();
			
			// if selection change
			if(this.lastSelection["lineStart"] != infos["lineStart"] || this.lastSelection["lineNb"] != infos["lineNb"] || infos["fullText"] != this.lastSelection["fullText"] || this.reloadHighlight || this.lastSelection["selectionStart"] != infos["selectionStart"] || this.lastSelection["selectionEnd"] != infos["selectionEnd"] || !timerCheckup )
			{
				// move and adjust text selection elements
				newTop		= this.getLinePosTop( infos["lineStart"] );
				newWidth	= Math.max(this.textarea.scrollWidth, this.container.clientWidth -50);
				this.selectionField.style.top=this.selectionFieldText.style.top=newTop+"px";
				if(!this.settings['wordWrap']){	
					this.selectionField.style.width=this.selectionFieldText.style.width=this.testFontSize.style.width=newWidth+"px";
				}
				
				// usefull? => _$("cursorPos").style.top=newTop+"px";	
		
				if(this.doHighlight==true)
				{
					// fill selection elements
					var currText	= infos["fullText"].split("\n");
					var content		= "";
					//alert("length: "+currText.length+ " i: "+ Math.max(0,infos["lineStart"]-1)+ " end: "+Math.min(currText.length, infos["lineStart"]+infos["lineNb"]-1)+ " line: "+infos["lineStart"]+" [0]: "+currText[0]+" [1]: "+currText[1]);
					var start		= Math.max(0,infos["lineStart"]-1);
					var end			= Math.min(currText.length, infos["lineStart"]+infos["lineNb"]-1);
					
					//currText[start]= currText[start].substr(0,infos["currPos"]-1) +"¤Overline_¤"+ currText[start].substr(infos["currPos"]-1);
					for(i=start; i< end; i++){
						content+= currText[i]+"\n";	
					}
					
					// add special chars arround selected characters
					selLength	= infos['selectionEnd'] - infos['selectionStart'];
					content		= content.substr( 0, infos["currPos"] - 1 ) + "\r\r" + content.substr( infos["currPos"] - 1, selLength ) + "\r\r" + content.substr( infos["currPos"] - 1 + selLength );
					content		= '<span>'+ content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace("\r\r", '</span><strong>').replace("\r\r", '</strong><span>') +'</span>';
					
					if( this.isIE || ( this.isOpera && this.isOpera < 9.6 ) ) {
						this.selectionField.innerHTML= "<pre>" + content.replace(/^\r?\n/, "<br>") + "</pre>";
					} else {
						this.selectionField.innerHTML= content;
					}
					this.selectionFieldText.innerHTML = this.selectionField.innerHTML;
					t2_1 = new Date().getTime();
					// check if we need to update the highlighted background 
					if(this.reloadHighlight || (infos["fullText"] != this.lastTextToHighlight && (this.lastSelection["lineStart"]!=infos["lineStart"] || this.showƒineColors || this.settings['wordWrap'] || this.lastSelection["lineNb"]!=infos["lineNb"] || this.lastSelection["nbLine"]!=infos["nbLine"]) ) )
					{
						this.majHighlight(infos);
					}
				}		
			}
			t3= new Date().getTime();
			
			// manage line heights
			if( this.settings['wordWrap'] && infos["fullText"] != this.lastSelection["fullText"])
			{
				// refresh only 1 line if text change concern only one line and that the total line number has not changed
				if( changes.newText.split("\n").length == 1 && this.lastSelection['nbLine'] && infos['nbLine'] == this.lastSelection['nbLine'] )
				{
					this.fixLinesHeight( infos['fullText'], changes.lineStart, changes.lineStart );
				}
				else
				{
					this.fixLinesHeight( infos['fullText'], changes.lineStart, -1 );
				}
			}
		
			tLines= new Date().getTime();
			// manage bracket finding
			if( infos["lineStart"] != this.lastSelection["lineStart"] || infos["currPos"] != this.lastSelection["currPos"] || infos["fullText"].length!=this.lastSelection["fullText"].length || this.reloadHighlight || !timerCheckup )
			{
				// move CursorPos
				var selecChar= infos["currLine"].charAt(infos["currPos"]-1);
				var noRealMove=true;
				if(infos["lineNb"]==1 && (this.assocBracket[selecChar] || this.revertAssocBracket[selecChar]) ){
					
					noRealMove=false;					
					//findEndBracket(infos["lineStart"], infos["currPos"], selecChar);
					if(this.findEndBracket(infos, selecChar) === true){
						_$("endBracket").style.visibility	="visible";
						_$("cursorPos").style.visibility	="visible";
						_$("cursorPos").innerHTML			= selecChar;
						_$("endBracket").innerHTML			= (this.assocBracket[selecChar] || this.revertAssocBracket[selecChar]);
					}else{
						_$("endBracket").style.visibility	="hidden";
						_$("cursorPos").style.visibility	="hidden";
					}
				}else{
					_$("cursorPos").style.visibility	="hidden";
					_$("endBracket").style.visibility	="hidden";
				}
				//alert("move cursor");
				this.displayToCursorPosition("cursorPos", infos["lineStart"], infos["currPos"]-1, infos["currLine"], noRealMove);
				if(infos["lineNb"]==1 && infos["lineStart"]!=this.lastSelection["lineStart"])
					this.scrollToView();
			}
			this.lastSelection=infos;
		}
		
		tend= new Date().getTime();
		//if( (tend-t1) > 7 )
		//	console.log( "tps total: "+ (tend-t1) + " tps getInfos: "+ (t2-t1)+ " tps selec: "+ (t2_1-t2)+ " tps highlight: "+ (t3-t2_1) +" tps lines: "+ (tLines-t3) +" tps cursor+lines: "+ (tend-tLines)+" \n" );
		
		
		if(timerCheckup){
			setTimeout("editArea.checkLineSelection(true)", this.checkLineSelectionTimer);
		}
	};


	EditArea.prototype.getSelectionInfos= function(){
		var sel={}, start, end, len, str;
	
		this.getIESelection();
		start	= this.textarea.selectionStart;
		end		= this.textarea.selectionEnd;		
		
		if( this.lastSelection["selectionStart"] == start && this.lastSelection["selectionEnd"] == end && this.lastSelection["fullText"] == this.textarea.value )
		{	
			return this.lastSelection;
		}
			
		if(this.tabulation!="\t" && this.textarea.value.indexOf("\t")!=-1) 
		{	// can append only after copy/paste 
			len		= this.textarea.value.length;
			this.textarea.value	= this.replaceTab(this.textarea.value);
			start	= end	= start+(this.textarea.value.length-len);
			this.areaSelect( start, 0 );
		}
		
		sel["selectionStart"]	= start;
		sel["selectionEnd"]		= end;		
		sel["fullText"]		= this.textarea.value;
		sel["lineStart"]		= 1;
		sel["lineNb"]			= 1;
		sel["currPos"]			= 0;
		sel["currLine"]		= "";
		sel["indexOfCursor"]	= 0;
		sel["selecDirection"]	= this.lastSelection["selecDirection"];

		//return sel;	
		var splitTab= sel["fullText"].split("\n");
		var nbLine	= Math.max(0, splitTab.length);		
		var nbChar	= Math.max(0, sel["fullText"].length - (nbLine - 1));	// (remove \n caracters from the count)
		if( sel["fullText"].indexOf("\r") != -1 )
			nbChar	= nbChar - ( nbLine - 1 );		// (remove \r caracters from the count)
		sel["nbLine"]	= nbLine;		
		sel["nbChar"]	= nbChar;
	
		if(start>0){
			str					= sel["fullText"].substr(0,start);
			sel["currPos"]		= start - str.lastIndexOf("\n");
			sel["lineStart"]	= Math.max(1, str.split("\n").length);
		}else{
			sel["currPos"]=1;
		}
		if(end>start){
			sel["lineNb"]=sel["fullText"].substring(start,end).split("\n").length;
		}
		sel["indexOfCursor"]=start;		
		sel["currLine"]=splitTab[Math.max(0,sel["lineStart"]-1)];
	
		// determine in which direction the selection grow
		if(sel["selectionStart"] == this.lastSelection["selectionStart"]){
			if(sel["selectionEnd"]>this.lastSelection["selectionEnd"])
				sel["selecDirection"]= "down";
			else if(sel["selectionEnd"] == this.lastSelection["selectionStart"])
				sel["selecDirection"]= this.lastSelection["selecDirection"];
		}else if(sel["selectionStart"] == this.lastSelection["selectionEnd"] && sel["selectionEnd"]>this.lastSelection["selectionEnd"]){
			sel["selecDirection"]= "down";
		}else{
			sel["selecDirection"]= "up";
		}
		
		_$("nbLine").innerHTML	= nbLine;		
		_$("nbChar").innerHTML	= nbChar;		
		_$("linePos").innerHTML	= sel["lineStart"];
		_$("currPos").innerHTML	= sel["currPos"];

		return sel;		
	};
	
	// set IE position in Firefox mode (textarea.selectionStart and textarea.selectionEnd)
	EditArea.prototype.getIESelection= function(){
		var selectionStart, selectionEnd, range, storedRange;
		
		if( !this.isIE )
			return false;
			
		// make it work as nowrap mode (easier for range manipulation with lineHeight)
		if( this.settings['wordWrap'] )
			this.textarea.wrap='off';
			
		try{
			range			= document.selection.createRange();
			storedRange	= range.duplicate();
			storedRange.moveToElementText( this.textarea );
			storedRange.setEndPoint( 'EndToEnd', range );
			if( storedRange.parentElement() != this.textarea )
				throw "invalid focus";
				
			// the range don't take care of empty lines in the end of the selection
			var scrollTop	= this.result.scrollTop + document.body.scrollTop;
			var relativeTop= range.offsetTop - parent.calculeOffsetTop(this.textarea) + scrollTop;
			var lineStart	= Math.round((relativeTop / this.lineHeight) +1);
			var lineNb		= Math.round( range.boundingHeight / this.lineHeight );
						
			selectionStart	= storedRange.text.length - range.text.length;		
			selectionStart	+= ( lineStart - this.textarea.value.substr(0, selectionStart).split("\n").length)*2;		// count missing empty \r to the selection
			selectionStart	-= ( lineStart - this.textarea.value.substr(0, selectionStart).split("\n").length ) * 2;
			
			selectionEnd	= selectionStart + range.text.length;		
			selectionEnd	+= (lineStart + lineNb - 1 - this.textarea.value.substr(0, selectionEnd ).split("\n").length)*2;			
		
			this.textarea.selectionStart	= selectionStart;
			this.textarea.selectionEnd		= selectionEnd;
		}
		catch(e){}
		
		// restore wrap mode
		if( this.settings['wordWrap'] )
			this.textarea.wrap='soft';
	};
	
	// select the text for IE (and take care of \r caracters)
	EditArea.prototype.setIESelection= function(){
		var a = this.textarea, nbLineStart, nbLineEnd, range;
		
		if( !this.isIE )
			return false;
		
		nbLineStart	= a.value.substr(0, a.selectionStart).split("\n").length - 1;
		nbLineEnd 	= a.value.substr(0, a.selectionEnd).split("\n").length - 1;
		range		= document.selection.createRange();
		range.moveToElementText( a );
		range.setEndPoint( 'EndToStart', range );
		
		range.moveStart('character', a.selectionStart - nbLineStart);
		range.moveEnd('character', a.selectionEnd - nbLineEnd - (a.selectionStart - nbLineStart)  );
		range.select();
	};
	
	
	
	EditArea.prototype.checkTextEvolution=function(lastText,newText){
		// ch will contain changes datas
		var ch={},baseStep=200, cpt=0, end, step,tStart=new Date().getTime();
	
		end		= Math.min(newText.length, lastText.length);
        step	= baseStep;
        // find how many chars are similar at the begin of the text						
		while( cpt<end && step>=1 ){
            if(lastText.substr(cpt, step) == newText.substr(cpt, step)){
                cpt+= step;
            }else{
                step= Math.floor(step/2);
            }
		}
		
		ch.posStart	= cpt;
		ch.lineStart= newText.substr(0, ch.posStart).split("\n").length -1;						
		
		cptLast	= lastText.length;
        cpt			= newText.length;
        step		= baseStep;			
        // find how many chars are similar at the end of the text						
		while( cpt>=0 && cptLast>=0 && step>=1 ){
            if(lastText.substr(cptLast-step, step) == newText.substr(cpt-step, step)){
                cpt-= step;
                cptLast-= step;
            }else{
                step= Math.floor(step/2);
            }
		}
		
		ch.posNewEnd	= cpt;
		ch.posLastEnd	= cptLast;
		if(ch.posNewEnd<=ch.posStart){
			if(lastText.length < newText.length){
				ch.posNewEnd= ch.posStart + newText.length - lastText.length;
				ch.posLastEnd= ch.posStart;
			}else{
				ch.posLastEnd= ch.posStart + lastText.length - newText.length;
				ch.posNewEnd= ch.posStart;
			}
		} 
		ch.newText		= newText.substring(ch.posStart, ch.posNewEnd);
		ch.lastText		= lastText.substring(ch.posStart, ch.posLastEnd);			            
		
		ch.lineNewEnd	= newText.substr(0, ch.posNewEnd).split("\n").length -1;
		ch.lineLastEnd	= lastText.substr(0, ch.posLastEnd).split("\n").length -1;
		
		ch.newTextLine	= newText.split("\n").slice(ch.lineStart, ch.lineNewEnd+1).join("\n");
		ch.lastTextLine	= lastText.split("\n").slice(ch.lineStart, ch.lineLastEnd+1).join("\n");
		//console.log( ch );
		return ch;	
	};
	
	EditArea.prototype.tabSelection= function(){
		if(this.isTabbing)
			return;
		this.isTabbing=true;
		//infos=getSelectionInfos();
		//if( document.selection ){
		this.getIESelection();
		/* Insertion du code de formatage */
		var start = this.textarea.selectionStart;
		var end = this.textarea.selectionEnd;
		var insText = this.textarea.value.substring(start, end);
		
		/* Insert tabulation and ajust cursor position */
		var posStart=start;
		var posfnd=end;
		if (insText.length == 0) {
			// if only one line selected
			this.textarea.value = this.textarea.value.substr(0, start) + this.tabulation + this.textarea.value.substr(end);
			posStart = start + this.tabulation.length;
			posEnd=posStart;
		} else {
			start= Math.max(0, this.textarea.value.substr(0, start).lastIndexOf("\n")+1);
			endText=this.textarea.value.substr(end);
			startText=this.textarea.value.substr(0, start);
			tmp= this.textarea.value.substring(start, end).split("\n");
			insText= this.tabulation+tmp.join("\n"+this.tabulation);
			this.textarea.value = startText + insText + endText;
			posStart = start;
			posEnd= this.textarea.value.indexOf("\n", startText.length + insText.length);
			if(posEnd==-1)
				posEnd=this.textarea.value.length;
			//pos = start + repdeb.length + insText.length + ;
		}
		this.textarea.selectionStart = posStart;
		this.textarea.selectionEnd = posEnd;
		
		//if( document.selection ){
		if(this.isIE)
		{
			this.setIESelection();
			setTimeout("editArea.isTabbing=false;", 100);	// IE can't accept to make 2 tabulation without a little break between both
		}
		else
		{ 
			this.isTabbing=false;
		}	
		
  	};
	
	EditArea.prototype.invertTabSelection= function(){
		var t=this, a=this.textarea;
		if(t.isTabbing)
			return;
		t.isTabbing=true;
		//infos=getSelectionInfos();
		//if( document.selection ){
		t.getIESelection();
		
		var start	= a.selectionStart;
		var end		= a.selectionEnd;
		var insText	= a.value.substring(start, end);
		
		/* Tab remove and cursor seleciton adjust */
		var posStart=start;
		var posEnd=end;
		if (insText.length == 0) {
			if(a.value.substring(start-t.tabulation.length, start)==t.tabulation)
			{
				a.value		= a.value.substr(0, start-t.tabulation.length) + a.value.substr(end);
				posStart	= Math.max(0, start-t.tabulation.length);
				posEnd		= posStart;
			}	
			/*
			a.value = a.value.substr(0, start) + t.tabulation + insText + a.value.substr(end);
			posStart = start + t.tabulation.length;
			posEnd=posStart;*/
		} else {
			start		= a.value.substr(0, start).lastIndexOf("\n")+1;
			endText		= a.value.substr(end);
			startText	= a.value.substr(0, start);
			tmp			= a.value.substring(start, end).split("\n");
			insText		= "";
			for(i=0; i<tmp.length; i++){				
				for(j=0; j<t.tabNbChar; j++){
					if(tmp[i].charAt(0)=="\t"){
						tmp[i]=tmp[i].substr(1);
						j=t.tabNbChar;
					}else if(tmp[i].charAt(0)==" ")
						tmp[i]=tmp[i].substr(1);
				}		
				insText+=tmp[i];
				if(i<tmp.length-1)
					insText+="\n";
			}
			//insText+="_";
			a.value		= startText + insText + endText;
			posStart	= start;
			posEnd		= a.value.indexOf("\n", startText.length + insText.length);
			if(posEnd==-1)
				posEnd=a.value.length;
			//pos = start + repdeb.length + insText.length + ;
		}
		a.selectionStart = posStart;
		a.selectionEnd = posEnd;
		
		//if( document.selection ){
		if(t.isIE){
			// select the text for IE
			t.setIESelection();
			setTimeout("editArea.isTabbing=false;", 100);	// IE can accept to make 2 tabulation without a little break between both
		}else
			t.isTabbing=false;
  	};
	
	EditArea.prototype.pressEnter= function(){		
		if(!this.smoothSelection)
			return false;
		this.getIESelection();
		var scrollTop= this.result.scrollTop;
		var scrollLeft= this.result.scrollLeft;
		var start=this.textarea.selectionStart;
		var end= this.textarea.selectionEnd;
		var startLastLine= Math.max(0 , this.textarea.value.substring(0, start).lastIndexOf("\n") + 1 );
		var beginLine= this.textarea.value.substring(startLastLine, start).replace(/^([ \t]*).*/gm, "$1");
		var lineStart = this.textarea.value.substring(0, start).split("\n").length;
		if(beginLine=="\n" || beginLine=="\r" || beginLine.length==0)
		{
			return false;
		}
			
		if(this.isIE || ( this.isOpera && this.isOpera < 9.6 ) ){
			beginLine="\r\n"+ beginLine;
		}else{
			beginLine="\n"+ beginLine;
		}	
		//alert(startLastLine+" strat: "+start +"\n"+this.textarea.value.substring(startLastLine, start)+"\n_"+beginLine+"_")
		this.textarea.value= this.textarea.value.substring(0, start) + beginLine + this.textarea.value.substring(end);
		
		this.areaSelect(start+ beginLine.length ,0);
		// during this process IE scroll back to the top of the textarea
		if(this.isIE){
			this.result.scrollTop	= scrollTop;
			this.result.scrollLeft	= scrollLeft;
		}
		return true;
		
	};
	
	EditArea.prototype.findEndBracket= function(infos, bracket){
			
		var start=infos["indexOfCursor"];
		var normalOrder=true;
		//currText=infos["fullText"].split("\n");
		if(this.assocBracket[bracket])
			endBracket=this.assocBracket[bracket];
		else if(this.revertAssocBracket[bracket]){
			endBracket=this.revertAssocBracket[bracket];
			normalOrder=false;
		}	
		var end=-1;
		var nbBracketOpen=0;
		
		for(var i=start; i<infos["fullText"].length && i>=0; ){
			if(infos["fullText"].charAt(i)==endBracket){				
				nbBracketOpen--;
				if(nbBracketOpen<=0){
					//i=infos["fullText"].length;
					end=i;
					break;
				}
			}else if(infos["fullText"].charAt(i)==bracket)
				nbBracketOpen++;
			if(normalOrder)
				i++;
			else
				i--;
		}
		
		//end=infos["fullText"].indexOf("}", start);
		if(end==-1)
			return false;	
		var endLastLine=infos["fullText"].substr(0, end).lastIndexOf("\n");			
		if(endLastLine==-1)
			line=1;
		else
			line= infos["fullText"].substr(0, endLastLine).split("\n").length + 1;
					
		var curPos= end - endLastLine - 1;
		var endLineLength	= infos["fullText"].substring(end).split("\n")[0].length;
		this.displayToCursorPosition("endBracket", line, curPos, infos["fullText"].substring(endLastLine +1, end + endLineLength));
		return true;
	};
	
	EditArea.prototype.displayToCursorPosition= function(id, startLine, curPos, lineContent, noRealMove){
		var elem,dest,content,posLeft=0,posTop,fixPadding,topOffset,endElem;	

		elem		= this.testFontSize;
		dest		= _$(id);
		content		= "<span id='testFontSizeInner'>"+lineContent.substr(0, curPos).replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</span><span id='endTestFont'>"+lineContent.substr(curPos).replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</span>";
		if( this.isIE || ( this.isOpera && this.isOpera < 9.6 ) ) {
			elem.innerHTML= "<pre>" + content.replace(/^\r?\n/, "<br>") + "</pre>";
		} else {
			elem.innerHTML= content;
		}
		

		endElem		= _$('endTestFont');
		topOffset	= endElem.offsetTop;
		fixPadding	= parseInt( this.contentHighlight.style.paddingLeft.replace("px", "") );
		posLeft 	= 45 + endElem.offsetLeft + ( !isNaN( fixPadding ) && topOffset > 0 ? fixPadding : 0 );
		posTop		= this.getLinePosTop( startLine ) + topOffset;// + Math.floor( ( endElem.offsetHeight - 1 ) / this.lineHeight ) * this.lineHeight;
	
		// detect the case where the span start on a line but has no display on it
		if( this.isIE && curPos > 0 && endElem.offsetLeft == 0 )
		{
			posTop	+=	this.lineHeight;
		}
		if(noRealMove!=true){	// when the cursor is hidden no need to move him
			dest.style.top=posTop+"px";
			dest.style.left=posLeft+"px";	
		}
		// usefull for smarter scroll
		dest.cursorTop=posTop;
		dest.cursorLeft=posLeft;	
	//	_$(id).style.marginLeft=posLeft+"px";
	};
	
	EditArea.prototype.getLinePosTop= function(startLine){
		var elem= _$('line_'+ startLine), posTop=0;
		if( elem )
			posTop	= elem.offsetTop;
		else
			posTop	= this.lineHeight * (startLine-1);
		return posTop;
	};
	
	
	// return the dislpayed height of a text (take word-wrap into account)
	EditArea.prototype.getTextHeight= function(text){
		var t=this,elem,height;
		elem		= t.testFontSize;
		content		= text.replace(/&/g,"&amp;").replace(/</g,"&lt;");
		if( t.isIE || ( this.isOpera && this.isOpera < 9.6 ) ) {
			elem.innerHTML= "<pre>" + content.replace(/^\r?\n/, "<br>") + "</pre>";
		} else {
			elem.innerHTML= content;
		}
		height	= elem.offsetHeight;
		height	= Math.max( 1, Math.floor( elem.offsetHeight / this.lineHeight ) ) * this.lineHeight;
		return height;
	};

	/**
	 * Fix line height for the given lines
	 * @param Integer linestart
	 * @param Integer lineEnd End line or -1 to cover all lines
	 */
	EditArea.prototype.fixLinesHeight= function( textValue, lineStart,lineEnd ){
		var aText = textValue.split("\n");
		if( lineEnd == -1 )
			lineEnd	= aText.length-1;
		for( var i = Math.max(0, lineStart); i <= lineEnd; i++ )
		{
			if( elem = _$('line_'+ ( i+1 ) ) )
			{
				elem.style.height= typeof( aText[i] ) != "undefined" ? this.getTextHeight( aText[i] )+"px" : this.lineHeight;
			}
		}
	};
	
	EditArea.prototype.areaSelect= function(start, length){
		this.textarea.focus();
		
		start	= Math.max(0, Math.min(this.textarea.value.length, start));
		end		= Math.max(start, Math.min(this.textarea.value.length, start+length));

		if(this.isIE)
		{
			this.textarea.selectionStart	= start;
			this.textarea.selectionEnd		= end;		
			this.setIESelection();
		}
		else
		{
			// Opera bug when moving selection start and selection end
			if(this.isOpera && this.isOpera < 9.6 )
			{	
				this.textarea.setSelectionRange(0, 0);
			}
			this.textarea.setSelectionRange(start, end);
		}
		this.checkLineSelection();
	};
	
	
	EditArea.prototype.areaGetSelection= function(){
		var text="";
		if( document.selection ){
			var range = document.selection.createRange();
			text=range.text;
		}else{
			text= this.textarea.value.substring(this.textarea.selectionStart, this.textarea.selectionEnd);
		}
		return text;			
	};
