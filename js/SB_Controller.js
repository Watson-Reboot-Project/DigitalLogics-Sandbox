/**************************************************************************************
*	Author:		Neil Vosburg, Du Tong, Benjamin Beach
*	Class:		Controller.js
*	Date:		2/26/2014
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

function SB_Controller(setup, truthTable, serializer, numInputs, numOutputs, containerNum) {

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE DECLARATIONS/DEFINITIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

	var connecting = false;						// keeps track if the controller is in "connecting mode" where one component is selected to be connected to another
	var components = [];						// array of components on the canvas including input/output nodes
	var inputs = [];							// array of input nodes
	var outputs = [];							// array of output nodes
	var points = [];							// reused throughout the code to create points for wires (lines)
	var selectedComp = null;					// when connecting two components together, the first component that is selected will be stored here
	var tempLine = null;						// used to store points to line that follows mouse when in connecting mode
	var nextID = 0;								// the ID of that the next component will have
	var addPopup = null;						// the add popup object (null unless it is being shown)
	var deletePopup = null;						// the delete popup object (null unless it is being shown)
	var wrenchPopup = null;						// the wrench popup object (null unless it is being shown)
	var probeMode = false;						// flag to indicate if the controller is in boolean probe mode
	var selectedPlug = null;					// used throughout the controller to indicate what plug the user has selected on the selected gate
	var warningWire = null;						// stores the wire that turns yellow when the user mouses over a connection (wire)
	var selectedPlugNum = 0;					// the number of the selected plug
	var deleteMode = false;						// indicates if the controller is in delete mode
	var truthTableOpen = false;					// boolean value to indicate if the truth table is currently open
	var thisObj = this;							// stores the object of the controller class
	var wrenchImg = new Image();				// make an image object for the wrench
	
	var mainLayer = setup.getMainLayer();		// get the main layer from the setup class
	var stage = setup.getStage();				// get the stage object from the setup class
	var bg = setup.getBG();						// get the background rectangle from the setup class
	
	var wrenchLayer = setup.getWrenchLayer();	// get the wrench image layer from the setup class
	var trashLayer = setup.getTrashLayer();		// get the trash can image layer from the setup class
	
	var tempLineLayer = new Kinetic.Layer();	// create a layer to place the temp line on
	stage.add(tempLineLayer);					// add the temp line layer to the stage
	tempLine = new Kinetic.Line();				// create an object for the temp line
	tempLine.setPoints([0, 0, 0, 0]);			// ... with the start and end points (0, 0)
	tempLineLayer.add(tempLine);				// add the temp line to the temp line layer
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; PUBLIC FUNCTION DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	this.registerComponent = registerComponent;				// register a new component
	this.deleteComponent = deleteComponent;					// delete a component
	
	// non-sand box functions
	this.connectComponents = connectComponents;				// programmatically set a connection
	this.updateNumberOfInputs = updateNumberOfInputs;		// update number of inputs
	this.updateNumberOfOutputs = updateNumberOfOutputs;		// update number of outputs
	this.evaluateCircuit = evaluateCircuit;					// evaluate the circuit to update the truth table
	
	//add & delete functions
	this.addComponent = addComponent;						// add a component
	this.addAndGate = addAndGate;							// add AND gate
	this.addOrGate = addOrGate;								// add OR gate
	this.addNotGate = addNotGate;							// add NOT gate
	this.addConnector = addConnector;						// add CONNECTOR
	this.deleteGate = deleteGate;							// delete a gate
	this.deleteConnecor = deleteConnector;					// delete a connector
	this.addInput = addInput;								// add an input node
	this.addOutput = addOutput;								// add an output node
	
	this.initTruthTableListeners = initTruthTableListeners;
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; INITIAL SETUP ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	// serialize the circuit before every page unload
	window.addEventListener("beforeunload", function(e){
	   serializer.serialize(components, inputs, outputs);
	}, false);

	// this event listener is used to draw the line that follows the mouse when in connecting mode
	stage.on('mousemove touchmove', function() {
		stageMouseMove();
		mainLayer.draw();
	});
	
	// call bgClick() when the user clicks on the background
	bg.on('click tap', function(event) {
		bgClick(event);
	});

	// call bgMouseUp() when the user mouse ups on the background
	bg.on('mouseup touchend', function() {
		bgMouseUp();
		
		// if a temp line exists, remove it on every mouse up
		if (tempLine !== null) {
			tempLine.remove();
			tempLine = null;
			tempLineLayer.draw();
		}
		//mainLayer.draw();
	});
	
	wrenchImg.src = "wrench.ico";						// set the HTML image source to the wrench icon
	setTrashImage("trash_closed.bmp");					// initially set the trash can to closed
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION IMPLEMENTATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	/*
	*	registerComponent()
	*
	*	This function is called to register a component with the controller. Event listeners are set accordingly.
	*	Every component has transparent rectangles that surround their input/output pins. These are refered to as
	*	"inputBoxes" and "outputBoxes". An input box surrounds a components input pin; an output box surrounds a
	*	components output pin. This makes it easy for users to make connections on gates. Each input/output box has
	*	four listeners: mouseenter, mouseleave, mouseup, mousedown.
	*		1. inputMouseEnter: refers to when the user's mouse enters the component's input box (analogous to outputBox)
	*		2. inputMouseLeave: refers to when the user's mouse leaves the component's input box (analogous to outputBox)
	*		3. inputMouseDown:	refers to when the user 'mouses down' on a input box (analogous to outputBox)
	*		4. inputMouseUp:	refers to when the user 'mouses up' on an input box (analogous to outputBox)
	*
	*	The registerComponent() function registers these listeners to each new component. Depending on what that component
	*	is, there may be multiple input boxes (AND/OR gate) or multiple output boxes (connector).
	*/
	function registerComponent(comp)
	{
		// regardless of the component, they all need the same mouseup function on the component's group (main gate shape)
		comp.getGroup().on('mouseup touchend', function() {
			if (connecting) {
				tempLine.remove();
				tempLine = null;
				selectedComp = null;
				connecting = false;
				tempLineLayer.draw();
			}
		});
		
		if (comp.getFunc() == "connection") {									// if this component is a connector
			comp.getInputBox().on('mousedown touchstart', function(event) {		// add the mouse down event for the connector's input box
				connectorInputBoxMouseDown(event, comp);						// pass the event and the connector to this associated function
				mainLayer.draw();												// update the main layer after the function
			});
			comp.getInputBox().on('mouseup touchend', function(event) {			// add the mouse up event for the connector's input box
				connectorInputBoxMouseUp(event, comp);							// pass the event and the connector to this associated function
				mainLayer.draw();												// update the main layer
				setTimeout(evaluateCircuit, 50);								// in 50 milliseconds, re-evaluate the circuit (to make the lag associated with evaluating the circuit un-noticeable)
			});
			comp.getInputBox().on('mouseenter', function(event) {				// add the mouse enter event for the connector's input box
				connectorInputBoxMouseEnter(event, comp);						// pass the event and the connector to this associated function
				mainLayer.draw();												// update the main layer
			});
			comp.getInputBox().on('mouseleave', function(event) {				// add the mouse leave event for the connector's input box
				connectorInputBoxMouseLeave(event, comp);						// add the event and the connector this associated function
				mainLayer.draw();												// update the main layer
			});
			
			// The connector has three outputs: hence three output boxes. Each output box needs a mousedown, mouseup, mouseenter, and mouseleave event associated with it.
			// We pass the number associated with that output to the associated function
			comp.getOutputBox(1).on('mousedown touchstart', function(event) { connectorOutputBoxMouseDown(event, comp, 1); mainLayer.draw();});
			comp.getOutputBox(1).on('mouseup touchend', function (event) { connectorOutputBoxMouseUp(event, comp, 1); mainLayer.draw(); setTimeout(evaluateCircuit, 50);});
			comp.getOutputBox(1).on('mouseenter touchend', function(event) { connectorOutputBoxMouseEnter(event, comp, 1); mainLayer.draw();});
			comp.getOutputBox(1).on('mouseleave touchend', function(event) { connectorOutputBoxMouseLeave(event, comp, 1); mainLayer.draw();});
			comp.getOutputBox(2).on('mousedown touchstart', function(event) { connectorOutputBoxMouseDown(event, comp, 2); mainLayer.draw();});
			comp.getOutputBox(2).on('mouseup touchend', function (event) { connectorOutputBoxMouseUp(event, comp, 2); mainLayer.draw(); setTimeout(evaluateCircuit, 50);});
			comp.getOutputBox(2).on('mouseenter touchend', function(event) { connectorOutputBoxMouseEnter(event, comp, 2); mainLayer.draw();});
			comp.getOutputBox(2).on('mouseleave touchend', function(event) { connectorOutputBoxMouseLeave(event, comp, 2); mainLayer.draw();});
			comp.getOutputBox(3).on('mousedown touchstart', function(event) { connectorOutputBoxMouseDown(event, comp, 3); mainLayer.draw();});
			comp.getOutputBox(3).on('mouseup touchend', function (event) { connectorOutputBoxMouseUp(event, comp, 3); mainLayer.draw(); setTimeout(evaluateCircuit, 50);});
			comp.getOutputBox(3).on('mouseenter touchend', function(event) { connectorOutputBoxMouseEnter(event, comp, 3); mainLayer.draw();});
			comp.getOutputBox(3).on('mouseleave touchend', function(event) { connectorOutputBoxMouseLeave(event, comp, 3); mainLayer.draw();});
			
			comp.getGroup().on('dragmove touchmove', function() {				// add a dragmove event to the connector (update the connections when the user drags the connector)
				connectorDrag(comp);											// pass the connector to the associated function
				mainLayer.draw();												// update the main layer
			});
			
			comp.getGroup().on('click tap', function() {						// add a click event to the connector (for deletion/boolean probe)
				connectorClick(comp);
				mainLayer.draw();
			});
			
			comp.getGroup().on('dragend', function() {							// add a dragend event to the connector (for connecting components whose input/output boxes overlap)
				connectorDragEnd(comp);
			});
		}
		else if (comp.getFunc() == "gate") {									// if the component is a gate...
			if (comp.getType() == "not") {										// if it's a NOT gate, only one input
			
				// apply mousedown, mouseup, mouseenter, and mouseleave listeners to the input box
				comp.getInputBox().on('mousedown touchstart', function(event) {
					gateInputBoxMouseDown(event, comp, 0);
					setTimeout(evaluateCircuit, 50);
				});
				comp.getInputBox().on('mouseup touchend', function(event) {
					gateInputBoxMouseUp(event, comp, 0);
					mainLayer.draw();
					setTimeout(evaluateCircuit, 50);
				});
				comp.getInputBox().on('mouseenter', function(event) {
					gateInputBoxMouseEnter(event, comp, 0);
					mainLayer.draw();
				});
				comp.getInputBox().on('mouseleave', function(event) {
					gateInputBoxMouseLeave(event, comp, 0);
					mainLayer.draw();
				});
			}
			else {															// else, it's an AND or OR gate
			
				// apply the four event listeners to both input boxes
				comp.getInputBox(1).on('mousedown touchstart', function(event) {
					gateInputBoxMouseDown(event, comp, 1);
					mainLayer.draw();
				});
				comp.getInputBox(1).on('mouseup touchend', function(event) {
					gateInputBoxMouseUp(event, comp, 1);
					mainLayer.draw();
					setTimeout(evaluateCircuit, 50);
				});
				comp.getInputBox(1).on('mouseenter', function(event) {
					gateInputBoxMouseEnter(event, comp, 1);
					mainLayer.draw();
				});
				comp.getInputBox(1).on('mouseleave', function(event) {
					gateInputBoxMouseLeave(event, comp, 1);
					mainLayer.draw();
				});
				
				comp.getInputBox(2).on('mousedown touchstart', function(event) {
					gateInputBoxMouseDown(event, comp, 2);
					mainLayer.draw();
				});
				comp.getInputBox(2).on('mouseup touchend', function(event) {
					gateInputBoxMouseUp(event, comp, 2);
					mainLayer.draw();
					setTimeout(evaluateCircuit, 50);
				});
				comp.getInputBox(2).on('mouseenter', function(event) {
					gateInputBoxMouseEnter(event, comp, 2);
					mainLayer.draw();
				});
				comp.getInputBox(2).on('mouseleave', function(event) {
					gateInputBoxMouseLeave(event, comp, 2);
					mainLayer.draw();
				});
			}
			
			// regardless if AND, OR, or NOT gate, they all have one output; apply the four event listeners to the output boxes
			comp.getOutputBox().on('mousedown touchstart', function(event) {
				gateOutputBoxMouseDown(event, comp);
				mainLayer.draw();
			});
			comp.getOutputBox().on('mouseup touchend', function(event) {
				gateOutputBoxMouseUp(event, comp);
				mainLayer.draw();
				setTimeout(evaluateCircuit, 50);
			});
			comp.getOutputBox().on('mouseenter', function(event) {
				gateOutputBoxMouseEnter(event, comp);
				mainLayer.draw();
			});
			comp.getOutputBox().on('mouseleave', function(event) {
				gateOutputBoxMouseLeave(event, comp);
				mainLayer.draw();
			});

			comp.getGroup().on('click tap', function (event) {			// for deletion/boolean probe
				gateClick(event, comp);
				mainLayer.draw();
			});
	
			comp.getGroup().on('dragmove touchmove', function() {		// for updating wires
				gateDrag(comp);
				mainLayer.draw();
			});
			
			comp.getGroup().on('dragend', function() {					// for connecting components whose input/output boxes overlap
				gateDragEnd(comp);
			});
			
		}
		else if (comp.getFunc() == "node") {							// if it's a node, it can either be a input or output node
		
			if (comp.getType() == "input") {							// an input node as only an output box; apply event listeners to it
				comp.getOutputBox().on('mousedown touchstart', function (event) {
					nodeOutputBoxMouseDown(event, comp);
					mainLayer.draw();
				});
				comp.getOutputBox().on('mouseup touchend', function (event) {
					nodeOutputBoxMouseUp(event, comp);
					mainLayer.draw();
					setTimeout(evaluateCircuit, 50);
				});
				comp.getOutputBox().on('mouseenter', function (event) {
					nodeOutputBoxMouseEnter(event, comp);
					mainLayer.draw();
				});
				comp.getOutputBox().on('mouseleave', function(event) {
					nodeOutputBoxMouseLeave(event, comp);
					mainLayer.draw();
				});
			}
			if (comp.getType() == "output") {						// an output node as only an input box; apply the event listeners to it
				comp.getInputBox().on('mousedown touchstart', function (event) {
					nodeInputBoxMouseDown(event, comp);
					mainLayer.draw();
				});
				comp.getInputBox().on('mouseup touchend', function (event) {
					nodeInputBoxMouseUp(event, comp);
					mainLayer.draw();
					setTimeout(evaluateCircuit, 50);
				});
				comp.getInputBox().on('mouseenter', function (event) {
					nodeInputBoxMouseEnter(event, comp);
					mainLayer.draw();
				});
				comp.getInputBox().on('mouseleave', function(event) {
					nodeInputBoxMouseLeave(event, comp);
					mainLayer.draw();
				});
			}
	
			comp.getGroup().on('dragmove touchmove', function() {	// unused since you can't drag nodes
				nodeDrag(comp);
				mainLayer.draw();
			});
			comp.getGroup().on('click tap', function() {			// for when you boolean probe/toggle input node values
				nodeClick(comp);
				mainLayer.draw();
			});
		}
	}
	
	//------------------------------------
	//--------- GATE LISTENERS -----------
	//------------------------------------
	
	/*
	*	gateInputBoxMouseDown()
	*
	*	If a user mouses down on a gate's input box, the user wants to connect this input box to a component's output box.
	*/
	function gateInputBoxMouseDown(event, gate, inputNum) {
		if (!connecting) {													// we really can't be in connecting mode if we mouse down on an input box, but we check anyway
			if (gate.getPluginComp(inputNum) !== null) {					// if the gate's plugin component isn't null, it's already connected to something; we must get rid of it first
				var connComp = gate.getPluginComp(inputNum);				// grab the connected component at this gate's plugin (number passed by parameter); if it's a NOT gate, this is ignored
				if (connComp.getType() == "connector") {					// if the connected component is a connector, we must get the plugout number that is connected to this gate
					var plugoutNum = gate.getConnectorPlugin(inputNum);		// grab the plugout number that this gate is connected to on the CONNECTOR
					connComp.deleteOutputConnection(plugoutNum);			// delete this connection
				}
				else connComp.deleteOutputConnection();						// otherwise, just delete the connection, because all other components just have one output
				evaluateCircuit();											// re-evaluate the circuit
			}
			
			// set the points array to the end point of this gate's plugin
			points = [gate.getPlugin(inputNum).getPoints()[0].x, gate.getPlugin(inputNum).getPoints()[0].y, gate.getPlugin(inputNum).getPoints()[0].x, gate.getPlugin(inputNum).getPoints()[0].y];			// set the points array from (0,0) to (0, 0); they will be set later
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});	// make a new line with these points
			tempLineLayer.add(tempLine);			// add the temp line to the temp line layer
			selectedComp = gate;					// set this gate as the selected component
			selectedPlugNum = inputNum;				// set the selected plug number to this plugin
			selectedPlug = "plugin" + inputNum;		// set the selected plug variable
			connecting = true;						// set the controller to connecting mode; this will tell the stageMouseMove() function to draw the temp line following the mouse
		}
	}
	
	/*
	*	gateInputBoxMouseUp()
	*
	*	If a user mouses up on a gate's input box, the user is potentially wanting to connect a component to this gate.
	*/
	function gateInputBoxMouseUp(event, gate, pluginNum) {
		if (connecting) {	// ensure that we are in connecting mode
			// if the selected component is this gate, the gate already has a component connected to this plugin, or if a loop will be introduced with this connection, cancel this connection
			if (selectedComp == gate || gate.getPluginComp(pluginNum) !== null || selectedPlug.indexOf("plugin") >= 0 || selectedComp.loopCheckBackward(gate) == true) {
				if (tempLine !== null) {	// remove the temporary line
					tempLine.remove();
					tempLineLayer.draw();
				}
				connecting = false;			// connecting is now false
				selectedComp = null;
				
				return false;				// return false; this connection wasn't successful
			}
			
			// if the selected component (the component we are trying to connect this gate to) has one output, use setWireFrom1OutTo1In()
			if (selectedComp.getFunc() == "gate" || selectedComp.getType() == "input") {
				setWireFromGateToGate(selectedComp, gate, pluginNum);	// sets the connection between the selected component and this gate
			}
			else if (selectedComp.getType() == "connector") {	// if the selected component is a connector, call setWireFromConnectorToGate()
				var plugoutNum = selectedPlugNum				// set selectedPlugNum will be the plugout number of the connector
				setWireFromConnectorToGate(selectedComp, gate, plugoutNum, pluginNum);	// set the connection from the connector to this gate
				gate.setConnectorPlugin(pluginNum, plugoutNum);	// set the connector plugin value for this gate (the plugout value of the connector)
			}
			
			if (pluginNum == 0) gate.setPlugColor("plugin", "default");	// if pluginNum is 0, this gate is a NOT gate; set the plugin color to the default color
			else gate.setPlugColor("plugin" + pluginNum, "default");	// otherwise, this gate is a OR/AND gate; set the specified plugin color the default color
			
			connecting = false;		// we are no longer in connection mode
			selectedComp = null;	// null the selected component
			
			return true;			// return true; this connection was successful
		}
	}
	
	/*
	*	gateInputBoxMouseEnter()
	*
	*	When the user's mouse enters an inputBox of this gate:
	*		1. If this input isn't connected to anything, turn the input plug green
	*		2. If this input is connected to something, turn the wire associated with this connection to yellow
	*/
	function gateInputBoxMouseEnter(event, comp, inputNum) {
		var inputString;								
		if (inputNum == 0) inputString = "plugin";		// if inputNum is 0, this is a NOT gate, use "plugin"
		else inputString = "plugin" + inputNum;			// if inputNum is 1 or 2, this is a AND/OR gate, use "plugout1" or "plugout2"

		if (comp.getPluginComp(inputNum) === null) {					// if this plugin is not connected to anything
			if (!connecting) comp.setPlugColor(inputString, "green");	// ... and we are not connecting, turn it green
			if (connecting && selectedPlug.indexOf("plugout") >= 0) {	// if we are connecting AND the selected plug is a plugout (we cannot connect a plugin to a plugin, for example)
				comp.setPlugColor(inputString, "green");				// change the plug to green
				tempLine.setStroke("green");							// also set the temp line to green
			}
		}
		else {					// else, the plugin is connected to something
			if (!connecting) {	// if we are not in connection mode
				if (comp.getPluginComp(inputNum).getType() != "connector") {		// if the component this gate is connected to isn't a connector, set the plugout only plugout wire to yellow
					comp.getPluginComp(inputNum).setPlugoutWireColor("yellow");		// set it yellow
				}
				else {			// else, we the connected component is a connector, we must get the plugout associated with that connector
					var plugoutNum = comp.getConnectorPlugin(inputNum);							// get the plugout number
					comp.getPluginComp(inputNum).setPlugoutWireColor(plugoutNum, "yellow");		// turn it yellow
				}
			}
		}
	}
	
	/*
	*	gateInputBoxMouseLeave()
	*
	*	When the user's mouse leaves an inputBox of this gate:
	*		1. If this output isn't connected to anything, make the input color its default color
	*		2. If this output is connected to something, make the wire associated with this connection its default color
	*/
	function gateInputBoxMouseLeave(event, comp, inputNum) {
		var inputString;
		if (inputNum == 0) inputString = "plugin";		// if inputNum is 0, this is a NOT gate, use "plugin"
		else inputString = "plugin" + inputNum;			// if inputNum is 1 or 2, this is a AND/OR gate, use "plugout1" or "plugout2"
		
		comp.setPlugColor(inputString, "default");		// set the associated plugin to default color
		
		if (connecting) tempLine.setStroke("black");									// if we are connecting, set the temp line color to black
		else {																			// otherwise, if we are not connecting ...
			if (comp.getPluginComp(inputNum) !== null) {								// if this plugin isn't connected to a component ...
				if (comp.getPluginComp(inputNum).getType() != "connector") {			// if the connected component is not a connector
					comp.getPluginComp(inputNum).setPlugoutWireColor("default");		// set the one plugout wire to default
				}
				else {																	// otherwise, the connected component is a connector
					var plugoutNum = comp.getConnectorPlugin(inputNum);					// obtain the plugout number of the connector of this connection
					comp.getPluginComp(inputNum).setPlugoutWireColor(plugoutNum, "default");	// set the plug color to default
				}
			}
		}
	}
	
	/*
	*	gateOutputBoxMouseDown()
	*
	*	When the user mouses down on a gate's output box, the user is potentially wanting to connect this gate to another.
	*/
	function gateOutputBoxMouseDown(event, gate) {
		if (!connecting) {							// if we are not connecting already
			
			if (gate.getPlugoutComp() !== null) {	// if this gate's output is already connecting to something, get rid of it first
				gate.deleteOutputConnection();		// delete the plugout wire and plugout comp; continue drawing temp line
				evaluateCircuit();					// re-evaluate the circuit for the truth table
			}
			// set the points array to the endpoint of this gate's plugout
			points = [gate.getPlugout().getPoints()[1].x, gate.getPlugout().getPoints()[1].y, gate.getPlugout().getPoints()[1].x, gate.getPlugout().getPoints()[1].y];			// set the points array from (0,0) to (0, 0); they will be set later
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});	// make a new line with these points
			tempLineLayer.add(tempLine);					// add this line to the temp line layer so it can be drawn
			selectedComp = gate;							// set this gate as the selected component
			selectedPlug = "plugout";						// set the selected plug string
			gate.setPlugColor("plugout", "default");		// set the plug color of this plugout to its default color
			connecting = true;								// we are not connecting
		}
	}
	
	function gateOutputBoxMouseUp(event, gate) {
		if (connecting) {
			
			if (selectedComp == gate || gate.getPlugoutComp() !== null || selectedPlug.indexOf("plugout") >= 0 || selectedComp.loopCheckForward(gate)) {
				if (tempLine !== null) {
					tempLine.remove();
					tempLineLayer.draw();
				}
				connecting = false;
				selectedComp = null;
				
				return false;
			}
			
			if (selectedComp.getType() == "not" || selectedComp.getType() == "output" || selectedComp.getType() == "connector") {
				// set wire from the plugout of the gate we are clicking now to a one input component
				setWireFromGateToGate(gate, selectedComp, 0);
			}
			else {
				// set wire from the plugout of the gate we are clicking now to a multiple input component (or/and gate)
				var pluginNum = selectedPlugNum;
				setWireFromGateToGate(gate, selectedComp, pluginNum);
			}
		
			gate.setPlugColor("plugout", "default");
		
		
			tempLineLayer.draw();
			tempLine = null;
			connecting = false;		// we are no longer in connection mode
			selectedComp = null;	// null the selected component
			
			return true;
		}
	}
	
	
	function gateOutputBoxMouseEnter(event, comp, inputNum) {
		if (comp.getPlugoutComp() === null) {
			if (!connecting) comp.setPlugColor("plugout", "green");
			if (connecting && selectedPlug.indexOf("plugin") >= 0) {
				comp.setPlugColor("plugout", "green");
				tempLine.setStroke("green");
			}
		}
		else {
			if (!connecting) {
				comp.setPlugoutWireColor("yellow");
			}
		}
	}
	
	function gateOutputBoxMouseLeave(event, comp) {
		comp.setPlugColor("plugout", "default");
		if (connecting) tempLine.setStroke("black");
		else {
			if (comp.getPlugoutComp() !== null) {
				comp.setPlugoutWireColor("default");
			}
		}
	}
	
	function gateClick(event, gate) {
		if (probeMode) {
			probe(gate);
			probeMode = false;
			setComponentMouseOver("pointer");
		}
		
		if (deleteMode) {
			deleteGate(gate);
		}
	}
	
	function gateDragEnd(gate) {
		var thisInput1Box = gate.getInputBoxCoords(1);
		var thisInput2Box = gate.getInputBoxCoords(2);
		var thisInputBox = [ thisInput1Box, thisInput2Box ];
		var thisOutput1Box = gate.getOutputBoxCoords();
		var thisOutputBox = [ thisOutput1Box ];
		
		for (var i = 0; i < components.length; i++) {
			var comp = components[i];
			if (comp == gate) continue;
			
			var thatInputBox;
			var thatOutputBox;
			
			var thatInput1Box;
			var thatInput2Box;
			var thatOutput1Box;
			var thatOutput2Box;
			var thatOutput3Box;
			
			if (comp.getFunc() == "gate" || comp.getFunc() == "node") {
				thatInput1Box = comp.getInputBoxCoords(1);
				thatInput2Box = comp.getInputBoxCoords(2);
				thatInputBox = [ thatInput1Box, thatInput2Box ];
				
				thatOutput1Box = comp.getOutputBoxCoords();
				thatOutputBox = [ thatOutput1Box ];
			}
			else {
				thatInput1Box = comp.getInputBoxCoords(1);
				thatInputBox = [ thatInput1Box ];
				
				thatOutput1Box = comp.getOutputBoxCoords(1);
				thatOutput2Box = comp.getOutputBoxCoords(2);
				thatOutput3Box = comp.getOutputBoxCoords(3);
				thatOutputBox = [ thatOutput1Box, thatOutput2Box, thatOutput3Box ];
			}
			
			inputIntersectOutput(thatOutputBox, thisInputBox, gate, comp);
			outputIntersectInput(thisOutputBox, thatInputBox, gate, comp);
		}
	}
	
	function inputIntersectOutput(thatOutputBox, thisInputBox, thisComp, thatComp) {
		if (thatComp.getType() == "output") return;
		
		var trueResults = [];
		var pluginNum;
		var plugoutNum;
		
		var iters = (thisComp.getType() == "not" || thisComp.getType() == "connector") ? 1 : 2;
		
		for (var i = 0; i < iters; i++) {
		
			if (thisComp.getPluginComp(i+1) !== null) continue;
			if (thatComp.getType() == "output") break;
			
			for (var j = 0; j < thatOutputBox.length; j++) {
				if (thatComp.getPlugoutComp(j+1) !== null) continue;
				
				if (thatOutputBox[j].x1 < thisInputBox[i].x2 && thatOutputBox[j].x2 > thisInputBox[i].x1 && thatOutputBox[j].y1 < thisInputBox[i].y2 && thatOutputBox[j].y2 > thisInputBox[i].y1) {
					trueResults.push([i+1, j+1]);
				}
			}
		}
		
		if (trueResults.length == 0) {
			return;
		}
		else if (trueResults.length == 1) {
			pluginNum = trueResults[0][0];
			plugoutNum = trueResults[0][1];
		}
		else {
			var shortest = distance(thisComp.getPlugin(trueResults[0][0]).getPoints()[0], thatComp.getPlugout(trueResults[0][1]).getPoints()[1]);
			pluginNum = trueResults[0][0];
			plugoutNum = trueResults[0][1];
			for (var i = 1; i < trueResults.length; i++) {
				var dist = distance(thisComp.getPlugin(trueResults[i][0]).getPoints()[0], thatComp.getPlugout(trueResults[i][1]).getPoints()[1]);
				if (dist < shortest) {
					dist = shortest;
					pluginNum = i+1;
					plugoutNum = j+1;
				}
			}
		}
		
		selectedComp = thisComp;
		selectedPlugNum = pluginNum;
		selectedPlug = "plugin" + pluginNum;
		connecting = true;
		var res;
		if (thatComp.getType() == "connector") res = connectorOutputBoxMouseUp(null, thatComp, plugoutNum);
		else res = gateOutputBoxMouseUp(null, thatComp, plugoutNum);
		
		if (res) evaluateCircuit();
	}
	
	function outputIntersectInput(thisOutputBox, thatInputBox, thisComp, thatComp, outputNum) {
		var trueResults = [];
		var pluginNum;
		var plugoutNum;
		
		if (thatComp.getType() == "input") return;
		
		for (var i = 0; i < 2; i++) {
			if ((thatComp.getType() == "connector" || thatComp.getType() == "not" || thatComp.getType() == "output") && i == 1) break;
			if (thatComp.getPluginComp(i+1) !== null) continue;
			
			for (var j = 0; j < thisOutputBox.length; j++) {
				if (thisComp.getPlugoutComp(j+1) !== null) continue;
				if (thisOutputBox[j].x1 < thatInputBox[i].x2 && thisOutputBox[j].x2 > thatInputBox[i].x1 && thisOutputBox[j].y1 < thatInputBox[i].y2 && thisOutputBox[j].y2 > thatInputBox[i].y1) {
					trueResults.push([i+1, j+1]);
				}
			}
		}
		
		if (trueResults.length == 0) {
			return
		}
		else if (trueResults.length == 1) {
			pluginNum = trueResults[0][0];
			plugoutNum = trueResults[0][1];
		}
		else {
			var shortest = distance(thisComp.getPlugout(trueResults[0][1]).getPoints()[0], thatComp.getPlugin(trueResults[0][0]).getPoints()[1]);
			pluginNum = trueResults[0][0];
			plugoutNum = trueResults[0][1];
			for (var i = 1; i < trueResults.length; i++) {
				var dist = distance(thisComp.getPlugout(trueResults[i][1]).getPoints()[0], thatComp.getPlugin(trueResults[i][0]).getPoints()[1]);
				if (dist < shortest) {
					dist = shortest;
					pluginNum = i + 1;
					plugoutNum = j + 1;
				}
			}
		}
		
		selectedComp = thisComp;
		selectedPlugNum = plugoutNum;
		selectedPlug = "plugout";
		connecting = true;
		var res;
		
		if (thatComp.getType() == "connector") res = connectorInputBoxMouseUp(null, thatComp);
		else res = gateInputBoxMouseUp(null, thatComp, pluginNum);
		if (res) evaluateCircuit();
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
		
		gate.drawBoxes();
		if (deleteMode == true) {
			gate.setDeleteIcon("delete.ico");
		}
		
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
	}
	
	//------------------------------------
	//------ CONNECTOR LISTENERS ---------
	//------------------------------------

	function connectorInputBoxMouseDown(event, connect) {
		if (!connecting) {
			if (connect.getPluginComp() !== null) {
				var connComp = connect.getPluginComp();
				if (connComp.getType() == "connector") {
					var plugoutComp = connComp.getPlugoutToComp(connect);
					connComp.deleteOutputConnection(plugoutComp);
				}
				else connComp.deleteOutputConnection();
				
				evaluateCircuit();
			}

			points = [ connect.getPlugin().getPoints()[0].x, connect.getPlugin().getPoints()[0].y, connect.getPlugin().getPoints()[0].x, connect.getPlugin().getPoints()[0].y ];

		
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			tempLineLayer.add(tempLine);
			selectedPlug = "plugin";
			selectedComp = connect;			// set this gate as the selected component
			connecting = true;				// set the controller to connecting mode
		}
	}
	
	function connectorInputBoxMouseUp(event, connect) {
		if (connecting) {
			if (selectedComp == connect || connect.getPluginComp() !== null || selectedComp.loopCheckBackward(connect) == true) {
				if (tempLine !== null) {
					tempLine.remove();
					tempLineLayer.draw();
				}
				connecting = false;
				selectedComp = null;
				return false;
			}
			
			if (selectedPlug.indexOf("plugin") < 0) {			
				if (selectedComp.getType() == "connector") {				// if the selected component is a connector,
					var selPlugout = selectedComp.getSelectedPlugout();		// get the selected plugout for that connector
					setWireFromConnectorToConnector(selectedComp, connect, selPlugout);	// make the connection
				}
				else {	// else, the selected component is not a connector, it's a gate
					setWireFromGateToConnector(selectedComp, connect);	// make the connection
				}
			}
			
			connecting = false;
			selectedComp = null;
			selectedPlug = null;
			
			return true;
		}
	}
	
	function connectorInputBoxMouseEnter(event, comp) {
		if (comp.getPluginComp() === null) {
			if (!connecting) comp.setPlugColor("plugin", "green");
			if (connecting && selectedPlug.indexOf("plugout") >= 0)	{
				comp.setPlugColor("plugin", "green");
				tempLine.setStroke("green");			
			}
		}
		else {
			if (!connecting) {
				if (comp.getPluginComp().getType() != "connector") comp.getPluginComp().setPlugoutWireColor("yellow");
				else {
					var plugoutNum = comp.getPluginComp().getPlugoutToComp(comp);
					comp.getPluginComp().setPlugoutWireColor(plugoutNum, "yellow");
				}
			}
		}
	}
	
	function connectorInputBoxMouseLeave(event, comp) {
		comp.setPlugColor("plugin", "default");
		if (connecting) tempLine.setStroke("black");
		else {
			if (comp.getPluginComp() !== null) {
				if (comp.getPluginComp().getType() != "connector") comp.getPluginComp().setPlugoutWireColor("default");
				else {
					var plugoutNum = comp.getPluginComp().getPlugoutToComp(comp);
					comp.getPluginComp().setPlugoutWireColor(plugoutNum, "default");
				}
			}
		}
	}
	
	function connectorOutputBoxMouseDown(event, connect, plugoutNum) {
		if (!connecting) {
			if (connect.getPlugoutWire(plugoutNum) !== null) {
				connect.deleteOutputConnection(plugoutNum);
				evaluateCircuit();
			}
			
			points = [ connect.getPlugout(plugoutNum).getPoints()[1].x, connect.getPlugout(plugoutNum).getPoints()[1].y, connect.getPlugout(plugoutNum).getPoints()[1].x, connect.getPlugout(plugoutNum).getPoints()[1].y ];
			connect.setSelectedPlugout(plugoutNum);			// set this plugout selected within this connector (very important)
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			tempLineLayer.add(tempLine);
			selectedPlug = "plugout" + plugoutNum;
			selectedPlugNum = plugoutNum;
			selectedComp = connect;			// set this gate as the selected component
			connecting = true;				// set the controller to connecting mode
		}
	}
	
	function connectorOutputBoxMouseUp(event, connect, plugoutNum) {
		if (connecting) {
			if (selectedComp == connect || connect.getPlugoutComp(plugoutNum) !== null || connect.loopCheckBackward(selectedComp) == true) {
				if (tempLine !== null) {
					tempLine.remove();
					tempLineLayer.draw();
				}
				connecting = false;
				selectedComp = null;
				
				return false;
			}
			
			if (selectedPlug.indexOf("plugout") < 0) {
				if (selectedComp.getType() == "connector") {
					// setting connection from a connector's input to this connectors output
					setWireFromConnectorToConnector(connect, selectedComp, plugoutNum);
				}
				else if (selectedComp.getType() == "not" || selectedComp.getType() == "output") {
					// setting connection from a NOT's input or an output node's input to this connectors output
					setWireFromConnectorToGate(connect, selectedComp, plugoutNum, 0);
				}
				else {
					// setting connection from an OR or AND gate's input to this connectors output
					var pluginNum = parseFloat(selectedPlug.charAt(selectedPlug.length - 1));
					console.log("Plugin num: " + pluginNum + ":: " + selectedPlug);
					setWireFromConnectorToGate(connect, selectedComp, plugoutNum, pluginNum);
				}
			}
			
			connecting = false;
			selectedComp = null;
			
			return true;
		}
	}
	
	function connectorOutputBoxMouseEnter(event, comp, plugoutNum) {
		if (comp.getPlugoutComp(plugoutNum) === null) {
			if (!connecting) comp.setPlugColor("plugout" + plugoutNum, "green");
			if (connecting && selectedPlug.indexOf("plugin") >= 0) {
				comp.setPlugColor("plugout" + plugoutNum, "green");
				tempLine.setStroke("green");
			}
		}
		else {
			comp.setPlugoutWireColor(plugoutNum, "yellow");
		}
	}
	
	function connectorOutputBoxMouseLeave(event, comp, plugoutNum) {
		comp.setPlugColor("plugout" + plugoutNum, "default");
		if (connecting) tempLine.setStroke("black");
		else {
			if (comp.getPlugoutComp(plugoutNum) !== null) comp.setPlugoutWireColor(plugoutNum, "default");
		}
	}
	
	function connectorClick(connect) {
		if (addPopup !== null) { addPopup.hide(); addPopup = null; return; }
		if (deletePopup !== null) { deletePopup.hide(); deletePopup = null; return; }
		if (deleteMode == true) deleteConnector(connect);
	}
	
	function connectorDragEnd(connect) {
		var thisInput1Box = connect.getInputBoxCoords(1);
		var thisInputBox = [ thisInput1Box ];
		var thisOutput1Box = connect.getOutputBoxCoords(1);
		var thisOutput2Box = connect.getOutputBoxCoords(2);
		var thisOutput3Box = connect.getOutputBoxCoords(3);
		var thisOutputBox = [ thisOutput1Box, thisOutput2Box, thisOutput3Box ];
		
		for (var i = 0; i < components.length; i++) {
			var comp = components[i];
			if (comp == connect) continue;
			
			var thatInputBox;
			var thatOutputBox;
			
			var thatInput1Box;
			var thatInput2Box;
			var thatOutput1Box;
			var thatOutput2Box;
			var thatOutput3Box;
			
			if (comp.getFunc() == "gate" || comp.getFunc() == "node") {
				thatInput1Box = comp.getInputBoxCoords(1);
				thatInput2Box = comp.getInputBoxCoords(2);
				thatInputBox = [ thatInput1Box, thatInput2Box ];
				
				thatOutput1Box = comp.getOutputBoxCoords();
				thatOutputBox = [ thatOutput1Box ];
			}
			else {
				thatInput1Box = comp.getInputBoxCoords(1);
				thatInputBox = [ thatInput1Box ];
				
				thatOutput1Box = comp.getOutputBoxCoords(1);
				thatOutput2Box = comp.getOutputBoxCoords(2);
				thatOutput3Box = comp.getOutputBoxCoords(3);
				thatOutputBox = [ thatOutput1Box, thatOutput2Box, thatOutput3Box ];
			}
			
			inputIntersectOutput(thatOutputBox, thisInputBox, connect, comp);
			outputIntersectInput(thisOutputBox, thatInputBox, connect, comp);
		}
	}
	
	/*
	*	connectorDrag()
	*
	*	Similar to the way the gate drag event is handled, we must redraw any connections if we drag a connector. We first take care of the one input line.
	*	If this gate has an input line, we need to redraw it. Next, we look at each plugout individually. If the plugout has a component connected to it,
	*	we must redraw that wire as well.
	*/
	
	function connectorDrag(connect) {
		var connectedComps;
		
		connect.drawBoxes();
		if (deleteMode == true) {
			connect.setDeleteIcon("delete.ico");
		}
		
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
	}
	
	//------------------------------------
	//------- COMPONENT LISTENERS --------	(for both gates and connectors)
	//------------------------------------
	
	function probe(comp) {
		var str = comp.probe();
		if (str !== null) alert(str);
		else alert("Part of your circuit is not connected to an input!");
	}
	
	//------------------------------------
	//--------- NODE LISTENERS -----------
	//------------------------------------
	
	function nodeClick(node) {
		if (probeMode == true) {
			probe(node);
			probeMode = false;
			setComponentMouseOver("pointer");
			return;
		}
		if (node.getType() == "input") {
			node.toggleOutputValue();
		}
	}
	
	function nodeOutputBoxMouseDown(event, node) {
		if (!connecting) {
			if (node.getPlugoutWire() !== null) {
				// delete the output wire
				node.deleteOutputConnection();
				evaluateCircuit();
			}
			
			points = [node.getPlugout().getPoints()[1].x, node.getPlugout().getPoints()[1].y, node.getPlugout().getPoints()[1].x, node.getPlugout().getPoints()[1].y];
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			tempLineLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			selectedComp = node;			// set this gate as the selected component
			selectedPlug = "plugout";
			connecting = true;				// set the controller to connecting mode
		}
	}
	
	function nodeOutputBoxMouseUp(event, node) {
		if (connecting) {
			if (selectedComp == node || node.getPlugoutComp() !== null) {
				tempLine.remove();
				tempLineLayer.draw();
				connecting = false;
				selectedComp = null;
				selectedPlug = null;
				return;
			}
			
			if (selectedPlug.indexOf("plugout") < 0) {
				if (selectedComp.getType() == "not" || selectedComp.getType() == "output") setWireFromGateToGate(node, selectedComp, 0);
				else if (selectedComp.getFunc() == "gate") setWireFromGateToGate(node, selectedComp, parseFloat(selectedPlug.charAt(selectedPlug.length - 1)));
				else if (selectedComp.getType() == "connector") {
					// connect wire from connector to input node
					setWireFromGateToConnector(node, selectedComp);
				}
			}
			
			node.setPlugColor("plugout", "black");
			connecting = false;
			selectedComp = null;
			selectedPlug = null;
		}
	}
	
	function nodeOutputBoxMouseEnter(event, node) {
		if (node.getPlugoutComp() === null) {
			if (!connecting) node.setPlugColor("plugout", "green");
			if (connecting && selectedPlug.indexOf("plugin") >= 0) {
				node.setPlugColor("plugout", "green");
				tempLine.setStroke("green");
			}
		}
		else {
			if (!connecting) node.setPlugoutWireColor("yellow");
		}
	}
	
	function nodeOutputBoxMouseLeave(event, node) {
		node.setPlugColor("plugout", "default");
		if (connecting) tempLine.setStroke("plugout", "default");
		else {
			if (node.getPlugoutComp() !== null) node.setPlugoutWireColor("default");
		}
	}
	
	function nodeInputBoxMouseDown(event, node) {
		if (!connecting) {
			if (node.getPluginComp() !== null) {
				// delete the input wire
				var connComp = node.getPluginComp();
				if (connComp.getType() == "connector") {
					var plugoutNum = connComp.getPlugoutToComp(node);
					connComp.deleteOutputConnection(plugoutNum);
				}
				else connComp.deleteOutputConnection();
				evaluateCircuit();
			}
			
			points = [node.getPlugin().getPoints()[0].x, node.getPlugin().getPoints()[0].y, node.getPlugin().getPoints()[0].x, node.getPlugin().getPoints()[0].y];
			
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			mainLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			selectedComp = node;			// set this gate as the selected component
			selectedPlug = "plugin";
			connecting = true;				// set the controller to connecting mode
		}
	}
	
	function nodeInputBoxMouseUp(event, node) {
		if (connecting) {
			if (selectedComp == node || node.getPluginComp() !== null) {
				tempLine.remove();
				tempLineLayer.draw();
				connecting = false;
				selectedComp = null;
				
				return;
			}
			
			if (selectedPlug.indexOf("plugin") >= 0) return;	
		
			if (selectedComp.getFunc() == "gate" || selectedComp.getType() == "input") setWireFromGateToGate(selectedComp, node, 0);
			else if (selectedComp.getType() == "connector") {
				// connect wire from connector to output node
				var plugoutNum = parseFloat(selectedPlug.charAt(selectedPlug.length - 1));
				setWireFromConnectorToGate(selectedComp, node, plugoutNum, 0);
			}
			
			node.setPlugColor("plugin", "default");
			connecting = false;
			selectedComp = null;
		}
	}
	
	function nodeInputBoxMouseEnter(event, node) {
		if (node.getPluginComp() === null) {
			if (!connecting) node.setPlugColor("plugin", "green");
			if (connecting && selectedPlug.indexOf("plugout") >= 0) {
				node.setPlugColor("plugin", "green");
				tempLine.setStroke("green");
			}
		}
		else {
			if (!connecting) {
				if (node.getPluginComp().getType() != "connector") node.getPluginComp().setPlugoutWireColor("yellow");
				else {
					var plugoutNum = node.getConnectorPlugin();
					node.getPluginComp().setPlugoutWireColor(plugoutNum, "yellow");
				}
			}
		}
	}
	
	function nodeInputBoxMouseLeave(event, node) {
		node.setPlugColor("plugin", "default");
		if (connecting) {
			tempLine.setStroke("plugin", "black");
		}
		else {
			if (node.getPluginComp() !== null) {
				if (node.getPluginComp().getType() != "connector") node.getPluginComp().setPlugoutWireColor("default");
				else {
					var plugoutNum = node.getConnectorPlugin();
					node.getPluginComp().setPlugoutWireColor(plugoutNum, "default");
				}
			}
		}
	}
	
	function nodeDrag(node) {
		var connectedComp;
		
		node.drawBoxes();
		
		if (node.getType() == "input") {
			if (node.getPlugoutWire() !== null) {	// check to see if this gate has a plug out wire, if so, set its points to the new location
				points = getWirePoints(node.getPlugout().getPoints()[1], node.getPlugoutWire().getPoints()[3]); // get points for the new line
				node.getPlugoutWire().setPoints(points);	// set the points for the plugout wire that we just computed above.
			}
		}
		else {
			if (node.getPluginComp() !== null) {
				connectedComp = node.getPluginComp();
				if (connectedComp.getType() == "connector") {
					var plugoutNum = connectedComp.getPlugoutToComp(node);
					points = getWirePoints(connectedComp.getPlugoutWire(plugoutNum).getPoints()[0], node.getPlugin().getPoints()[0]);
					connectedComp.getPlugoutWire(plugoutNum).setPoints(points);
				}
				else {
					points = getWirePoints(connectedComp.getPlugoutWire().getPoints()[0], node.getPlugin().getPoints()[0]);
					connectedComp.getPlugoutWire().setPoints(points);
				}
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
		if (addPopup !== null) { addPopup.hide(); addPopup = null; return; }
		if (deletePopup !== null) { deletePopup.hide(); deletePopup = null; return; }
		if (wrenchPopup !== null) { wrenchPopup.hide(); wrenchPopup = null; return; }
		if (probeMode == true) { probeMode = false; setComponentMouseOver("pointer"); return; }
		if (deleteMode == true) { 
			deleteMode = false;
			toggleComponentDeleteIcons(false);
			setTrashImage("trash_closed.bmp");
			return;
		}
		
		if (!connecting) {
			showAddMenu(event, getRelativePointerPosition(event));
		}
		
		if (connecting) {							// if we are in connecting mode
			tempLine.disableStroke();				// disable the tempLine's stroke
			tempLine = null;						// set the tempLine to NULL
			connecting = false;		// we are not longer in connecting mode
			selectedComp = null;
		}
	}
	
	function getPosition(e) {
		var x;
		var y;
		if (e.pageX || e.pageY) { 
		  x = e.pageX;
		  y = e.pageY;
		}
		else { 
		  x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
		  y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
		} 
		
		
		return { x: x, y: y }
	}
	
	function getRelativePointerPosition() {
		var pointer = stage.getPointerPosition();
		var pos = stage.getPosition();
		var offset = stage.getOffset();
		var scale = stage.getScale();
		
		return {
			x : ((pointer.x - pos.x + offset.x) / scale.x),
			y : ((pointer.y - pos.y + offset.y) / scale.y)
		};
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
		if (connecting) {
			var mPos = getRelativePointerPosition();
			mPos.x = mPos.x;
			mPos.y = mPos.y - 5;
			
			if (selectedComp.getType() == "connector" && selectedPlug.indexOf("plugout") >= 0) {
				if (selectedPlugNum == 1 || selectedPlugNum == 3) points = getWirePoints2(tempLine.getPoints()[0], mPos);
				else points = getWirePoints(tempLine.getPoints()[0], mPos);
			}
			else points = getWirePoints(tempLine.getPoints()[0], mPos);
			
			if (tempLine.getStroke() != "green" && selectedPlug.indexOf("plugout") >= 0) {
				var state = selectedComp.getOutputValue();
				if (state == -1) tempLine.setStroke("black");
				else if (state == 1) tempLine.setStroke("red");
				else tempLine.setStroke("blue");
			}
			
			tempLine.setPoints(points);
			tempLineLayer.draw();
		}
	}
	
	function bgMouseUp() {
		if (!connecting) {
			
		}
		else {
			console.log("Cancel the current connection mode.");
			connecting = false;
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
	function setWireFromGateToGate(fromGate, toGate, pluginNum) {
		start = fromGate.getPlugout().getPoints()[1];										// the end point of the start line
		end = toGate.getPlugin(pluginNum).getPoints()[0];											// the start point of the end line
		points = getWirePoints(start, end);									// compute the wire points
		
		// make a new line with the points computed earlier
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		mainLayer.add(line);			// refresh the scene
		line.draw();
		
		if (tempLine !== null) {		// if the tempLine does not equal null, disable it and set it null
			tempLine.remove();
			tempLine = null;
			tempLineLayer.draw();
		}
		
		if (toGate.getType() == "not" || toGate.getFunc() == "node") toGate.setPluginComp(fromGate);				// if the plugin number is 0, the component is a NOT gate (only one input for a not gate)
		else toGate.setPluginComp(pluginNum, fromGate);					// else, call setPluginComp on the component with the plugin number provided and the selected component
		
		fromGate.setPlugoutWire(line);	// set the plugoutWire of the selectedComp to this new line
		fromGate.setPlugoutComp(toGate);									// set the plugoutComp for the selectedComp
		
	}
	
	/*
	*	setWireFromGateToConnector()
	*
	*	This function is called to set a connection from a gate to a connector. We are passed the connector that we will be connecting
	*	the gate (selectedComp) to. We are also passed the start line and end line. We will make a wire (line) from the end point of
	*	the start line to the start point of the end line.
	*/
	function setWireFromGateToConnector(fromGate, toConnect) {
		start = fromGate.getPlugout().getPoints()[1];			// get the end point of the start line
		end = toConnect.getPlugin().getPoints()[0];				// get the start point of the end line
		points = getWirePoints(start, end);		// get the wire points
		
		// make the line with the points computed earlier
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		mainLayer.add(line);
		line.draw();
		
		if (tempLine !== null) {		// if temp line does not equal null, make it null and disable it
			tempLine.remove();
			tempLine = null;
			tempLineLayer.draw();
		}
		
		toConnect.setPluginComp(fromGate);	// set the plugin component of the connector to the selected gate
		fromGate.setPlugoutWire(line);	// set the plugout wire to this line of the selected gate
		fromGate.setPlugoutComp(toConnect);	// set the plugout component of the selected gate to this connector
	}
	
	/*
	*	setWireFromConnectorToGate()
	*
	*	This function is called to set a connection from a connector to a gate. We are passed the gate that we will be connecting
	*	the connector (selectedComp) to. We are also passed the start line and end line. We will make a wire (line) from the end
	*	point of the start line to the start point of the end line. We are also passed plugoutNum which is the plugout number of
	*	the connector being use, and also the pluginNum which is the plugin number of the gate being used.
	*/
	function setWireFromConnectorToGate(fromConnect, toGate, plugoutNum, pluginNum) {
		start = fromConnect.getPlugout(plugoutNum).getPoints()[1];										// get the end point of the start line
		end = toGate.getPlugin(pluginNum).getPoints()[0];											// get the start point of the end line
		
		// if the plugoutNum of the connector is 2, use getWirePoins(); else use getWirePoints2() -- see documentation
		if (plugoutNum == 2) points = getWirePoints(start, end);
		else points = getWirePoints2(start, end);
		
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		mainLayer.add(line);
		line.draw();
		
		if (tempLine !== null) {		// if the temp line is not null, disable it
			tempLine.remove();
			tempLine = null;
			tempLineLayer.draw();
		}
		
		if (pluginNum == 0) {
			toGate.setConnectorPlugin(plugoutNum);
			toGate.setPluginComp(fromConnect);				// if pluginNum is 0, its a NOT gate
		}
		else {																// else, it's an AND or OR gate
			toGate.setConnectorPlugin(pluginNum, plugoutNum);					// set the connector plugin for the gate (very important)
			toGate.setPluginComp(pluginNum, fromConnect);					// set the plugin component of the gate
		}
		
		// make the line with the points computed earlier
		
		fromConnect.setPlugoutWire(plugoutNum, line);	// set plugout wire of the connector to this line
		fromConnect.setPlugoutComp(plugoutNum, toGate);						// set the plugout component of the connector to the gate
	}
	
	/*
	*	setWireFromConnectorToConnector()
	*
	*	This function is called to set a connection from a connector to another connector. We are passed a start line and end line.
	*	We will make a wire (line) from the end point of the start line to the start points of the end line. We are also passed
	*	the plugout number of the first connector we are using.
	*/
	function setWireFromConnectorToConnector(fromConnect, toConnect, plugoutNum) {
		start = fromConnect.getPlugout(plugoutNum).getPoints()[1];									// get the end point of the start line
		end = toConnect.getPlugin().getPoints()[0];										// get the start point of the end line
		
		// if the plugoutNum of the connector is 2, use getWirePoins(); else use getWirePoints2() -- see documentation
		if (plugoutNum == 2) points = getWirePoints(start, end);
		else points = getWirePoints2(start, end);
		
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		mainLayer.add(line);
		line.draw();
		
		if (tempLine !== null) {		// if the temp line isn't null, disable it
			tempLine.remove();
			tempLine = null;
			tempLineLayer.draw();
		}
		
		toConnect.setPluginComp(fromConnect);							// set the plugin component of the second connector
		fromConnect.setPlugoutWire(plugoutNum, line);		// set the plugout wire of the given plugout to the line we just created
		fromConnect.setPlugoutComp(plugoutNum, toConnect);				// set the plugout component of the selected connector
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
		
		if ((comp1.getFunc() == "gate" || comp1.getType() == "input") && (comp2.getFunc() == "gate" || comp2.getType() == "output")) { // if both components are gates (from gate to gate); opts = [ pluginNum ]
			//setWireFromGateToGate(comp2, comp1.getPlugout(), comp2.getPlugin(opts[0]), opts[0]);	// make the connection
			if (opts) setWireFromGateToGate(comp1, comp2, opts[0]);
			else setWireFromGateToGate(comp1, comp2, 0);
		}
		else if ((comp1.getFunc() == "gate" || comp1.getType() == "input") && comp2.getFunc() == "connection") { // if from gate to connector; opts is empty 
			setWireFromGateToConnector(comp1, comp2);
		}
		else if (comp1.getFunc() == "connection" && comp2.getFunc() == "gate") { // if from connector to gate; opts = [ pluginNumOfGate, plugoutNumOfConnector ]
			//comp1.setSelectedPlugout(opts[1]);	// get the selectedPlugout line
			if (comp2.getType() == "not") setWireFromConnectorToGate(comp1, comp2, opts[0], 0);
			else setWireFromConnectorToGate(comp1, comp2, opts[0], opts[1]);
		}
		else if (comp1.getFunc() == "connection" && comp2.getFunc() == "connection") { // if from connector to connector; opts = [ plugoutNumOfConnecotr ]
			//comp1.setSelectedPlugout(opts[0]);	// get the selectedPlugout line
			setWireFromConnectorToConnector(comp1, comp2, opts[0]);
		}
		
		mainLayer.draw();	// refresh the scene
	}
	
	//------------------------------------
	//----- AND & DELETE FUNCTIONS -------
	//------------------------------------
	
	function addOrGate(initX, initY, id) {
		var orGate;
		if (!id) orGate = new SB_OrGate(initX, initY, "Or Gate", nextID++, setup);
		else {
			orGate = new SB_OrGate(initX, initY, "Or Gate", id, setup);
			if (id >= nextID) nextID = id + 1;
		}
		components.push(orGate);
		orGate.draw();
		registerComponent(orGate);
		//orGate.draw();
		gateDragEnd(orGate);
		
		return orGate;
	}
	
	function addAndGate(initX, initY, id) {
		var andGate;
		if (!id) andGate = new SB_AndGate(initX, initY, "And Gate", nextID++, setup);
		else {
			andGate = new SB_AndGate(initX, initY, "And Gate", id, setup);
			if (id >= nextID) nextID = id + 1;
		}
		components.push(andGate);
		andGate.draw();
		registerComponent(andGate);
		//andGate.draw();
		gateDragEnd(andGate);
		
		return andGate;
	}
	
	function addNotGate(initX, initY, id) {
		var notGate;
		if (!id) notGate = new SB_NotGate(initX, initY, "Not Gate", nextID++, setup);
		else {
			notGate = new SB_NotGate(initX, initY, "Not Gate", id, setup);
			if (id >= nextID) nextID = id + 1;
		}
		components.push(notGate);
		notGate.draw();
		registerComponent(notGate);
		//notGate.draw();
		gateDragEnd(notGate);
		
		return notGate;
	}
	
	function addConnector(initX, initY, id) {
		var conn;
		if (!id) conn = new SB_Connector(initX, initY, "Connector", nextID++, setup);
		else {
			conn = new SB_Connector(initX, initY, "Connector", id, setup);
			if (id >= nextID) nextID = id + 1;
		}
		components.push(conn);
		conn.draw();
		registerComponent(conn);
		
		return conn;
	}
	
	function deleteComponent(comp) {
		if (comp.getFunc() == "gate") {
			if (comp.getType() == "not") deleteNotGate(comp);
			else deleteANDORGate(comp);
		}
		else deleteConnector(comp);
	}
	
	function deleteInputNode(node) {
		if (node.getPlugoutComp() !== null) {
			node.deleteOutputConnection();
		}
		
		node.deleteSelf();
		removeComp(node);
		mainLayer.draw();
	}
	
	function deleteOutputNode(node) {
		if (node.getPluginComp() !== null) {
			node.getPluginComp().deleteOutputConnection();
		}
		
		node.deleteSelf();
		removeComp(node);
		mainLayer.draw();
	}
	
	function deleteGate(gate) {
		if (gate.getType() == "and" || gate.getType() == "or") deleteANDORGate(gate);
		else deleteNotGate(gate);
		
		evaluateCircuit();
		stage.draw();
		document.body.style.cursor = "default";
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
							comp.evaluate();
							flag = true;
						}
					}
					else {
						comp.getPlugoutWire(plugoutNum[0]).disableStroke();
						comp.setPlugoutWire(plugoutNum[0], null);
						comp.setPlugoutComp(plugoutNum[0], null);
						comp.evaluate();
					}
				}
				else {
					comp.getPlugoutWire().disableStroke();
					comp.setPlugoutWire(null);
					comp.setPlugoutComp(null);
				}
				comp.evaluate();
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
		
		gate.deleteSelf();
		removeComp(gate);
		mainLayer.draw();
	}
	
	function deleteNotGate(gate) {
		var comp = gate.getPluginComp();
		if (comp !== null) {
			if (comp.getType() == "connector") {
				var plugout = comp.getPlugoutToComp(gate);
				comp.getPlugoutWire(plugout).disableStroke();
				comp.setPlugoutWire(plugout, null);
				comp.setPlugoutComp(plugout, null);
				comp.evaluate();
			}
			else {
				comp.getPlugoutWire().disableStroke();
				comp.setPlugoutWire(null);
				comp.setPlugoutComp(null);
				comp.evaluate();
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
			comp.evaluate();
			gate.getPlugoutWire().disableStroke();
		}
		
		gate.deleteSelf();
		removeComp(gate);
		mainLayer.draw();
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
			comp.evaluate();
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
				comp.evaluate();
			}
		}
		
		connect.deleteSelf();
		removeComp(connect);
		evaluateCircuit();
		stage.draw();
	}
	
	function addInput(initX, initY, text, value) {
		input = new SB_InputNode(initX, initY, text, value, "Input Node", text, setup);
		components.push(input);
		inputs.push(input);
		input.draw();
		registerComponent(input);
	}
	
	function addOutput(initX, initY, text) {
		output = new SB_OutputNode(initX, initY, text, "Output Node", text, setup);
		components.push(output);
		outputs.push(output);
		output.draw();
		registerComponent(output);
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
		return Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
	}
	
	function stopListeners(comp) {
		if (comp.getType() == "and" || comp.getType() == "or") {
			for (var i = 1; i < 3; i++) {
				comp.getInputBox(i).off('mouseenter');
				comp.getInputBox(i).off('mouseleave');
				comp.getInputBox(i).off('mousedown touchstart');
				comp.getInputBox(i).off('mouseup toundend');
			}
			comp.getOutputBox().off('mouseenter');
			comp.getOutputBox().off('mouseleave');
			comp.getOutputBox().off('mousedown touchstart');
			comp.getOutputBox().off('mouseup toundend');
		}
		
		comp.getGroup().off('click touch');
		comp.getGroup().off('click touch');
		comp.getGroup().off('dragmove touchmove');
		comp.getGroup().off('mouseup touchend');
	}
	
	function evaluateCircuit() {
		if (numInputs > 5) return;
		
		var flag = false;
		var truthTableArr = [];
		var inputValSave = [];
		
		for (var i = 0; i < inputs.length; i++) inputValSave.push(inputs[i].getValue());
		
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
		
		for (var i = 0; i < inputs.length; i++) {
			if (inputs[i].getValue() != inputValSave[i]) {
				inputs[i].toggleOutputValue(false);
			}
		}
		
		mainLayer.draw();
		truthTable.setTable(truthTableArr);
		truthTable.checkTruthTable(truthTableArr);	
	}
	
	function showAddMenu(event, pos) {
		addPopup = new SB_PopupMenu();
		
		addPopup.add('And Gate', function(target) {
			addAndGate(pos.x, pos.y);
			addPopup = null;
		});
		addPopup.add('Or Gate', function(target) {
			addOrGate(pos.x, pos.y);
			addPopup = null;
		});
		addPopup.add('Not Gate', function (target) {
			addNotGate(pos.x, pos.y);
			addPopup = null;
		});
		addPopup.add('Connector', function(target) {
			addConnector(pos.x, pos.y);
			addPopup = null;
		});
		addPopup.setSize(140, 0);
		addPopup.show(event);
	}
	
	function showDeleteMenu(event, gate) {
		deletePopup = new SB_PopupMenu();
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
	
	function showWrenchMenu(event, pos) {
		wrenchPopup = new SB_PopupMenu();
		wrenchPopup.add('Boolean Probe', function(target) {
			probeMode = true;
			setComponentMouseOver("crosshair");
			wrenchPopup = null;
		});
		var truthTableMenu = "Truth Table";
		if (truthTableOpen) truthTableMenu = ".Truth Table";
		
		wrenchPopup.add(truthTableMenu, function(target) {
			if (numInputs > 5) { alert("The truth table feature has been disabled because you have more than 5 inputs."); return; }
			else {
				truthTable.setTableOffset((stage.getWidth() / 2) * 0.3, 600);
				truthTable.toggleVisible();
				
				if (deleteMode == true) truthTable.setDeleteIcon(true);
				else truthTable.setDeleteIcon(false);
				
				truthTableOpen = true;
			}
			wrenchPopup = null;
		});
		var inputMenu = "Number of Inputs";
		var outputMenu = "Number of Outputs";
		if (checkInputNodeConnections() == true) inputMenu = ".Number of Inputs";
		if (checkOutputNodeConnections() == true) outputMenu = ".Number of Outputs";
		
		wrenchPopup.add(inputMenu, function(target) {
			updateNumberOfInputsMenuButton();
			wrenchPopup = null;
		});
		wrenchPopup.add(outputMenu, function(target) {
			updateNumberOfOutputsMenuButton();
			wrenchPopup = null;
		});
		wrenchPopup.add("Reset", function(target) {
			var res = confirm("You are about to reset the sandbox which will result in all current progress being lost.\n\nDo you wish to continue?");
			if (res == true) {
				setup.resetExercise(numInputs, numOutputs);
			}
			else {
				wrenchPopup = null;
				return;
			}
		});
		wrenchPopup.setSize(140, 0);
		wrenchPopup.showMenu(event);
	}
	
	function removeComp(comp) {
		var ind = components.indexOf(comp);
		components.splice(ind, 1);
	}
	
	function setComponentMouseOver(str) {
		document.body.style.cursor = str;
		for (var i = 0; i < components.length; i++) {
			components[i].setMouseOver(str);
		}
	}
	
	function toggleComponentDeleteIcons(bool) {
		for (var i = 0; i < components.length; i++) {
			components[i].toggleDeleteIcon(bool);
		}
		truthTable.setDeleteIcon(bool);
		//stage.draw();
	}
	
	function updateNumberOfInputsMenuButton() {
		//var res = prompt("Enter number of inputs.", numInputs);
		openNumPad(0, null, "This is a test", "Do things", false, 10).done(function(res) {
			if (res === null) return;
			if (res <= "0") { alert("You can't have a negative number of inputs..."); return; }
			if (isNaN(parseFloat(res))) { alert("Not a number!"); return; }
			res = parseFloat(res);
			if (res + numOutputs > 25) { alert("You can't have that many inputs."); return; }
		
			updateNumberOfInputs(res);
		});
	}
	
	function updateNumberOfInputs(res) {
		var alphabet = [ "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z" ];
		
		var header = [ ];

		for (var i = 0; i < res; i++) header.push(alphabet[i]);
		for (var i = 0; i < numOutputs; i++) header.push(alphabet[25 - i]);
			
		for (var i = 0; i < inputs.length; i++) {
			deleteInputNode(inputs[i]);
		}
		inputs = [];
		
		var ind = 0;
		for (var i = 0; i < res; i++) {
			addInput(5, ((600 / (res + 1)) * (i + 1)), header[ind++], 0);
		}
		
		truthTable.resetTruthTable(res, numOutputs, header);
		numInputs = res;
		if (deleteMode) {
			truthTable.setDeleteIcon(true);
		}
		
		return inputs;
	}
	
	function updateNumberOfOutputsMenuButton() {
		//var res = prompt("Enter number of outputs.", numOutputs);
		openNumPad(0, null, "This is a test", "Do things", false, 10).done(function(res) {
			if (res === null) return;
			if (res <= "0") { alert("You can't have a negative number of outputs..."); return; }
			if (isNaN(parseFloat(res))) { alert("Not a number!"); return; }
			res = parseFloat(res);
			if (res + numInputs > 25) { alert("You can't have that many outputs."); return; }
			updateNumberOfOutputs(res);
		});
	}
	
	function updateNumberOfOutputs(res) {
		var alphabet = [ "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z" ];
		
		var header = [ ];

		for (var i = 0; i < numInputs; i++) header.push(alphabet[i]);
		for (var i = 0; i < res; i++) header.push(alphabet[25 - i]);
			
		for (var i = 0; i < outputs.length; i++) {
			deleteOutputNode(outputs[i]);
		}
		outputs = [];
		
		var ind = numInputs;
		for (var i = 0; i < res; i++) {
			addOutput(820, ((550 / (res + 1)) * (i + 1)), header[ind++]);
		}
		
		truthTable.resetTruthTable(numInputs, res, header);
		numOutputs = res;
		if (deleteMode) {
			truthTable.setDeleteIcon(true);
		}
		
		return outputs;
	}
	
	function initTruthTableListeners() {
		$(function() {
			$( "#truthTableDiv" + containerNum ).draggable({ containment: "#sandbox1", scroll: false });

			$( "#truthTableDiv" + containerNum ).on("click tap", function() {
				if (deleteMode == true) {
					truthTable.toggleVisible();
					truthTable.setDeleteIcon(false);
					truthTableOpen = false;
				}
			});
		});
	}
	
	function checkInputNodeConnections() {
		for (var i = 0; i < components.length; i++) {
			if (components[i].getType() == "input") {
				if (components[i].getPlugoutComp() !== null) return true;
			}
		}
		
		return false;
	}
	
	function checkOutputNodeConnections() {
		for (var i = 0; i < components.length; i++) {
			if (components[i].getType() == "output") {
				if (components[i].getPluginComp() !== null) return true;
			}
		}
		
		return false;
	}
	
	function addComponent(type, x, y, id) {
		var comp;
		
		if (type == "and") comp = addAndGate(x, y, id);
		else if (type == "or") comp = addOrGate(x, y, id);
		else if (type == "not") comp = addNotGate(x, y, id);
		else if (type == "connector") comp = addConnector(x, y, id);
		
		return comp;
	}
	
	wrenchImg.onload = function() {						// set an onload function for the wrench image

		var wrench = new Kinetic.Image({				// create a Kinetic Image
			x: 805,										// assign them a fixed x and y coord
			y: 10,
			image: wrenchImg,							// set the image to the HTML wrench image
			scaleX: 0.3,								// set the x and y scale to 0.3
			scaleY: 0.3
		});

		wrench.on('click tap', function(event) {			// when the user taps the wrench...
			if (wrenchPopup !== null) return;				// if the wrench popup is already shown, return

			var mPos = getRelativePointerPosition(event);	// get the relative position of the click
			mPos.x = mPos.x - 150;							// offset the position a bit as this is where the menu will show
			mPos.y = mPos.y + 15;
			showWrenchMenu(event, mPos);					// pass the position we just calculated to the showWrenchMenu() function
		});

		wrenchLayer.add(wrench);						// add the wrench to the wrench layer
		wrenchLayer.draw();								// redraw the wrench layer
	};
	
	// setTrashImage() sets a new image for the trash can (open and closed)
	function setTrashImage (image) {
		var imageObj = new Image();							// create a new HTML image object
		imageObj.onload = function (){						// populate the onload function for the trash can image
			var trashImg = new Kinetic.Image({				// create a Kinetic Image for trash can
				x: 805,										// set the image at a fixed x and y coordinate
				y: 600 - 55,
				image: imageObj,							// set the image to the HTML image object
				scaleX: 0.3,								// set the image scale to 0.3
				scaleY: 0.3
			});
			
			trashImg.on('click tap', function() {			// set a click listener for the trash can
				if (deleteMode == false) {					// if delete mode is false, set the delete mode to true and open the trash can
					deleteMode = true;						// delete mode = true
					toggleComponentDeleteIcons(true);		// toggle the component delete mode icons (make the red X's visible for gates)
					setTrashImage("trash_open.bmp");		// set the trash can image to the open trash can
				}
				else {										// if delete mode is true, set the delete mode to false and close the trash can
					deleteMode = false;						// delete mode = false
					toggleComponentDeleteIcons(false);		// toggle the component delete mode icons (make the red X's hidden for gates)
					setTrashImage("trash_closed.bmp");		// set the trash can image to the closed trash can
				}
			});
				
			trashLayer.destroyChildren();					// erase all children on the trash layer (the current trash can image)
			trashLayer.add(trashImg);						// add the new image to the trash layer
			trashLayer.draw();								// redraw the trash can layer
		};
		imageObj.src = image;								// set the HTML image object to the image string passed to the function
	}
}