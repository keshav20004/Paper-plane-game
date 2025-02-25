const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(800, 600);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('plane-canvas').appendChild(renderer.domElement);

// Paper Plane
const planeGeometry = new THREE.BufferGeometry();
const planeVertices = new Float32Array([
    0, 0, 0.6,    // Nose
    -1.2, 0, -0.4, // Left wing tip
    1.2, 0, -0.4,  // Right wing tip
    -0.5, 0, -0.6, // Left tail
    0.5, 0, -0.6,  // Right tail
    0, 0.3, -0.6,  // Tail top
    -0.8, 0.1, -0.5, // Left fold
    0.8, 0.1, -0.5  // Right fold
]);
const planeIndices = [
    0, 1, 2,
    1, 6, 7,
    2, 7, 6,
    1, 3, 4,
    2, 4, 3,
    3, 4, 5
];
planeGeometry.setAttribute('position', new THREE.BufferAttribute(planeVertices, 3));
planeGeometry.setIndex(planeIndices);
planeGeometry.computeVertexNormals();
const planeTexture = new THREE.TextureLoader().load('https://i.imgur.com/8Q8zX8r.png'); // Replace with your paper texture URL
const planeMaterial = new THREE.MeshLambertMaterial({ map: planeTexture, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 10, 0);
plane.castShadow = true;
scene.add(plane);

// Physics
let velocity = new THREE.Vector3(0, 0, -0.15);
const gravity = 0.008;
const lift = 0.015;
const drag = 0.98;
let pitch = 0;
let roll = 0;

// Unique Buildings
const buildings = [];
const buildingTypes = [
    () => new THREE.BoxGeometry(Math.random() * 3 + 2, Math.random() * 15 + 5, Math.random() * 3 + 2),
    () => new THREE.CylinderGeometry(1 + Math.random() * 2, 1 + Math.random() * 2, Math.random() * 20 + 5, 32),
    () => new THREE.BoxGeometry(Math.random() * 5 + 3, Math.random() * 12 + 5, Math.random() * 5 + 3)
];
for (let i = 0; i < 15; i++) {
    const typeIndex = Math.floor(Math.random() * buildingTypes.length);
    const buildingGeometry = buildingTypes[typeIndex]();
    const isGlass = Math.random() > 0.7;
    const buildingMaterial = isGlass ?
        new THREE.MeshLambertMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.6 }) :
        new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(
        Math.random() * 40 - 20,
        buildingGeometry.parameters.height / 2 || buildingGeometry.parameters.radiusTop * 2,
        Math.random() * -50 - 10
    );
    building.castShadow = true;
    building.receiveShadow = true;
    if (Math.random() > 0.5) {
        const roofDetail = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const detail = new THREE.Mesh(roofDetail, roofMaterial);
        detail.position.set(0, buildingGeometry.parameters.height / 2 + 0.25, 0);
        building.add(detail);
    }
    const windowGeometry = new THREE.PlaneGeometry(Math.random() * 0.5 + 0.3, Math.random() * 0.5 + 0.3);
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const windowCount = Math.floor((buildingGeometry.parameters.height || buildingGeometry.parameters.radiusTop * 2) / 2);
    for (let j = 0; j < windowCount; j++) {
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        const side = Math.floor(Math.random() * 4);
        const width = buildingGeometry.parameters.width || buildingGeometry.parameters.radiusTop * 2;
        const depth = buildingGeometry.parameters.depth || buildingGeometry.parameters.radiusBottom * 2;
        switch (side) {
            case 0: window.position.set((Math.random() - 0.5) * (width - 0.6), j * 2 + 1, depth / 2 + 0.01); break;
            case 1: window.position.set((Math.random() - 0.5) * (width - 0.6), j * 2 + 1, -depth / 2 - 0.01); window.rotation.y = Math.PI; break;
            case 2: window.position.set(-width / 2 - 0.01, j * 2 + 1, (Math.random() - 0.5) * (depth - 0.6)); window.rotation.y = Math.PI / 2; break;
            case 3: window.position.set(width / 2 + 0.01, j * 2 + 1, (Math.random() - 0.5) * (depth - 0.6)); window.rotation.y = -Math.PI / 2; break;
        }
        building.add(window);
    }
    buildings.push(building);
    scene.add(building);
}

// Ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Parallax Background (Clouds)
const cloudGeometry = new THREE.PlaneGeometry(50, 10);
const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
const clouds = [];
for (let i = 0; i < 5; i++) {
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(Math.random() * 100 - 50, Math.random() * 20 + 20, -100);
    clouds.push(cloud);
    scene.add(cloud);
}

// Boost Rings
const rings = [];
function spawnRing() {
    const ringGeometry = new THREE.TorusGeometry(1, 0.1, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(Math.random() * 40 - 20, Math.random() * 15 + 2, -50);
    rings.push(ring);
    scene.add(ring);
}
setInterval(spawnRing, 5000);

// Obstacles (Birds)
const birds = [];
function spawnBird() {
    const birdGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const birdMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const bird = new THREE.Mesh(birdGeometry, birdMaterial);
    bird.position.set(Math.random() * 40 - 20, Math.random() * 15 + 2, -50);
    birds.push(bird);
    scene.add(bird);
}
setInterval(spawnBird, 7000);

// Lighting
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(5, 10, 5);
sun.castShadow = true;
sun.shadow.mapSize.width = 1024;
sun.shadow.mapSize.height = 1024;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 50;
scene.add(sun);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Rain
const rain = [];
for (let i = 0; i < 100; i++) {
    const rainDrop = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.5, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x87ceeb })
    );
    rainDrop.position.set(Math.random() * 40 - 20, Math.random() * 20 + 10, Math.random() * 20 - 10);
    rain.push(rainDrop);
    scene.add(rainDrop);
}

