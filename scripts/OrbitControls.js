/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author ScieCode / http://github.com/sciecode
 */

/* I have modified and reduced the original code to meet the requirements of
 * the first assignment. The changes include:
 *  - Handling keydown event for up/down keys to zoom in/out 
 *  - Handling keydown event for left/right keys to orbit left/right
 *  - Handling left mouse button to adjust viewing angle up/down from 0 to 90
 */
THREE.OrbitControls = function (object, domElement) {
	this.object = object;

	this.domElement = (domElement !== undefined) ? domElement : document;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI / 2; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = -Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	this.enableZoom = false;
	this.zoomSpeed = 1.0;

	// Set to false to disable rotating
	this.enableRotate = true;
	this.rotateSpeed = 0.1;

	// Set to false to disable use of the keys
	this.enableKeys = true;

	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	this.mouseButtons = { LEFT: THREE.MOUSE.ROTATE };

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	//
	// public methods
	//

	this.getPolarAngle = function () {
		return spherical.phi;
	};

	this.getAzimuthalAngle = function () {
		return spherical.theta;
	};

	this.saveState = function () {
		scope.target0.copy(scope.target);
		scope.position0.copy(scope.object.position);
		scope.zoom0 = scope.object.zoom;
	};

	this.reset = function () {
		scope.target.copy(scope.target0);
		scope.object.position.copy(scope.position0);
		scope.object.zoom = scope.zoom0;

		scope.object.updateProjectionMatrix();
		scope.dispatchEvent(changeEvent);

		scope.update();

		state = STATE.NONE;
	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function () {
		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
		var quatInverse = quat.clone().inverse();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function update() {
			var position = scope.object.position;

			offset.copy(position).sub(scope.target);

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion(quat);

			// angle from z-axis around y-axis
			spherical.setFromVector3(offset);

			spherical.theta += sphericalDelta.theta;
			spherical.phi += sphericalDelta.phi;

			// restrict theta to be between desired limits
			spherical.theta = Math.max(scope.minAzimuthAngle, Math.min(scope.maxAzimuthAngle, spherical.theta));

			// restrict phi to be between desired limits
			spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));

			spherical.makeSafe();

			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

			// move target to panned location

			scope.target.add(panOffset);

			offset.setFromSpherical(spherical);

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion(quatInverse);

			position.copy(scope.target).add(offset);

			scope.object.lookAt(scope.target);

			sphericalDelta.set(0, 0, 0);

			panOffset.set(0, 0, 0);

			scale = 1;

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if (zoomChanged ||
				lastPosition.distanceToSquared(scope.object.position) > EPS ||
				8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {

				scope.dispatchEvent(changeEvent);

				lastPosition.copy(scope.object.position);
				lastQuaternion.copy(scope.object.quaternion);
				zoomChanged = false;

				return true;
			}

			return false;
		};
	}();

	this.dispose = function () {
		scope.domElement.removeEventListener('mousedown', onMouseDown, false);

		document.removeEventListener('mousemove', onMouseMove, false);
		document.removeEventListener('mouseup', onMouseUp, false);

		window.removeEventListener('keydown', onKeyDown, false);
	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = {
		NONE: - 1,
		ROTATE: 0,
		DOLLY: 1
	};

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	var scale = 1;
	var panOffset = new THREE.Vector3();
	var zoomChanged = false;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var dollyStart = new THREE.Vector2();

	function getZoomScale() {
		return Math.pow(0.95, scope.zoomSpeed);
	}

	this.rotateLeft = function(angle) {
		sphericalDelta.theta -= angle;
	}

	this.rotateUp = function(angle) {
		sphericalDelta.phi -= angle;
	}

	function dollyIn(dollyScale) {
		scale /= dollyScale;
	}

	function dollyOut(dollyScale) {
		scale *= dollyScale;
	}

	//
	// event callbacks - update the object state
	//

	function handleMouseDownRotate(event) {
		rotateStart.set(event.clientX, event.clientY);
	}

	function handleMouseDownDolly(event) {
		dollyStart.set(event.clientX, event.clientY);
	}

	function handleMouseMoveRotate(event) {
		rotateEnd.set(event.clientX, event.clientY);

		rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);

		rotateStart.copy(rotateEnd);

		scope.update();
	}

	function handleMouseUp( /*event*/) {
		// no-op
	}

	function handleKeyDown(event) {
		var needsUpdate = false;

		switch (event.keyCode) {
			case scope.keys.UP:
				dollyOut(getZoomScale());
				needsUpdate = true;
				break;
			case scope.keys.BOTTOM:
				dollyIn(getZoomScale());
				needsUpdate = true;
				break;
			case scope.keys.LEFT:
				scope.rotateLeft(scope.rotateSpeed);
				needsUpdate = true;
				break;
			case scope.keys.RIGHT:
				scope.rotateLeft(-scope.rotateSpeed);
				needsUpdate = true;
				break;
		}

		if (needsUpdate) {
			event.preventDefault();

			scope.update();
		}
	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	function onMouseDown(event) {
		if (scope.enabled === false) return;

		// Prevent the browser from scrolling.

		event.preventDefault();

		// Manually set the focus since calling preventDefault above
		// prevents the browser from setting it automatically.

		scope.domElement.focus ? scope.domElement.focus() : window.focus();

		switch (event.button) {
			case 0:
				switch (scope.mouseButtons.LEFT) {
					case THREE.MOUSE.ROTATE:
						if (scope.enableRotate === false) return;

						handleMouseDownRotate(event);

						state = STATE.ROTATE;

						break;
					default:
						state = STATE.NONE;
				}

				break;
		}

		if (state !== STATE.NONE) {
			document.addEventListener('mousemove', onMouseMove, false);
			document.addEventListener('mouseup', onMouseUp, false);

			scope.dispatchEvent(startEvent);
		}
	}

	function onMouseMove(event) {
		if (scope.enabled === false) return;

		event.preventDefault();

		switch (state) {

			case STATE.ROTATE:

				if (scope.enableRotate === false) return;

				handleMouseMoveRotate(event);

				break;
		}
	}

	function onMouseUp(event) {
		if (scope.enabled === false) return;

		handleMouseUp(event);

		document.removeEventListener('mousemove', onMouseMove, false);
		document.removeEventListener('mouseup', onMouseUp, false);

		scope.dispatchEvent(endEvent);

		state = STATE.NONE;
	}

	function onKeyDown(event) {
		if (scope.enabled === false || scope.enableKeys === false || scope.enablePan === false) return;

		handleKeyDown(event);
	}
	//

	scope.domElement.addEventListener('mousedown', onMouseDown, false);

	window.addEventListener('keydown', onKeyDown, false);

	// force an update at start

	this.update();
};

THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;