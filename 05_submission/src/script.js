import * as THREE from 'three'  
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'  
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'   
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'  
import GUI from 'lil-gui'  
import wobbleVertexShader from './shaders/wobble/vertex.glsl'  
import wobbleFragmentShader from './shaders/wobble/fragment.glsl'  
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js' 
import { tracks } from './tracks.js'
import gsap from 'gsap'

// Enjoy :) 
  
// ========================================== 
// Initialise GUI and DebugObject 
// ========================================== 

const gui = new GUI({  
    width: 325 , 
    title: 'Debugger', 
    closeFolders: true 
})  
gui.hide()

// Toggle UI with H
window.addEventListener('keydown', (event) => {
    if (event.key === 'h') {
        if (gui._hidden) {
            gui.show();
        } else {
            gui.hide();
        }
    }
});

 
// GUI debugObject 
const debugObject = {  
    colorA: '#ffffff',  
    colorB: '#ffffff',  
    audioStrengthMultiplier: 1.1, 
}  
 
const canvas = document.querySelector('canvas.webgl') 
const buttons = document.querySelectorAll('.button') 
const scene = new THREE.Scene()  


// ========================================== 
// Set Sizes
// ========================================== 
const sizes = {  
    width: window.innerWidth,  
    height: window.innerHeight,  
    pixelRatio: Math.min(window.devicePixelRatio, 2)  
}  


// ========================================== 
// Fullscreen Button
// ========================================== 

const container = document.querySelector('#container');  
const btn = document.querySelector('.fullScreenButton'); 
 
btn.addEventListener('click', () => { 
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement; 
 
    if(!fullscreenElement) { 
        if(container.requestFullscreen) { 
            container.requestFullscreen(); 
        } else if(container.webkitRequestFullscreen) { 
            container.webkitRequestFullscreen(); 
        } 
    } else { 
        if(document.exitFullscreen) { 
            document.exitFullscreen(); 
        } 
    } 
}); 
 

// ========================================== 
// Setup Materials
// ========================================== 

// Displacement Sphere Material
const uniforms = {  
    uTime: new THREE.Uniform(0),  
    uPositionFrequency: new THREE.Uniform(0.5),  
    uTimeFrequency: new THREE.Uniform(1.0), 
    uStrength: new THREE.Uniform(0.3),  
  
    uWarpTime: new THREE.Uniform(0),  
    uWarpPositionFrequency: new THREE.Uniform(0.38),  
    uWarpTimeFrequency: new THREE.Uniform(0.12),  
    uWarpStrength: new THREE.Uniform(1.7),  
  
    uColorA: new THREE.Uniform(new THREE.Color(debugObject.colorA)),  
    uColorB: new THREE.Uniform(new THREE.Color(debugObject.colorB)),  
}  

// Sphere Material
const material = new CustomShaderMaterial({  
    baseMaterial: THREE.MeshPhysicalMaterial,  
    vertexShader: wobbleVertexShader,  
    fragmentShader: wobbleFragmentShader,  
    uniforms: uniforms,  
    silent: true,  
    metalness: 0,  
    roughness: 0.5,  
    color: '#ffffff',  
    transmission: 1,  
    ior: 1.5,  
    thickness: 1.5,  
    transparent: true  
})  
  
// Depth Material for correct Shadows
const depthMaterial = new CustomShaderMaterial({  
    baseMaterial: THREE.MeshDepthMaterial,  
    vertexShader: wobbleVertexShader,  
    uniforms: uniforms,  
    silent: true,  
    depthPacking: THREE.RGBADepthPacking  
})  


// ========================================== 
// Setup Geometries
// ========================================== 

let geometry = new THREE.IcosahedronGeometry(2.5, 50)  
geometry = mergeVertices(geometry)  
geometry.computeTangents()  
  
const wobble = new THREE.Mesh(geometry, material)  
wobble.customDepthMaterial = depthMaterial  
wobble.receiveShadow = true  
wobble.castShadow = true  
scene.add(wobble)  
  
