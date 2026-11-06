export const BUILDINGS = {
  house:   { name: 'Casa campesina', cost: { wood: 30, stone: 0 }, slots: 0, housing: 6, size: 6.2 },
  farm:    { name: 'Granja', cost: { wood: 40, stone: 10 }, slots: 4, housing: 0, size: 9.4 },
  sawmill: { name: 'Aserradero', cost: { wood: 55, stone: 10 }, slots: 3, housing: 0, size: 7.6 },
  quarry:  { name: 'Cantera', cost: { wood: 45, stone: 20 }, slots: 3, housing: 0, size: 7.4 },
  tower:   { name: 'Torre de guardia', cost: { wood: 50, stone: 35 }, slots: 2, housing: 0, size: 6.2 },
  market:  { name: 'Mercado', cost: { wood: 65, stone: 20 }, slots: 2, housing: 0, size: 7.2 },
  well:    { name: 'Pozo', cost: { wood: 25, stone: 25 }, slots: 0, housing: 0, size: 3.8 }
};

export const SEASONS = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
const SAVE_KEY = 'valdemar-save-v2';

export function newGame() {
  return {
    version: 2,
    day: 1,
    food: 180,
    wood: 130,
    stone: 100,
    gold: 35,
    population: 12,
    morale: 78,
    buildings: [
      { id: 1, kind: 'tower', x: -8, z: -9, workers: 0, permanent: true, rotation: 0 },
      { id: 2, kind: 'house', x: 0, z: -8, workers: 0, permanent: true, rotation: 0.08 },
      { id: 3, kind: 'house', x: 7, z: -4, workers: 0, permanent: true, rotation: -0.12 },
      { id: 4, kind: 'farm', x: -4, z: 7, workers: 2, permanent: true, rotation: -0.08 },
      { id: 5, kind: 'sawmill', x: -16, z: 1, workers: 1, permanent: true, rotation: 0.2 }
    ],
    nextBuildingId: 6,
    notices: ['La aldea de Valdemar despierta. Cuida sus reservas antes de que llegue el invierno.']
  };
}

export function housingCapacity(state) {
  return state.buildings.reduce((total, building) => total + (BUILDINGS[building.kind]?.housing || 0), 0);
}

export function assignedWorkers(state) {
  return state.buildings.reduce((total, building) => total + (Number(building.workers) || 0), 0);
}

export function freeWorkers(state) {
  return Math.max(0, state.population - assignedWorkers(state));
}

export function seasonForDay(day) {
  return SEASONS[Math.floor((Math.max(1, day) - 1) / 12) % 4];
}

export function canAfford(state, kind) {
  const cost = BUILDINGS[kind]?.cost;
  return Boolean(cost && state.wood >= cost.wood && state.stone >= cost.stone);
}

export function canPlace(state, kind, x, z) {
  const spec = BUILDINGS[kind];
  if (!spec || Math.abs(x) > 78 || Math.abs(z) > 78) return { valid: false, reason: 'Fuera de los límites del valle.' };
  const riverX = 18 + Math.sin(z * 0.042) * 3.8;
  if (Math.abs(x - riverX) < 7.8) return { valid: false, reason: 'El terreno está demasiado cerca del río.' };
  const radius = spec.size * 0.55;
  for (const other of state.buildings) {
    const otherRadius = (BUILDINGS[other.kind]?.size || 6) * 0.55;
    if (Math.hypot(x - other.x, z - other.z) < radius + otherRadius + 1.2) {
      return { valid: false, reason: 'No hay espacio suficiente; deja sitio entre edificios.' };
    }
  }
  return { valid: true, reason: 'Terreno adecuado.' };
}

export function placeBuilding(state, kind, x, z) {
  if (!canAfford(state, kind)) return { ok: false, message: 'No tienes materiales suficientes para construir.' };
  const placement = canPlace(state, kind, x, z);
  if (!placement.valid) return { ok: false, message: placement.reason };
  const cost = BUILDINGS[kind].cost;
  state.wood -= cost.wood;
  state.stone -= cost.stone;
  const building = {
    id: state.nextBuildingId++,
    kind, x, z, workers: 0, permanent: false, rotation: (Math.random() - 0.5) * 0.24
  };
  state.buildings.push(building);
  state.notices.unshift(BUILDINGS[kind].name + ' levantado en el valle.');
  state.notices = state.notices.slice(0, 8);
  return { ok: true, building, message: BUILDINGS[kind].name + ' construido.' };
}

export function changeWorkers(state, buildingId, change) {
  const building = state.buildings.find((item) => item.id === buildingId);
  if (!building) return { ok: false, message: 'No se encontró la construcción.' };
  const slots = BUILDINGS[building.kind]?.slots || 0;
  if (change > 0 && freeWorkers(state) < 1) return { ok: false, message: 'No quedan trabajadores libres.' };
  if (change > 0 && building.workers >= slots) return { ok: false, message: 'Este edificio ya tiene todos sus puestos ocupados.' };
  if (change < 0 && building.workers <= 0) return { ok: false, message: 'Este edificio no tiene trabajadores asignados.' };
  building.workers = Math.max(0, Math.min(slots, building.workers + change));
  return { ok: true, message: building.workers + ' trabajador(es) en ' + BUILDINGS[building.kind].name + '.' };
}

