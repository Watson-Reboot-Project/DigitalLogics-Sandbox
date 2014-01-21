function DigitalLogicsLab(container, width, height) {
	var setup = new Setup(container, width, height);
	
	this.resize = resize;
	function resize(width) {
		setup.setStageDimensions(width);
	}
}