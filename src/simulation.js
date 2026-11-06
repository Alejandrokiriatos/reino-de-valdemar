export const BUILDINGS = {
  house:   { name: 'Casa campesina', cost: { wood: 30, stone: 0 }, slots: 0, housing: 6, size: 6.2 },
  farm:    { name: 'Granja', cost: { wood: 40, stone: 10 }, slots: 4, housing: 0, size: 9.4 },
  sawmill: { name: 'Aserradero', cost: { wood: 55, stone: 10 }, slots: 3, housing: 0, size: 7.6 },
  quarry:  { name: 'Cantera', cost: { wood: 45, stone: 20 }, slots: 3, housing: 0, size: 7.4 },
  tower:   { name: 'Torre de guardia', cost: { wood: 50, stone: 35 }, slots: 2, housing: 0, size: 6.2 },
  market:  { name: 'Mercado', cost: { wood: 65, stone: 20 }, slots: 2, housing: 0, size: 7.2 },
  well:    { name: 'Pozo', cost: { wood: 25, stone: 25 }, slots: 0, housing: 0, size: 3.8 },
  storehouse: { name: 'Almacén', cost: { wood: 45, stone: 15 }, slots: 0, housing: 0, size: 8.2, storage: true },
  hunter: { name: 'Cabaña de cazadores', cost: { wood: 48, stone: 8 }, slots: 2, housing: 0, size: 6.8 },
  fishery: { name: 'Puesto de pesca', cost: { wood: 55, stone: 8 }, slots: 2, housing: 0, size: 6.8 },
  stable: { name: 'Establo y corral', cost: { wood: 65, stone: 25 }, slots: 2, housing: 0, size: 8.8, livestockCapacity: 4 }
};

export const SEASONS = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
const SAVE_KEY = 'valdemar-save-v2';

export function newGame() {
  return {
    version: 3,
    day: 1,
    nextCaravanDay: 5,
    caravanVisits: 0,
    caravan: null,
    food: 180,
    wood: 130,
    stone: 100,
    gold: 35,
    population: 12,
    morale: 78,
    wildlife: 100,
    fishStock: 100,
    livestock: 2,
    manure: 16,
    weather: weatherForDay(1),
    buildings: [
      { id: 1, kind: 'tower', x: -8, z: -16, workers: 0, permanent: true, rotation: 0 },
      { id: 2, kind: 'house', x: 0, z: -8, workers: 0, permanent: true, rotation: 0.08 },
      { id: 3, kind: 'house', x: 7, z: -4, workers: 0, permanent: true, rotation: -0.12 },
      { id: 4, kind: 'farm', x: -4, z: 7, workers: 2, permanent: true, rotation: -0.08, fertility: 100 },
      { id: 5, kind: 'sawmill', x: -19, z: 5, workers: 1, permanent: true, rotation: 0.2 },
      { id: 6, kind: 'storehouse', x: -17, z: -8, workers: 0, permanent: true, rotation: 0 },
      { id: 7, kind: 'hunter', x: -34, z: 16, workers: 1, permanent: true, rotation: 0.18 },
      { id: 8, kind: 'stable', x: -29, z: -14, workers: 1, permanent: true, rotation: 0.12 }
    ],
    nextBuildingId: 9,
    notices: ['La aldea de Valdemar despierta. Cuida sus reservas antes de que llegue el invierno.']
  };
}

export function housingCapacity(state) {
  return state.buildings.reduce((total, building) => total + (BUILDINGS[building.kind]?.housing || 0), 0);
}

export function storageCapacity(state) {
  const warehouses = state.buildings.filter((building) => building.kind === 'storehouse').length;
  return warehouses * 450 + (warehouses ? 200 : 0);
}

export function storedResources(state) {
  return Math.max(0, Number(state.food) || 0)
    + Math.max(0, Number(state.wood) || 0)
    + Math.max(0, Number(state.stone) || 0)
    + Math.max(0, Number(state.gold) || 0)
    + Math.max(0, Number(state.manure) || 0);
}

