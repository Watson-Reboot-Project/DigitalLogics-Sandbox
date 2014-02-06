/**************************************************************************************
*	Author:		Neil Vosburg
*	Class:		NotGate.js
*
*	Behavior:	This class represents the functionality of a NOT gate. The class contains
*				variables for a "plugin", "plugout", "plugoutWire", and "plugoutComp".
*				The Plugin for the NOT gate is the one input line. The OR gate has one plugout
*				which is the one line associated with its output. The plugout wire is
*				associated with the line that runs to the component it is connected to
*				from its plugout. The "plugoutComp" stands for plugout component, which is
*				the component the OR gate outputs to.
***************************************************************************************/

function NotGate(initX, initY, setName, id, setup) {

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	var plugin = null;				// the line associated with the NOT gate's input
	var pluginVal = -1;
	var pluginComp = null;			// the component that is connected to the NOT gate's input (the component before the NOT gate)
	var connectorPlugin;

	var plugout = null;				// the line associated with the NOT gate's output
	var plugoutComp = null;			// the component that the NOT gate's output is connected to
	var plugoutWire = null;			// the wire (line) that is drawn for the NOT gate's output to the input of another component

	var name = setName;				// the name for this gate
	var ID = id;					// the ID of this gate
	
	var group;						// the group that all of the NOT gate's components will be added to
	var gateShapeTriangle;			// the triangle that is used to draw the NOT gate
	var gateShapeCircle;			// the circle that is used to draw the NOT gate
	var inputBox;
	var outputBox;
	var transFg;					// a transparent foreground that makes the NOT gate easier to click
	
	var scale = setup.getGScale();
	var mainLayer = setup.getMainLayer();
	var stage = setup.getStage();
	var thisObj = this;
	var mouseOver = 'pointer';
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	this.getType = getType;
	this.getID = getID;
	this.getFunc = getFunc;
	this.getName = getName;
	this.getGroup = getGroup;
	this.getPlugin = getPlugin;
	this.getPluginComp = getPluginComp;
	this.setPluginComp = setPluginComp;
	this.getPlugout = getPlugout;
	this.getPlugoutComp = getPlugoutComp;
	this.setPlugoutComp = setPlugoutComp;
	this.getPlugoutWire = getPlugoutWire;
	this.setPlugoutWire = setPlugoutWire;
	this.setPluginCompNull = setPluginCompNull;
	this.setPluginVal = setPluginVal;
	this.evaluate = evaluate;
	this.probe = probe;
	this.setPlugColor = setPlugColor;
	this.getConnectorPlugin = getConnectorPlugin;
	this.setConnectorPlugin = setConnectorPlugin;
	this.drawBoxes = drawBoxes;
	this.getInputBox = getInputBox;
	this.getOutputBox = getOutputBox;
	this.deleteInputConnection = deleteInputConnection;
	this.deleteOutputConnection = deleteOutputConnection;
	this.setPlugoutWireColor = setPlugoutWireColor;
	this.setMouseOver = setMouseOver;
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE ASSIGNMENTS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	// make a custom shape for the triangle; just three lines
	gateShapeTriangle = new Kinetic.Shape({
			drawFunc : function (context) {
				// begin custom shape
				context.beginPath();
				context.moveTo(scale * 50, scale * 0);
				context.lineTo(scale * 50, scale * 40);
				context.lineTo(scale * 85, scale * 20);
				context.lineTo(scale * 50, scale * 0);
				// complete custom shape
				context.closePath();
				// KineticJS specific context method
				context.fillStrokeShape(this);
			},
			stroke : 'black',
			strokeWidth : 1
		});
		
	 // create the circle
	 gateShapeCircle = new Kinetic.Circle({
        x: scale * 93,
        y: scale * 20,
        radius: scale * 7,
        stroke: 'black',
        strokeWidth: 1
      });

	// the line associated with the NOT gate's input
	plugin = new Kinetic.Line({
			points : [scale * 25, scale * 20, scale * 50, scale * 20],
			stroke : 'black',
			strokeWidth : 1,
			lineCap : 'round',
			lineJoin : 'round'
		});

	// the line associated with the NOT gate's output
	plugout = new Kinetic.Line({
			points : [scale * 100, scale * 20, scale * 125, scale * 20],
			stroke : 'black',
			strokeWidth : 1,
			lineCap : 'round',
			lineJoin : 'round'
		});

	// the transparent rectangle
	transFg = new Kinetic.Rect({
		x: scale * 23,
		y: scale * 0,
		width: plugout.getPoints()[1].x - plugin.getPoints()[0].x,
		height: scale * 50
	});

	// create the group at the x,y coords passed to this object
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

	// draw the NOT gate
	this.draw = draw;
	function draw() {
		// add each component to the group
		group.add(gateShapeTriangle);	// the triangle
		group.add(gateShapeCircle);		// ... the circle
		group.add(plugin);				// ... the plugin line
		group.add(plugout);				// ... the plugout line
		//group.add(transFg);				// and finally the transparent foreground
		mainLayer.add(group);			// add this group to the main layer
		stage.draw();					// call draw on the stage to redraw its components
		drawBoxes();
	}
	
	function drawBoxes() {
		var plug;
		if (inputBox) {
			plug = getPlugin();
			inputBox.setPosition(plug.getPoints()[0].x - 10, plug.getPoints()[0].y - 20);
			plug = getPlugout();
			outputBox.setPosition(plug.getPoints()[0].x + 3, plug.getPoints()[0].y - 20);
		}
		else {
			plug = getPlugin();
			inputBox = new Kinetic.Rect({
				x: plug.getPoints()[0].x - 10,
				y: plug.getPoints()[0].y - 20,
				width: (plug.getPoints()[1].x - plug.getPoints()[0].x) + 5,
				height: 40
				//fill : 'black'
			});
			
			plug = getPlugout();
			outputBox = new Kinetic.Rect({
				x: plug.getPoints()[0].x + 3,
				y: plug.getPoints()[0].y - 20,
				width: (plug.getPoints()[1].x - plug.getPoints()[0].x) + 5,
				height: 40
				//fill : 'black'
			});
			
			
			mainLayer.add(inputBox);
			mainLayer.add(outputBox);
			stage.draw();
		}
	}
	
	function setMouseOver(str) { mouseOver = str; }
	
	function getInputBox() {
		return inputBox;
	}
	
	function getOutputBox() {
		return outputBox;
	}
	
	// accessor for this gate's type
	function getType() { return "not"; }
	
	function getID() { return ID; }
	
	// accessor for this gate's function
	function getFunc() { return "gate"; }
	
	// accessor for this gate's name
	function getName() { return name; }
	
	// accessor for this gate's group
	function getGroup() { return group; }

	// returns the line for the plugin in GLOBAL coordinates; used in the controller for drawing wires (the controller functions in global coordinates; which makes sense)
	function getPlugin() {
		var line = new Kinetic.Line({
			points: [group.getX() + plugin.getPoints()[0].x, group.getY() + plugin.getPoints()[0].y, group.getX() + plugin.getPoints()[1].x, group.getY() + plugin.getPoints()[1].y]
		});
		
		return line;
	}
	
	// accessor for the component that the NOT gate's input is connected to (the component before the NOT gate)
	function getPluginComp() { return pluginComp; }
	
	// return the line for the plugout in GLOBAL coordinates; same concept as plugin line
	function getPlugout() {
		var line = new Kinetic.Line({
			points: [group.getX() + plugout.getPoints()[0].x, group.getY() + plugout.getPoints()[0].y, group.getX() + plugout.getPoints()[1].x, group.getY() + plugout.getPoints()[1].y]
		});
		
		return line;
	}
	
	// accessor for the wire (line) that connects the plugout to a component for output
	function getPlugoutWire() { return plugoutWire;	}
	
	function setPlugoutWireColor(color) { plugoutWire.setStroke(color); }
	
	function setPlugColor(plugStr, color) {
		if (plugStr == "plugin") plugin.setStroke(color);
		else if (plugStr == "plugout") plugout.setStroke(color);
	}
	
	function setPlugColor1(plugStr, color) { 
		plugin.setStroke("black");
		plugout.setStroke("black");
		if (pluginComp !== null) pluginComp.setPlugoutWireColor("black", connectorPlugin);
		if (plugoutComp !== null) plugoutWire.setStroke("black");
		
		if (plugStr == "all") return;
		else if (plugStr == "plugin") {
			if (pluginComp !== null && color == "green") return false;
			else if (pluginComp !== null && color == "yellow") {
				pluginComp.setPlugoutWireColor("yellow", connectorPlugin);
				return pluginComp.getPlugoutWire(connectorPlugin);
			}
			else plugin.setStroke(color);
		}
		else if (plugStr == "plugout") {
			if (plugoutComp !== null && color == "green") return false;
			else if (plugoutComp !== null && color == "yellow") {
				plugoutWire.setStroke("yellow");
				return plugoutWire;
			}
			else plugout.setStroke(color);
		}
	}
	
	// mutator for the wire (line) that connects the plugout to a component for output
	function setPlugoutWire(line) { plugoutWire = line;	}
	
	// accessor for the component connected to the OR gate's output
	function getPlugoutComp() { return plugoutComp; }
	
	// sets the component that the OR gate is connected to
	function setPlugoutComp(comp) { plugoutComp = comp; evaluate();	}
	
	// set the plugin component to NULL (used in disconnection)
	function setPluginCompNull() { pluginComp = null; pluginVal = -1; evaluate(); }
	
	// set the plugin component to the component passed as parameter
	this.setPluginComp = setPluginComp;
	function setPluginComp(comp) { pluginComp = comp; comp.evaluate(); }
	
	// add a value to this AND gate's input values (used in computing the output of the circuit); these two values will be OR'ed together
	function setPluginVal(comp, val) {
		pluginVal = val;
		evaluate();
	}
	
	// evaluate this gate; AND the two values in pluginVals, and send the output to the next component
	function evaluate() {
		var res = 0;
		if (pluginVal == 0) {
			res = 1;
			// set plugout color red
			// set output wire color red
			// set plougout component's input wire red
		}
		else if(pluginVal == -1) res = -1;
		
		if (plugoutComp !== null) {
			plugoutComp.setPluginVal(thisObj, res);
		}
	}

	function probe() {
		var str = "!";
		if (pluginComp !== null) {
			str += pluginComp.probe();
			return str;
		}
		else return null;
	}
	
	function getConnectorPlugin() { return connectorPlugin; }
	
	function setConnectorPlugin(num) { connectorPlugin = num; }
	
	function deleteInputConnection() {
		connectorPlugin = -1;
		pluginComp = null;
	}
	
	function deleteOutputConnection() {
		plugoutComp.setPluginCompNull(thisObj);
		plugoutWire.disableStroke();
		plugoutComp = null;
		plugoutWire = null;
	}
}
