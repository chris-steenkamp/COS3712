let container;
let controls;
let scene;
let camera;
let renderer;
let tower;

function createPlane(width, height, colour = 'green') {
    const geometry = new THREE.PlaneBufferGeometry(width, height, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    //Move the plane down slightly so the bottom of other objects aren't visible
    //from underneath the plane.
    plane.position.y -= 0.02;

    //Rotate the plane so it is parallel to the x-axis.
    plane.rotation.x = -Math.PI / 2;

    return plane;
}

function createWaterTower(width, height, colour = 'blue', x = 0, y = 0, z = 0) {
    const geometry = new THREE.CylinderBufferGeometry(width, width, height, 32);
    const material = new THREE.MeshBasicMaterial({ color: colour });
    const tower = new THREE.Mesh(geometry, material);

    //offset the bottom of the water tower by half it's height so it starts at y=0
    tower.position.set(x, y + (height / 2), z);

    return tower;
}

function createTree(width, height, trunkRatio, x = 0, y = 0, z = 0) {
    const tree = new THREE.Group();

    const trunkHeight = height * trunkRatio;
    const trunkWidth = width / 4;
    const topHeight = height * (1 - trunkRatio);


    const trunkGeometry = new THREE.CylinderBufferGeometry(trunkWidth, trunkWidth, trunkHeight, 32);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 'brown' });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    //offset the y position of the trunk by half the height so it starts at y=0
    trunk.position.set(x, y + (trunkHeight / 2), z);

    const topGeometry = new THREE.ConeBufferGeometry(width, topHeight, 32);
    const topMaterial = new THREE.MeshBasicMaterial({ color: 'darkgreen' });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    //offset the top of the tree by half it's height to start at y=0 and then 
    //add the trunk height so the top starts where the trunk ends.
    top.position.set(x, y + ((topHeight) / 2) + trunkHeight, z);

    tree.add(trunk);
    tree.add(top);

    //move the entire tree to the coordinates specified
    tree.position.set(x, y, z);

    return tree;
}

function createBarn(width, height, depth, roofOverhang, wallColour, roofColour, x, y, z) {
    const wallHeight = height * 0.5;
    const roofHeight = height - wallHeight;

    const widthPlusOverhang = width + (roofOverhang * 2);
    const depthPlusOverhang = depth + (roofOverhang * 2);

    const barn = new THREE.Group();

    const buildingGeometry = new THREE.BoxBufferGeometry(width, wallHeight, depth);
    const buildingMesh = new THREE.MeshBasicMaterial({ color: wallColour });
    const building = new THREE.Mesh(buildingGeometry, buildingMesh);
    building.position.set(x, y + (wallHeight / 2), z);

    //For the roof, we define a triangle which we then extrude to create a prism
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(widthPlusOverhang / 2, roofHeight);
    shape.lineTo(widthPlusOverhang, 0);
    shape.lineTo(0, 0);

    const roofGeometry = new THREE.ExtrudeBufferGeometry(shape, { steps: 1, depth: depthPlusOverhang, bevelEnabled: false });
    const roofMesh = new THREE.MeshBasicMaterial({ color: roofColour });
    const roof = new THREE.Mesh(roofGeometry, roofMesh);

    //To center the roof over the building, we move the x-axis back by half the
    //width and the z-axis back by half the depth. We also move the prism up
    //by the height of the wall so the roof starts on top of the building.
    roof.position.set(x - (widthPlusOverhang / 2), y + (wallHeight), z - (depthPlusOverhang / 2));

    barn.add(building);
    barn.add(roof);

    //Move the entire barn structure to the coordinates specified.
    barn.position.set(x, y, z);

    return barn;
}

function createLighting() {
    const light = new THREE.DirectionalLight(0x333333, 5.0);
    light.position.set(10, 10, 10);
    scene.add(light);
}

function setupListeners() {
    window.addEventListener('resize', () => {
        aspect = container.clientWidth / container.clientHeight;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    window.addEventListener('keypress', (key) => {
        // switch(key) {
        //     case KEY
        // }
    })
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
}

function setupCamera() {
    fov = 35;
    aspect = container.clientWidth / container.clientHeight;
    near = 0.1;
    far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.set(0, 0, 150);
}

function setupScene() {
    scene.add(createPlane(140, 140));

    scene.add(createWaterTower(3, 1, 'blue', -4, 0, -10));

    scene.add(createBarn(10, 3, 5, 0.3, 'red', 'gray', 0, 0, 0));

    //Add some different trees 
    scene.add(createTree(2, 12, 0.2, -4, 0, -20));
    scene.add(createTree(1, 4, 0.3, 7, 0, 5));
    scene.add(createTree(1.5, 5, 0.14, 14, 0, 12));
    scene.add(createTree(1, 3, 0.4, 21, 0, -9));

    scene.rotation.x += 0.55;
    scene.rotation.y += -0.78;
    scene.rotation.z += 0;
}

function init() {
    setupListeners();

    container = document.querySelector("#scene-container");

    scene = new THREE.Scene();
    scene.background = new THREE.Color('skyblue');

    setupCamera();

    setupRenderer();

    createControls();
    // controls.update();

    setupScene();
}

function createControls() {
    controls = new THREE.OrbitControls(camera, container);
}

function animate() {
    renderer.setAnimationLoop(() => {
        update();

        render();
    });
}

function update() {
    // controls.update();
}

function render() {
    renderer.render(scene, camera);
}

init();

animate();