export function livestockCapacity(state) {
  return state.buildings.reduce((total, building) => total + (BUILDINGS[building.kind]?.livestockCapacity || 0), 0);
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

export function weatherForDay(day, season = seasonForDay(day)) {
  // Stable per-day weather keeps a saved calendar reproducible without
  // storing a random generator state.
  const roll = ((Math.max(1, Math.floor(day)) * 73 + 19) % 100);
  if (season === 'Primavera') {
    return roll < 12 ? 'Tormenta' : roll < 38 ? 'Lluvia' : roll < 68 ? 'Nublado' : 'Despejado';
  }
  if (season === 'Verano') {
    return roll < 5 ? 'Tormenta' : roll < 12 ? 'Lluvia' : roll < 29 ? 'Sequía' : roll < 58 ? 'Nublado' : 'Despejado';
  }
  if (season === 'Otoño') {
    return roll < 14 ? 'Tormenta' : roll < 42 ? 'Lluvia' : roll < 72 ? 'Nublado' : 'Despejado';
  }
  return roll < 43 ? 'Nieve' : roll < 79 ? 'Nublado' : 'Despejado';
}

export function weatherDescription(weather) {
  return ({
    Despejado: 'se despeja el cielo',
    Nublado: 'se cubre el cielo',
    Lluvia: 'comienza a llover',
    Tormenta: 'se desata una tormenta',
    Sequía: 'se instala la sequía',
    Nieve: 'comienza a nevar'
  })[weather] || 'tiempo variable';
}

export function canAfford(state, kind) {
  const cost = BUILDINGS[kind]?.cost;
  return Boolean(cost && state.wood >= cost.wood && state.stone >= cost.stone);
}

export function canPlace(state, kind, x, z) {
  const spec = BUILDINGS[kind];
  if (!spec || Math.abs(x) > 78 || Math.abs(z) > 78) return { valid: false, reason: 'Fuera de los límites del valle.' };
  const riverX = 18 + Math.sin(z * 0.042) * 3.8;
  const riverDistance = Math.abs(x - riverX);
  if (kind === 'fishery') {
    if (riverDistance < 6) return { valid: false, reason: 'Deja libre la orilla: el puesto necesita acceso a agua profunda.' };
    if (riverDistance > 14) return { valid: false, reason: 'El puesto de pesca debe construirse junto al río.' };
  } else if (riverDistance < 7.8) {
    return { valid: false, reason: 'El terreno está demasiado cerca del río.' };
  }
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
  const riverX = 18 + Math.sin(z * 0.042) * 3.8;
  const facingRiver = kind === 'fishery'
    ? (x < riverX ? Math.PI / 2 : -Math.PI / 2)
    : (Math.random() - 0.5) * 0.24;
  const building = {
    id: state.nextBuildingId++,
    kind, x, z, workers: 0, permanent: false, rotation: facingRiver
  };
  state.buildings.push(building);
  state.notices.unshift(BUILDINGS[kind].name + ' levantado en el valle.');
  state.notices = state.notices.slice(0, 8);
  return { ok: true, building, message: BUILDINGS[kind].name + ' construido.' };
}

export function buyLivestock(state, amount = 1) {
  const quantity = Math.max(1, Math.floor(Number(amount) || 1));
  const capacity = livestockCapacity(state);
  if (capacity <= 0) return { ok: false, message: 'Primero necesitas construir un establo.' };
  if (state.livestock + quantity > capacity) return { ok: false, message: 'No queda espacio en los corrales.' };
  const cost = quantity * 8;
  if (state.gold < cost) return { ok: false, message: 'No tienes oro suficiente para comprar el ganado.' };
  state.gold -= cost;
  state.livestock += quantity;
  state.notices.unshift('Llegan ' + quantity + ' cabeza(s) de ganado a los corrales.');
  state.notices = state.notices.slice(0, 8);
  return { ok: true, message: 'Ganado adquirido: ' + state.livestock + ' / ' + capacity + '.' };
}

function createCaravan(day) {
  const winter = seasonForDay(day) === 'Invierno';
  const buy = { food: winter ? 3 : 2, wood: winter ? 3 : 2, stone: 3, manure: 2 };
  const sell = Object.fromEntries(Object.entries(buy).map(([key, price]) => [key, Math.max(1, Math.floor(price * 0.6))]));
  return {
    arrivedDay: day,
    daysLeft: 3,
    stock: {
      food: 35 + (day % 3) * 5,
      wood: 24 + (day % 4) * 3,
      stone: 18 + (day % 5) * 2,
      manure: 12 + (day % 3) * 2
    },
    prices: { buy, sell }
  };
}

export function tradeWithCaravan(state, action, resource, amount = 10) {
  const caravan = state.caravan;
  const tradable = ['food', 'wood', 'stone', 'manure'];
  if (!caravan || caravan.daysLeft <= 0) return { ok: false, message: 'No hay ninguna caravana comerciando en el valle.' };
  if (!tradable.includes(resource)) return { ok: false, message: 'Esa mercancía no se puede comerciar.' };
  const quantity = Math.max(1, Math.min(99, Math.floor(Number(amount) || 0)));
  if (!['buy', 'sell'].includes(action)) return { ok: false, message: 'Operación comercial desconocida.' };
  const price = Math.max(1, Number(caravan.prices?.[action]?.[resource]) || 1);
  const total = quantity * price;
  const capacity = storageCapacity(state);

  if (action === 'buy') {
    const merchantStock = Math.max(0, Number(caravan.stock?.[resource]) || 0);
    if (merchantStock < quantity) return { ok: false, message: 'La caravana no tiene tantas unidades de esa mercancía.' };
    if (state.gold < total) return { ok: false, message: 'No tienes oro suficiente para esa compra.' };
    if (storedResources(state) - total + quantity > capacity) {
      return { ok: false, message: 'No hay espacio libre en los almacenes para recibir esa mercancía.' };
    }
    state.gold -= total;
    state[resource] += quantity;
    caravan.stock[resource] -= quantity;
    return { ok: true, message: 'Compra realizada: ' + quantity + ' unidades por ' + total + ' de oro.' };
  }

  if (state[resource] < quantity) return { ok: false, message: 'No tienes suficientes unidades para vender.' };
  if (storedResources(state) - quantity + total > capacity) {
    return { ok: false, message: 'No hay espacio en el almacén para guardar el oro de la venta.' };
  }
  state[resource] -= quantity;
  state.gold += total;
  caravan.stock[resource] = Math.max(0, Number(caravan.stock[resource]) || 0) + quantity;
  return { ok: true, message: 'Venta realizada: ' + quantity + ' unidades por ' + total + ' de oro.' };
}

export function fertilizeFarm(state, buildingId) {
  const farm = state.buildings.find((building) => building.id === buildingId && building.kind === 'farm');
  if (!farm) return { ok: false, message: 'Selecciona una granja para abonarla.' };
  const fertility = Math.max(0, Math.min(100, Number(farm.fertility ?? 100)));
  if (fertility >= 99.5) return { ok: false, message: 'La tierra todavía conserva suficiente fertilidad.' };
  if (state.manure < 8) return { ok: false, message: 'Necesitas 8 unidades de abono para fertilizar el campo.' };
  state.manure -= 8;
  farm.fertility = Math.min(100, fertility + 28);
  state.notices.unshift('Se abonó el campo. La fertilidad del suelo ha mejorado.');
  state.notices = state.notices.slice(0, 8);
  return { ok: true, message: 'Campo abonado: fertilidad al ' + Math.round(farm.fertility) + '%.' };
}

export function changeWorkers(state, buildingId, change) {
  const building = state.buildings.find((item) => item.id === buildingId);
  if (!building) return { ok: false, message: 'No se encontró la construcción.' };
  const slots = BUILDINGS[building.kind]?.slots || 0;
  if (change > 0 && change > freeWorkers(state)) return { ok: false, message: 'No quedan suficientes trabajadores libres.' };
  if (change > 0 && building.workers + change > slots) return { ok: false, message: 'Este edificio no tiene tantos puestos libres.' };
  if (change < 0 && building.workers + change < 0) return { ok: false, message: 'Este edificio no tiene tantos trabajadores asignados.' };
  building.workers = Math.max(0, Math.min(slots, building.workers + change));
  return { ok: true, message: building.workers + ' trabajador(es) en ' + BUILDINGS[building.kind].name + '.' };
}

export function demolishBuilding(state, buildingId) {
  const index = state.buildings.findIndex((item) => item.id === buildingId);
  if (index < 0) return { ok: false, message: 'No se encontró el edificio.' };
  const building = state.buildings[index];
  if (building.permanent) return { ok: false, message: 'No puedes demoler los edificios fundadores de la aldea.' };
  if (building.kind === 'storehouse' && state.buildings.filter((item) => item.kind === 'storehouse').length === 1) {
    return { ok: false, message: 'La aldea necesita al menos un almacén para organizar sus mercancías.' };
  }
  if (building.kind === 'stable' && state.livestock > livestockCapacity(state) - (BUILDINGS.stable.livestockCapacity || 0)) {
    return { ok: false, message: 'Tras retirar este establo no habría espacio suficiente para todo el ganado.' };
  }
  state.buildings.splice(index, 1);
  state.wood += Math.floor((BUILDINGS[building.kind]?.cost.wood || 0) * 0.35);
  state.stone += Math.floor((BUILDINGS[building.kind]?.cost.stone || 0) * 0.35);
  state.notices.unshift(BUILDINGS[building.kind].name + ' demolido. Se recuperaron algunos materiales.');
  return { ok: true, message: 'Edificio demolido; parte de los materiales ha sido recuperada.' };
}

export function advanceDay(state) {
  state.day += 1;
  const season = seasonForDay(state.day);
  const previousWeather = state.weather || weatherForDay(state.day - 1);
  let caravanArrived = false;
  if (state.caravan) {
    state.caravan.daysLeft = Math.max(0, Number(state.caravan.daysLeft) - 1);
    if (state.caravan.daysLeft <= 0) {
      state.caravan = null;
      state.nextCaravanDay = state.day + 5;
      state.notices.unshift('La caravana recoge sus mercancías y abandona Valdemar.');
    }
  }
  if (!state.caravan && state.day >= (Number(state.nextCaravanDay) || 5)) {
    state.caravan = createCaravan(state.day);
    state.caravanVisits = Math.max(0, Number(state.caravanVisits) || 0) + 1;
    caravanArrived = true;
    state.notices.unshift('¡Ha llegado una caravana mercante! Sus comerciantes permanecerán tres días en el valle.');
  }
  const weather = weatherForDay(state.day, season);
  state.weather = weather;
  const seasonFactor = season === 'Invierno' ? 0.32 : season === 'Verano' ? 1.2 : season === 'Otoño' ? 0.92 : 1.08;
  const cropWeatherFactor = weather === 'Lluvia' ? 1.18
    : weather === 'Tormenta' ? 1.12
    : weather === 'Sequía' ? 0.68
    : weather === 'Nieve' ? 0.62
    : weather === 'Nublado' ? 0.96 : 1;
  const growingFactor = seasonFactor * cropWeatherFactor;

  let foodProduced = 0;
  let woodProduced = 0;
  let stoneProduced = 0;
  let goldProduced = 0;
  let huntingWorkers = 0;
  let fishingWorkers = 0;
  for (const building of state.buildings) {
    const workers = Math.max(0, Number(building.workers) || 0);
    if (building.kind === 'farm') {
      const fertility = Math.max(0, Math.min(100, Number(building.fertility ?? 100)));
      const soilFactor = 0.55 + 0.45 * (fertility / 100);
      foodProduced += workers * 2.55 * growingFactor * soilFactor;
      building.fertility = Math.max(0, fertility - (workers > 0 ? 0.06 + workers * 0.12 : 0.015));
    }
    if (building.kind === 'sawmill') woodProduced += workers * 1.65;
    if (building.kind === 'quarry') stoneProduced += workers * 1.1;
    if (building.kind === 'market') goldProduced += workers * 1.25;
    if (building.kind === 'hunter') huntingWorkers += workers;
    if (building.kind === 'fishery') fishingWorkers += workers;
  }
  const wildlifeFactor = state.wildlife <= 0 ? 0 : 0.25 + 0.75 * Math.min(1, state.wildlife / 30);
  const huntedFood = huntingWorkers * 1.85 * seasonFactor * wildlifeFactor;
  foodProduced += huntedFood;
  const wildlifeRecovery = season === 'Invierno' ? 0.45 : weather === 'Sequía' ? 0.65 : (weather === 'Lluvia' || weather === 'Tormenta') ? 1.4 : 1.15;
  state.wildlife = Math.min(100, Math.max(0, state.wildlife + wildlifeRecovery - huntingWorkers * 1.05));
  const fishRecovery = weather === 'Tormenta' ? 2.1 : weather === 'Lluvia' ? 2.0 : weather === 'Sequía' ? 0.7 : 1.5;
  const fishFactor = state.fishStock <= 0 ? 0 : 0.2 + 0.8 * Math.min(1, state.fishStock / 35);
  const fishCaught = fishingWorkers * 2.0 * seasonFactor * fishFactor;
  foodProduced += fishCaught;
  state.fishStock = Math.min(100, Math.max(0, state.fishStock + fishRecovery - fishingWorkers * 1.15));

  const stableWorkers = state.buildings.filter((building) => building.kind === 'stable')
    .reduce((total, building) => total + Math.max(0, Number(building.workers) || 0), 0);
  const livestockCapacityNow = livestockCapacity(state);
  state.livestock = Math.max(0, Math.min(livestockCapacityNow, Math.floor(Number(state.livestock) || 0)));
  const livestockFed = state.livestock === 0 || state.food > state.population * 0.2 + state.livestock * 0.1;
  const dairyProduced = livestockFed ? state.livestock * (0.24 + Math.min(0.16, stableWorkers * 0.08)) * seasonFactor : 0;
  foodProduced += dairyProduced;
  const manureProduced = livestockFed ? state.livestock * (stableWorkers > 0 ? 0.58 : 0.3) : 0;

  const winter = season === 'Invierno';
  const foodConsumed = state.population * (winter ? 0.22 : 0.19);
  const animalFeed = state.livestock > 0 ? state.livestock * 0.1 : 0;
  const totalFoodConsumed = foodConsumed + animalFeed;
  const woodConsumed = winter ? state.population * (weather === 'Nieve' ? 0.16 : 0.12) : 0;
  state.food = Math.max(0, state.food - totalFoodConsumed);
  state.wood = Math.max(0, state.wood - woodConsumed);
  if (!livestockFed && state.day % 3 === 0 && state.livestock > 0) {
    state.livestock -= 1;
    state.notices.unshift('Falta de forraje: una res no ha sobrevivido.');
  }

  // Storage is a shared limit: new goods cannot appear in the village if the
  // storehouse has no room, matching the visible stockpile/hauling system.
  const capacity = storageCapacity(state);
  let occupied = storedResources(state);
  const storeGoods = (resource, amount) => {
    const stored = Math.max(0, Math.min(amount, capacity - occupied, 9999 - state[resource]));
    state[resource] += stored;
    occupied += stored;
    return stored;
  };
  const foodStored = storeGoods('food', foodProduced);
  const woodStored = storeGoods('wood', woodProduced);
  const stoneStored = storeGoods('stone', stoneProduced);
  const goldStored = storeGoods('gold', goldProduced);
  const manureStored = storeGoods('manure', manureProduced);
  if (winter && state.wood <= 0) state.morale = Math.max(0, state.morale - 2);

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
    const hasWell = state.buildings.some((building) => building.kind === 'well');
    const guarded = state.buildings.some((building) => building.kind === 'tower' && building.workers > 0);
    state.morale = Math.min(100, state.morale + 1.8 + (hasWell ? 0.55 : 0) + (guarded ? 0.35 : 0));
    if (state.day % 5 === 0 && state.population < housingCapacity(state) && state.food > state.population * 7) {
      state.population += 1;
      state.notices.unshift('Una nueva familia llega atraída por la prosperidad de Valdemar.');
    }
  }

  let remainingWorkers = state.population;
  for (const building of state.buildings) {
    building.workers = Math.max(0, Math.min(Number(building.workers) || 0, remainingWorkers));
    remainingWorkers -= building.workers;
  }

  if (state.day % 12 === 0 && livestockFed && state.livestock >= 2 && stableWorkers > 0 && state.livestock < livestockCapacityNow && state.food > state.population * 2.5) {
    state.livestock += 1;
    state.food = Math.max(0, state.food - 2.5);
    state.notices.unshift('Ha nacido una cría en los corrales. El ganado crece.');
  }
  if (weather !== previousWeather) {
    state.notices.unshift('El tiempo cambia: ' + weatherDescription(weather) + '.');
  }
  if (state.day % 12 === 0) {
    const nextSeason = seasonForDay(state.day + 1);
    state.notices.unshift(nextSeason === 'Invierno'
      ? 'Llega el invierno. Las cosechas serán mucho más escasas.'
      : 'Las estaciones cambian. Revisa las reservas del reino.');
  } else if (foodProduced + woodProduced + stoneProduced + goldProduced > 0) {
    state.notices.unshift('La producción diaria se ha completado.');
  }

  state.notices = state.notices.slice(0, 8);
  return {
    season, weather, previousWeather, cropWeatherFactor, caravanArrived, caravan: state.caravan,
    foodProduced, huntedFood, huntingWorkers, wildlife: state.wildlife,
    dairyProduced, manureProduced, manureStored, livestock: state.livestock,
    livestockCapacity: livestockCapacityNow, livestockFed, farmFertility: state.buildings.filter((building) => building.kind === 'farm').map((farm) => farm.fertility),
    fishCaught, fishingWorkers, fishStock: state.fishStock,
    foodConsumed, animalFeed, totalFoodConsumed, woodProduced, woodConsumed, stoneProduced, goldProduced,
    foodStored, woodStored, stoneStored, goldStored, manureStored, storageCapacity: capacity
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
      version: 3,
      day: Math.max(1, Number(saved.day) || 1),
      nextCaravanDay: Math.max(2, Math.floor(Number(saved.nextCaravanDay) || (Math.max(1, Number(saved.day) || 1) + 4))),
      caravanVisits: Math.max(0, Math.floor(Number(saved.caravanVisits) || 0)),
      caravan: saved.caravan && typeof saved.caravan === 'object' ? {
        arrivedDay: Math.max(1, Math.floor(Number(saved.caravan.arrivedDay) || 1)),
        daysLeft: Math.max(0, Math.min(3, Math.floor(Number(saved.caravan.daysLeft) || 0))),
        stock: Object.fromEntries(['food', 'wood', 'stone', 'manure'].map((key) => [key, Math.max(0, Number(saved.caravan.stock?.[key]) || 0)])),
        prices: {
          buy: Object.fromEntries(['food', 'wood', 'stone', 'manure'].map((key) => [key, Math.max(1, Number(saved.caravan.prices?.buy?.[key]) || 2)])),
          sell: Object.fromEntries(['food', 'wood', 'stone', 'manure'].map((key) => [key, Math.max(1, Number(saved.caravan.prices?.sell?.[key]) || 1)]))
        }
      } : null,
      food: Math.max(0, Number(saved.food) || 0),
      wood: Math.max(0, Number(saved.wood ?? saved.logs) || 0),
      stone: Math.max(0, Number(saved.stone ?? saved.rocks) || 0),
      gold: Math.max(0, Number(saved.gold) || 0),
      population: Math.max(1, Number(saved.population ?? saved.pop) || 1),
      morale: Math.min(100, Math.max(0, Number(saved.morale) || 70)),
      wildlife: Math.min(100, Math.max(0, Number(saved.wildlife ?? 100))),
      fishStock: Math.min(100, Math.max(0, Number(saved.fishStock ?? 100))),
      livestock: Math.max(0, Math.floor(Number(saved.livestock ?? 2))),
      manure: Math.max(0, Number(saved.manure ?? 16)),
      weather: saved.weather || weatherForDay(Math.max(1, Number(saved.day) || 1)),
      notices: Array.isArray(saved.notices) ? saved.notices.slice(0, 8) : [],
      buildings: saved.buildings.filter((b) => b && BUILDINGS[b.kind]).map((b, index) => ({
        id: Number(b.id) || index + 1,
        kind: b.kind,
        x: Number(b.x) || 0,
        z: Number(b.z) || 0,
        workers: Math.max(0, Math.min(BUILDINGS[b.kind].slots, Number(b.workers) || 0)),
        permanent: Boolean(b.permanent ?? index < 4),
        rotation: Number(b.rotation) || 0,
        fertility: b.kind === 'farm' ? Math.max(0, Math.min(100, Number(b.fertility ?? 100))) : undefined
      })),
      nextBuildingId: Math.max(Number(saved.nextBuildingId) || 1, saved.buildings.length + 1, ...saved.buildings.map((b) => (Number(b?.id) || 0) + 1))
    };
    if (!state.buildings.some((b) => b.kind === 'tower' && b.permanent)) {
      state.buildings.unshift({ id: 0, kind: 'tower', x: -8, z: -16, workers: 0, permanent: true, rotation: 0 });
    }
    if (!state.buildings.some((b) => b.kind === 'storehouse')) {
      state.buildings.push({
        id: state.nextBuildingId++,
        kind: 'storehouse', x: -17, z: -8, workers: 0, permanent: true, rotation: 0
      });
    }
    if (!state.buildings.some((b) => b.kind === 'stable')) {
      state.buildings.push({
        id: state.nextBuildingId++, kind: 'stable', x: -29, z: -14,
        workers: 1, permanent: true, rotation: 0.12
      });
    }
    state.livestock = Math.min(state.livestock, livestockCapacity(state));
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
