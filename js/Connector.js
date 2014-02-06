/**************************************************************************************
*	Author:		Neil Vosburg
*	Class:		Connector.js
*
*	Behavior:	This class implements the connector. The connector has one input and
*				three outputs. The input is simply sent to each of its three outputs.
*				The naming conventions are very similar to the other gates. The plugin
*				is associated with the input line. "plugout#" is associated with the
*				three output lines.
***************************************************************************************/

function Connector(initX, initY, setName, id, setup) {
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	var plugin = null;				// the line associated with the input
	var pluginVal = -1;
	var pluginComp = null;			// the component connected to this connector's input
	var connectorPlugin;

	var plugout1 = null;			// the line associated with the first (top) plugin
	var plugout1Wire = null;		// the wire (line) that connects the connector at the component connected to the first plugin
	var plugout1Comp = null;		// the component connected to the connector's first plugin

	var plugout2 = null;			// the line associated with the second (right) plugin
	var plugout2Wire = null;		// the wire (line) that connects the connector at the component connected to the second plugin
	var plugout2Comp = null;		// the component connected to the connector's second plugin
	
	var plugout3 = null;			// the line associated with the third (bottom) plugin
	var plugout3Wire = null;		// the wire (line) that connects the connector at the component connected to the third plugin
	var plugout3Comp = null;		// the component connected to the connector's third plugin
	
	var selectedPlugout;			// the plugout line selected by the controller when making a connection

	var name = setName;				// the name of the connector
	var ID = id;					// the ID of the connector
	var compShape;					// the shape of the connector (square)
	var group;						// the group that will be composed of the connector's components
	var transFg;					// the transparent foreground that makes it easy for users to click the connector
	var inputBox;
	var output1Box;
	var output2Box;
	var output3Box;
	
	var scale = setup.getGScale();
	var mainLayer = setup.getMainLayer();
	var stage = setup.getStage();
	var thisObj = this;
	var mouseOver = 'pointer';

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	this.draw = draw;
	this.drawBoxes = drawBoxes;
	this.getInputBox = getInputBox;
	this.getOutputBox = getOutputBox;
	this.getType = getType;
	this.getID = getID;
	this.getFunc = getFunc;
	this.getName = getName;
	this.getGroup = getGroup;
	this.getPlugin = getPlugin;
	this.getPluginComp = getPluginComp;
	this.getPlugout = getPlugout;
	this.getPlugoutToComp = getPlugoutToComp;
	this.getPlugoutComp = getPlugoutComp;
	this.setPlugoutComp = setPlugoutComp;
	this.setPlugoutCompNull = setPlugoutCompNull;
	this.getPlugoutWire = getPlugoutWire;
	this.setPlugoutWire = setPlugoutWire;
	this.getSelectedPlugout = getSelectedPlugout;
	this.setSelectedPlugout = setSelectedPlugout;
	this.setPluginComp = setPluginComp;
	this.setPluginCompNull = setPluginCompNull;
	this.setPluginVal = setPluginVal;
	this.evaluate = evaluate;
	this.probe = probe;
	this.setPlugColor = setPlugColor;
	this.deleteOutputConnection = deleteOutputConnection;
	this.setPlugoutWireColor = setPlugoutWireColor;
	this.setMouseOver = setMouseOver;
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE ASSIGNMENTS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	// make the rectangle
    compShape = new Kinetic.Rect({
        x: scale * 20,
        y: scale * 20,
        width: scale * 6,
        height: scale * 6,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 1
      });
	   
	// create the plugin line
	plugin = new Kinetic.Line({
		points : [scale * 4, scale * 23, scale * 19, scale * 23],
		stroke : 'black',
		strokeWidth : 1,
		lineCap : 'round',
		lineJoin : 'round'
	});

	// create the first plugout line
	plugout1 = new Kinetic.Line({
		points : [scale * 23, scale * 20, scale * 23, scale * 5],
		stroke : 'black',
		strokeWidth : 1,
		lineCap : 'round',
		lineJoin : 'round'
	});

	// create the second plugout line
	plugout2 = new Kinetic.Line({
		points : [scale * 27, scale * 23, scale * 42, scale * 23],
		stroke : 'black',
		strokeWidth : 1,
		lineCap : 'round',
		lineJoin : 'round'
	});
	
	// create the third plugout line
	plugout3 = new Kinetic.Line({
		points : [scale * 23, scale * 27, scale * 23, scale * 42],
		stroke : 'black',
		strokeWidth : 1,
		lineCap : 'round',
		lineJoin : 'round'
	});

	// create the transparent rectangle
	transFg = new Kinetic.Rect({
		x: scale * 3,
		y: scale * 3,
		width: scale * 41,
		height: scale * 41
	});
	
	// create the group object
	group = new Kinetic.Group({
			x : initX,
			y : initY,
			rotationDeg : 0,
			draggable : true
		});
	
	// add cursor styling when the user mouseovers the group
	group.on('mouseover', function () {
		document.body.style.cursor = mouseOver;
	});
	group.on('mouseout', function () {
		if (mouseOver !== "crosshair") document.body.style.cursor = 'default';
	});

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION IMPLEMENTATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	// draw the connector
	function draw() {
		// add each of the components to the group
		group.add(compShape);	// the shape
		group.add(plugin);		// ... the plugin line
		group.add(plugout1);	// ... the first plugin line
		group.add(plugout2);	// ... the second plugin line
		group.add(plugout3);	// ... the third plugin line
		group.add(transFg);		// and finally the transparent foreground
		mainLayer.add(group);	// add the group to the main layer
		stage.draw();			// call draw on the stage to redraw its components
		drawBoxes();
	}
	
	function drawBoxes() {
		var plug;
		if (inputBox) {
			plug = getPlugin();
			inputBox.setPosition(plug.getPoints()[0].x - 16, plug.getPoints()[0].y - 10);
			plug = getPlugout(1);
			output1Box.setPosition(plug.getPoints()[0].x - 10, plug.getPoints()[0].y - 27);
			plug = getPlugout(2);
			output2Box.setPosition(plug.getPoints()[0].x + 8, plug.getPoints()[0].y - 10);
			plug = getPlugout(3);
			output3Box.setPosition(plug.getPoints()[0].x - 10, plug.getPoints()[0].y + 6);
		}
		else {
			plug = getPlugin();
			inputBox = new Kinetic.Rect({
				x: plug.getPoints()[0].x - 16,
				y: plug.getPoints()[0].y - 10,
				width: (plug.getPoints()[1].x - plug.getPoints()[0].x) + 8,
				height: 18
				//fill : 'black'
			});
			
			plug = getPlugout(1);
			output1Box = new Kinetic.Rect({
				x: plug.getPoints()[0].x - 10,
				y: plug.getPoints()[0].y - 27,
				width: (plug.getPoints()[1].x - plug.getPoints()[0].x) + 20,
				height: 20
				//fill : 'black'
			});
			
			plug = getPlugout(2);
			output2Box = new Kinetic.Rect({
				x: plug.getPoints()[0].x + 8,
				y: plug.getPoints()[0].y - 10,
				width: (plug.getPoints()[1].x - plug.getPoints()[0].x) + 8,
				height: 18
				//fill : 'black'
			});
			
			plug = getPlugout(3);
			output3Box = new Kinetic.Rect({
				x: plug.getPoints()[0].x - 10,
				y: plug.getPoints()[0].y + 6,
				width: (plug.getPoints()[1].x - plug.getPoints()[0].x) + 20,
				height: 20
				//fill : 'black'
			});
			
			mainLayer.add(inputBox);
			mainLayer.add(output1Box);
			mainLayer.add(output2Box);
			mainLayer.add(output3Box);
			stage.draw();
		}
	}
	
	function getInputBox() {
		return inputBox;
	}
	
	function getOutputBox(outputNum) {
		if (outputNum == 1) return output1Box;
		else if (outputNum == 2) return output2Box;
		else if (outputNum == 3) return output3Box;
	}
	
	function setMouseOver(str) { mouseOver = str; }
	
	// accessor for this gate's type
	function getType() { return "connector"; }
	
	// accessor for this gate's function
	function getFunc() { return "connection"; }
	
	function getID() { return ID; }
	
	// accessor for this gate's name
	function getName() { return name; }
	
	// accessor for this gate's group
	function getGroup() { return group; }

	// returns the line for the plugin in GLOBAL coordinates; used in the controller for drawing wires (the controller functions in global coordinates; which makes sense)
	function getPlugin() {
		var line;
		line = new Kinetic.Line({
			points: [group.getX() + plugin.getPoints()[0].x, group.getY() + plugin.getPoints()[0].y, group.getX() + plugin.getPoints()[1].x, group.getY() + plugin.getPoints()[1].y]
		});
		return line;
	}

	// accessor for the component that the connector's input is connected to (the component before the connector)
	function getPluginComp() { return pluginComp; }
	
	// return a line for the plugout line specified by the parameter (same concept as plugin line; convert coordinates to global coordinates)
	function getPlugout(num)
	{
		var line;
		if (num == 1) {
			line = new Kinetic.Line({
				points: [group.getX() + plugout1.getPoints()[0].x, group.getY() + plugout1.getPoints()[0].y, group.getX() + plugout1.getPoints()[1].x, group.getY() + plugout1.getPoints()[1].y]
			});
		}
		else if (num == 2) {
			line = new Kinetic.Line({
				points: [group.getX() + plugout2.getPoints()[0].x, group.getY() + plugout2.getPoints()[0].y, group.getX() + plugout2.getPoints()[1].x, group.getY() + plugout2.getPoints()[1].y]
			});
		}
		else {
			line = new Kinetic.Line({
				points: [group.getX() + plugout3.getPoints()[0].x, group.getY() + plugout3.getPoints()[0].y, group.getX() + plugout3.getPoints()[1].x, group.getY() + plugout3.getPoints()[1].y]
			});
		}
		return line;
	}
	
	// return the component that is connected to the specified plugout number; we use an array here as two outputs can be connected to the same gate
	function getPlugoutToComp(comp)
	{
		var res = [];
		
		if (comp == plugout1Comp) res.push(1);
		if (comp == plugout2Comp) res.push(2);
		if (comp == plugout3Comp) res.push(3);
		
		return res;
	}
	
	// return the wire (line) that is connected to the specified plugout number that runs to the connected component for that plug
	function getPlugoutWire(num)
	{
		if (num == 1) return plugout1Wire;
		else if(num == 2) return plugout2Wire;
		else return plugout3Wire;
	}
	
	// set the wire (line) that is associated with the specified plugout number
	function setPlugoutWire(num, line)
	{
		if (num == 1) plugout1Wire = line;
		else if (num == 2) plugout2Wire = line;
		else plugout3Wire = line;
	}
	
	// get the component that is connected to the specified plugout
	function getPlugoutComp(num)
	{
		if (num == 1) return plugout1Comp;
		else if (num == 2) return plugout2Comp;
		else return plugout3Comp;
	}
	
	// set the component connected to the specified plugout
	function setPlugoutComp(num, comp)
	{
		if (num == 1) plugout1Comp = comp;
		else if (num == 2) plugout2Comp = comp;
		else plugout3Comp = comp;
		
		evaluate();
	}
	
	function setPlugoutCompNull(comp) {
		if (plugout1Comp == comp) plugout1Comp = null;
		else if (plugout2Comp == comp) plugout2Comp = null;
		else if (plugout3Comp == comp) plguout3Comp = null;
		
		evaluate();
	}
	
	// get the plugout that is currently selected
	function getSelectedPlugout() {
		return selectedPlugout;
	}
	
	// set the plugout that is currently selected
	function setSelectedPlugout(num) {
		selectedPlugout = num;
	}
	
	// set the component that is connected to the plugin to null
	function setPluginCompNull()
	{
		pluginComp = null;
		pluginVal = -1;
		evaluate();
	}
	
	// set the component that is connected to the plugin
	function setPluginComp(comp)
	{
		pluginComp = comp;
		comp.evaluate();
	}
	
	// give the connector an input (only one is needed)
	// add a value to this AND gate's input values (used in computing the output of the circuit); these two values will be OR'ed together
	function setPluginVal(comp, val) {
		pluginVal = val;
		evaluate();
	}
	
	// evaluate this gate; AND the two values in pluginVals, and send the output to the next component
	function evaluate() {
		var thisComp = thisObj;
		
		if (plugout1Comp !== null) plugout1Comp.setPluginVal(thisComp, pluginVal);
		if (plugout2Comp !== null) plugout2Comp.setPluginVal(thisComp, pluginVal);
		if (plugout3Comp !== null) plugout3Comp.setPluginVal(thisComp, pluginVal);
	}
	
	function probe() {
		var str = "";
		if (pluginComp !== null) {
			str += pluginComp.probe();
			return str;
		}
		else return null;
	}
	
	function setPlugoutWireColor(plugoutNum, color) { 
		if (plugoutNum == 1) plugout1Wire.setStroke(color);
		else if (plugoutNum == 2) plugout2Wire.setStroke(color);
		else if (plugoutNum == 3) plugout3Wire.setStroke(color);
	}
	
	function setPlugColor(plugStr, color) {
		if (plugStr == "plugin") plugin.setStroke(color);
		else if (plugStr == "plugout1") plugout1.setStroke(color);
		else if (plugStr == "plugout2") plugout2.setStroke(color);
		else if (plugStr == "plugout3") plugout3.setStroke(color);
	}
	
	function setPlugColor1(plugStr, color) { 
		plugin.setStroke("black");
		plugout1.setStroke("black");
		plugout2.setStroke("black");
		plugout3.setStroke("black");
		if (pluginComp !== null) pluginComp.setPlugoutWireColor("black", connectorPlugin);
		if (plugout1Comp !== null) plugout1Wire.setStroke("black");
		if (plugout2Comp !== null) plugout2Wire.setStroke("black");
		if (plugout3Comp !== null) plugout3Wire.setStroke("black");
		
		if (plugStr == "all") return;
		else if (plugStr == "plugin") {
			if (pluginComp !== null && color == "green") return false;
			else if (pluginComp !== null && color == "yellow") {
				pluginComp.setPlugoutWireColor("yellow", connectorPlugin);
				return pluginComp.getPlugoutWire(connectorPlugin);
			}
			else plugin.setStroke(color);
		}
		else if (plugStr == "plugout1") {
			if (plugout1Comp !== null && color == "green") return false;
			else if (plugout1Comp !== null && color == "yellow") {
				plugout1Wire.setStroke("yellow");
				return plugout1;
			}
			else plugout1.setStroke(color);
		}
		else if (plugStr == "plugout2") {
			if (plugout2Comp !== null && color == "green") return false;
			else if (plugout2Comp !== null && color == "yellow") {
				plugout2Wire.setStroke("yellow");
				return plugout2;
			}
			else plugout2.setStroke(color);
		}
		else if (plugStr == "plugout3") {
			if (plugout3Comp !== null && color == "green") return false;
			else if (plugout3Comp !== null && color == "yellow") {
				plugout3Wire.setStroke("yellow");
				return plugout3;
			}
			else plugout3.setStroke(color);
		}
	}
	
	function deleteOutputConnection(plugoutNum) {
		var plugoutComp;
		var plugoutWire;
		if (plugoutNum == 1) { plugoutComp = plugout1Comp; plugout1Comp = null; plugout1Wire.disableStroke(); plugout1Wire = null }
		else if (plugoutNum == 2) { plugoutComp = plugout2Comp; plugout2Comp = null; plugout2Wire.disableStroke(); plugout2Wire = null }
		else if (plugoutNum == 3) { plugoutComp = plugout3Comp; plugout3Comp = null; plugout3Wire.disableStroke(); plugout3Wire = null }
		
		if (plugoutComp.getType() == "not" || plugoutComp.getType() == "output" || plugoutComp.getType == "connector") {
			if (plugoutComp.getType() != "output") plugoutComp.setConnectorPlugin(-1);
			plugoutComp.setPluginCompNull();
		}
		else {
			var pluginNum;
			if (plugoutComp.getConnectorPlugin(1) == plugoutNum) pluginNum = 1
			else pluginNum = 2;
			console.log("Plugin Num: " + pluginNum);
			plugoutComp.setConnectorPlugin(pluginNum, -1);
			plugoutComp.setPluginComp(pluginNum, null);
		}
	}
}