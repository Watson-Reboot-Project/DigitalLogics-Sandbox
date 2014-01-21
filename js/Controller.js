/**************************************************************************************
*	Author:		Neil Vosburg
*	Class:		Controller.js
*	Date:		12/15/2013
*
*	Behavior:	This class is the main controller for the digital circuit creation. It
*				is responsible for drawing lines between connected components (the lines
*				are stored in the objects after drawing, however), setting connections
*				between components, handling mouse click events, etc. When a new component
*				is created, the new component is registered with the controller via
*				registerComponent(). A component (abbreviated 'comp') is considered to be
*				either a NOT gate, OR gate, AND gate, and a connector. A gate is considered
*				to be a NOT gate, OR gate, and an AND gate. A connector is not considered
*				a gate.
*
*				NOTES:
*				Output Wires: 	Output wires are lines that connect connected components. They
*								are set up to "zig zag" from one component to another; their
*								points array follows this structure:
*								[start.x, start.y, middle.x, start.y, middle.x, end.y, end.x, end.y]
*								The points array is composed of four points which essentially makes
*								up three lines. A midpoint is computed by simply adding start.x and
*								end.x and then diving by two. At this midpoint, the line jumps
*								vertically from the start.y position to the end.y position. This
*								prevents wires from being slanted; this zig zag looks more appealing
*								in terms of digital circuits.
***************************************************************************************/