export function demolishBuilding(state, buildingId) {
  const index = state.buildings.findIndex((item) => item.id === buildingId);
  if (index < 0) return { ok: false, message: 'No se encontró el edificio.' };
  const building = state.buildings[index];
  if (building.permanent) return { ok: false, message: 'No puedes demoler los edificios fundadores de la aldea.' };
  state.buildings.splice(index, 1);
  state.wood += Math.floor((BUILDINGS[building.kind]?.cost.wood || 0) * 0.35);
  state.stone += Math.floor((BUILDINGS[building.kind]?.cost.stone || 0) * 0.35);
  state.notices.unshift(BUILDINGS[building.kind].name + ' demolido. Se recuperaron algunos materiales.');
  return { ok: true, message: 'Edificio demolido; parte de los materiales ha sido recuperada.' };
}

export function advanceDay(state) {
  state.day += 1;
  const season = seasonForDay(state.day);
  const seasonFactor = season === 'Invierno' ? 0.32 : season === 'Verano' ? 1.2 : season === 'Otoño' ? 0.92 : 1.08;

  let foodProduced = 0;
  let woodProduced = 0;
  let stoneProduced = 0;
  let goldProduced = 0;
  for (const building of state.buildings) {
    const workers = Math.max(0, Number(building.workers) || 0);
    if (building.kind === 'farm') foodProduced += workers * 2.55 * seasonFactor;
    if (building.kind === 'sawmill') woodProduced += workers * 1.65;
    if (building.kind === 'quarry') stoneProduced += workers * 1.1;
    if (building.kind === 'market') goldProduced += workers * 1.25;
  }

  const foodConsumed = state.population * 0.19;
  state.food = Math.max(0, Math.min(9999, state.food + foodProduced - foodConsumed));
  state.wood = Math.min(9999, state.wood + woodProduced);
  state.stone = Math.min(9999, state.stone + stoneProduced);
  state.gold = Math.min(9999, state.gold + goldProduced);

  if (state.food <= 0) {
    state.morale = Math.max(0, state.morale - 13);
    state.notices.unshift('Hambre en la aldea: las reservas de comida se han agotado.');
    if (state.day % 3 === 0 && state.population > 1) {
      state.population -= 1;
      state.notices.unshift('Una familia ha abandonado Valdemar por falta de alimentos.');
    }
  } else if (state.food < state.population * 2.2) {
    state.morale = Math.max(5, state.morale - 3);
  } else {
    state.morale = Math.min(100, state.morale + 1.8);
    if (state.day % 5 === 0 && state.population < housingCapacity(state) && state.food > state.population * 7) {
      state.population += 1;
      state.notices.unshift('Una nueva familia llega atraída por la prosperidad de Valdemar.');
    }
  }

  if (state.day % 12 === 0) {
    const nextSeason = seasonForDay(state.day + 1);
    state.notices.unshift('El invierno se acerca: prepara comida y leña.' && nextSeason === 'Invierno'
      ? 'Llega el invierno. Las cosechas serán mucho más escasas.'
      : 'Las estaciones cambian. Revisa las reservas del reino.');
  } else if (foodProduced + woodProduced + stoneProduced + goldProduced > 0) {
    state.notices.unshift('La producción diaria se ha completado.');
  }

  state.notices = state.notices.slice(0, 8);
  return {
    season,
    foodProduced, foodConsumed, woodProduced, stoneProduced, goldProduced
  };
}

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('No se pudo guardar la partida:', error);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem('valdemar-save');
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.buildings)) return null;
    const state = {
      ...newGame(),
      ...saved,
      day: Math.max(1, Number(saved.day) || 1),
      food: Math.max(0, Number(saved.food) || 0),
      wood: Math.max(0, Number(saved.wood) || 0),
      stone: Math.max(0, Number(saved.stone) || 0),
      gold: Math.max(0, Number(saved.gold) || 0),
      population: Math.max(1, Number(saved.population ?? saved.pop) || 1),
      morale: Math.min(100, Math.max(0, Number(saved.morale) || 70)),
      buildings: saved.buildings.filter((b) => b && BUILDINGS[b.kind]).map((b, index) => ({
        id: Number(b.id) || index + 1,
        kind: b.kind,
        x: Number(b.x) || 0,
        z: Number(b.z) || 0,
        workers: Math.max(0, Math.min(BUILDINGS[b.kind].slots, Number(b.workers) || 0)),
        permanent: Boolean(b.permanent),
        rotation: Number(b.rotation) || 0
      })),
      nextBuildingId: Math.max(Number(saved.nextBuildingId) || 1, ...saved.buildings.map((b) => (Number(b?.id) || 0) + 1))
    };
    if (!state.buildings.some((b) => b.kind === 'tower' && b.permanent)) {
      state.buildings.unshift({ id: 0, kind: 'tower', x: -8, z: -9, workers: 0, permanent: true, rotation: 0 });
    }
    return state;
  } catch (error) {
    console.error('Partida guardada dañada:', error);
    return null;
  }
}

export function saveKeyExists() {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY) || localStorage.getItem('valdemar-save'));
  } catch {
    return false;
  }
}
