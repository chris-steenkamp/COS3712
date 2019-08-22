let container;
let controls;
let scene;
let camera;
let renderer;

//array to keep track of all created geometries
let geometries = [];
//array to keep track of all created materials
let materials = [];
//array to keep track of all created meshes
let meshes = [];

function createPlane(width, height, colour = 'green') {
    const geometry = new THREE.PlaneBufferGeometry(width, height, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    //Move the plane down slightly so the bottom of other objects aren't visible
    //from underneath the plane.
    plane.position.y -= 0.02;

    //Rotate the plane so it is parallel to the x-axis.
    plane.rotation.x = -Math.PI / 2;

    geometries.push(geometry);
    materials.push(material);
    meshes.push(plane);

    return plane;
}

//cleanup all the created geometries, materials, meshes and other objects.
function dispose() {
    container.removeChild(renderer.domElement);

    for (let i = 0; i < geometries.length; ++i) {
        geometries[i].dispose;
    }

    for (let i = 0; i < materials.length; ++i) {
        materials[i].dispose;
    }

    for (let i = 0; i < meshes.length; ++i) {
        meshes[i].dispose;
    }

    scene.dispose();

    renderer.dispose();
}


//create a water tower with the specified attributes.
function createWaterTower(width, height, colour, x, y, z) {
    const geometry = new THREE.CylinderBufferGeometry(width, width, height, 32);
    const material = new THREE.MeshBasicMaterial({ color: colour });
    const tower = new THREE.Mesh(geometry, material);

    //offset the bottom of the water tower by half it's height so it starts at y=0
    tower.position.set(x, y + (height / 2), z);

    geometries.push(geometry);
    materials.push(material);
    meshes.push(tower);

    return tower;
}


//create a tree with the specified attributes.
//trunk ratio specifies ratio of trunk to the top part of the tree.
function createTree(width, height, trunkRatio, x, y, z) {
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

    geometries.push(trunkGeometry);
    materials.push(trunkMaterial);
    meshes.push(trunk);

    geometries.push(topGeometry);
    materials.push(topMaterial);
    meshes.push(top);

    return tree;
}

//create a barn with the specified attributes.
function createBarn(width, height, depth, roofOverhang, wallColour, roofColour, x, y, z) {
    const wallHeight = height * 0.5;
    const roofHeight = height - wallHeight;

    //the roof should have an overhang on each side of the barn so we * 2
    const widthPlusOverhang = width + (roofOverhang * 2);
    const depthPlusOverhang = depth + (roofOverhang * 2);

    const barn = new THREE.Group();

    const buildingGeometry = new THREE.BoxBufferGeometry(width, wallHeight, depth);
    const buildingMaterial = new THREE.MeshBasicMaterial({ color: wallColour });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    //offset the y position of the building by half the height so it starts at y=0
    building.position.set(x, y + (wallHeight / 2), z);

    //For the roof, we define a simple triangle which we then extrude to create a prism
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(widthPlusOverhang / 2, roofHeight);
    shape.lineTo(widthPlusOverhang, 0);
    shape.lineTo(0, 0);

    const roofGeometry = new THREE.ExtrudeBufferGeometry(shape, { steps: 1, depth: depthPlusOverhang, bevelEnabled: false });
    const roofMaterial = new THREE.MeshBasicMaterial({ color: roofColour });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);

    //To center the roof over the building, we move the x-axis back by half the
    //width and the z-axis back by half the depth. We also move the prism up
    //by the height of the wall so the roof starts on top of the building.
    roof.position.set(x - (widthPlusOverhang / 2), y + (wallHeight), z - (depthPlusOverhang / 2));

    barn.add(building);
    barn.add(roof);

    //Move the entire barn structure to the coordinates specified.
    barn.position.set(x, y, z);

    geometries.push(buildingGeometry);
    materials.push(buildingMaterial);
    meshes.push(building);

    geometries.push(roofGeometry);
    materials.push(roofMaterial);
    meshes.push(roof);

    return barn;
}

function createLighting() {
}

//Code to handle escape key.
//The other movements such as zoom, rotate, etc. are done in OrbitControls.js
//see createControls()
function handleKeyDown(event) {
    switch (event.keyCode) {
        case 27:
            window.alert("We should close the window but javascript doesn't allow closing a window not created by the script.\nThis will clear the scene and remove the renderer from the container.");
            //remove the listener so we don't try dispose objects twice
            window.removeEventListener('keydown', handleKeyDown);
            dispose();
            break;
    }
}

function setupListeners() {
    window.addEventListener('resize', () => {
        aspect = container.clientWidth / container.clientHeight;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    //Handle when the user presses a key
    window.addEventListener('keydown', handleKeyDown);
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
    far = 10000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.set(0, 0, 100);
}

function setupScene() {
    scene.add(createPlane(100, 100));

    scene.add(createWaterTower(3, 1, 'blue', -4, 0, -10));

    scene.add(createBarn(10, 3, 5, 0.3, 'red', 'gray', 0, 0, 0));

    //Add some different trees 
    scene.add(createTree(2, 12, 0.2, -4, 0, -20));
    scene.add(createTree(1, 4, 0.3, 7, 0, 5));
    scene.add(createTree(1.5, 5, 0.14, 14, 0, 12));
    scene.add(createTree(1, 3, 0.5, 21, 0, -9));
}

function init() {
    container = document.querySelector("#scene-container");
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color('skyblue');
    
    setupListeners();
    
    setupCamera();

    setupRenderer();

    createControls();

    setupScene();
}

/* I have modified and reduced the original OrbitControls.js code to meet the
 * requirements of the first assignment. 
 * The changes made include:
 *  - Handling keydown event for up/down keys to zoom in/out 
 *  - Handling keydown event for left/right keys to orbit left/right
 *  - Handling left mouse button to adjust viewing angle up/down from 0 to 90
 */
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
}

function render() {
    renderer.render(scene, camera);
}

init();

animate();