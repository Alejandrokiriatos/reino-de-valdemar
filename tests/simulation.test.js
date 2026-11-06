import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, housingCapacity, storageCapacity, storedResources, livestockCapacity, freeWorkers, canPlace, placeBuilding, BUILDINGS,
  changeWorkers, buyLivestock, fertilizeFarm, demolishBuilding, advanceDay, seasonForDay, weatherForDay, loadGame, tradeWithCaravan
} from '../src/simulation.js';

test('a new settlement starts with consistent population and housing', () => {
  const state = newGame();
  assert.equal(state.population, 12);
  assert.equal(housingCapacity(state), 12);
  assert.equal(freeWorkers(state), 7);
  assert.equal(state.buildings.length, 8);
  assert.equal(state.livestock, 2);
  assert.equal(livestockCapacity(state), 4);
  assert.ok(state.buildings.some((building) => building.kind === 'storehouse' && building.permanent));
});

test('placement checks space and charges resources only on success', () => {
  const state = newGame();
  const woodBefore = state.wood;
  const stoneBefore = state.stone;
  const blocked = canPlace(state, 'house', 1, -8);
  assert.equal(blocked.valid, false);
  assert.equal(state.wood, woodBefore);
  const placed = placeBuilding(state, 'house', -52, -52);
  assert.equal(placed.ok, true);
  assert.equal(state.wood, woodBefore - 30);
  assert.equal(state.stone, stoneBefore);
});

test('worker assignment respects building slots and available population', () => {
  const state = newGame();
  assert.equal(changeWorkers(state, 4, 1).ok, true);
  assert.equal(state.buildings.find((item) => item.id === 4).workers, 3);
  assert.equal(freeWorkers(state), 6);
  assert.equal(changeWorkers(state, 4, 2).ok, false);
  assert.equal(changeWorkers(state, 4, -1).ok, true);
});

test('winter changes crop output and consumes heating wood', () => {
  const state = newGame();
  state.day = 36;
  const result = advanceDay(state);
  assert.equal(state.day, 37);
  assert.equal(seasonForDay(state.day), 'Invierno');
  assert.ok(result.woodConsumed > 0);
  assert.ok(result.foodProduced < 2 * 2.55 * 1.08);
});

test('wells provide a small daily morale benefit', () => {
  const withoutWell = newGame();
  const withWell = newGame();
  withWell.buildings.push({ id: 10, kind: 'well', x: 32, z: 32, workers: 0 });
  advanceDay(withoutWell);
  advanceDay(withWell);
  assert.ok(withWell.morale > withoutWell.morale);
});

test('hunting produces food but wildlife herds recover when not hunted', () => {
  const state = newGame();
  state.buildings.push({ id: 9, kind: 'hunter', x: 35, z: 40, workers: 2, permanent: false });
  const before = state.food;
  const result = advanceDay(state);
  assert.ok(result.huntedFood > 0);
  assert.ok(state.food > before);
  const depleted = { ...newGame(), wildlife: 0 };
  depleted.buildings.push({ id: 9, kind: 'hunter', x: 35, z: 40, workers: 2, permanent: false });
  const depletedResult = advanceDay(depleted);
  assert.equal(depletedResult.huntedFood, 0);
  const resting = newGame();
  resting.wildlife = 40;
  resting.buildings.find((building) => building.kind === 'hunter').workers = 0;
  advanceDay(resting);
  assert.ok(resting.wildlife > 40);

  const rainyValley = newGame();
  rainyValley.day = 6;
  rainyValley.wildlife = 50;
  advanceDay(rainyValley);
  const droughtValley = newGame();
  droughtValley.day = 21;
  droughtValley.wildlife = 50;
  advanceDay(droughtValley);
  assert.ok(rainyValley.wildlife > droughtValley.wildlife);
});


