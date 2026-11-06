import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, housingCapacity, freeWorkers, canPlace, placeBuilding,
  changeWorkers, advanceDay, seasonForDay
} from '../src/simulation.js';

test('a new settlement starts with consistent population and housing', () => {
  const state = newGame();
  assert.equal(state.population, 12);
  assert.equal(housingCapacity(state), 12);
  assert.equal(freeWorkers(state), 9);
  assert.equal(state.buildings.length, 5);
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
  assert.equal(freeWorkers(state), 8);
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
  withWell.buildings.push({ id: 6, kind: 'well', x: 32, z: 32, workers: 0 });
  advanceDay(withoutWell);
  advanceDay(withWell);
  assert.ok(withWell.morale > withoutWell.morale);
});
