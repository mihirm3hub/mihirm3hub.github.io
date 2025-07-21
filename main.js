const video = document.getElementById('video');
video.width = 640;
video.height = 480;

const startCam = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await video.play();
};
startCam();

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 640 / 480, 0.01, 10);
camera.position.z = 1;
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(640, 480);
document.body.appendChild(renderer.domElement);

// Placeholder geometry for mask & shield
const maskMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.15, 32, 32),
  new THREE.MeshNormalMaterial({ wireframe: true })
);
scene.add(maskMesh);

const shieldMesh = new THREE.Mesh(
  new THREE.CircleGeometry(0.1, 32),
  new THREE.MeshNormalMaterial({ wireframe: true })
);
scene.add(shieldMesh);

// MediaPipe setup
let lastFace = null, lastHand = null;

// Updated constructors!
const faceMesh = new FaceMesh({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
});
faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true });
faceMesh.onResults(res => lastFace = res.multiFaceLandmarks?.[0] || null);

const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
});
hands.setOptions({ maxNumHands: 1 });
hands.onResults(res => lastHand = res.multiHandLandmarks?.[0] || null);

// Frame processing
async function process() {
  await faceMesh.send({ image: video });
  await hands.send({ image: video });
  requestAnimationFrame(process);
}
video.onloadeddata = process;

// Render loop
function animate() {
  if (lastFace) {
    const pt = lastFace[1];
    maskMesh.position.set(pt.x - 0.5, -(pt.y - 0.5), -pt.z);
    maskMesh.visible = true;
  } else {
    maskMesh.visible = false;
  }

  if (lastHand) {
    const pt = lastHand[0];
    shieldMesh.position.set(pt.x - 0.5, -(pt.y - 0.5), -pt.z);
    shieldMesh.visible = true;
  } else {
    shieldMesh.visible = false;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
