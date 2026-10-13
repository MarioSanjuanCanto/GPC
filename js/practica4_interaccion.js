import GUI from "../lib/lil-gui.module.min.js";
import { TWEEN } from "../lib/tween.module.min.js";

// Busco cada parte siguiendo el grafo del robot que monté en la práctica anterior.
const robot = scene.children.find((objeto) => objeto.isGroup);
const base = robot.children.find((objeto) => objeto.isMesh);
const brazoGrupo = base.children.find((objeto) => objeto.isGroup);
const antebrazoGrupo = brazoGrupo.children.find((objeto) => objeto.isGroup);
const manoGrupo = antebrazoGrupo.children.find((objeto) => objeto.isGroup);
const dedos = manoGrupo.children.filter((objeto) => objeto.isGroup);
const dedoIzq = dedos[0];
const dedoDer = dedos[1];

const posicionInicialDedoIzq = dedoIzq.position.x;
const posicionInicialDedoDer = dedoDer.position.x;

// Constantes para que sea fácil cambiar la velocidad y evitar que el robot se salga del suelo.
const VELOCIDAD_ROBOT = 90;
const LIMITE_SUELO = 420;


const teclasPulsadas = new Set();
const relojInteraccion = new THREE.Clock();
const positionLabel = document.getElementById("position");

// Este objeto guarda el estado del robot. Tanto la GUI como los tweens cambian estos mismos valores, por eso los sliders también se actualizan al animar.
const controles = {
  giroBase: 0,
  giroBrazo: 0,
  giroAntebrazoY: 0,
  giroAntebrazoZ: 0,
  giroPinza: 0,
  aperturaPinza: 0,
  alambrico: false,
  animar: iniciarAnimacion,
  reiniciar: reiniciarRobot
};

setupGUI();
setupKeyboard();
updateInteraction();

function setupGUI() {
  // Creo el panel y separo los controles en carpetas para que quede más claro.
  const gui = new GUI({ title: "Control del robot", width: 330 });

  const articulaciones = gui.addFolder("Articulaciones");
  // Cada slider tiene el rango pedido en el enunciado. Cuando cambia un valor, applyPose actualiza inmediatamente la articulación correspondiente.
  articulaciones.add(controles, "giroBase", -180, 180, 1).name("Base · eje Y (°)").listen().onChange(applyPose);
  articulaciones.add(controles, "giroBrazo", -45, 45, 1).name("Brazo · eje Z (°)").listen().onChange(applyPose);
  articulaciones.add(controles, "giroAntebrazoY", -180, 180, 1).name("Antebrazo · eje Y (°)").listen().onChange(applyPose);
  articulaciones.add(controles, "giroAntebrazoZ", -90, 90, 1).name("Antebrazo · eje Z (°)").listen().onChange(applyPose);
  articulaciones.add(controles, "giroPinza", -40, 220, 1).name("Pinza · eje Z (°)").listen().onChange(applyPose);
  articulaciones.add(controles, "aperturaPinza", 0, 15, 0.1).name("Apertura pinza").listen().onChange(applyPose);

  const visualizacion = gui.addFolder("Visualización");
  visualizacion.add(controles, "alambrico").name("Modo alámbrico").onChange(setWireframe);

  const acciones = gui.addFolder("Acciones");
  acciones.add(controles, "animar").name("▶ Iniciar animación");
  acciones.add(controles, "reiniciar").name("↺ Reiniciar robot");

  articulaciones.open();
  visualizacion.open();
  acciones.open();

  controles.gui = gui;
}

function setupKeyboard() {
  // Añadir los diferentes event litseners
  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp, { passive: false });
  window.addEventListener("blur", () => teclasPulsadas.clear());
}

function applyPose() {
  // Cosa rara: la GUI trabaja en grados, pero Three.js necesita las rotaciones en radianes.
  base.rotation.y = THREE.MathUtils.degToRad(controles.giroBase);
  brazoGrupo.rotation.z = THREE.MathUtils.degToRad(controles.giroBrazo);
  antebrazoGrupo.rotation.y = THREE.MathUtils.degToRad(controles.giroAntebrazoY);
  antebrazoGrupo.rotation.z = THREE.MathUtils.degToRad(controles.giroAntebrazoZ);
  manoGrupo.rotation.z = THREE.MathUtils.degToRad(controles.giroPinza);

  // Para abrir la pinza desplazo los dos dedos la misma cantidad, pero en direcciones contrarias.
  dedoIzq.position.x = posicionInicialDedoIzq - controles.aperturaPinza;
  dedoDer.position.x = posicionInicialDedoDer + controles.aperturaPinza;
}

