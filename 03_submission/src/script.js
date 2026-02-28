import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Texture load
const textureLoader = new THREE.TextureLoader()
const matCapTexture = textureLoader.load('./textures/matcaps/2.png')
const matCapTorusTexture = textureLoader.load('./textures/matcaps/3.png')
const gradientTexture = textureLoader.load('./textures/gradients/5.jpg')

// Setting the right Color Space
matCapTexture.colorSpace = THREE.SRGBColorSpace
matCapTorusTexture.colorSpace = THREE.SRGBColorSpace

// Create GUI
const gui = new GUI({
width: 500,
title: 'Debugger',
closeFolders: true
})
gui.close()

// GUI Folders
const movementFolder = gui.addFolder('Movement')
const cubeFolder = gui.addFolder('Cube')
movementFolder.close()

// GUI debugObject
const debugObject = {
    amplitude: 0.25,
    frequency: 3,
    speed: 0.5
}

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

// GUI
gui
.add(pointLight.position, 'y')
.min(-2)
.max(4)
.step(0.01)
.name('Light Height')

// ==========================================
// EnvironmentMap
// ==========================================

const rgbeLoader = new RGBELoader()
rgbeLoader.load('./textures/environmentMap/2k.hdr', (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping

    scene.background = environmentMap
    scene.environment = environmentMap
})

// ==========================================
// Materials
// ==========================================

// WallMaterial
const wallMaterial = new THREE.MeshToonMaterial()
gradientTexture.minFilter = THREE.NearestFilter
gradientTexture.magFilter = THREE.NearestFilter
gradientTexture.generateMipmaps = false
wallMaterial.color = new THREE.Color('#29253a')
wallMaterial.gradientMap = gradientTexture

// GlassMaterial
const glassMaterial = new THREE.MeshPhysicalMaterial()
glassMaterial.metalness = 0
glassMaterial.roughness = 0.7
glassMaterial.color = new THREE.Color('#c507ff')
glassMaterial.iridescence = 1
glassMaterial.iridescenceThicknessRange = [ 100, 800 ]
glassMaterial.ior = 1
glassMaterial.thickness = 0.5
glassMaterial.transmission = 1

//NormalWireFrameMaterial
const normalMaterial = new THREE.MeshNormalMaterial()
normalMaterial.wireframe = true

//MatCapMaterial
const matCapMaterial = new THREE.MeshMatcapMaterial()
matCapMaterial.matcap = matCapTexture

//MatCapTorusMaterial
const matCapTorusMaterial = new THREE.MeshMatcapMaterial()
matCapTorusMaterial.matcap = matCapTorusTexture

// --- GUI ---------------------------
cubeFolder.add(glassMaterial, 'metalness').min(0).max(1).step(0.0001)
cubeFolder.add(glassMaterial, 'roughness').min(0).max(1).step(0.0001)
cubeFolder.addColor(glassMaterial, 'color')
cubeFolder.add(glassMaterial, 'iridescence').min(0).max(1).step(0.0001)
cubeFolder.add(glassMaterial, 'ior').min(1).max(2.333).step(0.0001)
cubeFolder.add(glassMaterial, 'transmission').min(0).max(1).step(0.0001)
cubeFolder.add(glassMaterial, 'thickness').min(0).max(1).step(0.0001)


// ==========================================
// Objects
// ==========================================

// Torus
const torusMesh = new THREE.Mesh(
    new THREE.TorusGeometry( 2, 0.4, 12, 100 ),
    matCapTorusMaterial
)
torusMesh.rotation.x = Math.PI * 0.5;

// Cube 1
const cube1 = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 4, 1.5), 
    glassMaterial
)

// Cube 2
const cube2 = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 4, 1.5), 
    normalMaterial
)

// Make a Group
const cubeMesh = new THREE.Group()
cubeMesh.add(cube1)
cubeMesh.add(cube2)


scene.add(torusMesh, cubeMesh)

const FloorSize = 10;
const WallHeight = 12;

// Floor and Ceiling
const FloorCeiling = new THREE.BoxGeometry(FloorSize, 1, FloorSize);

const floor = new THREE.Mesh(FloorCeiling, wallMaterial);
floor.position.set(0, -3, 0); 

const ceiling = new THREE.Mesh(FloorCeiling, wallMaterial);
ceiling.position.set(0, 8, 0);

// Walls
const Walls_01 = new THREE.BoxGeometry(FloorSize, WallHeight, 0.5);
const Walls_02 = new THREE.BoxGeometry(0.5, WallHeight, FloorSize);

// Back Wall
const wallBack = new THREE.Mesh(Walls_01, wallMaterial);
wallBack.position.set(0, 2.5, -5); 

// Front Wall
const wallFront = new THREE.Mesh(Walls_01, wallMaterial);
wallFront.position.set(0, 2.5, 5); 

// Left Wall
const wallLeft = new THREE.Mesh(Walls_02, wallMaterial);
wallLeft.position.set(-5, 2.5, 0); 

// RightWall
const wallRight = new THREE.Mesh(Walls_02, wallMaterial);
wallRight.position.set(5, 2.5, 0); 

// Add Objects to the Scene
scene.add(floor, ceiling, wallBack, wallFront, wallLeft, wallRight);


// Flying Cubes
const CubesCount = 100
for(let i = 0; i < CubesCount; i++) {
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.15, 0.15),
        matCapMaterial.clone() 
    )

    // Set random Wireframe color
    const randomColor = i % 2 === 0 ? 'white' : 'grey'
    cube.material.color.set(randomColor)
    
    const spread = 6
    // Set the Position and Rotate
    cube.position.x = (Math.random() - 0.5) * spread
    cube.position.y = (Math.random() - 0.5) * spread
    cube.position.z = (Math.random() - 0.5) * spread
    cube.rotation.z = Math.random() * Math.PI 
    
    scene.add(cube)
}


// ==========================================
// Camera
// ==========================================

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 5) 
scene.add(camera)


// ==========================================
// Controls
// ==========================================

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.zoomSpeed = 1.2
controls.enablePan = false

//Max Zoom Out
controls.maxDistance = 5.3
controls.minDistance = 1.5
controls.zoomSpeed = 2

// Max vertical Angle
controls.maxPolarAngle = Math.PI / 1.6;

// --- GUI ---------------------------
movementFolder.add(debugObject, 'amplitude').min(0).max(0.5).step(0.01).name('Float Amplitude')
movementFolder.add(debugObject, 'frequency').min(0).step(0.01).name('Float Frequency')
movementFolder.add(debugObject, 'speed').min(0).max(6).step(0.01).name('Rotation Speed')


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

    cubeMesh.rotation.y = debugObject.speed * elapsedTime
    cubeMesh.rotation.x = debugObject.speed * elapsedTime
    torusMesh.rotation.x = debugObject.speed * elapsedTime + Math.PI / 2

    const movement = Math.sin(elapsedTime * debugObject.frequency) * debugObject.amplitude

    torusMesh.position.y = movement
    cubeMesh.position.y = movement


    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()