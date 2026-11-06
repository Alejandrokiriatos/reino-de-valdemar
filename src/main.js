import * as THREE from 'three';
import { createWorld, terrainHeight } from './world.js';
import {
  BUILDINGS, SEASONS, newGame, housingCapacity, assignedWorkers, freeWorkers,
  seasonForDay, canAfford, canPlace, placeBuilding, changeWorkers, demolishBuilding,
  advanceDay, saveGame, loadGame, saveKeyExists
} from './simulation.js';
import './world.css';

const $ = (selector) => document.querySelector(selector);
const root = $('#game');
const world = createWorld(root);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const target = new THREE.Vector3(0, 0, 0);
let state = newGame();
let selectedId = null;
let buildMode = null;
let gameActive = false;
let paused = false;
let menuOpen = true;
let gameSpeed = 1;
let dayClock = 0;
let lastFrame = 0;
let toastTimer = 0;
let dragging = false;
let dragX = 0;
let dragY = 0;
let lastStatus = '';

const BUILD_LABELS = {
  house: 'Casa campesina',
  farm: 'Granja',
  sawmill: 'Aserradero',
  quarry: 'Cantera',
  tower: 'Torre de guardia',
  market: 'Mercado',
  well: 'Pozo',
  storehouse: 'Almacén',
  hunter: 'Cabaña de cazadores',
  fishery: 'Puesto de pesca'
};

const BUILD_DESC = {
  house: 'Aumenta la capacidad de alojamiento en seis habitantes.',
  farm: 'Cultiva alimentos. Su rendimiento cambia con las estaciones.',
  sawmill: 'Produce madera para ampliar la aldea.',
  quarry: 'Extrae piedra para edificios defensivos y servicios.',
  tower: 'Vigila los caminos y refuerza la defensa del asentamiento.',
  market: 'Genera oro y mejora el ánimo de los habitantes.',
  well: 'Asegura un punto de agua y mejora la vida de la aldea.',
  storehouse: 'Centro de acopio. Los trabajadores llevan hasta aquí los productos de sus talleres.',
  hunter: 'Los cazadores recorren los bosques, obtienen carne y dependen de que la fauna pueda recuperarse.',
  fishery: 'Pesca en el río. Si se captura demasiado, las poblaciones de peces necesitan tiempo para recuperarse.'
};

function notify(message, important = false) {
  $('#status').textContent = message;
  if (important) {
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => $('#toast').classList.remove('visible'), 3400);
  }
}

function updateHud() {
  const season = seasonForDay(state.day);
  $('#food').textContent = Math.floor(state.food);
  $('#wood').textContent = Math.floor(state.wood);
  $('#stone').textContent = Math.floor(state.stone);
  $('#gold').textContent = Math.floor(state.gold);
  $('#people').textContent = state.population;
  $('#housing').textContent = housingCapacity(state);
  $('#season').textContent = season;
  $('#day').textContent = 'Día ' + state.day;
  $('#freeWorkers').textContent = freeWorkers(state);
  $('#wildlife').textContent = Math.round(state.wildlife) + '%';
  $('#wildlifeBar').style.width = state.wildlife + '%';
  $('#fishStock').textContent = Math.round(state.fishStock) + '%';
  $('#fishBar').style.width = state.fishStock + '%';
  const deliveries = world.getDeliveryCounts();
  $('#logistics').textContent = '🌾 ' + deliveries.food + '  ·  🪵 ' + deliveries.wood + '  ·  🪨 ' + deliveries.stone + '  ·  🪙 ' + deliveries.gold;
  $('#morale').style.width = state.morale + '%';
  $('#moraleValue').textContent = Math.round(state.morale) + '%';
  $('#continue').disabled = !saveKeyExists();
  $('#continue').classList.toggle('disabled', !saveKeyExists());
  document.querySelectorAll('[data-build]').forEach((button) => {
    const type = button.dataset.build;
    const cost = BUILDINGS[type].cost;
    const enough = canAfford(state, type);
    button.classList.toggle('unaffordable', !enough);
    const costEl = button.querySelector('.cost');
    if (costEl) costEl.textContent = cost.wood + '🪵  ' + cost.stone + '🪨';
  });
}