function setWireframe(activado) {
  // Recorre todas las piezas del modelo y ve si tiene que ponerlas en modo wireframe o no
  robot.traverse((objeto) => {
    if (!objeto.isMesh) return;

    const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
    for (const material of materiales) {
      material.wireframe = activado;
      material.needsUpdate = true;
    }
  });
}

//Animacion del robot
function iniciarAnimacion() {
  TWEEN.removeAll();

  const poseUno = new TWEEN.Tween(controles)
    .to({
      giroBase: 95,
      giroBrazo: 32,
      giroAntebrazoY: -80,
      giroAntebrazoZ: 48,
      giroPinza: 190,
      aperturaPinza: 15
    }, 1500)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(applyPose);

  const poseDos = new TWEEN.Tween(controles)
    .to({
      giroBase: -115,
      giroBrazo: -35,
      giroAntebrazoY: 125,
      giroAntebrazoZ: -62,
      giroPinza: -25,
      aperturaPinza: 3
    }, 1800)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onUpdate(applyPose);

  const poseFinal = new TWEEN.Tween(controles)
    .to({
      giroBase: 0,
      giroBrazo: 0,
      giroAntebrazoY: 0,
      giroAntebrazoZ: 0,
      giroPinza: 0,
      aperturaPinza: 0
    }, 1400)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(applyPose);

  // aqui se encadenan las poses
  poseUno.chain(poseDos);
  poseDos.chain(poseFinal);
  poseUno.start();
}

function reiniciarRobot() {
  // Devuelvo tanto las articulaciones como la posición y la visualización al inicio.
  TWEEN.removeAll();
  controles.giroBase = 0;
  controles.giroBrazo = 0;
  controles.giroAntebrazoY = 0;
  controles.giroAntebrazoZ = 0;
  controles.giroPinza = 0;
  controles.aperturaPinza = 0;
  controles.alambrico = false;
  robot.position.set(0, 0, 0);
  setWireframe(false);
  applyPose();

  //Actualizar los sliders también
  controles.gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
}


//Detectar cuando el usuario pulsa una tecla
function onKeyDown(event) {
  if (!event.key.startsWith("Arrow")) return;
  event.preventDefault();

  // Este pequeño desplazamiento hace que un toque rápido también se note.
  if (!teclasPulsadas.has(event.key)) {
    moveRobotByKey(event.key, 5);
  }

  teclasPulsadas.add(event.key);
}

//Cuando el usuario suelta la tecla
function onKeyUp(event) {
  if (!event.key.startsWith("Arrow")) return;
  event.preventDefault();
  teclasPulsadas.delete(event.key);
}

function updateRobotMovement(delta) {
  // Construyo el vector de movimiento según las flechas que estén pulsadas.
  const direccion = new THREE.Vector3();

  if (teclasPulsadas.has("ArrowLeft")) direccion.x -= 1;
  if (teclasPulsadas.has("ArrowRight")) direccion.x += 1;
  if (teclasPulsadas.has("ArrowUp")) direccion.z -= 1;
  if (teclasPulsadas.has("ArrowDown")) direccion.z += 1;

  if (direccion.lengthSq() > 0) {
    // Multiplico por delta para que la velocidad no dependa de los FPS.
    direccion.normalize();
    robot.position.addScaledVector(direccion, VELOCIDAD_ROBOT * delta);
    limitRobotPosition();
  }

  positionLabel.textContent = `Posición X: ${robot.position.x.toFixed(0)} · Z: ${robot.position.z.toFixed(0)}`;
}

function moveRobotByKey(key, distance) {
  if (key === "ArrowLeft") robot.position.x -= distance;
  if (key === "ArrowRight") robot.position.x += distance;
  if (key === "ArrowUp") robot.position.z -= distance;
  if (key === "ArrowDown") robot.position.z += distance;
  limitRobotPosition();
}

function limitRobotPosition() {
  // clamp (como en unity) obliga a que X y Z se mantengan dentro de los límites del suelo.
  robot.position.x = THREE.MathUtils.clamp(robot.position.x, -LIMITE_SUELO, LIMITE_SUELO);
  robot.position.z = THREE.MathUtils.clamp(robot.position.z, -LIMITE_SUELO, LIMITE_SUELO);
}

function updateInteraction(time) {
  // Este es el bucle de interacción. Se ejecuta una vez por fotograma y actualiza tanto el movimiento del teclado como las animaciones de Tween.
  requestAnimationFrame(updateInteraction);
  const delta = Math.min(relojInteraccion.getDelta(), 0.05);
  updateRobotMovement(delta);
  TWEEN.update(time);
}