const bgSphere = new THREE.Mesh(  
    new THREE.SphereGeometry(50, 32, 16),  
    new THREE.MeshStandardMaterial({ 
        side: THREE.BackSide 
    })  
)  
bgSphere.position.y = -5  
scene.add(bgSphere)  


// ========================================== 
// Setup Lights
// ========================================== 

const directionalLight = new THREE.DirectionalLight('#ffffff', 3)  
directionalLight.position.set(0.25, 2, -2.25)  
scene.add(directionalLight)  

// HDRI
const rgbeLoader = new RGBELoader()
rgbeLoader.load('./textures/urban_alley_01_1k.hdr', (env) => {  
    env.mapping = THREE.EquirectangularReflectionMapping  
    scene.environment = env  
})  

// ========================================== 
// 3D CSS Setup 
// ========================================== 

const cssRenderer = new CSS3DRenderer() 
cssRenderer.setSize(sizes.width, sizes.height) 
cssRenderer.domElement.style.position = 'absolute' 
cssRenderer.domElement.style.top = '0px' 
cssRenderer.domElement.style.pointerEvents = 'none'  
container.appendChild(cssRenderer.domElement)
 
cssRenderer.domElement.style.pointerEvents = 'none' 
 
cssRenderer.domElement.style.zIndex = '1';  
canvas.style.zIndex = '0'; 
 
const infoElement = document.getElementById('info-card') 
const cssObject = new CSS3DObject(infoElement) 
cssObject.position.set(0, -3, 5)  
cssObject.rotation.x = - Math.PI * 0.1 
cssObject.scale.set(0.015, 0.015, 0.015) 
scene.add(cssObject) 
cssObject.visible = false  
 
// ========================================== 
// Audio Implementation 
// ========================================== 

const audioBuffers = {} 
let analyser  
const listener = new THREE.AudioListener()  
const sound = new THREE.Audio(listener)  
const audioLoader = new THREE.AudioLoader()  

// Preloading Audio Files
const preloadAudio = () => {
    Object.keys(tracks).forEach(key => {
        audioLoader.load(tracks[key].url, (buffer) => {
            audioBuffers[key] = buffer
            console.log(`Audio preloaded: ${key}`)
        }, undefined, (err) => {
            console.error(`Error loading ${tracks[key].url}:`, err)
        })
    })
}
preloadAudio()

// Siltent Tag so it woooorks even in silent phone mode
const silentTag = document.createElement('audio');
silentTag.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

const playTrack = (genreKey) => {  
    silentTag.play().then(() => {
        if (listener.context.state === 'suspended') {
            listener.context.resume();
        }
    }).catch(e => console.log("Silent Play Blocked", e));

    const track = tracks[genreKey] 
    const buffer = audioBuffers[genreKey]

    if (!track) return  
    if (!buffer) {
        console.warn('Audio still loading...')
        return
    }

    document.getElementById('card-title').innerText = track.title 
    document.getElementById('card-description').innerText = track.desc 
    document.getElementById('spotify-button').href = track.spotify 
    document.getElementById('artist-name').innerText = track.artist 
    document.getElementById('bpm-number').innerText = track.bpm 

    uniforms.uWarpPositionFrequency.value = track.WarpFreq
    uniforms.uPositionFrequency.value = track.PosFreq
    debugObject.audioStrengthMultiplier = track.AudioStrength

    gsap.to(camera.position, {
        x: 0, y: 0, z: 25,
        duration: 1,
        ease: "power2.inOut",
        onUpdate: () => { if(controls) controls.update() }
    })
 
    cssObject.visible = true 
    infoElement.style.display = 'block' 
    if(cssRenderer) cssRenderer.domElement.style.pointerEvents = 'none' 
    infoElement.style.pointerEvents = 'none' 

    const spotifyButton = document.getElementById('spotify-button')
    if (spotifyButton) spotifyButton.style.pointerEvents = 'auto'
  
    // Audio Start
    if (sound.isPlaying) sound.stop()  
    sound.setBuffer(buffer)  
    sound.setLoop(true)  
    sound.setVolume(1)  
    sound.play()  

    uniforms.uTimeFrequency.value = track.bpm / 60  
    uniforms.uColorA.value.set(track.colorA)  
    uniforms.uColorB.value.set(track.colorB)  
    
    debugObject.colorA = track.colorA  
    debugObject.colorB = track.colorB  
  
    if (!analyser) {  
        analyser = new THREE.AudioAnalyser(sound, 256)  
    }  
}  
 