function addWorldBuildings() {
  world.clearBuildings();
  state.buildings.forEach((building) => world.addBuilding(building));
  world.setPopulation(state.population, true);
  world.setJobs(state.buildings);
}

function setPaused(value) {
  paused = value;
  $('#pause').textContent = paused ? '▶ Reanudar' : 'Ⅱ Pausar';
  $('#pause').classList.toggle('active', paused);
}

function startSession(nextState, message) {
  state = nextState;
  selectedId = null;
  buildMode = null;
  dayClock = 0;
  gameActive = true;
  menuOpen = false;
  $('#mainmenu').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  $('#inspector').classList.add('hidden');
  world.hideGhost();
  setPaused(false);
  world.camera.position.set(31, 32, 39);
  target.set(0, 0, 0);
  if (state.camera?.position && [state.camera.position.x, state.camera.position.y, state.camera.position.z].every(Number.isFinite)) {
    world.camera.position.set(state.camera.position.x, state.camera.position.y, state.camera.position.z);
    if (state.camera.target) target.set(state.camera.target.x || 0, state.camera.target.y || 0, state.camera.target.z || 0);
  }
  addWorldBuildings();
  updateHud();
  notify(message, true);
}

function startNewGame() {
  startSession(newGame(), 'Un nuevo capítulo comienza en el valle de Valdemar.');
}

function continueGame() {
  const saved = loadGame();
  if (!saved) {
    notify('No se encontró una partida válida. Comienza una nueva.', true);
    startNewGame();
    return;
  }
  startSession(saved, 'Partida recuperada. El reino continúa donde lo dejaste.');
}

function openMenu() {
  if (gameActive) setPaused(true);
  menuOpen = true;
  $('#mainmenu').classList.remove('hidden');
  $('#hud').classList.add('hidden');
  $('#resume').classList.toggle('hidden', !gameActive);
  $('#continue').disabled = !saveKeyExists();
}

function closeMenu() {
  menuOpen = false;
  $('#mainmenu').classList.add('hidden');
  if (gameActive) {
    $('#hud').classList.remove('hidden');
    setPaused(false);
  }
}

function saveCurrentGame() {
  state.camera = {
    position: { x: world.camera.position.x, y: world.camera.position.y, z: world.camera.position.z },
    target: { x: target.x, y: target.y, z: target.z }
  };
  const ok = saveGame(state);
  notify(ok ? 'Partida guardada correctamente en este equipo.' : 'No se pudo guardar. Comprueba el almacenamiento del navegador.', true);
  updateHud();
}

function findBuilding(id) {
  return state.buildings.find((building) => building.id === id) || null;
}

function inspectBuilding(id) {
  const building = findBuilding(id);
  if (!building) {
    selectedId = null;
    $('#inspector').classList.add('hidden');
    return;
  }
  selectedId = id;
  const spec = BUILDINGS[building.kind];
  const panel = $('#inspector');
  panel.classList.remove('hidden');
  $('#inspectTitle').textContent = BUILD_LABELS[building.kind];
  $('#inspectDescription').textContent = BUILD_DESC[building.kind];
  $('#inspectLevel').textContent = building.permanent ? 'Edificio fundador' : 'Construcción de la aldea';
  $('#inspectWorkers').textContent = building.workers + ' / ' + spec.slots;
  $('#inspectCapacity').textContent = spec.housing ? '+' + spec.housing + ' plazas' : (spec.slots ? spec.slots + ' puestos' : 'Servicio comunitario');
  $('#workerPlus').disabled = building.workers >= spec.slots || freeWorkers(state) <= 0;
  $('#workerMinus').disabled = building.workers <= 0;
  $('#demolish').disabled = building.permanent;
  $('#demolish').textContent = building.permanent ? 'Edificio fundador' : 'Demoler edificio';
}

function refreshJobs() {
  world.setJobs(state.buildings);
  updateHud();
  if (selectedId !== null) inspectBuilding(selectedId);
}

function onWorkerChange(change) {
  if (selectedId === null) return;
  const result = changeWorkers(state, selectedId, change);
  notify(result.message, !result.ok);
  if (result.ok) refreshJobs();
  else inspectBuilding(selectedId);
}