test('legacy saves keep wood, stone, population and player-built status', () => {
  const oldStorage = globalThis.localStorage;
  const legacy = {
    day: 17, food: 88, logs: 73, rocks: 41, pop: 14,
    buildings: [
      { kind: 'tower', x: -8, z: -9 },
      { kind: 'house', x: 0, z: -8 },
      { kind: 'house', x: 7, z: -4 },
      { kind: 'farm', x: -4, z: 7 },
      { kind: 'house', x: 25, z: 25 }
    ]
  };
  globalThis.localStorage = {
    getItem(key) {
      return key === 'valdemar-save' ? JSON.stringify(legacy) : null;
    }
  };
  try {
    const state = loadGame();
    assert.equal(state.wood, 73);
    assert.equal(state.stone, 41);
    assert.equal(state.population, 14);
    assert.equal(state.buildings[3].permanent, true);
    assert.equal(state.buildings[4].permanent, false);
  } finally {
    if (oldStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = oldStorage;
  }
});


test('fishing requires a river bank and depleted fish stocks recover', () => {
  const state = newGame();
  assert.equal(canPlace(state, 'fishery', 28, 25).valid, true);
  assert.equal(canPlace(state, 'fishery', -52, -52).valid, false);
  state.buildings.push({ id: 11, kind: 'fishery', x: 28, z: 25, workers: 2, permanent: false });
  state.fishStock = 20;
  const result = advanceDay(state);
  assert.ok(result.fishCaught > 0);
  assert.ok(state.fishStock < 20);
  const empty = newGame();
  empty.buildings.push({ id: 11, kind: 'fishery', x: 28, z: 25, workers: 2, permanent: false });
  empty.fishStock = 0;
  const emptyResult = advanceDay(empty);
  assert.equal(emptyResult.fishCaught, 0);
  const resting = newGame();
  resting.fishStock = 40;
  advanceDay(resting);
  assert.ok(resting.fishStock > 40);
});


test('storehouses limit shared resources and expansion increases storage', () => {
  const state = newGame();
  assert.equal(storageCapacity(state), 650);
  assert.equal(storedResources(state), 461);
  state.food = 400;
  state.wood = 200;
  state.stone = 50;
  state.gold = 0;
  state.manure = 0;
  const report = advanceDay(state);
  assert.ok(storedResources(state) <= storageCapacity(state));
  assert.ok(report.foodStored < report.foodProduced);
  state.buildings.push({ id: 12, kind: 'storehouse', x: 50, z: 40, workers: 0, permanent: false });
  assert.equal(storageCapacity(state), 1100);
  const afterExpansion = advanceDay(state);
  assert.ok(afterExpansion.foodStored >= 0);
  assert.ok(storedResources(state) <= storageCapacity(state));
});


test('weather is deterministic and spring rain improves farm production', () => {
  assert.equal(weatherForDay(7), 'Lluvia');
  assert.equal(weatherForDay(7), weatherForDay(7));
  const rainy = newGame();
  rainy.day = 6;
  const rainReport = advanceDay(rainy);
  const clear = newGame();
  clear.day = 4;
  const clearReport = advanceDay(clear);
  assert.equal(rainReport.weather, 'Lluvia');
  assert.equal(clearReport.weather, 'Despejado');
  assert.ok(rainReport.cropWeatherFactor > clearReport.cropWeatherFactor);
  assert.ok(rainReport.foodProduced > clearReport.foodProduced);
});

test('winter snowfall increases heating demand beyond a cloudy winter day', () => {
  const snowy = newGame();
  snowy.day = 36;
  const snowReport = advanceDay(snowy);
  const cloudy = newGame();
  cloudy.day = 38;
  const cloudReport = advanceDay(cloudy);
  assert.equal(snowReport.weather, 'Nieve');
  assert.equal(cloudReport.weather, 'Nublado');
  assert.ok(snowReport.woodConsumed > cloudReport.woodConsumed);
  assert.equal(snowy.weather, snowReport.weather);
});


test('spring storms trigger a stronger weather event and a settlement warning', () => {
  const state = newGame();
  state.day = 3;
  const result = advanceDay(state);
  assert.equal(result.weather, 'Tormenta');
  assert.equal(state.weather, 'Tormenta');
  assert.equal(result.previousWeather, 'Despejado');
  assert.ok(state.notices.some((notice) => notice.includes('tormenta')));
});


test('livestock can be purchased up to stable capacity and produces dairy and manure', () => {
  const state = newGame();
  const first = buyLivestock(state, 1);
  assert.equal(first.ok, true);
  assert.equal(state.livestock, 3);
  assert.equal(state.gold, 27);
  assert.equal(buyLivestock(state, 2).ok, false);
  const report = advanceDay(state);
  assert.ok(report.dairyProduced > 0);
  assert.ok(report.manureProduced > 0);
  assert.ok(report.manureStored > 0);
  assert.ok(state.manure > 16);
});

test('farm fertility declines with cultivation and can be restored with manure', () => {
  const state = newGame();
  const farm = state.buildings.find((building) => building.kind === 'farm');
  const startingManure = state.manure;
  for (let day = 0; day < 4; day++) advanceDay(state);
  assert.ok(farm.fertility < 99);
  const before = farm.fertility;
  const manureBeforeFertilizing = state.manure;
  const result = fertilizeFarm(state, farm.id);
  assert.equal(result.ok, true);
  assert.ok(farm.fertility > before);
  assert.equal(state.manure, manureBeforeFertilizing - 8);
  assert.equal(fertilizeFarm(state, 999).ok, false);
  const addedStable = { id: 15, kind: 'stable', x: 50, z: 40, workers: 0, permanent: false };
  state.buildings.push(addedStable);
  state.livestock = 5;
  const cannotDemolish = state.buildings.find((building) => building.id === 15);
  assert.equal(demolishBuilding(state, cannotDemolish.id).ok, false);
});

test('a staffed stable breeds cattle when there is feed and open corral space', () => {
  const state = newGame();
  for (let day = 0; day < 11; day++) advanceDay(state);
  assert.equal(state.day, 12);
  assert.equal(state.livestock, 3);
});


test('a merchant caravan arrives on its scheduled day and stays for three days', () => {
  const state = newGame();
  for (let day = 0; day < 4; day++) advanceDay(state);
  assert.equal(state.day, 5);
  assert.ok(state.caravan);
  assert.equal(state.caravan.daysLeft, 3);
  assert.equal(state.caravanVisits, 1);
  assert.ok(state.notices.some((notice) => notice.includes('caravana mercante')));
  advanceDay(state);
  assert.equal(state.caravan.daysLeft, 2);
  advanceDay(state);
  assert.equal(state.caravan.daysLeft, 1);
  advanceDay(state);
  assert.equal(state.caravan, null);
  assert.equal(state.nextCaravanDay, 13);
});

test('the caravan supports buying and selling goods with correct stock and gold changes', () => {
  const state = newGame();
  for (let day = 0; day < 4; day++) advanceDay(state);
  const merchant = state.caravan;
  const goldBefore = state.gold;
  const foodBefore = state.food;
  const merchantFoodBefore = merchant.stock.food;
  const buyPrice = merchant.prices.buy.food;
  const purchase = tradeWithCaravan(state, 'buy', 'food', 10);
  assert.equal(purchase.ok, true);
  assert.equal(state.food, foodBefore + 10);
  assert.equal(state.gold, goldBefore - buyPrice * 10);
  assert.equal(merchant.stock.food, merchantFoodBefore - 10);

  const woodBefore = state.wood;
  const merchantWoodBefore = merchant.stock.wood;
  const saleGoldBefore = state.gold;
  const sellPrice = merchant.prices.sell.wood;
  const sale = tradeWithCaravan(state, 'sell', 'wood', 10);
  assert.equal(sale.ok, true);
  assert.equal(state.wood, woodBefore - 10);
  assert.equal(state.gold, saleGoldBefore + sellPrice * 10);
  assert.equal(merchant.stock.wood, merchantWoodBefore + 10);
});

test('trade rejects unavailable caravans, insufficient gold, stock, goods and storage space', () => {
  const state = newGame();
  assert.equal(tradeWithCaravan(state, 'buy', 'food', 10).ok, false);
  state.caravan = {
    arrivedDay: 1, daysLeft: 2,
    stock: { food: 5, wood: 20, stone: 20, manure: 20 },
    prices: { buy: { food: 2, wood: 2, stone: 3, manure: 2 }, sell: { food: 1, wood: 1, stone: 1, manure: 1 } }
  };
  assert.equal(tradeWithCaravan(state, 'buy', 'food', 10).ok, false);
  state.gold = 0;
  assert.equal(tradeWithCaravan(state, 'buy', 'wood', 10).ok, false);
  state.gold = 35;
  state.wood = 0;
  assert.equal(tradeWithCaravan(state, 'sell', 'wood', 10).ok, false);
  state.food = 640;
  state.wood = 0;
  state.stone = 0;
  state.gold = 0;
  state.manure = 0;
  assert.equal(tradeWithCaravan(state, 'buy', 'wood', 10).ok, false);
});

test('el bosque limita la madera disponible y se regenera gradualmente', () => {
  const state = newGame();
  state.forestReserve = 1;
  const result = advanceDay(state);
  assert.ok(result.woodProduced <= 1.3);
  assert.ok(state.forestReserve >= 0);
  const barren = newGame();
  barren.forestReserve = 0;
  advanceDay(barren);
  assert.ok(barren.forestReserve > 0);
});
test('el administrador asigna aldeanos libres a los campos ante una escasez', () => {
  const state = newGame(); state.food = 1;
  const farm = state.buildings.find((building) => building.kind === 'farm');
  farm.workers = 1;
  advanceDay(state);
  assert.ok(farm.workers > 1);
  assert.ok(farm.workers <= BUILDINGS.farm.slots);
});
test('el territorio ampliado permite construir asentamientos lejanos', () => {
  const state = newGame();
  assert.equal(canPlace(state, 'house', 165, -140).valid, true);
  assert.equal(canPlace(state, 'house', 205, 0).valid, false);
});
