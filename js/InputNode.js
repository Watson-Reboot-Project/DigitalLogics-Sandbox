function InputNode(initX, initY, setText, setValue, setName, id, setup) {

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; VARIABLE DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	var value = setValue;
	var plugout = null;
	var plugoutComp = null;
	var plugoutWire = null;
	
	var name = setName;				// the name of the connector
	var ID = id;					// the ID of the connector
	var compShape;					// the shape of the connector (square)
	var text;
	var group;						// the group that will be composed of the connector's components
	var transFg;					// the transparent foreground that makes it easy for users to click the connector
	
	var scale = setup.getGScale();
	var mainLayer = setup.getMainLayer();
	var stage = setup.getStage();
	var thisObj = this;
	
	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; FUNCTION DECLARATIONS ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	
	this.getPlugout = getPlugout;
	this.getPlugoutComp = getPlugoutComp;
	this.setPlugoutComp = setPlugoutComp;
	this.setPlugoutWire = setPlugoutWire;
	this.getPlugoutWire = getPlugoutWire;
	this.setValue = setValue;
	
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
	this.redraw = redraw;
	
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
	  
	if (setText.length == 1) {
		text = new Kinetic.Text({
			x: scale * 0,
			y: scale * 14,
			text: setText,
			fontSize: scale * 20,
			fontFamily: 'Calibri',
			fill: 'black'
		});
	}
	else {
		text = new Kinetic.Text({
			x: scale * (-5 * setText.length),
			y: scale * 14,
			text: setText,
			fontSize: scale * 20,
			fontFamily: 'Calibri',
			fill: 'black'
		});
	}

	// create the first plugout line
	plugout = new Kinetic.Line({
		points : [scale * 25, scale * 25, scale * 40, scale * 25],
		stroke : 'black',
		strokeWidth : 1,
		lineCap : 'round',
		lineJoin : 'round'
	});

	// create the transparent rectangle
	transFg = new Kinetic.Rect({
		x: scale * 0,
		y: scale * 15,
		width: scale * 50,
		height: scale * 25
	});
	
	// create the group object
	group = new Kinetic.Group({
			x : scale * initX,
			y : scale * initY,
			rotationDeg : 0,
			draggable : false
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
		group.add(plugout);		// ... the plugin line
		group.add(transFg);		// and finally the transparent foreground
		mainLayer.add(group);	// add the group to the main layer
		stage.draw();			// call draw on the stage to redraw its components
	}
	
	function redraw() {
		updateScale();
		stage.remove(group); group.destroy();
		compShape = new Kinetic.Rect({ x: scale * 15, y: scale * 20, width: scale * 10,  height: scale * 10, fill: 'black', stroke: 'black', strokeWidth: 1 });
		if (setText.length == 1) text = new Kinetic.Text({ x: scale * 0,	y: scale * 14,	text: setText,	fontSize: scale * 20, fontFamily: 'Calibri',fill: 'black'});
		else text = new Kinetic.Text({	x: scale * -10,	y: scale * 14,	text: setText, fontSize: scale * 20,	fontFamily: 'Calibri',	fill: 'black' });
		plugout = new Kinetic.Line({points : [scale * 25, scale * 25, scale * 40, scale * 25],stroke : 'black',strokeWidth : 1,lineCap : 'round',lineJoin : 'round'});
		transFg = new Kinetic.Rect({x: scale * 0,y: scale * 15,width: scale * 50,height: scale * 25});
		group = new Kinetic.Group({	x : scale * initX,	y : scale * initY,	rotationDeg : 0,draggable : false });
		draw();
	}
	
	function getName() { return name; }
	
	function getID() { return ID; }
	
	function getType() { return "input"; }
	
	function getText() { return setText; }
	
	function getFunc() { return "node"; }
	
	function getID() { return ID; }
	
	function getGroup() { return group; }
	
	function getPlugout() {
		var line;
		line = new Kinetic.Line({
			points: [group.getX() + plugout.getPoints()[0].x, group.getY() + plugout.getPoints()[0].y, group.getX() + plugout.getPoints()[1].x, group.getY() + plugout.getPoints()[1].y]
		});
		return line;
	}
	
	function setValue(val) { value = val; }
	
	function getPlugoutComp() { return plugoutComp; }
	
	function setPlugoutComp(comp) { plugoutComp = comp; evaluate(); }
	
	function getPlugoutWire() { return plugoutWire; }
	
	function setPlugoutWire(line) { plugoutWire = line; }
	
	function evaluate() {
		if (plugoutComp !== null) {
			plugoutComp.setPluginVal(thisObj, value);
		}
	}
	
	function probe() {
		var str = setText;
		return str;
	}
	
	function updateScale() { scale = setup.getGScale(); }
}