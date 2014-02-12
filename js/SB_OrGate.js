/**************************************************************************************
*	Author:		Neil Vosburg
*	Class:		OrGate.js
*
*	Behavior:	This class represents the functionality of an OR gate. The class contains
*				variables for "plugins", "plugout", "plugoutWire", and "plugoutComp".
*				Plugins for the OR gate are the two input lines. The OR gate has one plugout
*				which is the one line associated with its output. The plugout wire is
*				associated with the line that runs to the component it is connected to
*				from its plugout. The "plugoutComp" stands for plugout component, which is
*				the components the OR gate outputs to.
***************************************************************************************/

function SB_OrGate(initX, initY, setName, id, setup) {
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	var plugin1 = null;				// the first (top) input line
	var plugin1Val = -1;
	var connectorPlugin1;			// if this gate's plugin1 is connected to a connector, this keeps track of the plugout number of the connector it is connected to
	var plugin1Comp = null;			// the component that is connected to plugin1
	
	var plugin2 = null;				// the second (bottom) input line
	var plugin2Val = -1;
	var connectorPlugin2;			// if this gate's plugin2 is connected to a connector, this keeps track of the plugout number of the connector it is connected to
	var plugin2Comp = null;			// the component that is connected to plugin2

	var plugout = null;				// the output line
	var plugoutWire = null;			// the wire the connects the output to the input of another gate
	var plugoutComp = null;			// the component this gate's output is connected to
	
	var name = setName;				// the name of this gate
	var ID = id;					// the ID of this gate
	
	var group;						// the group that all of the OR gate's components are added to
	var gateShape;					// the custom shape for the OR gate
	var input1Box;
	var input2Box;
	var outputBox;
	var transFg;					// a transparent foreground for the OR gate
	
	var mainLayer = setup.getMainLayer();
	var stage = setup.getStage();
	var thisObj = this;
	var mouseOver = 'pointer';
	var deleteImg;
	var scale = 0.75;
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	this.draw = draw;
	this.getType = getType;
	this.getFunc = getFunc;
	this.getName = getName;
	this.getGroup = getGroup;
	this.getID = getID;
	this.getPlugin = getPlugin;
	this.getPluginComp = getPluginComp;
	this.setPluginComp = setPluginComp;
	this.getConnectorPlugin = getConnectorPlugin;
	this.setConnectorPlugin = setConnectorPlugin;
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
	this.deleteOutputConnection = deleteOutputConnection;
	this.setPlugoutWireColor = setPlugoutWireColor
	this.drawBoxes = drawBoxes;
	this.getInputBox = getInputBox;
	this.getOutputBox = getOutputBox;
	this.setMouseOver = setMouseOver;
	this.toggleDeleteIcon = toggleDeleteIcon;
	this.setPluginColor = setPluginColor;
	this.deleteSelf = deleteSelf;
	this.getOutputValue = getOutputValue;
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE ASSIGNMENTS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	// a custom shape to draw the or gate; composed of three quadratic curves
	gateShape = new Kinetic.Shape({
			drawFunc : function (context) {
				// begin custom shape
				//context.beginPath();
				//context.moveTo( 50,  0);
				//context.quadraticCurveTo( 70,  0,  90,  20);
				//context.quadraticCurveTo( 70,  40,  50,  40);
				//context.quadraticCurveTo( 70,  20,  50,  0);
				context.beginPath();
				context.moveTo(scale * 50, 0);
				context.lineTo(scale * 60, 0);
				context.quadraticCurveTo(scale * 75, 0, scale * 90, scale * 20);
				context.quadraticCurveTo(scale * 75, scale * 40, scale * 60, scale * 40);
				context.lineTo(scale * 50, scale * 40);
				context.quadraticCurveTo(scale * 75, scale * 20, scale * 50, 0);
				// complete custom shape
				context.closePath();
				// KineticJS specific context method
				context.fillStrokeShape(this);
			},
			stroke : 'black',
			strokeWidth : 1
		});

	// the line for the first plugin
	plugin1 = new Kinetic.Line({
			points : [scale * 34, scale * 10, scale * 59, scale * 10],
			stroke : 'black',
			strokeWidth : 1,
			lineCap : 'round',
			lineJoin : 'round'
		});

	// the line for the second plugin
	plugin2 = new Kinetic.Line({
			points : [scale * 34, scale * 30, scale * 59, scale * 30],
			stroke : 'black',
			strokeWidth : 1,
			lineCap : 'round',
			lineJoin : 'round'
		});

	// the line for the plugout
	plugout = new Kinetic.Line({
			points : [scale * 90, scale * 20, scale * 115, scale * 20],
			stroke : 'black',
			strokeWidth : 1,
			lineCap : 'round',
			lineJoin : 'round'
		});
	
	// create the transparent rectangle that makes it easy to click the OR gate
	transFg = new Kinetic.Rect({
		x:  30,
		y:  0,
		width: plugout.getPoints()[1].x - plugin1.getPoints()[0].x,
		height: (plugin2.getPoints()[0].y +  10)
	});

	// create the group for the components that make up the OR gate; place it at the x,y coords passed to the object
	group = new Kinetic.Group({
			x : initX,
			y : initY,
			rotationDeg : 0,
			draggable : true
		});
		
	deleteImg = new Image();
	deleteImg.onload = function() {
		var deleteIco = new Kinetic.Image({
			x: scale * 87,
			y: scale * -5,
			image: deleteImg,
			scale: 0.3
		});

		// add the shape to the layer
		group.add(deleteIco);
		mainLayer.draw();
	};
	deleteImg.src = "";

	// add cursor styling when the user mouseovers the group
	group.on('mouseover', function () {
		document.body.style.cursor = mouseOver;
	});
	group.on('mouseout', function () {
		if (mouseOver !== "crosshair") document.body.style.cursor = 'default';
	});

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION IMPLEMENTATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	// draw the OR gate
	function draw() {
		// add each component to the group
		group.add(gateShape);	// the custom shape
		group.add(plugin1);		// ... the first plugin line
		group.add(plugin2);		// ... the secong plugin line
		group.add(plugout);		// ... the plugout line
		//group.add(transFg);		// and finally the transparent foreground
		mainLayer.add(group);	// add the group to the main layer
		stage.draw();					// call draw on the stage to redraw its components
		drawBoxes();
	}
	
	function deleteSelf() {
		group.remove();
		input1Box.remove();
		input2Box.remove();
		outputBox.remove();
	}
	
	function drawBoxes() {
		var plug;
		if (input1Box) {
			plug = getPlugin(1);
			input1Box.setPosition(plug.getPoints()[0].x - scale * 10, plug.getPoints()[0].y - scale * 15);
			plug = getPlugin(2);
			input2Box.setPosition(plug.getPoints()[0].x - scale * 10, plug.getPoints()[0].y - scale * 9);
			plug = getPlugout();
			outputBox.setPosition(plug.getPoints()[0].x - 0, plug.getPoints()[0].y - scale * 20);
		}
		else {
			plug = getPlugin(1);
			input1Box = new Kinetic.Rect({
				x: plug.getPoints()[0].x - scale * 10,
				y: plug.getPoints()[0].y - scale * 15,
				width: (plug.getPoints()[1].x - plug.getPoints()[0].x) + 5,
				height: scale * 24
				//fill : 'black'
			});
			
			plug = getPlugin(2);
			input2Box = new Kinetic.Rect({
				x: plug.getPoints()[0].x - scale * 10,
				y: plug.getPoints()[0].y - scale * 9,
				width: (plug.getPoints()[1].x - plug.getPoints()[0].x) + 5,
				height: scale * 24
				//fill : 'black'
			});
			
			plug = getPlugout();
			outputBox = new Kinetic.Rect({
				x: plug.getPoints()[0].x - 0,
				y: plug.getPoints()[0].y - scale * 20,
				width: (plug.getPoints()[1].x - plug.getPoints()[0].x) + 5,
				height: scale * 40
				//fill : 'black'
			});
			
			mainLayer.add(input1Box);
			mainLayer.add(input2Box);
			mainLayer.add(outputBox);
			stage.draw();
		}
	}
	
	function setMouseOver(str) { mouseOver = str; }
	
	function toggleDeleteIcon(bool) {
		if (bool) deleteImg.src = "delete.ico";
		else deleteImg.src = "";
		
		mainLayer.draw();
	}
	
	function getInputBox(num) {
		if (num == 1) return input1Box;
		else if (num == 2) return input2Box;
	}
	
	function getOutputBox() {
		return outputBox;
	}
	
	// accessor for the gate type
	function getType() { return "or"; }
	
	function getID() { return ID; }
	
	// accessor for the gate function (returns "gate" for OR, AND, and NOT; returns "connection" for CONNECTOR)
	function getFunc() { return "gate"; }
	
	// accessor for the gate name
	function getName() { return name; }
	
	// accessor for the group (used in controller for setting events on this object)
	function getGroup() { return group; }
	
	// returns the line for a plugin in GLOBAL coordinates; used in the controller for drawing wires (the controller functions in global coordinates; which makes sense)
	function getPlugin(num) {	// num is the plugin number to return
		var line;
		
		if (num == 1) {
			line = new Kinetic.Line({
				// make a new line and transform the line's coordinates to global coordinates; we do this by adding the group's coordinates to the line's coordinates
				points: [group.getX() + plugin1.getPoints()[0].x, group.getY() + plugin1.getPoints()[0].y, group.getX() + plugin1.getPoints()[1].x, group.getY() + plugin1.getPoints()[1].y]
			});
		}
		else {
			line = new Kinetic.Line({
				// same concept as above; must transform coordinates to global coordinates
				points: [group.getX() + plugin2.getPoints()[0].x, group.getY() + plugin2.getPoints()[0].y, group.getX() + plugin2.getPoints()[1].x, group.getY() + plugin2.getPoints()[1].y]
			});
		}
		
		return line;
	}
	
	// accessor for a connector plugin number (recall that connectorPlugin# is for when a plugin is connected to a connector)
	function getConnectorPlugin(num) {
		if (num == 1) return connectorPlugin1;
		else if (num == 2) return connectorPlugin2;
	}
	
	// mutator for a connector plugin (this is called when the OR gate's input is connected to a connector)
	function setConnectorPlugin(pluginNum, plugoutNum) {
		if (pluginNum == 1) connectorPlugin1 = plugoutNum;
		else if (pluginNum == 2) connectorPlugin2 = plugoutNum;
	}
	
	// accessor for the component connected to the OR gate's input (the component before the OR gate)
	function getPluginComp(num) {
		if (num == 1) return plugin1Comp;
		else if (num == 2) return plugin2Comp;
	}
	
	// return the line for the plugout in GLOBAL coordinates; same concept as plugin lines
	function getPlugout() {
		var line = new Kinetic.Line({
			points: [group.getX() + plugout.getPoints()[0].x, group.getY() + plugout.getPoints()[0].y, group.getX() + plugout.getPoints()[1].x, group.getY() + plugout.getPoints()[1].y]
		});
				
		return line;
	}
	
	// accessor for the wire (line) that connects the plugout to a component for output
	function getPlugoutWire() { return plugoutWire;	}
	
	// mutator for the wire (line) that connects the plugout to a component for output
	function setPlugoutWire(line) { plugoutWire = line;	}
	
	function setPlugoutWireColor(color) {
		if (color != "default") plugoutWire.setStroke(color);
		else evaluate();
	}
	
	// accessor for the component connected to the OR gate's output
	function getPlugoutComp() { return plugoutComp; }
	
	// sets the component that the OR gate is connected to
	function setPlugoutComp(comp) { plugoutComp = comp; evaluate(); }
	
	// set a plugin to NULL that equals the given component passed as parameter (used in disconnection)
	function setPluginCompNull(comp)
	{
		if (plugin1Comp == comp) {
			plugin1Comp = null;
			plugin1.setStroke("black");
			plugin1Val = -1;
		}
		
		if (plugin2Comp == comp) {
			plugin2Comp = null;
			plugin2.setStroke("black");
			plugin2Val = -1;
		}
		
		evaluate();
	}
	
	// set the component that the OR gate's input is connected to
	function setPluginComp(num, comp) {
		if (num == 1) plugin1Comp = comp;
		else if (num == 2) plugin2Comp = comp;
		
		if (comp !== null) comp.evaluate();
		else {
			if (num == 1) { plugin1.setStroke("black"); plugin1Val = -1; }
			else { plugin2.setStroke("black"); plugin2Val = -1; }
	
			evaluate();
		}
	}
	// add a value to this AND gate's input values (used in computing the output of the circuit); these two values will be OR'ed together
	function setPluginVal(comp, val) {
		if (comp == plugin1Comp && comp == plugin2Comp) { plugin1Val = val; plugin2Val = val; }
		else if (comp == plugin1Comp) plugin1Val = val;
		else if (comp == plugin2Comp) plugin2Val = val;
		
		evaluate();
	}
	
	function setPluginColor(comp, color) {
		if (comp == plugin1Comp) plugin1.setStroke(color);
		if (comp == plugin2Comp) plugin2.setStroke(color);
	}
	
	// evaluate this gate; AND the two values in pluginVals, and send the output to the next component
	function evaluate() {
		if (plugin1Val != -1 && plugin2Val != -1) {
			var res = 0;
			if (plugin1Val == 1 || plugin2Val == 1) {
				res = 1;
			}
			
			var color = "blue";
			if (res == 1) color = "red";
				
			if (plugoutComp !== null) {
				plugoutComp.setPluginVal(thisObj, res);
				setPlugColor("plugout", color);
				plugoutWire.setStroke(color);
				plugoutComp.setPluginColor(thisObj, color);
			}
			else {
				setPlugColor("plugout", color);
			}
			gateShape.setFill(color);
		}
		else {
			if (plugoutComp !== null) {
				plugoutComp.setPluginVal(thisObj, -1);
				setPlugColor("plugout", "black");
				plugoutWire.setStroke("black");
				plugoutComp.setPluginColor(thisObj, "black");
			}
			else {
				setPlugColor("plugout", "black");
			}
			
			gateShape.setFill("#ffffff");
		}
	}
	
	function probe() {
	var str = "(";
	if (plugin1Comp !== null && plugin2Comp !== null) {
		str += plugin1Comp.probe();
		str += " + ";
		str += plugin2Comp.probe();
		str += ")";
		return str;
	}
	else return null;
	}
	
	function setPlugColor(plugStr, color) {
		if (plugStr == "plugin1") {
			if (color == "default" && plugin1Comp !== null) plugin1Comp.evaluate();
			else if (color == "default" && plugin1Comp === null) plugin1.setStroke("black");
			else plugin1.setStroke(color);
		}
		else if (plugStr == "plugin2") {
			if (color == "default" && plugin2Comp !== null) plugin2Comp.evaluate();
			else if (color == "default" && plugin2Comp === null) plugin2.setStroke("black");
			else plugin2.setStroke(color);
		}
		else if (plugStr == "plugout") {
			if (color == "default") evaluate();
			else plugout.setStroke(color);
		}	
	}
	
	function deleteOutputConnection() {
		plugoutComp.setPluginCompNull(thisObj);
		plugoutWire.disableStroke();
		plugoutComp = null;
		plugoutWire = null;
	}
	
	function getOutputValue() {
		if (plugin1Val == -1 || plugin2Val == -1) return -1;
		else {
			if (plugin1Val == 1 || plugin2Val == 1) return 1;
			else return 0;
		}
	}
}
