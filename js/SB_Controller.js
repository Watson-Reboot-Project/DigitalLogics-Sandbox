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

function SB_Controller(setup, truthTable, numInputs, numOutputs) {

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
	var wrenchPopup = null;
	var probeMode = false;
	var highlightPlug = null;
	var mouseOverComp = null;
	var selectedPlug = null;
	var warningWire = null;
	var selectedPlugNum = 0;
	var deleteMode = false;
	var haltMenu = false;

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
	stage.on('mousemove touchmove', function() {
		stageMouseMove();
	});
	
	// this event listener listens for clicks on the stage
	//stage.on('click', function(event) {
	//	stageClick(event);
	//});
	
	bg.on('click tap', function(event) {
		bgClick(event);
	});

	bg.on('mouseup touchend', function() {
		bgMouseUp();
	});
	
	bg.on('mousedown touchstart', function() {
		bgMouseDown();
	});
	
	var wrenchImg = new Image();
	  wrenchImg.onload = function() {
		//var scalarWidth = stage.getWidth() * (1 - stage.getScale().x);
		
		var wrench = new Kinetic.Image({
		  //x: ((stage.getWidth() - 43) + (stage.getWidth() * stage.getScale())),
		  x: 805,
		  y: 10,
		  image: wrenchImg,
		  scale: 0.3
		  //width: 106,
		  //height: 118
		});
		
		wrench.on('click tap', function(event) {
			if (wrenchPopup !== null) return;
			
			var mPos = getPosition(event);
			mPos.x = mPos.x - 100;
			mPos.y = mPos.y + 15;
			showWrenchMenu(event, mPos);
		});

		// add the shape to the layer
		mainLayer.add(wrench);
		mainLayer.draw();
	  };
	wrenchImg.src = "wrench.ico";
	
	var trashImg = new Image();
	  trashImg.onload = function() {
		//var scalarWidth = stage.getWidth() * (1 - stage.getScale().x);
		//var scalarHeight = stage.getHeight() * (1 - stage.getScale().y);
		
		var trash = new Kinetic.Image({
		  x: 805,
		  y: 600 - 55,
		  image: trashImg,
		  scale: 0.3
		  //width: 106,
		  //height: 118
		});
		
		trash.on('click tap', function() {
			
			if (deleteMode == false) { trashImg.src = "trash_open.bmp"; deleteMode = true; toggleComponentDeleteIcons(true); }
			else { trashImg.src = "trash_closed.bmp"; deleteMode = false; toggleComponentDeleteIcons(false); }
			
			mainLayer.draw();
		});

		// add the shape to the layer
		mainLayer.add(trash);
		mainLayer.draw();
	  };
	  
	trashImg.src = "trash_closed.bmp";
	
	this.initTruthTableListeners = initTruthTableListeners;

	
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
		comp.getGroup().on('mouseup touchend', function() {
			if (connecting) {
				tempLine.disableStroke();
				tempLine = null;
				selectedComp = null;
				connecting = false;
				mainLayer.draw();
			}
		});
		if (comp.getFunc() == "connection") {
			comp.getInputBox().on('mousedown touchstart', function(event) {
				connectorInputBoxMouseDown(event, comp);
			});
			comp.getInputBox().on('mouseup touchend', function(event) {
				connectorInputBoxMouseUp(event, comp);
			});
			comp.getInputBox().on('mouseenter', function(event) {
				connectorInputBoxMouseEnter(event, comp);
			});
			comp.getInputBox().on('mouseleave', function(event) {
				connectorInputBoxMouseLeave(event, comp);
			});
			
			comp.getOutputBox(1).on('mousedown touchstart', function(event) { connectorOutputBoxMouseDown(event, comp, 1); });
			comp.getOutputBox(1).on('mouseup touchend', function (event) { connectorOutputBoxMouseUp(event, comp, 1); });
			comp.getOutputBox(1).on('mouseenter touchend', function(event) { connectorOutputBoxMouseEnter(event, comp, 1); });
			comp.getOutputBox(1).on('mouseleave touchend', function(event) { connectorOutputBoxMouseLeave(event, comp, 1); });
			comp.getOutputBox(2).on('mousedown touchstart', function(event) { connectorOutputBoxMouseDown(event, comp, 2); });
			comp.getOutputBox(2).on('mouseup touchend', function (event) { connectorOutputBoxMouseUp(event, comp, 2); });
			comp.getOutputBox(2).on('mouseenter touchend', function(event) { connectorOutputBoxMouseEnter(event, comp, 2); });
			comp.getOutputBox(2).on('mouseleave touchend', function(event) { connectorOutputBoxMouseLeave(event, comp, 2); });
			comp.getOutputBox(3).on('mousedown touchstart', function(event) { connectorOutputBoxMouseDown(event, comp, 3); });
			comp.getOutputBox(3).on('mouseup touchend', function (event) { connectorOutputBoxMouseUp(event, comp, 3); });
			comp.getOutputBox(3).on('mouseenter touchend', function(event) { connectorOutputBoxMouseEnter(event, comp, 3); });
			comp.getOutputBox(3).on('mouseleave touchend', function(event) { connectorOutputBoxMouseLeave(event, comp, 3); });
			
			comp.getGroup().on('dragmove touchmove', function() {
				connectorDrag(comp);
			});
			
			comp.getGroup().on('click tap', function() {
				connectorClick(comp);
			});
		}
		// if the component is a gate, set gate event listeners
		else if (comp.getFunc() == "gate") {
			if (comp.getType() == "not") {
				comp.getInputBox().on('mousedown touchstart', function(event) {
					gateInputBoxMouseDown(event, comp, 0);
					evaluateCircuit();
				});
				comp.getInputBox().on('mouseup touchend', function(event) {
					gateInputBoxMouseUp(event, comp, 0);
					evaluateCircuit();
				});
				comp.getInputBox().on('mouseenter', function(event) {
					gateInputBoxMouseEnter(event, comp, 0);
				});
				comp.getInputBox().on('mouseleave', function(event) {
					gateInputBoxMouseLeave(event, comp, 0);
				});
			}
			else {
				comp.getInputBox(1).on('mousedown touchstart', function(event) {
					gateInputBoxMouseDown(event, comp, 1);
					evaluateCircuit();
				});
				comp.getInputBox(1).on('mouseup touchend', function(event) {
					gateInputBoxMouseUp(event, comp, 1);
					evaluateCircuit();
				});
				comp.getInputBox(1).on('mouseenter', function(event) {
					gateInputBoxMouseEnter(event, comp, 1);
				});
				comp.getInputBox(1).on('mouseleave', function(event) {
					gateInputBoxMouseLeave(event, comp, 1);
				});
				
				comp.getInputBox(2).on('mousedown touchstart', function(event) {
					gateInputBoxMouseDown(event, comp, 2);
					evaluateCircuit();
				});
				comp.getInputBox(2).on('mouseup touchend', function(event) {
					gateInputBoxMouseUp(event, comp, 2);
					evaluateCircuit();
				});
				comp.getInputBox(2).on('mouseenter', function(event) {
					gateInputBoxMouseEnter(event, comp, 2);
				});
				comp.getInputBox(2).on('mouseleave', function(event) {
					gateInputBoxMouseLeave(event, comp, 2);
				});
			}
			
			comp.getOutputBox().on('mousedown touchstart', function(event) {
				gateOutputBoxMouseDown(event, comp);
				evaluateCircuit();
			});
			comp.getOutputBox().on('mouseup touchend', function(event) {
				gateOutputBoxMouseUp(event, comp);
				evaluateCircuit();
			});
			comp.getOutputBox().on('mouseenter', function(event) {
				gateOutputBoxMouseEnter(event, comp);
			});
			comp.getOutputBox().on('mouseleave', function(event) {
				gateOutputBoxMouseLeave(event, comp);
			});
			
			comp.getGroup().on('click tap', function (event) {
				gateClick(event, comp);
			});
			
			/*
			comp.getGroup().on('click tap', function(event) {
				gateMouseDown(event, comp);
				if (event.button != 2) evaluateCircuit();
			});*/
	
			comp.getGroup().on('dragmove touchmove', function() {
				gateDrag(comp);
			});
		}
		else if (comp.getFunc() == "node") {

			if (comp.getType() == "input") {
				comp.getOutputBox().on('mousedown touchstart', function (event) {
					nodeOutputBoxMouseDown(event, comp);
					evaluateCircuit();
				});
				comp.getOutputBox().on('mouseup touchend', function (event) {
					nodeOutputBoxMouseUp(event, comp);
					evaluateCircuit();
				});
				comp.getOutputBox().on('mouseenter', function (event) {
					nodeOutputBoxMouseEnter(event, comp);
				});
				comp.getOutputBox().on('mouseleave', function(event) {
					nodeOutputBoxMouseLeave(event, comp);
				});
			}
			if (comp.getType() == "output") {
				comp.getInputBox().on('mousedown touchstart', function (event) {
					nodeInputBoxMouseDown(event, comp);
					evaluateCircuit();
				});
				comp.getInputBox().on('mouseup touchend', function (event) {
					nodeInputBoxMouseUp(event, comp);
					evaluateCircuit();
				});
				comp.getInputBox().on('mouseenter', function (event) {
					nodeInputBoxMouseEnter(event, comp);
				});
				comp.getInputBox().on('mouseleave', function(event) {
					nodeInputBoxMouseLeave(event, comp);
				});
			}
	
			comp.getGroup().on('dragmove touchmove', function() {
				nodeDrag(comp);
			});
			comp.getGroup().on('click tap', function() {
				nodeClick(comp);
			});
		}
		/*
		comp.getGroup().on('mouseover', function() {
			compMouseOver(comp);
		});
		
		comp.getGroup().on('mouseout', function() {
			if (selectedComp !== null) {
				tempLine.setStroke("black");
				//if (selectedComp.getFunc() == "gate" || selectedComp.getFunc() == "node") selectedComp.getPlugoutWire().setStroke("black");
				//else selectedComp.getPlugoutWire(selectedComp.getSelectedPlugout()).setStroke("black");
			}
			if (highlightPlug !== null) mouseOutHighlight(comp);
		});
		*/
	}
	
	//------------------------------------
	//--------- GATE LISTENERS -----------
	//------------------------------------
	
	function gateInputBoxMouseDown(event, gate, inputNum) {
		if (!connecting) {
			console.log("Attempting to make a connection.");
			if (gate.getType() == "not") {
				if (gate.getPluginComp() !== null) {
					var connComp = gate.getPluginComp();
					if (connComp.getType() == "connector") {
						var plugoutNum = gate.getConnectorPlugin();
						connComp.deleteOutputConnection(plugoutNum);
					}
					else connComp.deleteOutputConnection();
				}
				
				points = [gate.getPlugin().getPoints()[0].x, gate.getPlugin().getPoints()[0].y, gate.getPlugin().getPoints()[0].x, gate.getPlugin().getPoints()[0].y];			// set the points array from (0,0) to (0, 0); they will be set later
			}
			else {
				if (gate.getPluginComp(inputNum) !== null) {
					var connComp = gate.getPluginComp(inputNum);
					if (connComp.getType() == "connector") {
						var plugoutNum = gate.getConnectorPlugin(inputNum);
						console.log("PlugoutNum: " + plugoutNum);
						connComp.deleteOutputConnection(plugoutNum);
					}
					else connComp.deleteOutputConnection();
				}
				points = [gate.getPlugin(inputNum).getPoints()[0].x, gate.getPlugin(inputNum).getPoints()[0].y, gate.getPlugin(inputNum).getPoints()[0].x, gate.getPlugin(inputNum).getPoints()[0].y];			// set the points array from (0,0) to (0, 0); they will be set later
			}
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			mainLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			selectedComp = gate;			// set this gate as the selected component
			selectedPlugNum = inputNum;
			selectedPlug = "plugin" + inputNum;
			connecting = true;				// set the controller to connecting mode
		}
	}
	
	function gateInputBoxMouseUp(event, gate, pluginNum) {
		if (connecting) {
			
			if (gate.getPluginComp(pluginNum) !== null || selectedPlug.indexOf("plugin") >= 0) {
				tempLine.disableStroke();
				tempLine = null;
				mainLayer.draw();
				connecting = false;
				selectedComp = null;
			}
			
			if (gate.getType() == "not") {
				if (selectedComp.getFunc() == "gate" || selectedComp.getType() == "input") {
					setWireFromGateToGate(selectedComp, gate, 0);
				}
				else if (selectedComp.getFunc() == "connection") {
					// from connector to not
					var plugoutNum = selectedPlugNum;
					setWireFromConnectorToGate(selectedComp, gate, plugoutNum, 0);
					gate.setConnectorPlugin(plugoutNum);
				}
			}
			else {
				if (selectedComp.getFunc() == "gate" || selectedComp.getType() == "input") {
					setWireFromGateToGate(selectedComp, gate, pluginNum);
				}
				else if (selectedComp.getType() == "connector") {
					var plugoutNum = selectedPlugNum
					setWireFromConnectorToGate(selectedComp, gate, plugoutNum, pluginNum);
					gate.setConnectorPlugin(pluginNum, plugoutNum);
				}
			}
			
			if (pluginNum == 0) gate.setPlugColor("plugin", "default");
			else gate.setPlugColor("plugin" + pluginNum, "default");
		}
		
		tempLine = null;
		connecting = false;		// we are no longer in connection mode
		selectedComp = null;	// null the selected component
		mainLayer.draw();
	}
	
	function gateInputBoxMouseEnter(event, comp, inputNum) {
		if (inputNum == 0) {
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
						var plugoutNum = comp.getConnectorPlugin();
						comp.getPluginComp().setPlugoutWireColor(plugoutNum, "yellow");
					}
				}
			}
			mainLayer.draw();
		}
		else {
			if (comp.getPluginComp(inputNum) === null) {
				if (!connecting) comp.setPlugColor("plugin" + inputNum, "green");
				if (connecting && selectedPlug.indexOf("plugout") >= 0) {
					comp.setPlugColor("plugin" + inputNum, "green");
					tempLine.setStroke("green");
				}
			}
			else {
				if (!connecting) {
					if (comp.getPluginComp(inputNum).getType() != "connector") comp.getPluginComp(inputNum).setPlugoutWireColor("yellow");
					else {
						var plugoutNum = comp.getConnectorPlugin(inputNum);
						comp.getPluginComp(inputNum).setPlugoutWireColor(plugoutNum, "yellow");
					}
				}
			}
			
			mainLayer.draw();
		}
	}
	
	function gateInputBoxMouseLeave(event, comp, inputNum) {
		if (inputNum == 0) {
			comp.setPlugColor("plugin", "default");
			if (connecting) tempLine.setStroke("black");
			else {
				if (comp.getPluginComp() !== null) {
					if (comp.getPluginComp().getType() != "connector") comp.getPluginComp().setPlugoutWireColor("default");
					else {
						var plugoutNum = comp.getConnectorPlugin();
						comp.getPluginComp().setPlugoutWireColor(plugoutNum, "default");
					}
				}
			}
		}
		else {
			comp.setPlugColor("plugin" + inputNum, "default");
			if (connecting) tempLine.setStroke("black");
			else {
				if (comp.getPluginComp(inputNum) !== null) {
					if (comp.getPluginComp(inputNum).getType() != "connector") comp.getPluginComp(inputNum).setPlugoutWireColor("default");
					else {
						var plugoutNum = comp.getConnectorPlugin(inputNum);
						comp.getPluginComp(inputNum).setPlugoutWireColor(plugoutNum, "default");
					}
				}
			}
		}
		
		mainLayer.draw();
	}
	
	function gateOutputBoxMouseDown(event, gate) {
		if (!connecting) {
			connecting = true;
			console.log("Attempting to make a connection.");		
			if (gate.getPlugoutComp() !== null) {
				// delete the plugout wire and plugout comp; continue drawing temp line
				gate.deleteOutputConnection();
			}
			
			points = [gate.getPlugout().getPoints()[1].x, gate.getPlugout().getPoints()[1].y, gate.getPlugout().getPoints()[1].x, gate.getPlugout().getPoints()[1].y];			// set the points array from (0,0) to (0, 0); they will be set later
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			mainLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			selectedComp = gate;			// set this gate as the selected component
			selectedPlug = "plugout";
			gate.setPlugColor("plugout", "default");
		}
	}
	
	function gateOutputBoxMouseUp(event, gate) {
		if (connecting) {
			
			if (gate.getPlugoutComp() !== null || selectedPlug.indexOf("plugout") >= 0) {
				tempLine.disableStroke();
				tempLine = null;
				connecting = false;
				selectedComp = null;
				mainLayer.draw();
				
				return;
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
		}
		
		tempLine = null;
		mainLayer.drawScene();	// redraw the scene to draw any changes
		connecting = false;		// we are no longer in connection mode
		selectedComp = null;	// null the selected component
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
		mainLayer.draw();
	}
	
	function gateOutputBoxMouseLeave(event, comp) {
		comp.setPlugColor("plugout", "default");
		if (connecting) tempLine.setStroke("black");
		else {
			if (comp.getPlugoutComp() !== null) {
				comp.setPlugoutWireColor("default");
			}
		}
		mainLayer.draw();
	}
	
	function gateClick(event, gate) {
		if (probeMode) {
			probe(gate);
			probeMode = false;
			setComponentMouseOver("default");
		}
		
		if (deleteMode) {
			deleteGate(gate);
		}
	}
	
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
			
			// if its a plug out and something is connected, delete it
			// if its a plug out and nothing is connected, begin drawing our temp line
			
			// if its a plugin --
			// for that plugin, if there is something there, delete it
			// for that plugin, if there is not something there, begin drawing our temp line, make this gate our selected plugin

			// check to see which plug was clicked (distance)
			if (highlightPlug === null) return;
			selectedPlug = highlightPlug;

			if (highlightPlug.indexOf("plugout") >= 0) {
				if (gate.getPlugoutWire() !== null) {			
					gate.deleteOutputConnection();
					mainLayer.drawScene();								// redraw the scene
					return;
				}
				else {
					points = [gate.getPlugout().getPoints()[1].x, gate.getPlugout().getPoints()[1].y, gate.getPlugout().getPoints()[1].x, gate.getPlugout().getPoints()[1].y];			// set the points array from (0,0) to (0, 0); they will be set later
				}
			}
			else {
				if (gate.getType() == "not") {
					if (gate.getPluginComp() !== null) {
						var connComp = gate.getPluginComp();
						if (connComp.getType() == "connector") {
							var plugoutNum = gate.getConnectorPlugin();
							connComp.deleteOutputConnection(plugoutNum);
						}
						else connComp.deleteOutputConnection();
						
						return;
					}
					else {
						points = [gate.getPlugin().getPoints()[0].x, gate.getPlugin().getPoints()[0].y, gate.getPlugin().getPoints()[0].x, gate.getPlugin().getPoints()[0].y];			// set the points array from (0,0) to (0, 0); they will be set later
					}
				}
				else {
					var pluginNum = parseFloat(highlightPlug.charAt(highlightPlug.length - 1));
					if (gate.getPluginComp(pluginNum) !== null) {
						var connComp = gate.getPluginComp(pluginNum);
						if (connComp.getType() == "connector") {
							var plugoutNum = gate.getConnectorPlugin(pluginNum);
							connComp.deleteOutputConnection(plugoutNum);
						}
						else connComp.deleteOutputConnection();
						
						return;
					}
					else {
						points = [gate.getPlugin(pluginNum).getPoints()[0].x, gate.getPlugin(pluginNum).getPoints()[0].y, gate.getPlugin(pluginNum).getPoints()[0].x, gate.getPlugin(pluginNum).getPoints()[0].y];			// set the points array from (0,0) to (0, 0); they will be set later
					}
				}
			}
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			mainLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			selectedComp = gate;			// set this gate as the selected component
			connecting = true;				// set the controller to connecting mode	
		}
		else {
			// if we make it here, then the user has clicked a gate, and the controller is in connection mode
			
			// determine if we clicked an input or output
			if (highlightPlug === null) return;
			
			// if we have selected an input of the selected component, we can only connect to an output of this component
			// if we have selected an output of the selected component, we can only connect to an input of this component
			
			if (highlightPlug.indexOf("plugin") >= 0) { // we have clicked on a plugin, it must come from a plugout
				if (selectedPlug.indexOf("plugin") >= 0) return;
				
				if (gate.getType() == "not") {
					if (selectedComp.getFunc() == "gate" || selectedComp.getType() == "input") {
						setWireFromGateToGate(selectedComp, gate, 0);
					}
					else if (selectedComp.getFunc() == "connection") {
						// from connector to not
						var plugoutNum = parseFloat(selectedPlug.charAt(selectedPlug.length - 1));
						setWireFromConnectorToGate(selectedComp, gate, plugoutNum, 0);
						gate.setConnectorPlugin(plugoutNum);
					}
				}
				else {
					var pluginNum = parseFloat(highlightPlug.charAt(highlightPlug.length - 1));
					if (selectedComp.getFunc() == "gate" || selectedComp.getType() == "input") {
						setWireFromGateToGate(selectedComp, gate, pluginNum);
					}
					else if (selectedComp.getType() == "connector") {
						var plugoutNum = parseFloat(selectedPlug.charAt(selectedPlug.length - 1));
						setWireFromConnectorToGate(selectedComp, gate, plugoutNum, pluginNum);
						gate.setConnectorPlugin(pluginNum, plugoutNum);
					}
				}
			}
			else if (highlightPlug.indexOf("plugout") >= 0) { // we have clicked on a plugout, it must come from a plugin
				if (selectedPlug.indexOf("plugout") >= 0) return;
				
				if (selectedComp.getType() == "not" || selectedComp.getType() == "output" || selectedComp.getType() == "connector") {
					// set wire from the plugout of the gate we are clicking now to a one input component
					setWireFromGateToGate(gate, selectedComp, 0);
				}
				else {
					// set wire from the plugout of the gate we are clicking now to a multiple input component (or/and gate)
					var pluginNum = parseFloat(selectedPlug.charAt(selectedPlug.length - 1));
					setWireFromGateToGate(gate, selectedComp, pluginNum);
				}
			}
			
			selectedPlug = null;
			tempLine = null;
			mainLayer.drawScene();	// redraw the scene to draw any changes
			connecting = false;		// we are no longer in connection mode
			selectedComp = null;	// null the selected component
		}
	}
	
	function mouseOverHighlight() {
		if (mouseOverComp !== null) {
			highlightPlug = getSelectedPlug(mouseOverComp);
			if ((highlightPlug && !selectedPlug) || (highlightPlug && selectedPlug && ((highlightPlug.indexOf("plugin") >= 0 && selectedPlug.indexOf("plugout") >= 0) || (highlightPlug.indexOf("plugout") >= 0 && selectedPlug.indexOf("plugin") >= 0)))) {
				var result = mouseOverComp.setPlugColor(highlightPlug, "green");
				if (result == false) {
					if (!connecting) {
						warningWire = mouseOverComp.setPlugColor(highlightPlug, "yellow");
					}
					else tempLine.setStroke("black");
					//highlightPlug = null;
				}
				else {
					if (tempLine) tempLine.setStroke("green");
				}
			}
			else {
				highlightPlug = null;
				mouseOverComp.setPlugColor("all", "default");
			}
			
			mainLayer.draw();
		}
	}
	
	function mouseOutHighlight(comp) {
		mouseOverComp.setPlugColor("all", "black");
		
		mouseOverComp = null;
		mainLayer.draw();
		highlightPlug = null;
	}
	
	function getSelectedPlug(comp) {
		var mPos = stage.getPointerPosition();
		var plugin1;
		var plugin2;
		var plugout;
		
		if (comp.getFunc() == "gate") {
			if (comp.getType() == "not") {

				var pX = (comp.getPlugin().getPoints()[0].x + comp.getPlugin().getPoints()[1].x) / 2;
				var pY = (comp.getPlugin().getPoints()[0].y + comp.getPlugin().getPoints()[1].y) / 2;
				var pluginDist = distance(mPos, {x: pX, y:pY});
				
				pX = (comp.getPlugout().getPoints()[0].x + comp.getPlugout().getPoints()[1].x) / 2;
				pY = (comp.getPlugout().getPoints()[0].y + comp.getPlugout().getPoints()[1].y) / 2;
				var plugoutDist = distance(mPos, {x: pX, y:pY});
				
				if (pluginDist < 15) return "plugin";
				if (plugoutDist < 15) return "plugout";
			}
			else {
				var pX = (comp.getPlugin(1).getPoints()[0].x + comp.getPlugin(1).getPoints()[1].x) / 2;
				var pY = (comp.getPlugin(1).getPoints()[0].y + comp.getPlugin(1).getPoints()[1].y) / 2;
				var plugin1Dist = distance(mPos, {x: pX, y:pY});
				
				pX = (comp.getPlugin(2).getPoints()[0].x + comp.getPlugin(2).getPoints()[1].x) / 2;
				pY = (comp.getPlugin(2).getPoints()[0].y + comp.getPlugin(2).getPoints()[1].y) / 2;
				var plugin2Dist = distance(mPos, {x: pX, y:pY});
				
				pX = (comp.getPlugout().getPoints()[0].x + comp.getPlugout().getPoints()[1].x) / 2;
				pY = (comp.getPlugout().getPoints()[0].y + comp.getPlugout().getPoints()[1].y) / 2;
				var plugoutDist = distance(mPos, {x: pX, y:pY});
				
				if (plugin1Dist < 15) return "plugin1";
				if (plugin2Dist < 15) return "plugin2";
				if (plugoutDist < 15) return "plugout";
			}
		}
		else if (comp.getFunc() == "connection") {
			var pX = (comp.getPlugin().getPoints()[0].x + comp.getPlugin().getPoints()[1].x) / 2;
			var pY = (comp.getPlugin().getPoints()[0].y + comp.getPlugin().getPoints()[1].y) / 2;
			var pluginDist = distance(mPos, {x: pX, y:pY});
			
			pX = (comp.getPlugout(1).getPoints()[0].x + comp.getPlugout(1).getPoints()[1].x) / 2;
			pY = (comp.getPlugout(1).getPoints()[0].y + comp.getPlugout(1).getPoints()[1].y) / 2;
			var plugout1Dist = distance(mPos, {x: pX, y:pY});
			
			pX = (comp.getPlugout(2).getPoints()[0].x + comp.getPlugout(2).getPoints()[1].x) / 2;
			pY = (comp.getPlugout(2).getPoints()[0].y + comp.getPlugout(2).getPoints()[1].y) / 2;
			var plugout2Dist = distance(mPos, {x: pX, y:pY});
			
			pX = (comp.getPlugout(3).getPoints()[0].x + comp.getPlugout(3).getPoints()[1].x) / 2;
			pY = (comp.getPlugout(3).getPoints()[0].y + comp.getPlugout(3).getPoints()[1].y) / 2;
			var plugout3Dist = distance(mPos, {x: pX, y:pY});
			
			if (pluginDist < 15) return "plugin";
			if (plugout1Dist < 15) return "plugout1";
			if (plugout2Dist < 15) return "plugout2";
			if (plugout3Dist < 15) return "plugout3";
		}
		else if (comp.getFunc() == "node") {
			if (comp.getType() == "input") {
				var pX = (comp.getPlugout().getPoints()[0].x + comp.getPlugout().getPoints()[1].x) / 2;
				var pY = (comp.getPlugout().getPoints()[0].y + comp.getPlugout().getPoints()[1].y) / 2;
				var plugoutDist = distance(mPos, {x: pX, y:pY});
				
				if (plugoutDist < 15) return "plugout";
			}
			else {
				var pX = (comp.getPlugin().getPoints()[0].x + comp.getPlugin().getPoints()[1].x) / 2;
				var pY = (comp.getPlugin().getPoints()[0].y + comp.getPlugin().getPoints()[1].y) / 2;
				var pluginDist = distance(mPos, {x: pX, y:pY});
				
				if (pluginDist < 15) return "plugin";
			}
		}
		else {
		
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
		
		gate.drawBoxes();
		
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

	function connectorInputBoxMouseDown(event, connect) {
		if (!connecting) {
			if (connect.getPluginComp() !== null) {
				var connComp = connect.getPluginComp();
				if (connComp.getType() == "connector") {
					var plugoutComp = connComp.getPlugoutToComp(connect);
					connComp.deleteOutputConnection(plugoutComp);
				}
				else connComp.deleteOutputConnection();
				
			}
			else {
				points = [ connect.getPlugin().getPoints()[0].x, connect.getPlugin().getPoints()[0].y, connect.getPlugin().getPoints()[0].x, connect.getPlugin().getPoints()[0].y ];
			}
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			selectedPlug = "plugin";
			mainLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			selectedComp = connect;			// set this gate as the selected component
			connecting = true;				// set the controller to connecting mode
		}
	}
	
	function connectorInputBoxMouseUp(event, connect) {
		if (connecting) {
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
			tempLine.remove();
			tempLine = null;
			mainLayer.drawScene();		
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
					var plugoutNum = comp.getConnectorPlugin();
					comp.getPluginComp().setPlugoutWireColor(plugoutNum, "yellow");
				}
			}
		}
		mainLayer.draw();
	}
	
	function connectorInputBoxMouseLeave(event, comp) {
		comp.setPlugColor("plugin", "default");
		if (connecting) tempLine.setStroke("black");
		else {
			if (comp.getPluginComp() !== null) {
				if (comp.getPluginComp().getType() != "connector") comp.getPluginComp().setPlugoutWireColor("default");
				else {
					var plugoutNum = comp.getConnectorPlugin();
					comp.getPluginComp().setPlugoutWireColor(plugoutNum, "default");
				}
			}
		}
		mainLayer.draw();
	}
	
	function connectorOutputBoxMouseDown(event, connect, plugoutNum) {
		if (!connecting) {
			if (connect.getPlugoutWire(plugoutNum) !== null) {
				connect.deleteOutputConnection(plugoutNum);
			}
			else {
				points = [ connect.getPlugout(plugoutNum).getPoints()[1].x, connect.getPlugout(plugoutNum).getPoints()[1].y, connect.getPlugout(plugoutNum).getPoints()[1].x, connect.getPlugout(plugoutNum).getPoints()[1].y ];
				connect.setSelectedPlugout(plugoutNum);			// set this plugout selected within this connector (very important)
			}
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			selectedPlug = "plugout" + plugoutNum;
			selectedPlugNum = plugoutNum;
			mainLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			selectedComp = connect;			// set this gate as the selected component
			connecting = true;				// set the controller to connecting mode
		}
	}
	
	function connectorOutputBoxMouseUp(event, connect, plugoutNum) {
		if (connecting) {
			if (selectedPlug.indexOf("plugout") < 0) {
				if (selectedComp.getType() == "connector") {
					// setting connection from a connector's input to this connectors output
					setWireFromConnectorToConnector(connect, selectedComp, plugoutNum);
				}
				else if (selectedComp.getType() == "not" || selectedComp.getType() == "output") {
					// setting connection from a NOT's input or an output node's input to this connectors output
					setWireFromConnectorToGate(connect, selectedComp, plugoutNum, 0);
					console.log("Set wire from connector to output.");
				}
				else {
					// setting connection from an OR or AND gate's input to this connectors output
					var pluginNum = parseFloat(selectedPlug.charAt(selectedPlug.length - 1));
					console.log("Plugin num: " + pluginNum + ":: " + selectedPlug);
					setWireFromConnectorToGate(connect, selectedComp, plugoutNum, pluginNum);
				}
			}
			
			connecting = false;
			tempLine.remove();
			selectedComp = null;
			mainLayer.drawScene();		
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
		
		mainLayer.draw();
	}
	
	function connectorOutputBoxMouseLeave(event, comp, plugoutNum) {
		comp.setPlugColor("plugout" + plugoutNum, "default");
		if (connecting) tempLine.setStroke("black");
		else {
			if (comp.getPlugoutComp(plugoutNum) !== null) comp.setPlugoutWireColor(plugoutNum, "default");
		}
		mainLayer.draw();
	}
	
	function connectorClick(connect) {
		if (addPopup !== null) { addPopup.hide(); addPopup = null; return; }
		if (deletePopup !== null) { deletePopup.hide(); deletePopup = null; return; }
		if (deleteMode == true) deleteConnector(connect);
	}
	
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
		
		// if we are not connecting
			// draw a temp line from the selected plug
		// if we are connecting
			// if the highlighted plug is an input, the selected plug must be an output
			// if the highlighted plug is an output, the selected plug must be an input
		if (!connecting) {
			if (highlightPlug.indexOf("plugin") >= 0) {
				if (connect.getPluginComp() !== null) {
					var connComp = connect.getPluginComp();
					if (connComp.getType() == "connector") {
						var plugoutComp = connComp.getPlugoutToComp(connect);
						connComp.deleteOutputConnection(plugoutComp);
					}
					else connComp.deleteOutputConnection();
					return;
				}
				else {
					points = [ connect.getPlugin().getPoints()[0].x, connect.getPlugin().getPoints()[0].y, connect.getPlugin().getPoints()[0].x, connect.getPlugin().getPoints()[0].y ];
				}
			}
			else if (highlightPlug.indexOf("plugout") >= 0) {
				var plugoutNum = parseFloat(highlightPlug.charAt(highlightPlug.length - 1));
				if (connect.getPlugoutWire(plugoutNum) !== null) {
					connect.deleteOutputConnection(plugoutNum);
					return;		
				}
				else {
					points = [ connect.getPlugin(plugoutNum).getPoints()[1].x, connect.getPlugin(plugoutNum).getPoints()[1].y, connect.getPlugin(plugoutNum).getPoints()[1].x, connect.getPlugin(plugoutNum).getPoints()[1].y ];
					connect.setSelectedPlugout(plugoutNum);			// set this plugout selected within this connector (very important)
				}
			}
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			selectedPlug = highlightPlug;
			mainLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			selectedComp = connect;			// set this gate as the selected component
			connecting = true;				// set the controller to connecting mode
		}
		else {
			if (highlightPlug.indexOf("plugin") >= 0) {
				if (selectedPlug.indexOf("plugin") >= 0) return;
				
				if (selectedComp.getType() == "connector") {				// if the selected component is a connector,
					var selPlugout = selectedComp.getSelectedPlugout();		// get the selected plugout for that connector
					setWireFromConnectorToConnector(selectedComp, connect, selPlugout);	// make the connection
				}
				else {	// else, the selected component is not a connector, it's a gate
					setWireFromGateToConnector(selectedComp, connect);	// make the connection
				}
			}
			else if (highlightPlug.indexOf("plugout") >= 0) {
				if (selectedPlug.indexOf("plugout") >= 0) return;
				var plugoutNum = parseFloat(highlightPlug.charAt(highlightPlug.length - 1));
				
				if (selectedComp.getType() == "connector") {
					// setting connection from a connector's input to this connectors output
					//selectedComp.setPluginComp(connect);
					//connect.setPlugoutComp(plugoutNum, selectedComp);
					//connect.setPl
					console.log(plugoutNum);
					setWireFromConnectorToConnector(connect, selectedComp, plugoutNum);
				}
				else if (selectedComp.getType() == "not" || selectedComp.getType() == "output") {
					// setting connection from a NOT's input or an output node's input to this connectors output
					setWireFromConnectorToGate(connect, selectedComp, plugoutNum, 0);
					console.log("Set wire from connector to output.");
				}
				else {
					// setting connection from an OR or AND gate's input to this connectors output
					var pluginNum = parseFloat(selectedPlug.charAt(selectedPlug.length - 1));
					setWireFromConnectorToGate(connect, selectedComp, plugoutNum, pluginNum);
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
	
	function connectorDrag(connect) {
		var connectedComps;
		
		connect.drawBoxes();
		
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
					//tempLine.setStroke("green");										// set the line to green (tempLine is created and stored on the gate/connector mouse click event)
				}
			}
			else if (comp.getType() == "not" || comp.getType() == "connector" || comp.getType() == "output") {	// if the hovered component is a NOT or and CONNECTOR
				if (comp.getPluginComp() === null) {								// if its only input is available,
					//tempLine.setStroke("green");									// change the temp line to green
				}
			}
			else if (comp.getType() == "input") {
				if (comp.getPlugoutWire() === null) {
					//tempLine.setStroke("green");
				}
			}
		}
		
		mouseOverComp = comp;
	}
	
	function probe(comp) {
		var str = comp.probe();
		if (str !== null) alert(str);
		else alert("Part of your circuit is not connected to an input!");
	}
	
	//------------------------------------
	//--------- NODE LISTENERS -----------
	//------------------------------------
	
	function nodeClick(node) {
		if (node.getType() == "input") {
			node.toggleOutputValue();
			mainLayer.draw();
		}
	}
	
	function nodeOutputBoxMouseDown(event, node) {
		if (!connecting) {
			if (node.getPlugoutWire() !== null) {
				// delete the output wire
				node.deleteOutputConnection();

			}
			else {
				points = [node.getPlugout().getPoints()[1].x, node.getPlugout().getPoints()[1].y, node.getPlugout().getPoints()[1].x, node.getPlugout().getPoints()[1].y];
			}
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			mainLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			selectedComp = node;			// set this gate as the selected component
			selectedPlug = "plugout";
			connecting = true;				// set the controller to connecting mode
		}
	}
	
	function nodeOutputBoxMouseUp(event, node) {
		if (connecting) {
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
			tempLine.remove();
			mainLayer.drawScene();
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
			node.setPlugoutWireColor("yellow");
		}
		mainLayer.draw();
	}
	
	function nodeOutputBoxMouseLeave(event, node) {
		node.setPlugColor("plugout", "default");
		if (connecting) tempLine.setStroke("plugout", "default");
		else {
			if (node.getPlugoutComp() !== null) node.setPlugoutWireColor("default");
		}
		mainLayer.draw();
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
			mainLayer.drawScene();
		}
	}
	
	function nodeInputBoxMouseEnter(event, node) {
		if (node.getPluginComp() === null) {
			if (!connecting) node.setPlugColor("plugin", "green");
			if (connecting && selectedPlug.indexOf("plugout") >= 0) {
				node.setPlugColor("plugin", "green");
				tempLine.setStroke("green");
			}
			mainLayer.draw();
		}
		else {
			if (!connecting) {
				if (node.getPluginComp().getType() != "connector") node.getPluginComp().setPlugoutWireColor("yellow");
				else {
					var plugoutNum = node.getConnectorPlugin();
					node.getPluginComp().setPlugoutWireColor(plugoutNum, "yellow");
				}
			}
			
			mainLayer.draw();
		}
	}
	
	function nodeInputBoxMouseLeave(event, node) {
		node.setPlugColor("plugin", "default");
		if (connecting) {
			tempLine.setStroke("plugin", "black");
			mainLayer.draw();
		}
		else {
			if (node.getPluginComp() !== null) {
				if (node.getPluginComp().getType() != "connector") node.getPluginComp().setPlugoutWireColor("default");
				else {
					var plugoutNum = node.getConnectorPlugin();
					node.getPluginComp().setPlugoutWireColor(plugoutNum, "default");
				}
			}
			mainLayer.draw();
		}
	}
	
	function nodeMouseDown(event, node) {
		if (event.button == 0) {
			if (addPopup !== null) { addPopup.hide(); addPopup = null; return; }
			if (deletePopup !== null) { deletePopup.hide(); deletePopup = null; return; }
		}
			// if we are not connecting
				// if the node we are clicking is an input node, start drawing the temp line
				// if the node we are clicking is an output node, start drawing the temp line
			// if we are connecting
				// if the node we are clicking is an input node, it must be coming from an input
				// if the node we are clicking is an output node, it must be coming from an output
				
		if (!connecting) {
			if (event.button == 2) {
				showDeleteMenu(node);
				return;
			}
			selectedPlug = highlightPlug;
			
			if (node.getType() == "input") {
				if (node.getPlugoutWire() !== null) {
					// delete the output wire
					node.deleteOutputConnection();
					return;
				}
				else {
					points = [node.getPlugout().getPoints()[1].x, node.getPlugout().getPoints()[1].y, node.getPlugout().getPoints()[1].x, node.getPlugout().getPoints()[1].y];
				}
			}
			else {
				if (node.getPluginComp() !== null) {
					// delete the input wire
					var connComp = node.getPluginComp();
					if (connComp.getType() == "connector") {
						var plugoutNum = connComp.getPlugoutToComp(node);
						connComp.deleteOutputConnection(plugoutNum);
					}
					else connComp.deleteOutputConnection();
					
					return;
				}
				else {
					points = [node.getPlugin().getPoints()[0].x, node.getPlugin().getPoints()[0].y, node.getPlugin().getPoints()[0].x, node.getPlugin().getPoints()[0].y];
				}
			}
			
			tempLine = new Kinetic.Line({points : points,stroke : "black",strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
			mainLayer.add(tempLine);		// add this line to the main layer so it can be drawn
			selectedComp = node;			// set this gate as the selected component
			connecting = true;				// set the controller to connecting mode
		}
		else {
			if (node.getType() == "input") {
				if (selectedPlug.indexOf("plugout") >= 0) return;
				
				if (selectedComp.getType() == "not" || selectedComp.getType() == "output") setWireFromGateToGate(node, selectedComp, 0);
				else if (selectedComp.getFunc() == "gate") setWireFromGateToGate(node, selectedComp, parseFloat(selectedPlug.charAt(selectedPlug.length - 1)));
				else if (selectedComp.getType() == "connector") {
					// connect wire from connector to input node
					setWireFromGateToConnector(node, selectedComp);
				}
			}
			else if (node.getType() == "output") {
				if (selectedPlug.indexOf("plugin") >= 0) return;
				
				if (selectedComp.getFunc() == "gate") setWireFromGateToGate(selectedComp, node, 0);
				else if (selectedComp.getType() == "connector") {
					// connect wire from connector to output node
					var plugoutNum = parseFloat(selectedPlug.charAt(selectedPlug.length - 1));
					setWireFromConnectorToGate(selectedComp, node, plugoutNum, 0);
				}
			}
			
			connecting = false;
			selectedComp = null;
			mainLayer.drawScene();
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
		if (probeMode == true) { probeMode = false; setComponentMouseOver("default"); return; }
		if (deleteMode == true) { 
			if (haltMenu == true) {
				truthTable.toggleVisible("table1");
				haltMenu = false;
				return;
			}
			deleteMode = false;
			toggleComponentDeleteIcons(false);
			trashImg.src = "trash_closed.bmp";
			haltMenu = false;
			return;
		}
		
		if (!connecting && haltMenu == false) {
			showAddMenu(event, getRelativePointerPosition(event));
		}
		else if (haltMenu == true) haltMenu = false;
		
		if (connecting) {							// if we are in connecting mode
			tempLine.disableStroke();				// disable the tempLine's stroke
			tempLine = null;						// set the tempLine to NULL
			connecting = false;		// we are not longer in connecting mode
			selectedComp = null;
			mainLayer.drawScene();	// refresh the scene
		}

		evaluateCircuit();
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
			mainLayer.draw();
		}
	}
	
	function stageMouseMove3() {
		if (connecting) {		// if we are in connecting mode
			var selPlugout;
			
			var mPos = getRelativePointerPosition();
			mPos.x = mPos.x;
			mPos.y = mPos.y - 5;
			
			if (selectedComp.getType() == "connector") {			// if the selected component is a connector
				selPlugout = selectedComp.getSelectedPlugout();		// retrieve the selected plugout number
				
				
				// if the selected plugout is the top plugout (2), use getWirePoints(); else use getWirePoints2() -- go see why if you haven't yet
				if (selPlugout == 2) points = getWirePoints(selectedComp.getPlugout(selPlugout).getPoints()[1], mPos);
				else if (selPlugout == 1 || selPlugout == 3) points = getWirePoints2(selectedComp.getPlugout(selPlugout).getPoints()[1], mPos);
				else points = getWirePoints(selectedComp.getPlugin().getPoints()[0], mPos);
				
				tempLine.setPoints(points);
			}
			else {	// if the selected component is anything else (a gate)
				//points = getWirePoints(selectedComp.getPlugout().getPoints()[1], mPos);	// get the wire points
				points = getWirePoints(tempLine.getPoints()[0], mPos);
				tempLine.setPoints(points);
				//selectedComp.getPlugoutWire().setPoints(points);												// set the points we just computed
			}
			
			mainLayer.drawScene();	// refresh the scene
		}
		
		//mouseOverHighlight();
	}
	
	function bgMouseUp() {
		if (!connecting) {
			
		}
		else {
			console.log("Cancel the current connection mode.");
			connecting = false;
			tempLine.disableStroke();
			tempLine = null;
		}
		mainLayer.draw();
	}
	
	function bgMouseDown() {
		if (!connecting) {
		
		}
		else {
		
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
		
		if (pluginNum == 0) toGate.setPluginComp(fromGate);				// if the plugin number is 0, the component is a NOT gate (only one input for a not gate)
		else toGate.setPluginComp(pluginNum, fromGate);					// else, call setPluginComp on the component with the plugin number provided and the selected component
		
		
		// make a new line with the points computed earlier
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		fromGate.setPlugoutWire(line);	// set the plugoutWire of the selectedComp to this new line
		fromGate.setPlugoutComp(toGate);									// set the plugoutComp for the selectedComp
		
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
	function setWireFromGateToConnector(fromGate, toConnect) {
		start = fromGate.getPlugout().getPoints()[1];			// get the end point of the start line
		end = toConnect.getPlugin().getPoints()[0];				// get the start point of the end line
		points = getWirePoints(start, end);		// get the wire points
		toConnect.setPluginComp(fromGate);	// set the plugin component of the connector to the selected gate
		
		// make the line with the points computed earlier
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		fromGate.setPlugoutWire(line);	// set the plugout wire to this line of the selected gate
		fromGate.setPlugoutComp(toConnect);	// set the plugout component of the selected gate to this connector
		
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
	function setWireFromConnectorToGate(fromConnect, toGate, plugoutNum, pluginNum) {
		start = fromConnect.getPlugout(plugoutNum).getPoints()[1];										// get the end point of the start line
		end = toGate.getPlugin(pluginNum).getPoints()[0];											// get the start point of the end line
		
		// if the plugoutNum of the connector is 2, use getWirePoins(); else use getWirePoints2() -- see documentation
		if (plugoutNum == 2) points = getWirePoints(start, end);
		else points = getWirePoints2(start, end);
		
		if (pluginNum == 0) {
			toGate.setConnectorPlugin(plugoutNum);
			toGate.setPluginComp(fromConnect);				// if pluginNum is 0, its a NOT gate
		}
		else {																// else, it's an AND or OR gate
			toGate.setConnectorPlugin(pluginNum, plugoutNum);					// set the connector plugin for the gate (very important)
			toGate.setPluginComp(pluginNum, fromConnect);					// set the plugin component of the gate
		}
		
		// make the line with the points computed earlier
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		fromConnect.setPlugoutWire(plugoutNum, line);	// set plugout wire of the connector to this line
		fromConnect.setPlugoutComp(plugoutNum, toGate);						// set the plugout component of the connector to the gate
		
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
	function setWireFromConnectorToConnector(fromConnect, toConnect, plugoutNum) {
		start = fromConnect.getPlugout(plugoutNum).getPoints()[1];									// get the end point of the start line
		end = toConnect.getPlugin().getPoints()[0];										// get the start point of the end line
		
		// if the plugoutNum of the connector is 2, use getWirePoins(); else use getWirePoints2() -- see documentation
		if (plugoutNum == 2) points = getWirePoints(start, end);
		else points = getWirePoints2(start, end);
		
		toConnect.setPluginComp(fromConnect);							// set the plugin component of the second connector
		fromConnect.setPlugoutComp(plugoutNum, toConnect);				// set the plugout component of the selected connector
		
		// make a line with the points computed earlier
		var line = new Kinetic.Line({points : points, stroke : "black", strokeWidth : 1, lineCap : 'round', lineJoin : 'round'});
		fromConnect.setPlugoutWire(plugoutNum, line);		// set the plugout wire of the given plugout to the line we just created
		
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
		var orGate = new SB_OrGate(initX, initY, "Or Gate", nextID++, setup);
		components.push(orGate);
		orGate.draw();
		registerComponent(orGate);
		//orGate.draw();
	}
	
	function addAndGate(initX, initY) {
		var andGate = new SB_AndGate(initX, initY, "And Gate", nextID++, setup);
		components.push(andGate);
		andGate.draw();
		registerComponent(andGate);
		//andGate.draw();
	}
	
	function addNotGate(initX, initY) {
		var notGate = new SB_NotGate(initX, initY, "Not Gate", nextID++, setup);
		components.push(notGate);
		notGate.draw();
		registerComponent(notGate);
		//notGate.draw();
	}
	
	function addConnector(initX, initY) {
		var conn = new SB_Connector(initX, initY, "Connector", nextID++, setup);
		components.push(conn);
		conn.draw();
		registerComponent(conn);
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
		mainLayer.drawScene();
		evaluateCircuit();
		stage.draw();
	}
	
	function addInput(initX, initY, text, value) {
		input = new SB_InputNode(initX, initY, text, value, "Input Node", nextID++, setup);
		components.push(input);
		inputs.push(input);
		input.draw();
		registerComponent(input);
	}
	
	function addOutput(initX, initY, text) {
		output = new SB_OutputNode(initX, initY, text, "Output Node", nextID++, setup);
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
			if (inputValSave[i] != inputs[i].getValue()) inputs[i].toggleOutputValue();
		}
		
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
		wrenchPopup.add('Truth Table', function(target) {
			if (numInputs > 5) { alert("The truth table feature has been disabled because you have more than 5 inputs."); return; }
			else {
				truthTable.toggleVisible("table1");
			}
			wrenchPopup = null;
		});
		wrenchPopup.add('Number of Inputs', function(target) {
			if (components.length != (numInputs + numOutputs)) {
				var r = confirm("You have already began building a circuit. This action will reset the Scratch Pad which would result in work being lost.\n\nDo you wish to continue?");
				if (r == true) {
					updateNumberOfInputs();
				}
				else {
					wrenchPopup = null;
					return;
				}
			}
			else {
				updateNumberOfInputs();
			}
			wrenchPopup = null;
		});
		wrenchPopup.add('Number of Outputs', function(target) {
			if (components.length != (numInputs + numOutputs)) {
				var r = confirm("You have already began building a circuit. This action will reset the Scratch Pad which would result in work being lost.\n\nDo you wish to continue?");
				if (r == true) {
					updateNumberOfOutputs();
				}
				else {
					wrenchPopup = null;
					return;
				}
			}
			else {
				updateNumberOfOutputs();
			}
			wrenchPopup = null;
		});
		wrenchPopup.setSize(140, 0);
		wrenchPopup.showMenu(event, pos);
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
		stage.draw();
	}
	
	function updateNumberOfInputs() {
		var res = prompt("Enter number of inputs.", numInputs);
		if (res === null) return;
		if (res <= "0") { alert("You can't have a negative number of inputs..."); return; }
		if (isNaN(parseFloat(res))) { alert("Not a number!"); return; }
		if (parseFloat(res) + numOutputs > 25) { alert("You can't have that many inputs."); return; }
		setup.resetExercise(parseFloat(res), numOutputs);
	}
	
	function updateNumberOfOutputs() {
		var res = prompt("Enter number of outputs.", numOutputs);
		if (res === null) return;
		if (res <= "0") { alert("You can't have a negative number of outputs..."); return; }
		if (isNaN(parseFloat(res))) { alert("Not a number!"); return; }
		if (parseFloat(res) + numInputs > 25) { alert("You can't have that many outputs."); return; }
		setup.resetExercise(numInputs, parseFloat(res));
	}
	
	function initTruthTableListeners() {
		$(function() {
			$( "#table1" ).draggable();
			$( "#table1" ).on("touchstart mousedown", function() {
				haltMenu = true;
			});
		});
	}
}