buttons.forEach(button => {  
    button.addEventListener('click', () => {  
        playTrack(button.dataset.genre) 
    })  
})


// ========================================== 
// GUI ELEMENTS
// ========================================== 

const deformFolder = gui.addFolder('Deform Sphere')  
deformFolder.add(uniforms.uPositionFrequency, 'value', 0, 2, 0.001).name('Pos Frequency')  
deformFolder.add(uniforms.uWarpPositionFrequency, 'value', 0, 2, 0.001).name('Warp Frequency') 
deformFolder.add(debugObject, 'audioStrengthMultiplier', 0, 10, 0.1).name('Audio Strength')  
  
const materialFolder = gui.addFolder('Material')  
materialFolder.addColor(debugObject, 'colorA').onChange(() => uniforms.uColorA.value.set(debugObject.colorA))  
materialFolder.addColor(debugObject, 'colorB').onChange(() => uniforms.uColorB.value.set(debugObject.colorB))  
materialFolder.add(material, 'metalness', 0, 1)  
materialFolder.add(material, 'transmission', 0, 1) 

// ========================================== 
// Setup Camera and Renderer
// ========================================== 

const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)  
camera.position.set(0, 0, 25)  
camera.add(listener)  
scene.add(camera)  
  
const controls = new OrbitControls(camera, canvas)  
controls.enableDamping = true  
controls.enablePan = false 
controls.enableZoom = true 
controls.maxDistance = 40 
controls.minDistance = 8 
 
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })  
renderer.shadowMap.enabled = true  
renderer.setSize(sizes.width, sizes.height)  
renderer.setPixelRatio(sizes.pixelRatio)  
  
// ========================================== 
// Mouse Interaction
// ========================================== 

const raycaster = new THREE.Raycaster()  
const mouse = new THREE.Vector2()  
window.addEventListener('mousemove', (e) => {  
    mouse.x = (e.clientX / sizes.width) * 2 - 1  
    mouse.y = -(e.clientY / sizes.height) * 2 + 1  
})  
 
// ========================================== 
// Update Viewport on Change
// ========================================== 

window.addEventListener('resize', () => { 
    sizes.width = window.innerWidth 
    sizes.height = window.innerHeight 
 
    camera.aspect = sizes.width / sizes.height 
    camera.updateProjectionMatrix() 
    renderer.setSize(sizes.width, sizes.height) 
    cssRenderer.setSize(sizes.width, sizes.height) 
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) 
}) 
  
// ========================================== 
// Animation
// ========================================== 

const clock = new THREE.Clock()  
  
const tick = () => {  
    const deltaTime = clock.getDelta()  
  
    if (analyser && sound.isPlaying) {  
        const avgFrequency = analyser.getAverageFrequency()   
        uniforms.uStrength.value = (avgFrequency / 255) * debugObject.audioStrengthMultiplier   
    } else {  
        uniforms.uStrength.value = 0   
    }  
 
    uniforms.uTime.value += deltaTime * uniforms.uTimeFrequency.value 
  
    raycaster.setFromCamera(mouse, camera)  
    const isHovered = raycaster.intersectObject(wobble).length > 0  
    const targetScale = isHovered ? 1.15 : 1.0  
    wobble.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)  

    controls.update()  
    renderer.render(scene, camera)  
    cssRenderer.render(scene, camera)  
     
    window.requestAnimationFrame(tick) 
}  
  
tick()
