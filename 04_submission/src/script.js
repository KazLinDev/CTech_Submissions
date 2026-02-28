import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Canvas
const canvas = document.querySelector('canvas.webgl')

// ==========================================
// Keyboard Controls
// ==========================================

function onKeyDown(event) {
    if (!fox.instance) return;

    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            fox.instance.position.z -= fox.moveDistance;
            fox.instance.rotation.y = 0; // Facing forward 
            break;
        case 's':
        case 'arrowdown':
            fox.instance.position.z += fox.moveDistance;
            fox.instance.rotation.y = Math.PI; // Facing backward
            break;
        case 'a':
        case 'arrowleft':
            fox.instance.position.x -= fox.moveDistance;
            fox.instance.rotation.y = Math.PI / 2; // Facing left
            break;
        case 'd':
        case 'arrowright':
            fox.instance.position.x += fox.moveDistance;
            fox.instance.rotation.y = -Math.PI / 2; // Facing right
            break;
    }
    console.log(event.key, fox.instance.position);
}


window.addEventListener('keydown', onKeyDown);

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color('#3a3a3d')

// ==========================================
// Lights
// ==========================================

// ambientLight
const ambientLight = new THREE.AmbientLight('#ffffff', 1)
scene.add(ambientLight)

const pointLight = new THREE.PointLight('#ffffff', 30)
pointLight.position.y = 4
scene.add(pointLight)

// EnvironmentMap
const rgbeLoader = new RGBELoader()
rgbeLoader.load('./textures/1k.hdr', (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
})

// ==========================================
// Materials
// ==========================================

// FloorMaterial
const floorMaterial = new THREE.MeshToonMaterial()
floorMaterial.color = new THREE.Color('#18cf00')

// ==========================================
// GLTFLoader
// ==========================================

//Fox
let fox = {
    instance: null,
    moveDistance: 1,
};

const gltfLoader = new GLTFLoader()
gltfLoader.load('./models/fox.glb', (glb) => {
    fox.instance = glb.scene 
    fox.instance.scale.set(1, 1, 1)
    fox.instance.position.set(0, 0, 0)
    scene.add(fox.instance)
    console.log('fox geladen!', fox.instance)
})

//Mushroom
let mushroom = { 
    instance: null 
}

gltfLoader.load('./models/mushroom.glb', (glb) => {
    mushroom.instance = glb.scene
    
    const mushroomCount = 100
    for(let i = 0; i < mushroomCount; i++) {
        const cube = mushroom.instance.clone()

        const spread = 45
        cube.position.x = (Math.random() - 0.5) * spread
        cube.position.z = (Math.random() - 0.5) * spread
        cube.rotation.y = Math.random() * Math.PI
        
        scene.add(cube)
    }
})

// Floor Model
const FloorSize = 45;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(FloorSize, FloorSize), floorMaterial);
floor.position.set(0, 0, 0); 
floor.rotation.x = -Math.PI / 2;
scene.add(floor);


// ==========================================
// Camera
// ==========================================

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 2, 5) 
scene.add(camera)

// ==========================================
// Controls
// ==========================================

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.zoomSpeed = 1.2
controls.enablePan = false

//Zoom Controls
controls.zoomSpeed = 2

// Max vertical Angle
controls.maxPolarAngle = Math.PI / 2.1;

// ==========================================
// Renderer
// ==========================================

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Update
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()