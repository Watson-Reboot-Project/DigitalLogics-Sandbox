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
	
	var scale = setup.getGScale();
	var mainLayer = setup.getMainLayer();
	var stage = setup.getStage();
	var thisObj = this;

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	this.draw = draw;
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
	this.getPlugoutWire = getPlugoutWire;
	this.setPlugoutWire = setPlugoutWire;
	this.getSelectedPlugout = getSelectedPlugout;
	this.setSelectedPlugout = setSelectedPlugout;
	this.setPluginComp = setPluginComp;
	this.setPluginCompNull = setPluginCompNull;
	this.setPluginVal = setPluginVal;
	this.evaluate = evaluate;
	this.probe = probe;
	
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
		document.body.style.cursor = 'pointer';
	});
	group.on('mouseout', function () {
		document.body.style.cursor = 'default';
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
	}
	
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
}