function onDemolish() {
  if (selectedId === null) return;
  const id = selectedId;
  const result = demolishBuilding(state, id);
  if (!result.ok) {
    notify(result.message, true);
    return;
  }
  const mesh = world.buildings.find((item) => item.userData.buildingData.id === id);
  if (mesh) world.removeBuilding(mesh);
  selectedId = null;
  $('#inspector').classList.add('hidden');
  refreshJobs();
  notify(result.message, true);
}

function pointerRay(event) {
  const rect = world.renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, world.camera);
}

function getTerrainPoint(event) {
  pointerRay(event);
  const hits = raycaster.intersectObject(world.ground, false);
  return hits.length ? hits[0].point : null;
}

function snappedPosition(point) {
  return {
    x: Math.round(point.x * 2) / 2,
    z: Math.round(point.z * 2) / 2
  };
}

function updateBuildPreview(event) {
  if (!buildMode || menuOpen || !gameActive) return;
  const point = getTerrainPoint(event);
  if (!point) {
    world.hideGhost();
    return;
  }
  const place = snappedPosition(point);
  const result = canPlace(state, buildMode, place.x, place.z);
  const affordable = canAfford(state, buildMode);
  world.showGhost(place.x, place.z, result.valid && affordable, buildMode);
}

function placeSelectedBuilding(event) {
  const point = getTerrainPoint(event);
  if (!point || !buildMode) return;
  const place = snappedPosition(point);
  const result = placeBuilding(state, buildMode, place.x, place.z);
  if (!result.ok) {
    notify(result.message, true);
    updateBuildPreview(event);
    return;
  }
  world.addBuilding(result.building);
  world.hideGhost();
  buildMode = null;
  refreshJobs();
  notify(result.message, true);
}

function selectWorldBuilding(event) {
  pointerRay(event);
  const meshes = raycaster.intersectObjects(world.buildings, true);
  for (const hit of meshes) {
    let current = hit.object;
    while (current && !current.userData.isBuilding) current = current.parent;
    if (current?.userData.isBuilding) {
      inspectBuilding(current.userData.buildingData.id);
      return true;
    }
  }
  inspectBuilding(null);
  return false;
}

function activateBuild(type) {
  if (!gameActive) return;
  buildMode = type;
  inspectBuilding(null);
  const cost = BUILDINGS[type].cost;
  notify('Modo de construcción: ' + BUILD_LABELS[type] + '. Coste: ' + cost.wood + ' madera y ' + cost.stone + ' piedra.');
  world.showGhost(0, 0, canAfford(state, type), type);
}

function advanceSimulationDay() {
  const result = advanceDay(state);
  if (state.day % 3 === 0) {
    state.camera = {
      position: { x: world.camera.position.x, y: world.camera.position.y, z: world.camera.position.z },
      target: { x: target.x, y: target.y, z: target.z }
    };
    saveGame(state);
  }
  world.setPopulation(state.population);
  world.setJobs(state.buildings);
  updateHud();
  const report = 'Día ' + state.day + ': +' + result.foodProduced.toFixed(0) + ' comida, -' + result.foodConsumed.toFixed(0) +
    ' comida, +' + result.woodProduced.toFixed(0) + ' madera, -' + result.woodConsumed.toFixed(0) +
    ' leña, +' + result.stoneProduced.toFixed(0) + ' piedra.';
  notify(report);
  if (state.notices[0] && state.notices[0] !== lastStatus) {
    lastStatus = state.notices[0];
    notify(state.notices[0], true);
  }
  if (state.morale <= 0 || state.population <= 1) {
    setPaused(true);
    notify('La aldea está al borde del colapso. Reorganiza la producción y las reservas.', true);
  }
}

