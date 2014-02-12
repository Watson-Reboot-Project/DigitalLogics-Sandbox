function SB_Exercises(stage, setup, truthTable, controller, numInputs, numOutputs) {
	var stage = setup.getStage();
	var alphabet = [ "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z" ];
	
	this.setExercise = setExercise;
	
	function setExercise(exerciseNum) {
		var expectedTruthTable;
		var header;
		var numIn;
		var numOut;
		
		if (exerciseNum == 0) {	// scratch pad mode
			expectedTruthTable = [ ];
			var header = [ ];

			for (var i = 0; i < numInputs; i++) header.push(alphabet[i]);
			for (var i = 0; i < numOutputs; i++) header.push(alphabet[25 - i]);
				
			if (numInputs <= 5) {
				truthTable.createTable(numInputs, numOutputs, header);
			}
			
			var ind = 0;
			for (var i = 0; i < numInputs; i++) {
				controller.addInput(5, ((600 / (numInputs + 1)) * (i + 1)), header[ind++], 0);
			}
			for (var i = 0; i < numOutputs; i++) {
				controller.addOutput(820, ((550 / (numOutputs + 1)) * (i + 1)), header[ind++]);
			}
		}
		if (exerciseNum == 1) {  //3 input AND
			expectedTruthTable = [
			[0, 0, 0, 0],
			[0, 0, 1, 0],
			[0, 1, 0, 0],
			[0, 1, 1, 0],
			[1, 0, 0, 0],
			[1, 0, 1, 0],
			[1, 1, 0, 0],
			[1, 1, 1, 1] ];
			
			header = ["A","B","C","Z"];
			truthTable.createTable(3, 1, header);
			
			controller.addInput(5, 50, "A", 0);
			controller.addInput(5, 250, "B", 0);
			controller.addInput(5, 450, "C", 0);
			controller.addOutput(760, 250, "Z");
		}
		else if (exerciseNum == 2) {  //4 input AND
			expectedTruthTable = [
			[0, 0, 0, 0, 0],
			[0, 0, 0, 1, 0],
			[0, 0, 1, 0, 0],
			[0, 0, 1, 1, 0],
			[0, 1, 0, 0, 0],
			[0, 1, 0, 1, 0],
			[0, 1, 1, 0, 0],
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 0],
			[1, 0, 0, 1, 0],
			[1, 0, 1, 0, 0],
			[1, 0, 1, 1, 0],
			[1, 1, 0, 0, 0],
			[1, 1, 0, 1, 0],
			[1, 1, 1, 0, 0],
			[1, 1, 1, 1, 1] ];
			
			header = ["A","B","C","D","Z"];
			truthTable.createTable(4, 1, header);
			
			controller.addInput(0, 50, "A", 0);
			controller.addInput(0, 150, "B", 0);
			controller.addInput(0, 250, "C", 0);
			controller.addInput(0, 350, "D", 0);
			controller.addOutput(1350, 200, "Z");
		}
		else if (exerciseNum == 3){  //3 input OR
			expectedTruthTable = [
			[0, 0, 0, 0],
			[0, 0, 1, 1],
			[0, 1, 0, 1],
			[0, 1, 1, 1],
			[1, 0, 0, 1],
			[1, 0, 1, 1],
			[1, 1, 0, 1],
			[1, 1, 1, 1] ];
			
			header = ["A","B","C","Z"];
			truthTable.createTable(3, 1, header);
			
			controller.addInput(50, 50, "A", 0);
			controller.addInput(50, 250, "B", 0);
			controller.addInput(50, 450, "C", 0);
			controller.addOutput(1350, 250, "Z");
		}
		else if (exerciseNum == 4){  //3 input NAND
			expectedTruthTable = [
			[0, 0, 0, 1],
			[0, 0, 1, 1],
			[0, 1, 0, 1],
			[0, 1, 1, 1],
			[1, 0, 0, 1],
			[1, 0, 1, 1],
			[1, 1, 0, 1],
			[1, 1, 1, 0] ];
			
			header = ["A","B","C","Z"];
			truthTable.createTable(3, 1, header);
			
			controller.addInput(50, 50, "A", 0);
			controller.addInput(50, 250, "B", 0);
			controller.addInput(50, 450, "C", 0);
			controller.addOutput(1350, 250, "Z");
		}
		else if (exerciseNum == 5) {  //4 input NAND
			expectedTruthTable = [
			[0, 0, 0, 0, 1],
			[0, 0, 0, 1, 1],
			[0, 0, 1, 0, 1],
			[0, 0, 1, 1, 1],
			[0, 1, 0, 0, 1],
			[0, 1, 0, 1, 1],
			[0, 1, 1, 0, 1],
			[0, 1, 1, 1, 1],
			[1, 0, 0, 0, 1],
			[1, 0, 0, 1, 1],
			[1, 0, 1, 0, 1],
			[1, 0, 1, 1, 1],
			[1, 1, 0, 0, 1],
			[1, 1, 0, 1, 1],
			[1, 1, 1, 0, 1],
			[1, 1, 1, 1, 0] ];
			
			header = ["A","B","C","D","Z"];
			truthTable.createTable(4, 1, header);
			
			controller.addInput(0, 50, "A", 0);
			controller.addInput(0, 150, "B", 0);
			controller.addInput(0, 250, "C", 0);
			controller.addInput(0, 350, "D", 0);
			controller.addOutput(1300, 200, "Z");
		}
		else if (exerciseNum == 6){  //3 input NOR
			expectedTruthTable = [
			[0, 0, 0, 1],
			[0, 0, 1, 0],
			[0, 1, 0, 0],
			[0, 1, 1, 0],
			[1, 0, 0, 0],
			[1, 0, 1, 0],
			[1, 1, 0, 0],
			[1, 1, 1, 0] ];
			
			header = ["A","B","C","Z"];
			truthTable.createTable(3, 1, header);
			
			controller.addInput(50, 50, "A", 0);
			controller.addInput(50, 250, "B", 0);
			controller.addInput(50, 450, "C", 0);
			controller.addOutput(1350, 250, "Z");
		}
		else if (exerciseNum == 7) {  //4 input NOR
			expectedTruthTable = [
			[0, 0, 0, 0, 1],
			[0, 0, 0, 1, 0],
			[0, 0, 1, 0, 0],
			[0, 0, 1, 1, 0],
			[0, 1, 0, 0, 0],
			[0, 1, 0, 1, 0],
			[0, 1, 1, 0, 0],
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 0],
			[1, 0, 0, 1, 0],
			[1, 0, 1, 0, 0],
			[1, 0, 1, 1, 0],
			[1, 1, 0, 0, 0],
			[1, 1, 0, 1, 0],
			[1, 1, 1, 0, 0],
			[1, 1, 1, 1, 0] ];
			
			header = ["A","B","C","D","Z"];
			truthTable.createTable(4, 1, header);
			
			controller.addInput(0, 50, "A", 0);
			controller.addInput(0, 150, "B", 0);
			controller.addInput(0, 250, "C", 0);
			controller.addInput(0, 350, "D", 0);
			controller.addOutput(1300, 200, "Z");
		}
		else if(exerciseNum == 8) { //XOR
			expectedTruthTable = [
			[0, 0, 0],
			[0, 1, 1],
			[1, 0, 1],
			[1, 1, 0] ];
			
			var header = ["A","B","Z"];
			truthTable.createTable(2, 1, header);

			controller.addInput(50, 50, "A", 0);
			controller.addInput(50, 250, "B", 0);
			controller.addOutput(1350, 150, "Z");
		}
		else if(exerciseNum == 9) { //two-bit comparator for equality
			expectedTruthTable = [
			[0, 0, 0, 0, 1],
			[0, 0, 0, 1, 0],
			[0, 0, 1, 0, 0],
			[0, 0, 1, 1, 0],
			[0, 1, 0, 0, 0],
			[0, 1, 0, 1, 1],
			[0, 1, 1, 0, 0],
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 0],
			[1, 0, 0, 1, 0],
			[1, 0, 1, 0, 1],
			[1, 0, 1, 1, 0],
			[1, 1, 0, 0, 0],
			[1, 1, 0, 1, 0],
			[1, 1, 1, 0, 0],
			[1, 1, 1, 1, 1] ];
			
			var header = ["A1","A0","B1","B0", "Z"];
			truthTable.createTable(4, 1, header);

			controller.addInput(50, 150, "A1", 0);
			controller.addInput(50, 50, "A0", 0);
			controller.addInput(50, 350, "B1", 0);
			controller.addInput(50, 250, "B0", 0);
			controller.addOutput(1300, 200, "Z");
		}
		else if(exerciseNum == 10) { //one-bit comparator for less than
			expectedTruthTable = [
			[0, 0, 0],
			[0, 1, 1],
			[1, 0, 0],
			[1, 1, 0] ];
			
			var header = ["A","B","Z"];
			truthTable.createTable(2, 1, header);

			controller.addInput(50, 50, "A", 0);
			controller.addInput(50, 250, "B", 0);
			controller.addOutput(1350, 150, "Z");
		}
		else if(exerciseNum == 11) { //two-bit comparator for less than
			expectedTruthTable = [
			[0, 0, 0, 0, 0],
			[0, 0, 0, 1, 1],
			[0, 0, 1, 0, 1],
			[0, 0, 1, 1, 1],
			[0, 1, 0, 0, 0],
			[0, 1, 0, 1, 0],
			[0, 1, 1, 0, 1],
			[0, 1, 1, 1, 1],
			[1, 0, 0, 0, 0],
			[1, 0, 0, 1, 0],
			[1, 0, 1, 0, 0],
			[1, 0, 1, 1, 1],
			[1, 1, 0, 0, 0],
			[1, 1, 0, 1, 0],
			[1, 1, 1, 0, 0],
			[1, 1, 1, 1, 0] ];
			
			var header = ["A1","A0","B1","B0", "Z"];
			truthTable.createTable(4, 1, header);

			controller.addInput(50, 150, "A1", 0);
			controller.addInput(50, 50, "A0", 0);
			controller.addInput(50, 350, "B1", 0);
			controller.addInput(50, 250, "B0", 0);
			controller.addOutput(1300, 200, "Z");
		}
		else if(exerciseNum == 12) { //one-bit comparator for greater than
			expectedTruthTable = [
			[0, 0, 0],
			[0, 1, 0],
			[1, 0, 1],
			[1, 1, 0] ];

			var header = ["A","B","Z"];
			truthTable.createTable(2, 1, header);

			controller.addInput(50, 50, "A", 0);
			controller.addInput(50, 250, "B", 0);
			controller.addOutput(1350, 150, "Z");
		}
		else if(exerciseNum == 13) { //two-bit comparator for greater than
			expectedTruthTable = [
			[0, 0, 0, 0, 0],
			[0, 0, 0, 1, 0],
			[0, 0, 1, 0, 0],
			[0, 0, 1, 1, 0],
			[0, 1, 0, 0, 1],
			[0, 1, 0, 1, 0],
			[0, 1, 1, 0, 0],
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 1],
			[1, 0, 0, 1, 1],
			[1, 0, 1, 0, 0],
			[1, 0, 1, 1, 0],
			[1, 1, 0, 0, 1],
			[1, 1, 0, 1, 1],
			[1, 1, 1, 0, 1],
			[1, 1, 1, 1, 0] ];
			
			var header = ["A1","A0","B1","B0", "O"];
			truthTable.createTable(4, 1, header);

			controller.addInput(50, 150, "A1", 0);
			controller.addInput(50, 50, "A0", 0);
			controller.addInput(50, 350, "B1", 0);
			controller.addInput(50, 250, "B0", 0);
			controller.addOutput(1300, 200, "0");
		}
		else if(exerciseNum == 14) { //one-bit full adder
			expectedTruthTable = [
			[0, 0, 0, 0, 0],
			[0, 0, 1, 0, 1],
			[0, 1, 0, 0, 1],
			[0, 1, 1, 1, 0],
			[1, 0, 0, 0, 1],
			[1, 0, 1, 1, 0],
			[1, 1, 0, 1, 0],
			[1, 1, 1, 1, 1] ];
			
			var header = ["Cin","A","B","Cout", "S"];
			truthTable.createTable(3, 2, header);

			controller.addInput(50, 50, "Cin", 0);
			controller.addInput(50, 150, "A", 0);
			controller.addInput(50, 250, "B", 0);
			controller.addOutput(1300, 50, "Cout", 0);
			controller.addOutput(1300, 150, "S", 0);
		}
		else if(exerciseNum == 15) { //four-bit adder
			expectedTruthTable = [
			[0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 1, 0, 0, 1],
			[0, 0, 1, 0, 0, 1, 0],
			[0, 0, 1, 1, 0, 1, 1],
			[0, 1, 0, 0, 0, 0, 1],
			[0, 1, 0, 1, 0, 1, 0],
			[0, 1, 1, 0, 0, 1, 1],
			[0, 1, 1, 1, 1, 1, 1],
			[1, 0, 0, 0, 0, 0, 1],
			[1, 0, 0, 1, 0, 1, 1],
			[1, 0, 1, 0, 1, 1, 1],
			[1, 0, 1, 1, 1, 1, 1],
			[1, 1, 0, 0, 0, 1, 1],
			[1, 1, 0, 1, 1, 1, 1],
			[1, 1, 1, 0, 1, 1, 1],
			[1, 1, 1, 1, 1, 1, 1] ];
			
			var header = ["A1","A0","B1","B0","Ov","S1","S0"];
			truthTable.createTable(4, 3, header);
			
			controller.addInput(50, 50, "A1", 0);
			controller.addInput(50, 150, "A0", 0);
			controller.addInput(50, 300, "B1", 0);
			controller.addInput(50, 400, "B0", 0);
			controller.addOutput(1250, 150, "Ov", 0);
			controller.addOutput(1250, 250, "S1", 0);
			controller.addOutput(1250, 350, "S2", 0);
		}
		else if(exerciseNum == 16) { //2-to-4 decoder
			expectedTruthTable = [
			[0, 0, 1, 0, 0, 0],
			[0, 1, 0, 1, 0, 0],
			[1, 0, 0, 0, 1, 0],
			[1, 1, 0, 0, 0, 1] ];
		
			var header = ["A1","A0","D3","D2","D1","D0"];
			truthTable.createTable(2, 4, header);
			
			controller.addInput(50, 50, "A1", 0);
			controller.addInput(50, 150, "A0", 0);
			controller.addOutput(1300, 150, "D3", 0);
			controller.addOutput(1300, 250, "D2", 0);
			controller.addOutput(1300, 350, "D1", 0);
			controller.addOutput(1300, 450, "D0", 0);
		}
		else if(exerciseNum == 17) { //4-to-2 encoder
			expectedTruthTable = [
			[1, 0, 0, 0, 0, 0],
			[0, 1, 0, 0, 0, 1],
			[0, 0, 1, 0, 1, 0],
			[0, 0, 0, 1, 1, 1] ];

			var header = ["D0","D1","D2","D3","A1","A0"];
			truthTable.createTable(4, 2, header);
			
			controller.addInput(50, 50, "D0", 0);
			controller.addInput(50, 150, "D1", 0);
			controller.addInput(50, 250, "D2", 0);
			controller.addInput(50, 350, "D3", 0);
			controller.addOutput(1300, 150, "A1", 0);
			controller.addOutput(1300, 250, "A0", 0);
		}
		else if(exerciseNum == 18) { //8-output demultiplexor
			expectedTruthTable = [
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
			[0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
			[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
			[0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0],
			[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
			[1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0],
			[1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
			[1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0] ];
			
			var header = ["A2","A1","A0","D7","D6","D5","D4","D3","D2","D1","D0"];
			truthTable.createTable(3, 8, header);
			
			truthTable.setExpectedTruthTable(expectedTruthTable);

			controller.addInput(50, 105, "A2", 0);
			controller.addInput(50, 55, "A1", 0);
			controller.addInput(50, 5, "A0", 0);
			controller.addOutput(1125, 450, "D7");
			controller.addOutput(1125, 400, "D6");
			controller.addOutput(1125, 350, "D5");
			controller.addOutput(1125, 300, "D4");
			controller.addOutput(1125, 250, "D3");
			controller.addOutput(1125, 200, "D2");
			controller.addOutput(1125, 150, "D1");
			controller.addOutput(1125, 100, "D0");
		}
		
		truthTable.setExpectedTruthTable(expectedTruthTable);
	}
}
