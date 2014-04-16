function DigitalLogicsLab(containerNum, exerNum, numInputs, numOutputs) {
	this.saveExercise = saveExercise;
	
	var setup = new SB_Setup("sandbox" + containerNum, containerNum, exerNum, numInputs, numOutputs);
	
	function saveExercise() {
		setup.saveExercise();
	}
}