scene.background = new THREE.Color(0x87ceeb);

// Game Logic
let score = 0;
let gameOver = false;
let challengeMode = false;
let challengeGoal = 0;
const scoreDisplay = document.getElementById('score-display');
const statsDisplay = document.getElementById('stats-display');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
document.getElementById('mode-toggle').addEventListener('click', () => {
    challengeMode = !challengeMode;
    challengeGoal = 10;
    document.getElementById('mode-toggle').textContent = challengeMode ? "Switch to Endless Mode" : "Switch to Challenge Mode";
});

const keys = {};
document.addEventListener('keydown', (e) => (keys[e.code] = true));
document.addEventListener('keyup', (e) => (keys[e.code] = false));

let wind = new THREE.Vector3(0, 0, 0);
let boostTimer = 0;

function updateScene() {
    if (gameOver) return;

    requestAnimationFrame(updateScene);

    // Physics
    velocity.y -= gravity;
    if (keys['ArrowUp']) {
        velocity.y += lift;
        pitch = Math.max(pitch - 0.05, -0.5);
    } else {
        pitch = Math.min(pitch + 0.02, 0.5);
    }
    if (keys['ArrowLeft']) {
        velocity.x -= 0.02;
        roll = Math.min(roll + 0.05, 0.5);
    } else if (keys['ArrowRight']) {
        velocity.x += 0.02;
        roll = Math.max(roll - 0.05, -0.5);
    } else {
        roll *= 0.9;
        velocity.x *= 0.95;
    }
    velocity.multiplyScalar(drag);
    if (boostTimer > 0) {
        velocity.z = -0.3;
        boostTimer--;
    }
    if (Math.random() < 0.01) wind.set((Math.random() - 0.5) * 0.02, 0, 0);
    velocity.add(wind);

    plane.position.add(velocity);
    plane.rotation.x = pitch;
    plane.rotation.z = roll;

    // Boundaries
    if (plane.position.x < -20) plane.position.x = -20;
    if (plane.position.x > 20) plane.position.x = 20;
    if (plane.position.y > 20) plane.position.y = 20;
    if (plane.position.y < 1) {
        plane.position.y = 1;
        velocity.y = 0;
    }

    // Move Elements
    buildings.forEach(building => {
        building.position.z += 0.05;
        if (building.position.z > 10) {
            building.position.z = -60;
            building.position.x = Math.random() * 40 - 20;
            score += 10;
        }
    });
    rings.forEach((ring, i) => {
        ring.position.z += 0.05;
        if (ring.position.z > 10) {
            scene.remove(ring);
            rings.splice(i, 1);
        } else if (plane.position.distanceTo(ring.position) < 1.5) {
            scene.remove(ring);
            rings.splice(i, 1);
            boostTimer = 60;
            score += 50;
            if (challengeMode) challengeGoal--;
        }
    });
    birds.forEach((bird, i) => {
        bird.position.z += 0.07;
        bird.position.y += Math.sin(Date.now() * 0.005) * 0.02;
        if (bird.position.z > 10) {
            scene.remove(bird);
            birds.splice(i, 1);
        }
    });
    clouds.forEach(cloud => {
        cloud.position.z += 0.01;
        if (cloud.position.z > 10) cloud.position.z = -100;
    });
    rain.forEach(drop => {
        drop.position.y -= 0.1;
        if (drop.position.y < 0) drop.position.set(Math.random() * 40 - 20, Math.random() * 20 + 10, Math.random() * 20 - 10);
    });

    // Sun Movement
    const time = Date.now() * 0.0005;
    sun.position.set(10 * Math.cos(time), 10 * Math.sin(time), 5);

    // Score and Stats
    score += 0.1;
    const speed = Math.abs(velocity.z * 100).toFixed(1);
    const altitude = plane.position.y.toFixed(1);
    scoreDisplay.textContent = `Score: ${Math.floor(score)}`;
    statsDisplay.textContent = `Speed: ${speed} | Altitude: ${altitude}`;
    if (challengeMode && challengeGoal <= 0) {
        gameOver = true;
        gameOverScreen.classList.remove('hidden');
        finalScoreDisplay.textContent = Math.floor(score) + " (Challenge Complete!)";
    }

    // Collision Detection
    const planeBox = new THREE.Box3().setFromObject(plane);
    buildings.concat(birds).forEach(obj => {
        const objBox = new THREE.Box3().setFromObject(obj);
        if (planeBox.intersectsBox(objBox)) {
            gameOver = true;
            gameOverScreen.classList.remove('hidden');
            finalScoreDisplay.textContent = Math.floor(score);
        }
    });

    camera.position.set(plane.position.x, plane.position.y + 3, plane.position.z + 5);
    camera.lookAt(plane.position);
    renderer.render(scene, camera);
}
updateScene();