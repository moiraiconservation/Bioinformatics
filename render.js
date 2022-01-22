///////////////////////////////////////////////////////////////////////////////
// render.js

function RENDER() {

	this.network = () => {

		var mousePosition;
		var isMouseDown;

		//reference to the canvas element
		var canvas = document.createElement('canvas');
		canvas.width = document.body.clientWidth; //document.width is obsolete
		canvas.height = window_height - 200;
		var context = canvas.getContext("2d");

		//add listeners
		document.addEventListener('mousemove', move, false);
		document.addEventListener('mousedown', setDraggable, false);
		document.addEventListener('mouseup', setDraggable, false);

		//make some circles
		var c1 = new Circle(50, 50, 10, "red", "red");
		var c2 = new Circle(200, 50, 10, "green", "green");
		var c3 = new Circle(350, 50, 10, "blue", "blue");
		//make a collection of circles
		var circles = [c1, c2, c3];

		//main draw method
		function draw() {
			//clear canvas
			context.clearRect(0, 0, canvas.width, canvas.height);
			drawCircles();
		}

		//draw circles
		function drawCircles() {
			for (var i = circles.length - 1; i >= 0; i--) {
				circles[i].draw();
			}
		}

		//key track of circle focus and focused index
		var focused = { key: 0, state: false }

		//circle Object
		function Circle(x, y, r, fill, stroke) {
			this.startingAngle = 0;
			this.endAngle = 2 * Math.PI;
			this.x = x;
			this.y = y;
			this.r = r;

			this.fill = fill;
			this.stroke = stroke;

			this.draw = function () {
				context.beginPath();
				context.arc(this.x, this.y, this.r, this.startingAngle, this.endAngle);
				context.fillStyle = this.fill;
				context.lineWidth = 3;
				context.fill();
				context.strokeStyle = this.stroke;
				context.stroke();
			}
		}

		function move(e) {
			if (!isMouseDown) { return; }
			getMousePosition(e);
			//if any circle is focused
			if (focused.state) {
				circles[focused.key].x = mousePosition.x;
				circles[focused.key].y = mousePosition.y;
				draw();
				return;
			}
			//no circle currently focused check if circle is hovered
			for (var i = 0; i < circles.length; i++) {
				if (intersects(circles[i])) {
					circles.move(i, 0);
					focused.state = true;
					break;
				}
			}
			draw();
		}

		//set mousedown state
		function setDraggable(e) {
			var t = e.type;
			if (t === "mousedown") {
				isMouseDown = true;
			} else if (t === "mouseup") {
				isMouseDown = false;
				releaseFocus();
			}
		}

		function releaseFocus() {
			focused.state = false;
		}

		function getMousePosition(e) {
			var rect = canvas.getBoundingClientRect();
			mousePosition = {
				x: Math.round(e.x - rect.left),
				y: Math.round(e.y - rect.top)
			}
		}

		//detects whether the mouse cursor is between x and y relative to the radius specified
		function intersects(circle) {
			// subtract the x, y coordinates from the mouse position to get coordinates 
			// for the hotspot location and check against the area of the radius
			var areaX = mousePosition.x - circle.x;
			var areaY = mousePosition.y - circle.y;
			//return true if x^2 + y^2 <= radius squared.
			return areaX * areaX + areaY * areaY <= circle.r * circle.r;
		}

		Array.prototype.move = function (old_index, new_index) {
			if (new_index >= this.length) {
				var k = new_index - this.length;
				while ((k--) + 1) {
					this.push(undefined);
				}
			}
			this.splice(new_index, 0, this.splice(old_index, 1)[0]);
		};
		draw();
		return canvas;

	}

}
