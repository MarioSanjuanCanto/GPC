
// Variables globales que van siempre
var renderer, scene, camera;
var cameraControls;
var angulo = -0.01;

// 1-inicializa 
init();
// 2-Crea una escena
loadScene();
// 3-renderiza
render();

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(new THREE.Color(0xf4f8fb));
  document.getElementById('container').appendChild(renderer.domElement);

  scene = new THREE.Scene();

  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 5000);
  camera.position.set(130, 100, 150);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(0, 0, 0);

  window.addEventListener('resize', updateAspectRatio);
}


function loadScene() {
  //______ 0 Suelo del robot ______
  const suelo = createGround(1000, 1000)
  suelo.position.y = suelo.position.y - 0.7
  scene.add(suelo)

  //______ 1 Base del robot ______
  const base = createCylinder(50, 50, 15, 0x203d59, 32)
  base.position.y = base.geometry.parameters.height / 2 + 0.1;
  scene.add(base)

  //______ 2 Brazo del robot ______

  //___ 2.1 Eje ___
  const arm = createCylinder(20, 20, 18, 0x6087a2, 32)
  arm.rotation.x = THREE.MathUtils.degToRad(90);
  arm.position.y = base.position.y
  scene.add(arm)

  //___ 2.2 Esparrago ___
  const esparrago = createPrism(18, 120, 12, 0x2c7fa3);
  esparrago.position.y = arm.position.y + 120 / 2;
  scene.add(esparrago);

  //___ 2.3 Rotula ___
  const rotula = createSphere(20, 0x8cc4d5);
  rotula.position.y = arm.position.y + 120
  scene.add(rotula);

  //______ 3 Anterazo del robot ______

  //___ 3.1 Eje ___
  const disco = createCylinder(22, 22, 6, 0x386483, 32)
  yDisco = esparrago.position.y + esparrago.geometry.parameters.height / 2;
  disco.position.set(rotula.position.x, yDisco, rotula.position.z)
  scene.add(disco)

  //___ 3.2 Nervios ___
  const nerve_1 = createPrism(4, 80, 4, 0x50a4bf)
  const nerve_2 = createPrism(4, 80, 4, 0x50a4bf)
  const nerve_3 = createPrism(4, 80, 4, 0x50a4bf)
  const nerve_4 = createPrism(4, 80, 4, 0x50a4bf)

  const yNervios = disco.position.y + disco.geometry.parameters.height / 2 + 80 / 2;
  const d = 8
  nerve_1.position.set(-d, yNervios, -d);
  nerve_2.position.set(d, yNervios, -d);
  nerve_3.position.set(-d, yNervios, d);
  nerve_4.position.set(d, yNervios, d);

  scene.add(nerve_1, nerve_2, nerve_3, nerve_4);

  //___ 3.3 Mano ___
  const mano = createCylinder(15, 15, 40, 0x527a97, 32)
  mano.rotation.z = THREE.MathUtils.degToRad(90);
  mano.position.y = disco.position.y + 80
  scene.add(mano)


  //______ 4 Pinza del robot ______

  //___ 4.1 Pinza Izq ___
  const dedoIzq = new THREE.Group();
  dedoIzq.add(createSoportePinza(0x8bd0e2), createCunaPinza(0x3e91b5));
  dedoIzq.position.y = mano.position.y
  dedoIzq.position.x -= mano.geometry.parameters.height / 4
  dedoIzq.rotation.x = THREE.MathUtils.degToRad(90);

  scene.add(dedoIzq);

  //___ 4.2 Pinza Der ___
  const dedoDer = new THREE.Group();
  dedoDer.add(createSoportePinza(0x8bd0e2), createCunaPinza(0x3e91b5));
  dedoDer.position.y = mano.position.y
  dedoDer.position.x += mano.geometry.parameters.height / 4
  dedoDer.rotation.x = THREE.MathUtils.degToRad(90);
  dedoDer.rotation.y = THREE.MathUtils.degToRad(180);
  scene.add(dedoDer);


  // ____________ Agrupar todos elementos - lo del grafo ____________
  const yEje = arm.position.y;
  const yRotula = rotula.position.y;
  const yMano = mano.position.y;

  const robot = new THREE.Group();
  scene.add(robot);
  robot.attach(base);

  const brazoGrupo = new THREE.Group();
  base.add(brazoGrupo);
  brazoGrupo.position.y = yEje - base.position.y;
  brazoGrupo.attach(arm);
  brazoGrupo.attach(esparrago);
  brazoGrupo.attach(rotula);

  const antebrazoGrupo = new THREE.Group();
  brazoGrupo.add(antebrazoGrupo);
  antebrazoGrupo.position.y = yRotula - yEje;
  antebrazoGrupo.attach(disco);
  for (const nervio of [nerve_1, nerve_2, nerve_3, nerve_4]) {
    antebrazoGrupo.attach(nervio);
  }

  const manoGrupo = new THREE.Group();
  antebrazoGrupo.add(manoGrupo);
  manoGrupo.position.y = yMano - yRotula;
  manoGrupo.attach(mano);
  manoGrupo.attach(dedoIzq);
  manoGrupo.attach(dedoDer);



}


function createGround(h, w,) {
  const geometrySuelo = new THREE.PlaneGeometry(h, w);
  const materialSuelo = new THREE.MeshBasicMaterial({ color: 0xc7d7de, side: THREE.DoubleSide });
  const suelo = new THREE.Mesh(geometrySuelo, materialSuelo);

  suelo.rotation.x = -Math.PI / 2; // Plano XZ
  return suelo
}

function createCylinder(r_top, r_bottom, h, color, segments) {
  const geometry = new THREE.CylinderGeometry(r_top, r_bottom, h, segments);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const cylinder = new THREE.Mesh(geometry, material);
  return cylinder
}

function createPrism(width, height, depth, color) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const prism = new THREE.Mesh(geometry, material);
  return prism;
}

function createSphere(radius, color, segments = 32) {
  const geometry = new THREE.SphereGeometry(radius, segments, 16);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}


function createSoportePinza(color) {
  // Tramo recto: 4 de grosor (X), 20 de alto y 19 de largo (Z).
  const geometry = new THREE.BoxGeometry(4, 20, 19);
  const material = new THREE.MeshBasicMaterial({ color });
  const soporte = new THREE.Mesh(geometry, material);
  // El dedo completo va de y = 0 a y = -38.
  soporte.position.y = -20 / 2;
  return soporte;
}

function createCunaPinza(color) {
  // 19 de largo en Z; la punta se estrecha y se desplaza hacia +X.
  // En X pasa de [-2, 2] (ancho 4) a [1, 3] (ancho 2).
  const A = [-2, -20, 9.5], B = [2, -20, 9.5];
  const C = [3, -38, 9.5], D = [1, -38, 9.5];
  const E = [-2, -20, -9.5], F = [2, -20, -9.5];
  const G = [3, -38, -9.5], H = [1, -38, -9.5];

  const triangulos = [
    [A, D, C], [A, C, B], // delante
    [E, F, G], [E, G, H], // detrás
    [A, E, H], [A, H, D], // izquierda
    [B, C, G], [B, G, F], // derecha
    [A, B, F], [A, F, E], // arriba
    [D, H, G], [D, G, C]  // abajo
  ];

  const vertices = [];
  for (const [a, b, c] of triangulos) {
    vertices.push(...a, ...b, ...c);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geometry, material);
}



function updateAspectRatio() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function update() {
  // Cambios para actualizar la camara segun mvto del raton
  cameraControls.update();
}

function render() {
  requestAnimationFrame(render);
  update();
  renderer.render(scene, camera);
}



