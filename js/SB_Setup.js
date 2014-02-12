function SB_Setup(container) {
	var timeout = false;
	
	this.getMainLayer = getMainLayer;
	this.getStage = getStage;
	this.getBG = getBG;
	this.resetExercise = resetExercise;
	
	var width = 800;
	var height = 600;
	var thisObj = this;
	
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

	resize();
	
	var truthTable = new SB_TruthTable(container);
	var controller = new SB_Controller(this, truthTable, 2, 1);
	var exercises = new SB_Exercises(stage, this, truthTable, controller, 2, 1);
		
	var curExercise = 0;
	exercises.setExercise(curExercise);
	controller.initTruthTableListeners();
	
	truthTable.setLeftOffset(50);
	
	$(window).resize( function() {
		if (timeout == false) {
			timeout = true;
			setTimeout(resize, 200);
		}
	});
	
	function resize() {
		console.log(window.innerWidth);
		var width = (window.innerWidth > 800) ? 800 : window.innerWidth;
		var ratio = (width / 800);
		console.log("Ratio: " + ratio);
		stage.setScale(ratio);
		stage.setSize(800 * ratio, 600);
		console.log("Size: " + stage.getWidth() + ", " + stage.getHeight());
		
		timeout = false;
	}
	
	function resetExercise(numInputs, numOutputs) {
		console.log(document.getElementById("table1"));
		var table = document.getElementById("table1");
		table.id = "";
		table.parentNode.removeChild(table);
		
		container.innerHTML = "";
		width = 800;
		height = 600;
		stage = new Kinetic.Stage({
			container : container,
			width : width,
			height : height
		});
		mainLayer = new Kinetic.Layer();
		stage.add(mainLayer);
		bg = new Kinetic.Rect({
			x : 0,
			y : 0,
			width : width,
			height : height
		});
		mainLayer.add(bg);
		resize();
		truthTable = new SB_TruthTable(container);
		controller = new SB_Controller(thisObj, truthTable, numInputs, numOutputs);
		exercises = new SB_Exercises(stage, thisObj, truthTable, controller, numInputs, numOutputs);
		exercises.setExercise(0);
		truthTable.setLeftOffset(50);
		controller.initTruthTableListeners();
	}
	
	function getMainLayer() { return mainLayer; }
	
	function getStage() { return stage; }
	
	function getBG() { return bg; }
}