$('#newGame').addEventListener('click', startNewGame);
$('#continue').addEventListener('click', continueGame);
$('#resume').addEventListener('click', closeMenu);
$('#menuBtn').addEventListener('click', openMenu);
$('#options').addEventListener('click', () => $('#optionsBox').classList.toggle('hidden'));
$('#pause').addEventListener('click', () => setPaused(!paused));
$('#save').addEventListener('click', saveCurrentGame);
$('#collapseBuild').addEventListener('click', () => $('#buildPanel').classList.toggle('collapsed'));
$('#closeInspector').addEventListener('click', () => inspectBuilding(null));
$('#workerPlus').addEventListener('click', () => onWorkerChange(1));
$('#workerMinus').addEventListener('click', () => onWorkerChange(-1));
$('#demolish').addEventListener('click', onDemolish);
$('#quality').addEventListener('change', (event) => world.setQuality(event.target.value));
$('#shadows').addEventListener('change', (event) => {
  world.renderer.shadowMap.enabled = event.target.checked;
  world.renderer.shadowMap.needsUpdate = true;
});
$('#fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});
$('#centerCamera').addEventListener('click', () => {
  target.set(0, 0, 0);
  world.camera.position.set(31, 32, 39);
});
document.querySelectorAll('[data-build]').forEach((button) => {
  button.addEventListener('click', () => activateBuild(button.dataset.build));
});
$('#mainmenu').addEventListener('click', (event) => {
  if (event.target === $('#mainmenu') && gameActive) closeMenu();
});

world.renderer.domElement.addEventListener('pointermove', (event) => {
  updateBuildPreview(event);
  if (!dragging) return;
  const dx = event.clientX - dragX;
  const dy = event.clientY - dragY;
  world.camera.position.x -= dx * 0.055;
  world.camera.position.z += dy * 0.055;
  target.x -= dx * 0.055;
  target.z += dy * 0.055;
  dragX = event.clientX;
  dragY = event.clientY;
});
world.renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button === 2) {
    dragging = true;
    dragX = event.clientX;
    dragY = event.clientY;
    world.renderer.domElement.setPointerCapture?.(event.pointerId);
    return;
  }
  if (event.button !== 0 || !gameActive || menuOpen) return;
  if (buildMode) placeSelectedBuilding(event);
  else selectWorldBuilding(event);
});
world.renderer.domElement.addEventListener('pointerup', () => { dragging = false; });
world.renderer.domElement.addEventListener('pointercancel', () => { dragging = false; });
world.renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
world.renderer.domElement.addEventListener('wheel', (event) => {
  const offset = world.camera.position.clone().sub(target);
  const factor = event.deltaY > 0 ? 1.09 : 0.92;
  offset.multiplyScalar(factor);
  const distance = THREE.MathUtils.clamp(offset.length(), 13, 88);
  offset.setLength(distance);
  world.camera.position.copy(target).add(offset);
}, { passive: true });

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') {
    if (buildMode) {
      buildMode = null;
      world.hideGhost();
      notify('Construcción cancelada.');
    } else if (menuOpen && gameActive) closeMenu();
    else if (!menuOpen) openMenu();
  }
  if (event.code === 'Space' && gameActive && !menuOpen) {
    event.preventDefault();
    setPaused(!paused);
  }
  if (event.key.toLowerCase() === 'b' && gameActive && !menuOpen) {
    $('#buildPanel').classList.toggle('collapsed');
  }
  if (event.key.toLowerCase() === 's' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    saveCurrentGame();
  }
});

function frame(time) {
  requestAnimationFrame(frame);
  const dt = Math.min((time - lastFrame) / 1000 || 0, 0.05);
  lastFrame = time;
  if (gameActive && !paused && !menuOpen) {
    dayClock += dt * gameSpeed;
    if (dayClock >= 42) {
      dayClock -= 42;
      advanceSimulationDay();
    }
  }
  world.update(dt, time / 1000, dayClock / 42, seasonForDay(state.day));
  world.camera.lookAt(target);
  world.render();
}
requestAnimationFrame(frame);

$('#speed').addEventListener('click', (event) => {
  const button = event.target.closest('[data-speed]');
  if (!button) return;
  gameSpeed = Number(button.dataset.speed);
  document.querySelectorAll('[data-speed]').forEach((item) => item.classList.toggle('selected', item === button));
});
window.addEventListener('beforeunload', () => {
  if (gameActive) {
    state.camera = {
      position: { x: world.camera.position.x, y: world.camera.position.y, z: world.camera.position.z },
      target: { x: target.x, y: target.y, z: target.z }
    };
    saveGame(state);
  }
});
window.addEventListener('resize', () => {
  world.camera.aspect = window.innerWidth / window.innerHeight;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(window.innerWidth, window.innerHeight);
});

updateHud();
setPaused(false);
if (saveKeyExists()) $('#continue').disabled = false;
