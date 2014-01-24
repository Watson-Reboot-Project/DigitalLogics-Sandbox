function OutputNode(initX, initY, setText, setName, id, setup) {

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	var value;
	var plugin = null;
	var pluginVal = -1;
	var pluginComp = null;
	var pluginWire = null;
	
	var name = setName;				// the name of the connector
	var ID = id;					// the ID of the connector
	var compShape;					// the shape of the connector (square)
	var text;
	var group;						// the group that will be composed of the connector's components
	var transFg;					// the transparent foreground that makes it easy for users to click the connector
	
	var scale = setup.getGScale();
	var mainLayer = setup.getMainLayer();
	var stage = setup.getStage();
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	this.getPlugin = getPlugout;
	this.getPluginComp = getPluginComp;
	this.setPluginComp = setPluginComp;
	this.setPluginVal = setPluginVal;
	this.setPluginCompNull = setPluginCompNull;
	
	this.draw = draw;
	this.getID = getID;
	this.getName = getName;
	this.getType = getType;
	this.getText = getText;
	this.getFunc = getFunc;
	this.getID = getID;
	this.getGroup = getGroup;
	this.evaluate = evaluate;
	this.probe = probe;
	this.updateScale = updateScale;
	this.setPlugColor = setPlugColor;
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE ASSIGNMENTS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

	// make the rectangle
    compShape = new Kinetic.Rect({
        x: scale * 15,
        y: scale * 20,
        width: scale * 10,
        height: scale * 10,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 1
      });
	  
	text = new Kinetic.Text({
		x: scale * 15,
		y: scale * 0,
		text: setText,
		fontSize: scale * 20,
		fontFamily: 'Calibri',
		fill: 'black'
	});

	// create the first plugout line
	plugin = new Kinetic.Line({
		points : [scale * 0, scale * 25, scale * 15, scale * 25],
		stroke : 'black',
		strokeWidth : 1,
		lineCap : 'round',
		lineJoin : 'round'
	});

	// create the transparent rectangle
	transFg = new Kinetic.Rect({
		x: scale * 0,
		y: scale * 0,
		width: scale * 25,
		height: scale * 40
	});
	
	// create the group object
	group = new Kinetic.Group({
			x : scale * initX,
			y : scale * initY,
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
		group.add(text);
		group.add(plugin);		// ... the plugin line
		group.add(transFg);		// and finally the transparent foreground
		mainLayer.add(group);	// add the group to the main layer
		stage.draw();			// call draw on the stage to redraw its components
	}
	
	function getName() { return name; }
	
	function getID() { return ID; }
	
	function getType() { return "output"; }
	
	function getText() { return setText; }
	
	function getFunc() { return "node"; }
	
	function getID() { return ID; }
	
	function getGroup() { return group; }
	
	function getPlugout() {
		var line;
		line = new Kinetic.Line({
			points: [group.getX() + plugin.getPoints()[0].x, group.getY() + plugin.getPoints()[0].y, group.getX() + plugin.getPoints()[1].x, group.getY() + plugin.getPoints()[1].y]
		});
		return line;
	}
	
	function getPluginComp() { return pluginComp; }
	
	function setPluginComp(comp) { pluginComp = comp; }
	
	function setPluginCompNull() { pluginComp = null; pluginVal = -1; }
	
	function setPluginVal(comp, value) {
		evaluate(value);
		pluginVals = [];
		pluginVal = value;
	}
	
	function evaluate(res) {
		//console.log("Final result: " + res);
	}
	
	this.getResult = getResult;
	function getResult() {
		return pluginVal;
	}
	
	function probe() {
		var str;
		if (pluginComp !== null) {
			str = pluginComp.probe();
			return str;
		}
		else return null;
	}
	
	function updateScale() { scale = setup.getGScale(); }
	
	function setPlugColor(plugStr, color) { 
		plugin.setStroke("black");
		if (plugStr == "plugin") plugin.setStroke("green");
	}
}