function Controller(setup, truthTable) {

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE DECLARATIONS/DEFINITIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

	var connecting = false;		// keeps track if the controller is in "connecting mode" where one component is selected to be connected to another
	var components = [];
	var inputs = [];
	var outputs = [];
	var points = [];			// reused throughout the code to create points for wires (lines)
	var selectedComp = null;	// when connecting two components together, the first component that is selected will be stored here
	var tempLine = null;		// used to store points to line that follows mouse when in connecting mode
	var nextID = 0;
	var addPopup = null;
	var deletePopup = null;
	
	var scale = setup.getGScale();
	var mainLayer = setup.getMainLayer();
	var stage = setup.getStage();
	var bg = setup.getBG();
	
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	this.registerComponent = registerComponent;								// register a new component
	
	// gate functions
	gateMouseDown = gateMouseDown;											// handle clicks on gates
	gateDrag = gateDrag;													// handle drags on gates
	
	// connector functions
	connectorMouseDown = connectorMouseDown;								// handle clicks on connectors
	connectorDrag = connectorDrag;											// handle drags on connectors
	
	// component (gate & connector) functions
	compMouseOver = compMouseOver;											// turn connection wire green if a connection is possible
	probe = probe;
	
	// input & output node functions
	nodeMouseDown = nodeMouseDown;
	
	// background function
	bgClick = bgClick;														// handles click on the background (not on a component)
	
	// stage functions
	stageMouseMove = stageMouseMove;										// handle mouse moves on stage
	
	// misc functions
	setWireFromGateToGate = setWireFromGateToGate;							// set connections from a gate to gate
	setWireFromGateToConnector = setWireFromGateToConnector;				// set connections from a gate to a connector
	setWireFromConnectorToGate = setWireFromConnectorToGate;				// set connections from a connector to a gate
	setWireFromConnectorToConnector = setWireFromConnectorToConnector;		// set connections from a connector to a connector
	distance = distance;													// get distance between two points
	getWirePoints = getWirePoints;											// get the points for a wire from one component to another
	getWirePoints2 = getWirePoints2;										// get the points for a wire from one component to another (used on vertical connectors)
	
	// non-sand box functions
	this.connectComponents = connectComponents;								// programmatically set a connection from another class
	
	//add & delete functions
	this.addAndGate = addAndGate;
	this.addOrGate = addOrGate;
	this.addNotGate = addNotGate;
	this.addConnector = addConnector;
	this.deleteGate = deleteGate;
	this.deleteConnecor = deleteConnector;
	this.addInput = addInput;
	this.addOutput = addOutput;
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; INITIAL SETUP ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	// this event listener is used to draw the line that follows the mouse when in connecting mode
	stage.on('mousemove', function() {
		stageMouseMove();
	});
	
	// this event listener listens for clicks on the stage
	//stage.on('click', function(event) {
	//	stageClick(event);
	//});
	
	bg.on('click', function(event) {
		bgClick(event);
	});
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION IMPLEMENTATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	/*
	*	registerComponent()
	*
	*	This function is called to register a component with the controller. Event listeners are set accordinly.
	*/
	function registerComponent(comp)
	{
		// if the component is a connector, set connector event listeners
		if (comp.getFunc() == "connection") {
			comp.getGroup().on('click', function(event) {
				connectorMouseDown(event, comp);
				if (event.button != 2) evaluateCircuit();
			});
			
			comp.getGroup().on('dragmove', function() {
				connectorDrag(comp);
			});
		}
		// if the component is a gate, set gate event listeners
		else if (comp.getFunc() == "gate") {
			comp.getGroup().on('click', function(event) {
				gateMouseDown(event, comp);
				if (event.button != 2) evaluateCircuit();
			});
	
			comp.getGroup().on('dragmove', function() {
				gateDrag(comp);
			});
		}
		else {
			comp.getGroup().on('click', function(event) {
				nodeMouseDown(event, comp);
				if (event.button != 2) evaluateCircuit();
			});
		}
		
		comp.getGroup().on('mouseover', function() {
			compMouseOver(comp);
		});
		
		comp.getGroup().on('mouseout', function() {
			if (selectedComp !== null) {
				if (selectedComp.getFunc() == "gate" || selectedComp.getFunc() == "node") selectedComp.getPlugoutWire().setStroke("black");
				else selectedComp.getPlugoutWire(selectedComp.getSelectedPlugout()).setStroke("black");
			}
		});
	}
	
	//------------------------------------
	//--------- GATE LISTENERS -----------
	//------------------------------------
	
	/*
	*	gateMouseDown()
	*
	*	This function is called every time a user clicks on a gate (OR, NOT, AND). If the controller is not in
	*	connecting mode and a gate is clicked then the user wanting one out of two things:
	*			1. The user wants to connect this gate to another component on the stage, OR
	*			2. The user wants to disconnect this gate's output from another component.
	*	If the clicked (selected) gate does NOT have an output, then the user is wanting option (1). If the gate
	*	does have an output, then the user is wanting option (2). If the controller is in connecting mode and
	*	a gate is clicked, the user has already selected one gate and now has clicked another. These two components
	*	need to be connected.
	*
	*	TBI: If a right click is initiated on a gate and the controller is not in connecting mode, we need to show
	*	a menu that gives the option to delete the gate.
	*/
	function gateMouseDown(event, gate)
	{
		if (event.button == 0) {
			if (addPopup !== null) { addPopup.hide(); addPopup = null; return; }
			if (deletePopup !== null) { deletePopup.hide(); deletePopup = null; return; }
		}
		
		if (!connecting) { // if the controller is not in connecting mode and a gate is clicked...
		
			if (event.button == 2) {				// if the click was a right click
				// show menu to delete the gate
				showDeleteMenu(event, gate);
				return;
			}
			// check to see if the clicked gate has an output; if it does, disconnect the output and return
			if (gate.getPlugoutWire() != null) {
				gate.getPlugoutComp().setPluginCompNull(gate);		// set where this gate plugs in to its output component NULL
				gate.getPlugoutWire().disableStroke();				// disable the stroke for this gates plugout wire
				gate.setPlugoutWire(null);							// now set the plugout wire to NULL
				gate.setPlugoutComp(null);							// now set this gate's output component to NULL
				mainLayer.drawScene();								// redraw the scene
				return;												// we are done
			}

		
			// if we made it here, then the clicked gate did not have an output, so the user is wanting to connect this gate to another component	
			points = [0, 0, 0, 0];			// set the points array from (0,0) to (0, 0); they will be set later
			tempLine = new Kinetic.Line({	// create a new line object to be stored out the gate's plugout wire
					points : points,
					stroke : "black",
					strokeWidth : 1,
					lineCap : 'round',
					lineJoin : 'round'
				});
			mainLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			gate.setPlugoutWire(tempLine);	// set the plugout wire to the newly created line
			
			selectedComp = gate;			// set this gate as the selected component
			connecting = true;				// set the controller to connecting mode
		}
		else {
			// if we make it here, then the user has clicked a gate, and the controller is in connection mode
			
			if (gate.getType() == "and" || gate.getType() == "or") { // if the gate is either an AND or and OR gate . . .
				if (gate.getPluginComp(1) !== null && gate.getPluginComp(2) !== null) { // if both of the gate's plugins are not available, return (no more room on this gate)
					return;
				}
				else if (gate.getPluginComp(1) === null && gate.getPluginComp(2) === null) { // if both of the gate's plugins are available...
					// we need to determine which plugin the user is wanting... we do this by taking the distance between both plugins and the mouse
					var mPos = stage.getPointerPosition();										// grab the position of the mouse
					var nodePlugin1Dist = distance(mPos, gate.getPlugin(1).getPoints()[0]);		// take the distance between the mouse and plugin1
					var nodePlugin2Dist = distance(mPos, gate.getPlugin(2).getPoints()[0]);		// take the distance between the mouse and plugin2
					var pluginNum = 1;															// by default, select plugin1
					if (nodePlugin2Dist < nodePlugin1Dist) pluginNum = 2;						// if the distance between plugin2 and the mouse is shorter, use plugin2
					
					if (selectedComp.getFunc() == "connection") {								// if the selected component (the first component selected) is a connector...
						var selPlugout = selectedComp.getSelectedPlugout();						// grab the selected plugout of the selected connector
						setWireFromConnectorToGate(gate, selectedComp.getPlugout(selPlugout), gate.getPlugin(pluginNum), selPlugout, pluginNum);	// set a wire between the components
					}
					else  {																		// if the selected component is not a connector...
						setWireFromGateToGate(gate, selectedComp.getPlugout(), gate.getPlugin(pluginNum), pluginNum);	// set a wire between the components
					}
				}
				else {	// at the else statement, only one of the components is available, so connect to that one
					var pluginNum = (gate.getPluginComp(1) === null) ? 1 : 2; // determine the available plugin
					
					if (selectedComp.getType() == "connector") {				// if the selected component is a connector...
						var selPlugout = selectedComp.getSelectedPlugout();		// get the selected plugout for the selected connector
						setWireFromConnectorToGate(gate, selectedComp.getPlugout(selPlugout), gate.getPlugin(pluginNum), selPlugout, pluginNum); // set a wire between the components
					}
					else {	// if the selected component is not a connector
						setWireFromGateToGate(gate, selectedComp.getPlugout(), gate.getPlugin(pluginNum), pluginNum);	// set a wire between the components
					}
				}
			}
			else if(gate.getType() == "not") {									// if the clicked gate is an OR gate
				if (gate.getPluginComp() === null) {							// if the NOT gate has an available plugin
					if (selectedComp.getType() == "connector") {				// if the selected component is a connector
						var selPlugout = selectedComp.getSelectedPlugout();		// get the selected plugout of the connector
						setWireFromConnectorToGate(gate, selectedComp.getPlugout(selPlugout), gate.getPlugin(), selPlugout, 0);	// set the wire between the components
					}
					else {	// if the selected component is not a connector
						setWireFromGateToGate(gate, selectedComp.getPlugout(), gate.getPlugin(), 0); // set the wire between the components
					}
				}
				else {	// if there isn't an available plugin, return because there is no room for another input
					return;
				}
			}
			
			mainLayer.drawScene();	// redraw the scene to draw any changes
			connecting = false;		// we are no longer in connection mode
			selectedComp = null;	// null the selected component
		}
	}
	
	/*
	*	gateDrag()
	*
	*	This function is called during the drag of a gate. For every pixel the component is dragged, the connection wires must be redrawn
	*	to the new location. We first check to see if the dragged gate has an output. If it does, then we must redraw the plugout wire. If
	*	the dragged gate has a component on plugin1, we must redraw the wire connected to plugin1. The same goes for plugin2.
	*/
	function gateDrag(gate)
	{
		var connectedComps;
		var plugins;
		
		if (gate.getPlugoutWire() !== null) {	// check to see if this gate has a plug out wire, if so, set its points to the new location
			points = getWirePoints(gate.getPlugout().getPoints()[1], gate.getPlugoutWire().getPoints()[3]); // get points for the new line
			gate.getPlugoutWire().setPoints(points);	// set the points for the plugout wire that we just computed above.
		}
		
		// by this point, we have taken care of the output wire, now lets take care of input wires
		
		// now lets looks at wires connected to the plugins
		if (gate.getType() == 'and' || gate.getType() == 'or') {								// if the gate is an AND or OR, there are two plugins
			if (gate.getPluginComp(1) !== null && gate.getPluginComp(2) !== null) {				// if both of the plugins have a wire connected to them
				connectedComps = [ gate.getPluginComp(1),  gate.getPluginComp(2) ];				// put both plugin components in an array
				plugins = [ gate.getPlugin(1), gate.getPlugin(2) ]								// also put both plugin wires in an array
			}
			else if (gate.getPluginComp(1) == null && gate.getPluginComp(2) !== null) {			// if only the second plugin has a wire connected to it
				connectedComps = [ gate.getPluginComp(2) ];										// add the component connected to plugin2 to an array
				plugins = [ gate.getPlugin(2) ];												// add the second plugin wire to an array
			}
			else if (gate.getPluginComp(1) !== null && gate.getPluginComp(2) === null) {		// if only the first plugin has a wire connected to it
				connectedComps = [ gate.getPluginComp(1) ];										// add the component connected to plugin1 to an array
				plugins = [ gate.getPlugin(1) ];												// add the first plugin wire to an array
			}
			else {																				// else, no wires connected to plugins, return
				return;
			}
		}
		else if(gate.getType() == 'not') {														// if the gate is a NOT gate
			if (gate.getPluginComp() !== null) {												// and if the NOT gate has an input component
				connectedComps = [ gate.getPluginComp() ];										// add the component to an array
				plugins = [ gate.getPlugin() ];													// add the plugin wire to an array
			}
			else {																				// else, the gate has no input, return
				return;
			}
		}
		
		// by this point, we are an array "connectedComps" that contains the components connected as input to this gate
		// and also we have an array "plugIns" that contains the plugin wires for the connected components
		
		// we have one special case we must take care of where two outputs on a connector goes to the same gate
		if (connectedComps.length == 2 && connectedComps[0] == connectedComps[1]) { // two outputs on a connector goes to one gate
			var plugoutNum;
			for (var i = 1; i < 3; i++) {					// iterate throughout the plugin wires for the connector
				plugoutNum = gate.getConnectorPlugin(i);	// grab the connector plugin within the gate that tells what plugout wire the connector is using for this input
				if (plugoutNum == 2) points = getWirePoints(connectedComps[0].getPlugout(plugoutNum).getPoints()[1], gate.getPlugin(i).getPoints()[0]);	// compute the points for this wire
				else points = getWirePoints2(connectedComps[0].getPlugout(plugoutNum).getPoints()[1], gate.getPlugin(i).getPoints()[0]);
				connectedComps[0].getPlugoutWire(plugoutNum).setPoints(points);														// set the plugout wire points
			}
			mainLayer.drawScene();	// redraw the scene with these new wires
			
			return;
		}
		
		// we are finally ready to take care of the components we added in the arrays earlier
		for (var i = 0; i < connectedComps.length; i++) {	// iterate throughout the connected components
			points = [];
			
			if (connectedComps[i].getType() == "connector") {					// if the connected component is a connector
				var plugoutNums = connectedComps[i].getPlugoutToComp(gate);		// get the plugout number used to go to this gate (only one value will be returned in the array)
				
				// if the plugout number is 2, we call getWirePoints(); if its 1 or 3, we call getWirePoints2(); .. go looks on those functions for descriptions as to why
				if (plugoutNums[0] == 2) points = getWirePoints(connectedComps[i].getPlugout(plugoutNums[0]).getPoints()[1], plugins[i].getPoints()[0]);
				else points = getWirePoints2(connectedComps[i].getPlugout(plugoutNums[0]).getPoints()[1], plugins[i].getPoints()[0]);
				
				connectedComps[i].getPlugoutWire(plugoutNums[0]).setPoints(points);	// set the points for the wire we just computed
			}
			else {	// if the connected component is not a connector
				points = getWirePoints(connectedComps[i].getPlugout().getPoints()[1], plugins[i].getPoints()[0]);	// compute the points for the line
				connectedComps[i].getPlugoutWire().setPoints(points);												// set the points we just computed
			}
		}
			
		mainLayer.drawScene();	// refresh the main layer
	}
	
	//------------------------------------
	//------ CONNECTOR LISTENERS ---------
	//------------------------------------
	
	/*
	*	connectorMouseDown
	*
	*	This function is called when the user clicks on a connector. This concept is very similar to a gate mouse down. If the controller is NOT
	*	in connecting mode, then the user can be requesting one of two things:
	*		1. The user wants to make a connection from the connector to another component, OR
	*		2. The user wants to disconnect an output from a component.
	*	If the user clicks on out output that is NOT connected to anything, then the user is wanting options (1). If the user clicks on an output
	*	that is connecting to another component, the user is wanting to disconnect that output. Keep in mind there our three outputs for a connector.
	*	Similar to gates, we determine which output the user is selecting by calculating the distance from the mouse click to each plugout line.
	* 	If the controller is in connecting mode, we have selected the component to be connected to another component.
	*
	*	TBI: If the user right clicks on a connector and the controller is not in connecting mode, show a menu to delete the gate.
	*/
	function connectorMouseDown(event, connect) {
		if (event.button == 0) {
			if (addPopup !== null) { addPopup.hide(); addPopup = null; return; }
			if (deletePopup !== null) { deletePopup.hide(); deletePopup = null; return; }
		}
		
		// lets go ahead and calculate the distance from the pointer to each plugout
		var mPos = stage.getPointerPosition();									// grab the mouse pointer position
		var dist1 = distance(mPos, connect.getPlugout(1).getPoints()[1]);		// get distance from pointer to first plugout
		var dist2 = distance(mPos, connect.getPlugout(2).getPoints()[1]);		// "                          " second plugout
		var dist3 = distance(mPos, connect.getPlugout(3).getPoints()[1]);		// "                          " third plugout
		
		// the shortest distance determines which plugout to go with
		var plugoutNum;
		if (dist1 < dist2 && dist1 < dist3) plugoutNum = 1;
		else if (dist2 < dist3 && dist2 < dist1) plugoutNum = 2;
		else plugoutNum = 3;
					
		if (!connecting) {													// if we are not in connecting mode, we are either connecting this connector to another component, or disconnecting
			
			if (event.button == 2) {				// a right click
				// show menu to delete connector showDeleteMenu();
				showDeleteMenu(connect);
				return;
			}
			
			if (connect.getPlugoutWire(plugoutNum) != null) {				// if the plugout the user has chosen is not empty, we are disconnecting
				var connectedComp = connect.getPlugoutComp(plugoutNum);		// grab the connecting component at that plugin
				
				if (connectedComp.getType() == "connector" || connectedComp.getType() == "not" || connectedComp.getType() == "output") {		// if its a connector or a NOT, simply set the one input null
					connectedComp.setPluginCompNull();					// we set the plugin comp null
				}
				else {
					connectedComp.setPluginCompNull(connect);			// else, there are two inputs, so we pass this connector object to that gate to sell it null
				}
				
				connect.getPlugoutWire(plugoutNum).disableStroke();		// disable the plugout wire's stroke
				connect.setPlugoutWire(plugoutNum, null);				// set the plugout wire null inside this connector
				connect.setPlugoutComp(plugoutNum, null);				// set the plugout comp null inside this connector
				mainLayer.drawScene();									// refresh the scene
				return;													// we are done, return
			}

			// if we have made it here, then there was not a component connected to the selected output; we connecting this connector to another component

			points = [0, 0, 0, 0];				// set up the tempLine, we pass it 0's as the initial point as they get set later
			tempLine = new Kinetic.Line({
					points : points,
					stroke : "black",
					strokeWidth : 1,
					lineCap : 'round',
					lineJoin : 'round'
				});
			mainLayer.add(tempLine);		// add the tempLine to the main layer
			connect.setPlugoutWire(plugoutNum, tempLine);	// set the plugout wire of this connector to the templine

			connect.setSelectedPlugout(plugoutNum);			// set this plugout selected within this connector (very important)
			selectedComp = connect;							// set this connector as the selected component
			connecting = true;								// put the controller in connecting mode
			mainLayer.drawScene();							// refresh the scene
		}
		else {	// if the controller isn't in connection mode, we are attempting to connect the selectedComp to this connector
			if (connect.getPluginComp() !== null) { // if this connector has a component already in its plugin, return (no room for any thing else)
				return;
			}
			else {	// otherwise, the plugin slot is open, so lets make the connection
				if (selectedComp.getType() == "connector") {				// if the selected component is a connector,
					var selPlugout = selectedComp.getSelectedPlugout();		// get the selected plugout for that connector
					setWireFromConnectorToConnector(connect, selectedComp.getPlugout(selPlugout), connect.getPlugin(), selPlugout);	// make the connection
				}
				else {	// else, the selected component is not a connector, it's a gate
					setWireFromGateToConnector(connect, selectedComp.getPlugout(), connect.getPlugin());	// make the connection
				}
			}
			
			mainLayer.drawScene();
			
			connecting = false;
			selectedComp = null;
		}
	}
	
	/*
	*	connectorDrag()
	*
	*	Similar to the way the gate drag event is handled, we must redraw any connections if we drag a connector. We first take care of the one input line.
	*	If this gate has an input line, we need to redraw it. Next, we look at each plugout individually. If the plugout has a component connected to it,
	*	we must redraw that wire as well.
	*/
	function connectorDrag(connect)
	{
		var connectedComps;
		
		if (connect.getPluginComp() !== null) {		// if this connector has an input component
			if (connect.getPluginComp().getType() != "connector") {	// if the component connected to the input line is not connector
				points = getWirePoints(connect.getPluginComp().getPlugout().getPoints()[1], connect.getPlugin().getPoints()[0]);	// compute the points
				connect.getPluginComp().getPlugoutWire().setPoints(points);															// set the points		
			}
			else {									// else, the component that is plugged into the connector is a connector
				var plugoutNum = connect.getPluginComp().getPlugoutToComp(connect);		// get the plugout number of that connector that connects to this connector
				
				// if the plugout is the top plugout, use getWirePoints(), else use getWirePoints2() -- go look at those functions to see why
				if (plugoutNum == 2) points = getWirePoints(connect.getPluginComp().getPlugout(plugoutNum).getPoints()[1], connect.getPlugin().getPoints()[0]);
				else points = getWirePoints2(connect.getPluginComp().getPlugout(plugoutNum).getPoints()[1], connect.getPlugin().getPoints()[0]);	
				connect.getPluginComp().getPlugoutWire(plugoutNum).setPoints(points); // set the points we just computed
			}
		}
		
		// we took care of the input line, now we must take care of the three output lines
		for (var i = 0; i < 3; i++) {
			if (connect.getPlugoutComp(i) !== null) {	// if this output line has a component connected to it
				
				// same idea, if the plugout number is 2, use getWirePoints(); else use getWirePoints2() -- go see why if you haven't already
				if (i == 2) points = getWirePoints(connect.getPlugout(i).getPoints()[1], connect.getPlugoutWire(i).getPoints()[3]);
				else points = getWirePoints2(connect.getPlugout(i).getPoints()[1], connect.getPlugoutWire(i).getPoints()[2]);
				connect.getPlugoutWire(i).setPoints(points);	// set the points we just computed
			}
		}
		
		mainLayer.drawScene();	// refresh the scene
	}
	
	//------------------------------------
	//------- COMPONENT LISTENERS --------	(for both gates and connectors)
	//------------------------------------
	
		
	/*
	*	compMouseOver()
	*
	*	This function is responsible for changing the color of the temporary line that follows the mouse when in connecting mode.
	*	It takes care of all components. If the component that the mouse is hovering over has an available output, the temporary
	*	line's color gets set to green. Within registerComponent(), there is an event listener that listens for component "mouseout"
	*	which sets the temporary line's color to black when the mouse is no longer hovering over a component.
	*/
	function compMouseOver(comp) {
		if (connecting && (comp != selectedComp)) {						// if we are in connecting mode, and the component that is being "hovered" is not the same as the selected component
			if (comp.getType() == "or" || comp.getType() == "and") {	// if the component is an AND or an OR gate
				if (comp.getPluginComp(1) === null || comp.getPluginComp(2) === null) {	// if one of its inputs are available, we need to set this line to green
					tempLine.setStroke("green");										// set the line to green (tempLine is created and stored on the gate/connector mouse click event)
				}
			}
			else if (comp.getType() == "not" || comp.getType() == "connector" || comp.getFunc() == "node") {	// if the hovered component is a NOT or and CONNECTOR
				if (comp.getPluginComp() === null) {								// if its only input is available,
					tempLine.setStroke("green");									// change the temp line to green
				}
			}
		}
	}
	
	function probe(comp) {
		var str = comp.probe();
		if (str !== null) alert(str);
		else alert("Part of your circuit is not connected to an input!");
	}
	
	//------------------------------------
	//--------- NODE LISTENERS -----------
	//------------------------------------
	
	function nodeMouseDown(event, node) {
		if (event.button == 0) {
			if (addPopup !== null) { addPopup.hide(); addPopup = null; return; }
			if (deletePopup !== null) { deletePopup.hide(); deletePopup = null; return; }
		}
		
		if (!connecting) {
			if (event.button == 2) {
				showDeleteMenu(node);
				return;
			}	
			
			if (node.getType() == "input") {
				if (node.getPlugoutComp() !== null) {
					var connectedComp = node.getPlugoutComp();
					if (connectedComp.getType() == "connector" || connectedComp.getType() == "OR" || connectedComp.getType() == "output") {
						connectedComp.setPluginCompNull();
					}
					else {
						connectedComp.setPluginCompNull(node);
					}
					
					node.setPlugoutComp(null);
					node.getPlugoutWire().disableStroke();
					node.setPlugoutWire(null);
					mainLayer.drawScene();
					return;
				}

				points = [0, 0, 0, 0];				// set up the tempLine, we pass it 0's as the initial point as they get set later
				tempLine = new Kinetic.Line({
						points : points,
						stroke : "black",
						strokeWidth : 1,
						lineCap : 'round',
						lineJoin : 'round'
					});
				mainLayer.add(tempLine);						// add the tempLine to the main layer
				node.setPlugoutWire(tempLine);					// set the plugout wire of this connector to the templine

				selectedComp = node;							// set this connector as the selected component
				connecting = true;								// put the controller in connecting mode
				mainLayer.drawScene();							// refresh the scene

			}
		}
		else {
			if (node.getType() == "output" && node.getPluginComp() === null) {
				if (selectedComp.getFunc() == "gate") setWireFromGateToConnector(node, selectedComp.getPlugout(), node.getPlugin());
				else if (selectedComp.getFunc() == "connection") setWireFromConnectorToConnector(node, selectedComp.getPlugout(selectedComp.getSelectedPlugout()), node.getPlugin(), selectedComp.getSelectedPlugout());
				else setWireFromGateToConnector(node, selectedComp.getPlugout(), node.getPlugin());
				
				connecting = false;
				selectedComp = null;
				mainLayer.drawScene();
			}
		}
	}
	
	//------------------------------------
	//------ BACKGROUND LISTENERS --------
	//------------------------------------
	
	
	/*
	* bgClick()
	*
	*	This function is called every time the user clicks on the stage (every click that occurs). We only act if the click is a right click, however.
	*	If we are in connecting mode and the user right clicks, the user has requested to cancel the current connection.
	*
	*	TBI: If we are NOT in connecting mode and the user has right clicked on the background, a menu needs to popup. The menu needs to have an ADD
	*	section where we can add a component. When the user clicks on a component to add, the new gate is created and added to the spot of the right
	*	click.
	*/
	function bgClick(event) {
		if (event.button == 0) {
			if (addPopup !== null) { addPopup.hide(); addPopup = null; return; }
			if (deletePopup !== null) { deletePopup.hide(); deletePopup = null; return; }
		}
		else if (event.button == 2) {						// event.button == 2 means if the click is a right click
			if (!connecting) {
				showAddMenu(event, stage.getPointerPosition());
			}
			if (connecting) {							// if we are in connecting mode
				tempLine.disableStroke();				// disable the tempLine's stroke
				tempLine = null;						// set the tempLine to NULL
				if (selectedComp.getType() == "connector") {
					selectedComp.setPlugoutWire(selectedComp.getSelectedPlugout(), null);	// set the plugout wire to null if its a connector
				}
				else {
					selectedComp.setPlugoutWire(null);										// set the plugout wire to null if its a gate
				}
				connecting = false;		// we are not longer in connecting mode
				selectedComp = null;
				mainLayer.drawScene();	// refresh the scene
			}
		}
		evaluateCircuit();
	}
	
	//------------------------------------
	//--------- STAGE LISTENERS ----------
	//------------------------------------
	
	/*
	*	stageMouseMove()
	*
	*	This function is called every time the mouse hovers over the stage (each pixel). So this function is constantly being called, but we only act if
	*	the controller is in connecting mode. If the controller is in connecting mode, that means we need to draw the line that follows the mouse. That
	*	is what we do here.
	*/
	function stageMouseMove() {
		if (connecting) {		// if we are in connecting mode
			var selPlugout;
			
			var mPos = stage.getPointerPosition();
			mPos.x = mPos.x - 5;
			mPos.y = mPos.y - 5;
			
			if (selectedComp.getType() == "connector") {			// if the selected component is a connector
				selPlugout = selectedComp.getSelectedPlugout();		// retrieve the selected plugout number
				
				// if the selected plugout is the top plugout (2), use getWirePoints(); else use getWirePoints2() -- go see why if you haven't yet
				if (selPlugout == 2) points = getWirePoints(selectedComp.getPlugout(selPlugout).getPoints()[1], mPos);
				else points = getWirePoints2(selectedComp.getPlugout(selPlugout).getPoints()[1], mPos);
				
				selectedComp.getPlugoutWire(selPlugout).setPoints(points);	// set the points we just compued
			}
			else {	// if the selected component is anything else (a gate)
				points = getWirePoints(selectedComp.getPlugout().getPoints()[1], mPos);	// get the wire points
				selectedComp.getPlugoutWire().setPoints(points);												// set the points we just computed
			}
			
			mainLayer.drawScene();	// refresh the scene
		}
	}
	
	//------------------------------------
	//------- CONNECTION FUNCTIONS -------
	//------------------------------------
	
	/*
	*	setWireFromGateToGate()
	*
	*	This function is called to set a connection for a gate to another gate. We are passed the component
	*	that will be connected to the selectedComp. In other words, it is the second component chosen in the
	*	connection process. We are also passed a start line and an end line. Our wire will go from the end point
	*	of the start line to the start points of the end line. Lastly, we are passed a plugin number which will
	*	be the number of the plugin that the wire will be connected to.
	*/
	function setWireFromGateToGate(gate, start, end, pluginNum) {
		var xMed;															// middle x value
		start = start.getPoints()[1];										// the end point of the start line
		end = end.getPoints()[0];											// the start point of the end line
		points = getWirePoints(start, end);									// compute the wire points
		
		if (pluginNum == 0) gate.setPluginComp(selectedComp);				// if the plugin number is 0, the component is a NOT gate (only one input for a not gate)
		else gate.setPluginComp(pluginNum, selectedComp);					// else, call setPluginComp on the component with the plugin number provided and the selected component
		selectedComp.setPlugoutComp(gate);									// set the plugoutComp for the selectedComp
		
		// make a new line with the points computed earlier
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		selectedComp.setPlugoutWire(line);	// set the plugoutWire of the selectedComp to this new line
		
		if (tempLine !== null) {		// if the tempLine does not equal null, disable it and set it null
			tempLine.disableStroke();
			tempLine = null;
		}
		
		mainLayer.add(line);			// refresh the scene
	}
	
	/*
	*	setWireFromGateToConnector()
	*
	*	This function is called to set a connection from a gate to a connector. We are passed the connector that we will be connecting
	*	the gate (selectedComp) to. We are also passed the start line and end line. We will make a wire (line) from the end point of
	*	the start line to the start point of the end line.
	*/
	function setWireFromGateToConnector(connect, start, end) {
		start = start.getPoints()[1];			// get the end point of the start line
		end = end.getPoints()[0];				// get the start point of the end line
		points = getWirePoints(start, end);		// get the wire points
		connect.setPluginComp(selectedComp);	// set the plugin component of the connector to the selected gate
		selectedComp.setPlugoutComp(connect);	// set the plugout component of the selected gate to this connector
		
		// make the line with the points computed earlier
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		selectedComp.setPlugoutWire(line);	// set the plugout wire to this line of the selected gate
		
		if (tempLine !== null) {		// if temp line does not equal null, make it null and disable it
			tempLine.disableStroke();
			tempLine = null;
		}
		
		mainLayer.add(line);			// refresh the scene
	}
	
	/*
	*	setWireFromConnectorToGate()
	*
	*	This function is called to set a connection from a connector to a gate. We are passed the gate that we will be connecting
	*	the connector (selectedComp) to. We are also passed the start line and end line. We will make a wire (line) from the end
	*	point of the start line to the start point of the end line. We are also passed plugoutNum which is the plugout number of
	*	the connector being use, and also the pluginNum which is the plugin number of the gate being used.
	*/
	function setWireFromConnectorToGate(gate, start, end, plugoutNum, pluginNum) {
		start = start.getPoints()[1];										// get the end point of the start line
		end = end.getPoints()[0];											// get the start point of the end line
		
		// if the plugoutNum of the connector is 2, use getWirePoins(); else use getWirePoints2() -- see documentation
		if (plugoutNum == 2) points = getWirePoints(start, end);
		else points = getWirePoints2(start, end);
		
		if (pluginNum == 0) gate.setPluginComp(selectedComp);				// if pluginNum is 0, its a NOT gate
		else {																// else, it's an AND or OR gate
			gate.setPluginComp(pluginNum, selectedComp);					// set the plugin component of the gate
			gate.setConnectorPlugin(pluginNum, plugoutNum);					// set the connector plugin for the gate (very important)
		}

		selectedComp.setPlugoutComp(plugoutNum, gate);						// set the plugout component of the connector to the gate
		
		// make the line with the points computed earlier
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		selectedComp.setPlugoutWire(plugoutNum, line);	// set plugout wire of the connector to this line
		
		if (tempLine !== null) {		// if the temp line is not null, disable it
			tempLine.disableStroke();
			tempLine = null;
		}
		
		mainLayer.add(line);			// refresh the scene
	}
	
	/*
	*	setWireFromConnectorToConnector()
	*
	*	This function is called to set a connection from a connector to another connector. We are passed a start line and end line.
	*	We will make a wire (line) from the end point of the start line to the start points of the end line. We are also passed
	*	the plugout number of the first connector we are using.
	*/
	function setWireFromConnectorToConnector(connect, start, end, plugoutNum) {
		start = start.getPoints()[1];									// get the end point of the start line
		end = end.getPoints()[0];										// get the start point of the end line
		
		// if the plugoutNum of the connector is 2, use getWirePoins(); else use getWirePoints2() -- see documentation
		if (plugoutNum == 2) points = getWirePoints(start, end);
		else points = getWirePoints2(start, end);
		
		connect.setPluginComp(selectedComp);							// set the plugin component of the second connector
		selectedComp.setPlugoutComp(plugoutNum, connect);				// set the plugout component of the selected connector
		
		// make a line with the points computed earlier
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		selectedComp.setPlugoutWire(plugoutNum, line);		// set the plugout wire of the given plugout to the line we just created
		
		if (tempLine !== null) {		// if the temp line isn't null, disable it
			tempLine.disableStroke();
			tempLine = null;
		}
		
		mainLayer.add(line);			// refresh the scene
	}
	
	/*
	*	connectComponents()
	*
	*	This function was made for the non-sand box version of this lab. It sets connections between components programmatically.
	*	From another JavaScript, components can be added to the stage and connected here. We are passed two components that will
	*	be connected and an options array. We must determine what each component is, and connect them appropriately.
	*/
	function connectComponents(comp1, comp2, opts) {
		selectedComp = comp1;					// set the selectedComp to the first component (it's like the user selected it in the sand-box)
		
		if (comp1.getFunc() == "gate" && comp2.getFunc() == "gate") { // if both components are gates (from gate to gate); opts = [ pluginNum ]
			setWireFromGateToGate(comp2, comp1.getPlugout(), comp2.getPlugin(opts[0]), opts[0]);	// make the connection
		}
		else if (comp1.getFunc() == "gate" && comp2.getFunc() == "connection") { // if from gate to connector; opts is empty
			if (comp1.getType() == "not") {	// if the gate is a NOT gate
				setWireFromGateToGate(comp2, comp1.getPlugout().getPoints()[1], comp2.getPlugin().getPoints()[0], 0); // make the connection
			}
			else {							// if the gate is an AND or OR gate 
				setWireFromGateToConnector(comp2, comp1.getPlugout().getPoints()[1], comp2.getPlugin().getPoints()[0]);	// make the connection
			}
		}
		else if (comp1.getFunc() == "connection" && comp2.getFunc() == "gate") { // if from connector to gate; opts = [ pluginNumOfGate, plugoutNumOfConnector ]
			comp1.setSelectedPlugout(opts[1]);	// get the selectedPlugout line
			setWireFromConnectorToGate(comp2, comp1.getPlugout(opts[1]).getPoints()[1], comp2.getPlugin(opts[0]).getPoints()[0], opts[1], opts[0]); // make the connection
		}
		else if (comp1.getFunc() == "connection" && comp2.getFunc() == "connection") { // if from connector to connector; opts = [ plugoutNumOfConnecotr ]
			comp1.setSelectedPlugout(opts[0]);	// get the selectedPlugout line
			setWireFromConnectorToConnector(comp2, comp1.getPlugout(opts[0]).getPoints()[1], comp2.getPlugin().getPoints()[0], opts[0]);	// make the connection
		}
		
		mainLayer.drawScene();	// refresh the scene
	}
	
	//------------------------------------
	//----- AND & DELETE FUNCTIONS -------
	//------------------------------------
	
	function addOrGate(initX, initY) {
		console.log(initX + " ," + initY);
		var orGate = new OrGate(initX, initY, "Or Gate", nextID++, setup);
		components.push(orGate);
		registerComponent(orGate);
		orGate.draw();
	}
	
	function addAndGate(initX, initY) {
		var andGate = new AndGate(initX, initY, "And Gate", nextID++, setup);
		components.push(andGate);
		registerComponent(andGate);
		andGate.draw();
	}
	
	function addNotGate(initX, initY) {
		var notGate = new NotGate(initX, initY, "Not Gate", nextID++, setup);
		components.push(notGate);
		registerComponent(notGate);
		notGate.draw();
	}
	
	function addConnector(initX, initY) {
		var conn = new Connector(initX, initY, "Connector", nextID++, setup);
		components.push(conn);
		registerComponent(conn);
		conn.draw();
	}
	
	function deleteGate(gate) {
		if (gate.getType() == "and" || gate.getType() == "or") deleteANDORGate(gate);
		else deleteNotGate(gate);
		
		evaluateCircuit();
		stage.draw();
	}
	
	function deleteANDORGate(gate) {
		var flag = false;
		
		for (var i = 1; i < 3; i++) {
			var comp = gate.getPluginComp(i);
			if (comp !== null) {
				if (comp.getType() == "connector") {
					var plugoutNum = comp.getPlugoutToComp(gate);
					if (plugoutNum.length == 2) {
						for (var j = 0; j < 2; j++) {
							comp.getPlugoutWire(plugoutNum[j]).disableStroke();
							comp.setPlugoutWire(plugoutNum[j], null);
							comp.setPlugoutComp(plugoutNum[j], null);
							flag = true;
						}
					}
					else {
						comp.getPlugoutWire(plugoutNum[0]).disableStroke();
						comp.setPlugoutWire(plugoutNum[0], null);
						comp.setPlugoutComp(plugoutNum[0], null);
					}
				}
				else {
					comp.getPlugoutWire().disableStroke();
					comp.setPlugoutWire(null);
					comp.setPlugoutComp(null);
				}
			}
			
			if (flag) break;
		}
		
		var comp = gate.getPlugoutComp();
		if (comp !== null) {
			if (comp.getType() == "and" || comp.getType() == "or") {
				comp.setPluginCompNull(gate);
			}
			else {
				comp.setPluginCompNull();
			}
			gate.getPlugoutWire().disableStroke();
		}
		
		removeComp(gate);
		stopListeners(gate);
		gate.getGroup().destroy();
		mainLayer.drawScene();
	}
	
	function deleteNotGate(gate) {
		var comp = gate.getPluginComp();
		if (comp !== null) {
			if (comp.getType() == "connector") {
				var plugout = comp.getPlugoutToComp(gate);
				comp.getPlugoutWire(plugout).disableStroke();
				comp.setPlugoutWire(plugout, null);
				comp.setPlugoutComp(plugout, null);
			}
			else {
				comp.getPlugoutWire().disableStroke();
				comp.setPlugoutWire(null);
				comp.setPlugoutComp(null);
			}
		}
		
		comp = gate.getPlugoutComp();
		if (comp !== null) {
			if (comp.getType() == "and" || comp.getType() == "or") {
				comp.setPluginCompNull(gate);
			}
			else {
				comp.setPluginCompNull();
			}
			gate.getPlugoutWire().disableStroke();
		}
		
		removeComp(gate);
		stopListeners(gate);
		gate.getGroup().destroy();
		mainLayer.drawScene();
	}
	
	function deleteConnector(connect) {
		var comp = connect.getPluginComp();
		if (comp !== null) {
			if (comp.getType() == "connector") {
				var plugout = comp.getPlugoutToComp(connect);
				comp.getPlugoutWire(plugout).disableStroke();
				comp.setPlugoutWire(plugout, null);
				comp.setPlugoutComp(plugout, null);
			}
			else {
				comp.getPlugoutWire().disableStroke();
				comp.setPlugoutWire(null);
				comp.setPlugoutComp(null);
			}
		}
		
		for (var i = 0; i < 3; i++) {
			comp = connect.getPlugoutComp(i);
			if (comp !== null) {
				if (comp.getType() == "and" || comp.getType() == "or") {
					comp.setPluginCompNull(connect);
				}
				else {
					comp.setPluginCompNull();
				}
				connect.getPlugoutWire(i).disableStroke();
			}
		}
		
		removeComp(connect);
		stopListeners(connect);
		connect.getGroup().destroy();
		mainLayer.drawScene();
		evaluateCircuit();
		stage.draw();
	}
	
	function addInput(initX, initY, text, value) {
		input = new InputNode(initX, initY, text, value, "Input Node", nextID++, setup);
		components.push(input);
		inputs.push(input);
		registerComponent(input);
		input.draw();
	}
	
	function addOutput(initX, initY, text) {
		output = new OutputNode(initX, initY, text, "Output Node", nextID++, setup);
		components.push(output);
		outputs.push(output);
		registerComponent(output);
		output.draw();
	}
	
	//------------------------------------
	//--------- MISC FUNCTIONS -----------
	//------------------------------------
	
	/*
	*	getWirePoints()
	*
	*	This function returns an array with four points to be used in drawing a wire. The points make up a zig zag line which breaks down into
	*	three separate lines. "start" is the starting point of the line: "end" is the end point of the line. The ending points array will look
	*	like this: [ start.x, start.y, middle.x, start.y, middle.x, end.y, end.x, end.y ]; These points make a zig zag from start to end.
	*/
	function getWirePoints(start, end) {
		points = [];							// null the points array
		points.push(start.x, start.y);			// push start.x, start.y
		var xMed = (points[0] + end.x) / 2;		// comput the middle x
		points.push(xMed, start.y);				// push middle.x, start.y
		points.push(xMed, end.y);				// push middle.x, end.y
		points.push(end.x, end.y);				// push end.x, end.y
		return points;							// return the array
	}
	
	/*
	*	getWirePoints2()
	*
	*	This function returns an array with three points to be used in drawing a wire. It is called ONLY from the vertical plugout lines of a
	*	connector (plugout1 and plugout3). The first horizontal portion of the line is not necessary for the plugout lines of a connector
	*	that are already vertical. So, we simply make the poins array to look like: [ start.x, start.y, start.x, end.y, end.x, end.y ]
	*/
	function getWirePoints2(start, end) {
		points = [];						// null the points array
		points.push(start.x, start.y);		// push start.x, start.y
		points.push(start.x, end.y);		// push start.x, end.y
		points.push(end.x, end.y);			// push end.x, end.y
		return points;						// return the array
	}
	
	// simply compute the Euclidean distance between points p1 and p2
	function distance(p1, p2) {
		return Math.sqrt(Math.pow(p2.y * scale - p1.y * scale, 2) + Math.pow(p2.x * scale - p1.x * scale, 2));
	}
	
	function stopListeners(comp) {
		comp.getGroup().off('click');
		comp.getGroup().off('dragmove');
		comp.getGroup().off('mouseover');
		comp.getGroup().off('mouseout');
	}
	
	function evaluateCircuit() {
		var flag = false;
		var truthTableArr = [];
		
		var numRows = Math.pow(2, inputs.length);
		
		for (var i = 0; i < numRows; i++) {
			var num = i.toString(2);
			var str = "";
			if (num.length != inputs.length) {
				for (var j = 0; j < inputs.length - num.length; j++) str += "0";
			}
			str += num;
			var row = [];
			for (var j = 0; j < inputs.length; j++) {
				row.push(str[j]);
			}
			truthTableArr.push(row);
		}

		var logStr = "";
		for (var i = 0; i < truthTableArr.length; i++) {
			for (var j = 0; j < inputs.length; j++) {
				inputs[j].setValue(truthTableArr[i][j]);
				inputs[j].evaluate();
			}
			for (var j = 0; j < outputs.length; j++) {
				if (outputs[j].getResult() == -1) truthTableArr[i].push("0");
				else truthTableArr[i].push(outputs[j].getResult());
				
				if (outputs[j].getResult() != -1) flag = true;
			}
		}
		
		truthTable.setTable(truthTableArr);
		truthTable.checkTruthTable(truthTableArr);	
	}
	
	function showAddMenu(event, pos) {
		addPopup = new PopupMenu();
		console.log("New menu!");
		addPopup.add('Add And Gate', function(target) {
			addAndGate(pos.x, pos.y);
		});
		addPopup.add('Add Or Gate', function(target) {
			addOrGate(pos.x, pos.y);
		});
		addPopup.add('Add Not Gate', function (target) {
			addNotGate(pos.x, pos.y);
		});
		addPopup.addSeparator();
		addPopup.add('Add Connector', function(target) {
			addConnector(pos.x, pos.y);
		});
		addPopup.setSize(140, 0);
		addPopup.show(event);
	}
	
	function showDeleteMenu(event, gate) {
		deletePopup = new PopupMenu();
		deletePopup.add('Delete Gate', function(target) {
			if (gate.getFunc() == "node") { alert("You cannot delete an input/output node."); return; }
			deleteGate(gate);
		});
		deletePopup.addSeparator();
		deletePopup.add('Boolean Probe', function(target) {
			probe(gate);
		});
		deletePopup.setSize(140, 0);
		deletePopup.show(event);
	}
	
	function removeComp(comp) {
		var ind = components.indexOf(comp);
		components.splice(ind, 1);
	}
	
	this.redrawComps = redrawComps;
	function redrawComps() {
		for (var i = 0; i < components.length; i++) {
			components[i].redraw();
		}
		stage.draw();
	}
}