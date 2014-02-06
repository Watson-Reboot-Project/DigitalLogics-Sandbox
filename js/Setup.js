function Setup(container, width, height) {

	this.setStageDimensions = setStageDimensions;
	this.getGScale = getGScale;
	this.getMainLayer = getMainLayer;
	this.getStage = getStage;
	this.getBG = getBG;
	
	//var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
	//var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;

	console.log(width + ", " + height);
	
	var stage = new Kinetic.Stage({
			container : container,
			width : width,
			height : height
		});

	var mainLayer = new Kinetic.Layer();
	stage.add(mainLayer);
	
	var bg = new Kinetic.Rect({
		x : 0,
		y : 0,
		width : width,
		height : height
	});
	
	mainLayer.add(bg);
	
	var gScale = 1;

	var truthTable = new TruthTable(container);
	var controller = new Controller(this, truthTable);
	var exercises = new Exercises(this, truthTable, controller);
		
	var curExercise = 1;
	
	setStageDimensions(width, height);
	exercises.setExercise(curExercise);
	
	truthTable.setLeftOffset(50);
	
	function setStageDimensions(width) {
		var scale = exercises.resizeExercise(curExercise, width);
		gScale = scale;
		stage.setWidth(width);
		stage.setHeight(height);
		stage.draw();
	}
	
	function getGScale() { return gScale; }
	
	function getMainLayer() { return mainLayer; }
	
	function getStage() { return stage; }
	
	function getBG() { return bg; }
}
