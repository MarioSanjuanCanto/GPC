// En este fichero he puesto toda la parte visual nueva de la practica 5.
// La geometria y las animaciones siguen estando en los ficheros de la practica 4.

configurarPractica5();

function configurarPractica5() {
  configurarRenderer();

  const mapaEntorno = cargarMapaEntorno();
  const texturas = cargarTexturas();

  crearLuces();
  aplicarMateriales(texturas, mapaEntorno);
  configurarSombras();
  crearHabitacion();
}

function configurarRenderer() {
  // Activo las sombras y uso el filtro suave para que no se vean tan pixeladas.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Las texturas estan guardadas en sRGB, por eso tambien configuro asi la salida.
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
}

function cargarMapaEntorno() {
  // El orden que necesita CubeTextureLoader es: +X, -X, +Y, -Y, +Z y -Z.
  const mapaEntorno = new THREE.CubeTextureLoader()
    .setPath("images/")
    .load([
      "posx.jpg",
      "negx.jpg",
      "posy.jpg",
      "negy.jpg",
      "posz.jpg",
      "negz.jpg"
    ]);

  mapaEntorno.encoding = THREE.sRGBEncoding;
  return mapaEntorno;
}

function cargarTexturas() {
  const cargador = new THREE.TextureLoader();

  // Repito la textura del suelo para que no quede una sola imagen estirada.
  const suelo = cargador.load("images/pisometalico_1024.jpg");
  suelo.wrapS = THREE.RepeatWrapping;
  suelo.wrapT = THREE.RepeatWrapping;
  suelo.repeat.set(10, 10);
  suelo.anisotropy = renderer.capabilities.getMaxAnisotropy();
  suelo.encoding = THREE.sRGBEncoding;

  // Esta textura la reutilizo en varias piezas, cambiando el material de cada una.
  const metal = cargador.load("images/metal_128.jpg");
  metal.wrapS = THREE.RepeatWrapping;
  metal.wrapT = THREE.RepeatWrapping;
  metal.repeat.set(2, 2);
  metal.encoding = THREE.sRGBEncoding;

  // La madera ayuda a que se note mejor la diferencia entre Lambert y Phong.
  const madera = cargador.load("images/wood512.jpg");
  madera.wrapS = THREE.RepeatWrapping;
  madera.wrapT = THREE.RepeatWrapping;
  madera.repeat.set(2, 2);
  madera.encoding = THREE.sRGBEncoding;

  return { suelo, metal, madera };
}

function crearLuces() {
  // La ambiental evita que las zonas que no reciben luz directa queden negras.
  const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.2);
  luzAmbiente.name = "luzAmbiente";
  scene.add(luzAmbiente);

  // Esta es la luz principal y cubre casi todo el espacio por el que se mueve el robot.
  const luzDireccional = new THREE.DirectionalLight(0xfff1d6, 0.9);
  luzDireccional.name = "luzDireccional";
  luzDireccional.position.set(300, 450, 250);
  luzDireccional.castShadow = true;

  //renderizado de sombras
  luzDireccional.shadow.mapSize.set(2048, 2048);
  luzDireccional.shadow.camera.left = -600;
  luzDireccional.shadow.camera.right = 600;
  luzDireccional.shadow.camera.top = 600;
  luzDireccional.shadow.camera.bottom = -600;
  luzDireccional.shadow.camera.near = 10;
  luzDireccional.shadow.camera.far = 1400;
  luzDireccional.shadow.bias = -0.0004;
  luzDireccional.shadow.normalBias = 0.02;
  scene.add(luzDireccional);

  // La luz focal viene del lado contrario y da un brillo mas marcado al metal.
  const luzFocal = new THREE.SpotLight(0xbfdcff, 1.2);
  luzFocal.name = "luzFocal";
  luzFocal.position.set(-300, 380, 260);
  luzFocal.angle = THREE.MathUtils.degToRad(38);
  luzFocal.penumbra = 0.35;
  luzFocal.decay = 1;
  luzFocal.distance = 1200;
  luzFocal.castShadow = true;
  luzFocal.shadow.mapSize.set(1024, 1024);
  luzFocal.shadow.camera.near = 10;
  luzFocal.shadow.camera.far = 1200;
  luzFocal.shadow.bias = -0.0003;
  luzFocal.shadow.normalBias = 0.02;

  // El target indica el punto hacia el que esta mirando el foco.
  const objetivoFoco = new THREE.Object3D();
  objetivoFoco.position.set(0, 90, 0);
  scene.add(objetivoFoco);
  luzFocal.target = objetivoFoco;
  scene.add(luzFocal);

  // Añado otro foco desde la parte de atras para conseguir una tercera sombra.
  // Le doy un color un poco mas calido para diferenciarlo del primer foco.
  const luzFocalDos = new THREE.SpotLight(0xffd29d, 1.1);
  luzFocalDos.name = "luzFocalDos";
  luzFocalDos.position.set(0, 350, -350);
  luzFocalDos.angle = THREE.MathUtils.degToRad(40);
  luzFocalDos.penumbra = 0.4;
  luzFocalDos.decay = 1;
  luzFocalDos.distance = 1200;
  luzFocalDos.castShadow = true;
  luzFocalDos.shadow.mapSize.set(1024, 1024);
  luzFocalDos.shadow.camera.near = 10;
  luzFocalDos.shadow.camera.far = 1200;
  luzFocalDos.shadow.bias = -0.0003;
  luzFocalDos.shadow.normalBias = 0.02;

  const objetivoFocoDos = new THREE.Object3D();
  objetivoFocoDos.position.set(0, 90, 0);
  scene.add(objetivoFocoDos);
  luzFocalDos.target = objetivoFocoDos;
  scene.add(luzFocalDos);
}

