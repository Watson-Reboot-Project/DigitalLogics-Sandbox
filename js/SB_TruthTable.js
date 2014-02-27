function SB_TruthTable(containerNum) {
	var expectedTruthTable;
	var numIn;
	var numOut;
	var header;
	//var title;
	var tableName = "truthTable" + containerNum;
	var divName = "truthTableDiv" + containerNum;
	var innerDiv;
	var tableDiv = document.getElementById(divName);
	var img;
	
	this.setExpectedTruthTable = setExpectedTruthTable;
	this.checkTruthTable = checkTruthTable;
	this.createTable = createTable;
	this.setTable = setTable;
	this.getTableWidth = getTableWidth;
	//this.setLeftOffset = setLeftOffset;
	this.toggleVisible = toggleVisible;
	this.setDeleteIcon = setDeleteIcon;
	this.setTableOffset = setTableOffset;
	this.resetTruthTable = resetTruthTable;
	
	function resetTruthTable(_numIn, _numOut, _header) {
		var table = document.getElementById(tableName);
		if (table) {
			table.id = "";
			tableDiv.removeChild(document.getElementById("tableDeleteIcon" + containerNum));
			//tableDiv.removeChild(table);
			tableDiv.removeChild(innerDiv);
			createTable(_numIn, _numOut, _header);
		}
	}
	
	function checkTruthTable(resultTruthTable) {
		if (expectedTruthTable.length == 0) return; // no truth table set; scratch pad mode
		var correct = true;
		for (var i = 0; i < resultTruthTable.length; i++) {
			for (var j = 0; j < resultTruthTable[i].length; j++) {
				if (resultTruthTable[i][j] != expectedTruthTable[i][j]) { correct = false; break; }
			}
			if (correct === false) break;
		}
		
		if (correct) {
			alert("You circuit functions properly.");
		}
	}

	function setExpectedTruthTable(truthTable) {
		expectedTruthTable = truthTable;
	}

	function createTable(_numIn, _numOut, _header/*,_title*/) {
		// set global variables so setTable() can use them
		numIn = _numIn;
		numOut = _numOut;
		header = _header;
		//title = _title;
		
		var rows = Math.pow(2, numIn);											// set number of rows
		var cols = numIn+numOut;												// set number of columns
		var body = tableDiv;
		//var body = document.getElementById('tableDiv');
		var tbl = document.createElement('table');								// create a table element
		tbl.id = tableName;														// set its ID
		tbl.style.position='absolute';	
		tbl.style.display = 'block'; // block is viisble, none is invisible
		
		img = document.createElement('img');
		img.id = "tableDeleteIcon" + containerNum;
		img.src = "delete.ico";
		img.style.height = '20px';
		img.style.width = '20px';
		img.style.visibility = 'hidden';
		body.appendChild(img);
		
		innerDiv = document.createElement("div");
		innerDiv.id = "innerDiv" + containerNum;
		innerDiv.style.overflowY = "auto";
		innerDiv.style.position = "relative";
		
		if (_numIn == 1) innerDiv.style.height = "70px";
		else if (_numIn == 2) innerDiv.style.height = "120px";
		else if (_numIn == 3) innerDiv.style.height = "200px";
		else innerDiv.style.height = "250px";
		
		body.appendChild(innerDiv);
		
		var tbdy = document.createElement('tbody');
		
		//set up table rows
		for (var i = 0; i < rows; i++) {
		var tr = document.createElement('tr');
			for (var j = 0; j < cols; j++) {
				var td = document.createElement('td');
				td.style.backgroundColor='rgba(255, 255, 255, 0.5)';
				td.style.border='2px';
				if(j===(cols-numOut)){
					td.style.borderLeft='2px solid black';
				}
				td.appendChild(document.createTextNode('-1'));
				tr.appendChild(td);
			}
			tbdy.appendChild(tr);
		}
		tbl.appendChild(tbdy);
		innerDiv.appendChild(tbl);
		
		var thead = document.createElement('thead');							// create element for header
		tbl.appendChild(thead);													// append head to table

		for(var k=0;k<header.length;k++){										// append elements to header
			var th = document.createElement('th');
			th.style.border='2px';
			th.style.backgroundColor='rgba(255, 255, 255, 0.5)';
			th.style.borderBottom='2px solid black';
			if(k===(cols-numOut)){
				th.style.borderLeft='2px solid black';
			}
			th.appendChild(document.createTextNode(header[k]));
			thead.appendChild(th);
		}
		tbl.style.borderSpacing = '0px';
		initTableValues(rows, cols);

		img.style.marginLeft = tbl.offsetWidth + "px";
		img.style.marginTop = "-10px";
	}

	/*
	*	initTableValues()
	*
	*	Counts from 0 to numRows - 1 in binary, adding input values for table. All output values
	*	are zeros.
	*/
	function initTableValues(numRows, numCols) {
		var initTable = [];													// set up an array for the table
		for (var i = 0; i < numRows; i++) {									// iterate numRow times
			var num = i.toString(2);										// get the binary string representation of the current number
			var str = "";							
			var j;
			if (num.length != numIn) {										// we need zeros to fill in before the binary number begins; e.g. 101 would need to be 00101
				for (var j = 0; j < numIn - num.length; j++) str += "0";
			}
			str += num;
			var row = [];
			for (j = 0; j < numCols - numOut; j++) {
				row.push(str[j]);											// append each character to a cell
			}
			for (j = 0; j < numOut; j++) row.push("0");					// push a 0 for the output column
			initTable.push(row);											// push the row into the table
		}
		setTable(initTable);												// set the table with these values
	}

	/*
	*	setTable()
	*
	*	Sets the truth table to the 2-D array passed to it.
	*/
	function setTable(values){
		var rows = Math.pow(2, numIn);									// compute number of rows
		var cols = numIn+numOut;										// computer number of columns
		var myTable = document.getElementById(tableName);				// grab the table by ID
		for (var i = 0; i < rows; i++) {								// for all rows
			for (var j = 0; j < cols; j++) {							// for all columns
				//set table values
				myTable.rows[i].cells[j].innerHTML = values[i][j];		// make the cell value equal to 2-D array value
				//set alignment
				myTable.rows[i].cells[j].align='center';				// center the text
			}
		}
		
		innerDiv.style.width = (document.getElementById(tableName).offsetWidth + 15) + "px";
	}
	
	function getTableWidth() { return tableDiv.offsetWidth; }
	
	function setTableOffset(x, y) {
		if (tableDiv !== null) {
			tableDiv.style.left = x + "px";
			tableDiv.style.top = -y + "px";
			//tableDiv.style.width=document.getElementById(tableName).offsetWidth + "px";
			tableDiv.style.width = (document.getElementById(tableName).offsetWidth + 40) + "px";
		}
	}
	
	function setDeleteIcon(bool) {
		if (bool && tableDiv.style.visibility == 'visible') {
			img.style.visibility = 'visible';
		}
		else {
			img.style.visibility = 'hidden';
		}
	}

	function toggleVisible(){
		if(tableDiv.style.visibility == 'hidden'){
			tableDiv.style.visibility = 'visible';
			innerDiv.style.overflowY = "auto";
		}else{
			tableDiv.style.visibility = 'hidden';
			innerDiv.style.overflowY = "hidden";
		}
	}
}