function aplicarMateriales(texturas, mapaEntorno) {
  const suelo = scene.getObjectByName("suelo");
  const robot = scene.getObjectByName("robot");

  // El suelo es mate para que las sombras se distingan claramente encima de el.
  suelo.material = new THREE.MeshLambertMaterial({
    map: texturas.suelo,
    color: 0xffffff,
    side: THREE.DoubleSide
  });

  // Creo materiales Lambert y Phong para cumplir la diferencia mate/brillante.
  const materialMateMetal = new THREE.MeshLambertMaterial({
    map: texturas.metal,
    color: 0x9eb4c2
  });

  const materialMateMadera = new THREE.MeshLambertMaterial({
    map: texturas.madera,
    color: 0xd9c29c
  });

  const materialBrillante = new THREE.MeshPhongMaterial({
    map: texturas.metal,
    color: 0xc8d8e2,
    specular: 0xffffff,
    shininess: 90
  });

  const materialPinza = new THREE.MeshPhongMaterial({
    map: texturas.metal,
    color: 0xb8c6cc,
    envMap: mapaEntorno,
    reflectivity: 0.25,
    specular: 0xe8f7ff,
    shininess: 120
  });

  // La rotula refleja exactamente las mismas seis imagenes que forman la habitacion.
  const materialRotula = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    envMap: mapaEntorno,
    reflectivity: 1,
    specular: 0xffffff,
    shininess: 140
  });

  //Poner a cada objeto su material
  robot.traverse((objeto) => {
    if (!objeto.isMesh) return;

    if (objeto.name === "rotula") {
      objeto.material = materialRotula;
    } else if (objeto.parent.name === "dedoIzq" || objeto.parent.name === "dedoDer") {
      // Las dos partes de cada dedo reciben tambien una textura, como pide el enunciado.
      objeto.material = materialPinza;
    } else if (objeto.name === "esparrago" || objeto.name === "nervio") {
      objeto.material = materialMateMadera;
    } else if (objeto.name === "base" || objeto.name === "disco" || objeto.name === "mano") {
      objeto.material = materialBrillante;
    } else {
      objeto.material = materialMateMetal;
    }
  });
}

function configurarSombras() {
  const suelo = scene.getObjectByName("suelo");
  const robot = scene.getObjectByName("robot");

  suelo.receiveShadow = true;

  // NOTA: esto es para qeu todas las piezas del robot proyecten y reciban sombras.
  robot.traverse((objeto) => {
    if (!objeto.isMesh) return;
    objeto.castShadow = true;
    objeto.receiveShadow = true;
  });
}

function crearHabitacion() {
  const cargador = new THREE.TextureLoader();
  const nombresCaras = [
    "posx.jpg",
    "negx.jpg",
    "posy.jpg",
    "negy.jpg",
    "posz.jpg",
    "negz.jpg"
  ];

  // BoxGeometry usa el mismo orden de caras que el mapa cubico.
  const materialesParedes = nombresCaras.map((nombre) => {
    const textura = cargador.load(`images/${nombre}`);
    textura.encoding = THREE.sRGBEncoding;

    return new THREE.MeshBasicMaterial({
      map: textura,
      side: THREE.BackSide
    });
  });

  // La cara de abajo casi coincidia con el suelo y producia el efecto de parpadeo.
  // Como ya tengo un suelo separado, oculto esta cara del cubo.
  materialesParedes[3].visible = false;

  // El cubo tiene las caras hacia dentro porque la camara esta dentro de la habitacion.
  const geometriaHabitacion = new THREE.BoxGeometry(1000, 600, 1000);
  const habitacion = new THREE.Mesh(geometriaHabitacion, materialesParedes);
  habitacion.name = "habitacion";
  habitacion.position.y = 299;
  scene.add(habitacion);
}



/**  NOTA 
 * Sombra grande: luzFocalDos.
 * Sombra mediana: luzFocal.
 * Sombra pequeña: luzDireccional. --> por eso no cambia mucho al mover la figura
*/
