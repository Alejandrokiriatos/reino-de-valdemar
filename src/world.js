import * as THREE from 'three';
import { createSurfaceMaterials } from './graphics.js';

export const WORLD_SIZE = 420;

export function terrainHeight(x, z) {
  const riverX = 18 + Math.sin(z * 0.042) * 3.8;
  const channel = Math.exp(-Math.pow((x - riverX) / 6.2, 2));
  const hills = Math.sin(x * 0.12) * 0.32 + Math.cos(z * 0.09) * 0.4 + Math.sin((x - z) * 0.06) * 0.25;
  return hills * (1 - channel * 0.88) - channel * 0.18;
}

const material = (color, roughness = 0.9, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });

function addBox(parent, x, y, z, w, h, d, mat, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, x, y, z, rTop, rBottom, height, mat, sides = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, sides), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeTree(scene, x, z, scale, palette) {
  const group = new THREE.Group();
  group.position.set(x, terrainHeight(x, z), z);
  group.rotation.y = Math.random() * Math.PI * 2;
  const trunk = addCylinder(group, 0, 1.05 * scale, 0, 0.18 * scale, 0.28 * scale, 2.1 * scale, palette.trunk, 7);
  trunk.rotation.z = (Math.random() - 0.5) * 0.12;
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry((1.25 - i * 0.2) * scale, 2.15 * scale, 7),
      palette.leaves[(Math.random() * palette.leaves.length) | 0]
    );
    crown.position.set((Math.random() - 0.5) * 0.35 * scale, (2.25 + i * 0.78) * scale, (Math.random() - 0.5) * 0.35 * scale);
    crown.rotation.y = Math.random() * Math.PI;
    crown.castShadow = true;
    group.add(crown);
  }
  scene.add(group);
  return group;
}

function makeBush(scene, x, z, palette, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, terrainHeight(x, z), z);
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45 * scale, 1), palette.leaves[i % palette.leaves.length]);
    leaf.position.set((Math.random() - 0.5) * 0.75 * scale, 0.35 * scale + Math.random() * 0.2, (Math.random() - 0.5) * 0.7 * scale);
    leaf.scale.y = 0.78;
    leaf.castShadow = true;
    group.add(leaf);
  }
  scene.add(group);
}

function makeRock(scene, x, z, stoneMaterial, scale = 1) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), stoneMaterial);
  rock.position.set(x, terrainHeight(x, z) + scale * 0.38, z);
  rock.rotation.set(Math.random(), Math.random() * 2, Math.random());
  rock.scale.set(1.25, 0.72, 0.9);
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

function makeRoad(scene, points, width = 2.2, heightOffset = 0.045) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => {
    const offset = typeof heightOffset === 'function' ? heightOffset(x, z) : heightOffset;
    return new THREE.Vector3(x, terrainHeight(x, z) + offset, z);
  }));
  const vertices = [];
  const indices = [];
  const segments = 70;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);
    vertices.push(p.x - side.x, p.y, p.z - side.z, p.x + side.x, p.y + 0.002, p.z + side.z);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const road = new THREE.Mesh(geometry, material(0x756044, 1));
  road.receiveShadow = true;
  scene.add(road);
  return road;
}

function makeRiver(scene) {
  const vertices = [];
  const indices = [];
  const segments = 420;
  for (let i = 0; i <= segments; i++) {
    const z = -205 + (410 * i) / segments;
    const center = 18 + Math.sin(z * 0.042) * 3.8;
    const width = 3.25 + Math.sin(z * 0.075) * 0.35;
    vertices.push(center - width, 0.12, z, center + width, 0.12, z);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const water = new THREE.Mesh(geometry, material(0x477f87, 0.24, { transparent: true, opacity: 0.9, metalness: 0.08 }));
  water.receiveShadow = true;
  scene.add(water);
  const bankMat = material(0x8a805b, 1);
  const bank = new THREE.Mesh(new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => {
      const z = -200 + i * (400 / 29);
      const x = 18 + Math.sin(z * 0.042) * 3.8 - 3.5;
      return new THREE.Vector3(x, terrainHeight(x, z) + 0.04, z);
    })), 100, 0.12, 5, false
  ), bankMat);
  scene.add(bank);
  return water;
}

function makeHouse(group, wood, dark, stone, roof, plaster, accent) {
  addBox(group, 0, 0.25, 0, 5.8, 0.5, 5.2, stone);
  addBox(group, 0, 1.9, 0, 5.2, 3.15, 4.6, plaster);
  addBox(group, -2.48, 1.9, 0, 0.22, 3.25, 4.8, wood);
  addBox(group, 2.48, 1.9, 0, 0.22, 3.25, 4.8, wood);
  addBox(group, 0, 0.55, 2.33, 5.15, 0.2, 0.18, wood);
  addBox(group, -2.45, 3.15, 0, 0.22, 0.22, 4.8, wood);
  addBox(group, 2.45, 3.15, 0, 0.22, 0.22, 4.8, wood);
  addBox(group, 0, 3.2, -2.3, 5.15, 0.22, 0.2, wood);
  addBox(group, 0, 1.2, 2.38, 0.9, 1.7, 0.13, dark);
  addBox(group, 0.34, 1.2, 2.47, 0.08, 1.7, 0.05, accent);
  for (const x of [-1.45, 1.45]) {
    addBox(group, x, 2.1, 2.4, 0.72, 0.78, 0.12, dark);
    addBox(group, x, 2.1, 2.49, 0.1, 0.82, 0.06, wood);
    addBox(group, x, 2.1, 2.5, 0.78, 0.1, 0.06, wood);
    addBox(group, x, 2.1, 2.57, 0.12, 0.64, 0.05, accent);
  }
  const leftRoof = addBox(group, -1.28, 4.05, 0, 3.1, 0.28, 5.55, roof);
  leftRoof.rotation.z = -0.58;
  const rightRoof = addBox(group, 1.28, 4.05, 0, 3.1, 0.28, 5.55, roof);
  rightRoof.rotation.z = 0.58;
  addBox(group, 0, 4.93, 0, 0.24, 0.28, 5.7, wood);
  addBox(group, -1.98, 5.3, -0.9, 0.5, 1.2, 0.55, stone);
  addBox(group, -1.98, 5.95, -0.9, 0.65, 0.12, roof);
}

function makeTower(group, stone, roof, dark) {
  addBox(group, 0, 3.7, 0, 5.2, 7.4, 5.2, stone);
  addBox(group, 0, 7.35, 0, 6, 0.55, 6, dark);
  for (let x = -2.1; x <= 2.1; x += 1.05) {
    for (const z of [-2.4, 2.4]) addBox(group, x, 7.95, z, 0.6, 0.75, 0.62, stone);
    for (const xSide of [-2.4, 2.4]) addBox(group, xSide, 7.95, x, 0.62, 0.75, 0.6, stone);
  }
  for (const x of [-1.25, 1.25]) {
    addBox(group, x, 5.7, 2.64, 0.55, 1.05, 0.12, dark);
    addBox(group, x, 5.7, 2.72, 0.09, 1.1, 0.06, roof);
  }
  addBox(group, 0, 1.5, 2.66, 1.25, 2.8, 0.13, dark);
  addBox(group, 0.48, 1.5, 2.74, 0.08, 2.8, 0.05, roof);
  const flagpole = addCylinder(group, 0, 9.2, 0, 0.06, 0.06, 2.8, dark, 6);
  flagpole.position.y = 9.3;
  const flag = addBox(group, 0.55, 9.75, 0, 1.05, 0.62, 0.06, material(0x8c302a));
  flag.rotation.z = -0.08;
}

function makeFarm(group, wood, green, cropGold, soil) {
  addBox(group, 0, 0.08, 0, 9.2, 0.16, 8.2, soil);
  for (let row = 0; row < 5; row++) {
    const z = -2.7 + row * 1.28;
    addBox(group, 0, 0.19, z, 8.2, 0.05, 0.08, soil, false);
    for (let col = 0; col < 8; col++) {
      const x = -3.5 + col * 1;
      const stem = addBox(group, x, 0.6, z, 0.09, 0.82 + Math.random() * 0.25, 0.09, green, false);
      stem.rotation.z = (Math.random() - 0.5) * 0.28;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 7, 5), cropGold);
      head.position.set(x, 1.08, z);
      head.scale.set(0.85, 1.35, 0.85);
      head.castShadow = true;
      group.add(head);
    }
  }
  for (let i = 0; i < 8; i++) {
    const x = -4.5 + i * 1.28;
    addBox(group, x, 0.6, -4.15, 0.16, 1.2, 0.16, wood);
    addBox(group, x, 0.6, 4.15, 0.16, 1.2, 0.16, wood);
  }
  addBox(group, 0, 0.45, 4.1, 9.2, 0.12, 0.12, wood);
  addBox(group, 0, 0.45, -4.1, 9.2, 0.12, 0.12, wood);
  addBox(group, -3.2, 1, -3.1, 2, 1.8, 1.6, wood);
  const shedRoof = addBox(group, -3.2, 2, -3.1, 2.4, 0.22, 2, material(0x664339));
  shedRoof.rotation.z = 0.15;
}

function makeSawmill(group, wood, dark, roof, stone) {
  addBox(group, 0, 0.25, 0, 7.5, 0.5, 5.8, stone);
  addBox(group, 0, 1.95, -0.3, 5.6, 3.15, 4.4, wood);
  addBox(group, 0, 3.65, -0.3, 6.1, 0.3, 5, roof);
  addBox(group, -2.55, 1.9, 1.95, 0.2, 3.2, 0.2, dark);
  addBox(group, 2.55, 1.9, 1.95, 0.2, 3.2, 0.2, dark);
  addBox(group, 0, 0.65, 2.28, 2.2, 1.1, 0.18, dark);
  for (let i = 0; i < 5; i++) {
    const log = addCylinder(group, -2 + i * 0.62, 0.65, 3, 0.2, 0.2, 2.7, wood, 9);
    log.rotation.x = Math.PI / 2;
    log.rotation.z = 0.02 * i;
  }
  const blade = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.08, 8, 24), material(0x9a9a8d, 0.55, { metalness: 0.5 }));
  blade.position.set(1.55, 1.55, 2.4);
  blade.castShadow = true;
  group.add(blade);
  addCylinder(group, 1.55, 1.55, 2.42, 0.18, 0.18, 0.15, dark, 12).rotation.x = Math.PI / 2;
}

function makeQuarry(group, stone, wood, dark) {
  addBox(group, 0, 0.12, 0, 7.2, 0.24, 6.8, dark);
  for (let i = 0; i < 17; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.3, 0), stone);
    rock.position.set((Math.random() - 0.5) * 4.6, 0.35 + Math.random() * 0.35, (Math.random() - 0.5) * 4.5);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    group.add(rock);
  }
  for (const x of [-1.9, 1.9]) addBox(group, x, 2.05, 0, 0.2, 4, 0.2, wood);
  addBox(group, 0, 4, 0, 4.1, 0.22, 0.22, wood);
  const rope = addCylinder(group, 0, 2.9, 0, 0.08, 0.08, 2.1, dark, 7);
  rope.position.z = 0.3;
}

function makeMarket(group, wood, roof, cloth) {
  addBox(group, 0, 0.2, 0, 6.6, 0.4, 5.2, material(0x867553));
  for (const x of [-2.8, 2.8]) for (const z of [-2.05, 2.05]) addBox(group, x, 1.5, z, 0.18, 3, 0.18, wood);
  addBox(group, 0, 2.95, 0, 7, 0.2, 5.6, roof);
  addBox(group, 0, 2.7, 0, 6.8, 0.12, 5.4, cloth);
  addBox(group, 0, 1.1, 1.7, 5.2, 0.9, 0.65, wood);
  for (let i = 0; i < 4; i++) {
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), material([0xb29a69, 0x88734f, 0x9e754e][i % 3]));
    sack.position.set(-1.8 + i * 1.2, 1.85, 1.5);
    sack.scale.y = 0.8;
    sack.castShadow = true;
    group.add(sack);
  }
}

function makeWell(group, stone, wood, roof, dark) {
  addCylinder(group, 0, 0.55, 0, 1.55, 1.55, 1.1, stone, 10);
  addCylinder(group, 0, 1.1, 0, 1.12, 1.12, 0.15, dark, 10);
  for (const x of [-1.2, 1.2]) addBox(group, x, 2.35, 0, 0.2, 3, 0.2, wood);
  addBox(group, 0, 3.75, 0, 3.1, 0.2, 2.3, roof);
  const cap = addBox(group, 0, 4.25, 0, 3.1, 0.16, 2.3, roof);
  cap.rotation.z = 0.28;
  const beam = addCylinder(group, 0, 2.45, 0, 0.12, 0.12, 2.7, wood, 8);
  beam.rotation.z = Math.PI / 2;
  addCylinder(group, 0, 1.8, 0, 0.06, 0.06, 1.6, dark, 7);
}


function makeStorehouse(group, wood, dark, stone, roof, plaster) {
  addBox(group, 0, 0.24, 0, 7.4, 0.48, 6.4, stone);
  addBox(group, 0, 1.75, 0, 6.5, 2.65, 5.4, wood);
  addBox(group, 0, 1.45, 2.76, 6.25, 2.1, 0.16, plaster);
  for (const x of [-3.05, 3.05]) {
    addBox(group, x, 1.8, 2.88, 0.2, 2.9, 0.2, dark);
    addBox(group, x, 0.48, 2.88, 0.2, 0.8, 0.2, dark);
  }
  addBox(group, 0, 0.95, 2.88, 1.35, 1.65, 0.18, dark);
  addBox(group, -0.62, 0.95, 2.99, 0.1, 1.65, 0.06, wood);
  addBox(group, 0.62, 0.95, 2.99, 0.1, 1.65, 0.06, wood);
  for (const x of [-2, 2]) {
    addBox(group, x, 2.1, 2.9, 0.75, 0.72, 0.12, dark);
    addBox(group, x, 2.1, 2.98, 0.82, 0.1, 0.06, wood);
    addBox(group, x, 2.1, 3.02, 0.1, 0.74, 0.06, wood);
  }
  const roofL = addBox(group, -1.68, 3.35, 0, 3.65, 0.28, 6.1, roof);
  roofL.rotation.z = -0.48;
  const roofR = addBox(group, 1.68, 3.35, 0, 3.65, 0.28, 6.1, roof);
  roofR.rotation.z = 0.48;
  addBox(group, 0, 4.22, 0, 0.24, 0.22, 6.25, dark);
  addBox(group, -2.5, 4.4, -1.7, 0.56, 0.7, 0.58, stone);
  addBox(group, -2.5, 4.78, -1.7, 0.7, 0.1, roof);
  for (const z of [-1.7, -0.55, 0.6]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.85, 9), wood);
    barrel.position.set(3.9, 0.85, z);
    barrel.castShadow = true;
    group.add(barrel);
    for (const y of [0.58, 1.08]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 5, 12), dark);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(3.9, y, z);
      group.add(hoop);
    }
  }
}


function makeHunterCabin(group, wood, dark, stone, roof, plaster) {
  makeHouse(group, wood, dark, stone, roof, plaster, dark);
  addBox(group, -2.9, 1.45, -1.4, 0.18, 1.5, 0.18, dark);
  addBox(group, 2.9, 1.45, -1.4, 0.18, 1.5, 0.18, dark);
  for (const side of [-1, 1]) {
    const antler = new THREE.Group();
    antler.position.set(side * 1.5, 2.55, 2.55);
    const stem = addCylinder(antler, 0, 0.5, 0, 0.045, 0.07, 1.05, material(0xd5c39b), 6);
    stem.rotation.z = side * -0.22;
    const branchL = addCylinder(antler, side * 0.23, 0.77, 0, 0.035, 0.04, 0.55, material(0xd5c39b), 6);
    branchL.rotation.z = Math.PI / 2 - side * 0.35;
    const branchR = addCylinder(antler, -side * 0.18, 0.68, 0, 0.035, 0.04, 0.48, material(0xd5c39b), 6);
    branchR.rotation.z = -Math.PI / 2 + side * 0.3;
    group.add(antler);
  }
}

function makeDeer(scene, index, centerX, centerZ, palette) {
  const deer = new THREE.Group();
  const coat = palette.deerCoat;
  const dark = palette.dark;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.58, 9, 7), coat);
  body.scale.set(0.78, 0.74, 1.4);
  body.position.set(0, 1.12, 0);
  body.castShadow = true;
  deer.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), coat);
  chest.position.set(0, 1.23, 0.65);
  chest.scale.set(0.8, 1.25, 0.75);
  chest.rotation.x = -0.25;
  chest.castShadow = true;
  deer.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), coat);
  head.position.set(0, 1.65, 0.93);
  head.scale.set(0.78, 0.88, 1.1);
  head.castShadow = true;
  deer.add(head);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 5), material(0x8a705c));
  muzzle.position.set(0, 1.55, 1.12);
  deer.add(muzzle);
  const legs = [];
  for (const x of [-0.27, 0.27]) {
    for (const z of [-0.62, 0.55]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.88, z);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.78, 6), dark);
      lower.position.y = -0.39;
      lower.castShadow = true;
      leg.add(lower);
      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.2), dark);
      hoof.position.set(0, -0.78, 0.025);
      leg.add(hoof);
      deer.add(leg);
      legs.push(leg);
    }
  }
  for (const side of [-1, 1]) {
    const antler = addCylinder(deer, side * 0.15, 1.98, 0.91, 0.025, 0.05, 0.64, material(0xd1c09b), 5);
    antler.rotation.z = side * 0.32;
    const branch = addCylinder(deer, side * 0.28, 2.12, 0.91, 0.02, 0.028, 0.38, material(0xd1c09b), 5);
    branch.rotation.z = -side * 1.1;
  }
  deer.position.set(centerX + (Math.random() - 0.5) * 5, terrainHeight(centerX, centerZ), centerZ + (Math.random() - 0.5) * 5);
  deer.userData = {
    index, centerX, centerZ, target: new THREE.Vector3(centerX, 0, centerZ),
    wait: Math.random() * 5, phase: Math.random() * 6, speed: 0.8 + Math.random() * 0.35, legs
  };
  scene.add(deer);
  return deer;
}


function makeFishery(group, wood, dark, stone, roof, cloth) {
  addBox(group, 0, 0.2, 0, 7.2, 0.4, 6.2, stone);
  addBox(group, 0, 1.7, -0.7, 5.5, 2.65, 4.5, wood);
  for (const x of [-2.5, 2.5]) addBox(group, x, 1.75, 1.55, 0.18, 3, 0.18, dark);
  addBox(group, 0, 0.62, 1.65, 1.15, 1.4, 0.15, dark);
  const roofL = addBox(group, -1.35, 3.25, -0.7, 3, 0.25, 5.1, roof);
  roofL.rotation.z = -0.55;
  const roofR = addBox(group, 1.35, 3.25, -0.7, 3, 0.25, 5.1, roof);
  roofR.rotation.z = 0.55;
  addBox(group, 0, 4.05, -0.7, 0.22, 0.2, 5.25, dark);
  // A short timber jetty reaches toward the river.
  addBox(group, 0, 0.12, 4.4, 3.6, 0.24, 5.2, wood);
  for (const x of [-1.55, 1.55]) {
    for (const z of [2.3, 4.4, 6.4]) addBox(group, x, -0.3, z, 0.18, 1.05, 0.18, dark);
    addBox(group, x, 0.38, 4.4, 0.16, 0.16, 5.1, dark);
  }
  for (const z of [3.1, 5.2]) addBox(group, 0, 0.27, z, 3.1, 0.1, 0.14, dark);
  const net = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.045, 5, 14), cloth);
  net.position.set(2.15, 1.25, 2.4);
  net.rotation.y = Math.PI / 2;
  group.add(net);
  for (const x of [-1.2, -0.2, 0.8]) {
    const fishBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.68, 8), dark);
    fishBarrel.position.set(x, 0.62, 2.1);
    fishBarrel.castShadow = true;
    group.add(fishBarrel);
  }
}


function makeStable(group, wood, dark, stone, roof, plaster) {
  addBox(group, 0, 0.22, -0.8, 8.5, 0.44, 7.2, stone);
  addBox(group, 0, 1.85, -1.15, 6.8, 3.15, 5.35, wood);
  addBox(group, 0, 1.35, 1.57, 6.45, 2.05, 0.16, plaster);
  for (const x of [-3.15, 3.15]) {
    addBox(group, x, 1.75, 1.72, 0.22, 3.25, 0.22, dark);
    addBox(group, x, 0.47, 1.8, 0.22, 0.8, 0.22, dark);
  }
  addBox(group, 0, 0.95, 1.72, 1.55, 1.85, 0.2, dark);
  addBox(group, 0, 1.92, 1.83, 0.12, 0.12, 0.08, material(0xb28d59));
  const roofL = addBox(group, -1.72, 3.55, -1.15, 3.75, 0.28, 6.1, roof);
  roofL.rotation.z = -0.5;
  const roofR = addBox(group, 1.72, 3.55, -1.15, 3.75, 0.28, 6.1, roof);
  roofR.rotation.z = 0.5;
  addBox(group, 0, 4.42, -1.15, 0.24, 0.2, 6.3, dark);
  // Loft opening and hay storage.
  addBox(group, 0, 2.95, 1.68, 1.25, 0.82, 0.08, dark);
  addBox(group, 0, 2.95, 1.76, 0.98, 0.58, 0.06, wood);
  for (const x of [-2.3, 2.3]) {
    addBox(group, x, 0.65, -2.0, 0.82, 0.48, 0.75, material(0xb79a5e));
    for (let i = 0; i < 3; i++) {
      const hay = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.36, 5), material(0xc3a96d));
      hay.position.set(x + (i - 1) * 0.16, 0.98, -2 + (i % 2) * 0.14);
      hay.castShadow = true;
      group.add(hay);
    }
  }
  // Fenced exercise yard attached to the barn.
  for (const x of [-4, -1.35, 1.35, 4]) {
    for (const z of [3.1, 8.9]) addBox(group, x, 0.85, z, 0.17, 1.7, 0.17, dark);
  }
  for (const z of [3.1, 8.9]) {
    for (const y of [0.55, 1.18]) addBox(group, 0, y, z, 8.1, 0.13, 0.14, wood);
  }
  for (const x of [-4, 4]) {
    for (const y of [0.55, 1.18]) addBox(group, x, y, 6, 0.14, 0.13, 5.8, wood);
  }
  addBox(group, 1.95, 0.42, 4.05, 2.4, 0.48, 0.62, dark);
  addBox(group, 1.95, 0.68, 4.05, 2.25, 0.12, 0.5, material(0x817b59));
}

function makeCow(scene, index, x, z, palette) {
  const cow = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), palette.cowCoat);
  body.scale.set(0.86, 0.78, 1.35);
  body.position.y = 1.02;
  body.castShadow = true;
  cow.add(body);
  for (const side of [-1, 1]) {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 6), palette.cowPatch);
    patch.position.set(side * 0.43, 1.18, (index % 2 ? -0.2 : 0.28));
    patch.scale.set(0.18, 0.84, 0.94);
    cow.add(patch);
  }
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.31, 8, 6), palette.cowCoat);
  chest.position.set(0, 1.03, 0.62);
  chest.scale.set(0.86, 1.14, 0.8);
  cow.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 9, 7), palette.cowCoat);
  head.position.set(0, 1.48, 0.94);
  head.scale.set(0.78, 0.9, 1.08);
  head.castShadow = true;
  cow.add(head);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), palette.cowMuzzle);
  muzzle.position.set(0, 1.32, 1.18);
  muzzle.scale.set(1, 0.7, 0.75);
  cow.add(muzzle);
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.3, 6), palette.cowHorn);
    horn.position.set(side * 0.19, 1.78, 0.83);
    horn.rotation.z = side * -0.42;
    cow.add(horn);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 7, 5), palette.cowCoat);
    ear.position.set(side * 0.32, 1.55, 0.8);
    ear.scale.set(1.5, 0.45, 0.75);
    cow.add(ear);
  }
  const legs = [];
  for (const lx of [-0.3, 0.3]) {
    for (const lz of [-0.58, 0.52]) {
      const leg = new THREE.Group();
      leg.position.set(lx, 0.72, lz);
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.66, 6), palette.cowCoat);
      shin.position.y = -0.32;
      shin.castShadow = true;
      leg.add(shin);
      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.13, 0.17), palette.cowHorn);
      hoof.position.set(0, -0.67, 0.02);
      leg.add(hoof);
      cow.add(leg);
      legs.push(leg);
    }
  }
  const tail = new THREE.Group();
  tail.position.set(0, 1.15, -0.74);
  const tailStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.72, 6), palette.cowCoat);
  tailStem.position.set(0, -0.27, -0.08);
  tailStem.rotation.x = -0.24;
  tail.add(tailStem);
  const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 6), palette.cowHorn);
  tuft.position.set(0, -0.62, -0.1);
  tail.add(tuft);
  cow.add(tail);
  cow.position.set(x, terrainHeight(x, z), z);
  cow.userData = {
    index, phase: Math.random() * 6, wait: Math.random() * 4,
    centerX: x, centerZ: z, target: new THREE.Vector3(x, 0, z),
    speed: 0.45 + Math.random() * 0.16, legs, tail
  };
  scene.add(cow);
  return cow;
}

function makeBuildingMesh(type, palette) {
  const group = new THREE.Group();
  const wood = palette.wood;
  const dark = palette.dark;
  const stone = palette.stone;
  const roof = palette.roof;
  if (type === 'house') makeHouse(group, wood, dark, stone, roof, palette.plaster, palette.accent);
  else if (type === 'farm') makeFarm(group, wood, palette.crop, palette.cropGold, palette.soil);
  else if (type === 'sawmill') makeSawmill(group, wood, dark, roof, stone);
  else if (type === 'quarry') makeQuarry(group, stone, wood, dark);
  else if (type === 'market') makeMarket(group, wood, roof, palette.cloth);
  else if (type === 'well') makeWell(group, stone, wood, roof, dark);
  else if (type === 'storehouse') makeStorehouse(group, wood, dark, stone, roof, palette.plaster);
  else if (type === 'hunter') makeHunterCabin(group, wood, dark, stone, roof, palette.plaster);
  else if (type === 'fishery') makeFishery(group, wood, dark, stone, roof, palette.cloth);
  else if (type === 'stable') makeStable(group, wood, dark, stone, roof, palette.plaster);
  else makeTower(group, stone, roof, dark);
  return group;
}

function makeVillager(scene, index, palette) {
  const person = new THREE.Group();
  const tunic = palette.clothes[index % palette.clothes.length];
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.29, 0.52, 3, 7), tunic);
  torso.position.y = 0.94;
  torso.castShadow = true;
  person.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 9, 7), palette.skin);
  head.position.y = 1.62;
  head.castShadow = true;
  person.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.225, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), palette.dark);
  hair.position.y = 1.7; person.add(hair);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x34271f, roughness: 0.8 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 5), eyeMaterial);
    eye.position.set(side * 0.082, 1.64, 0.196); person.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 6), palette.skin);
  nose.position.set(0, 1.57, 0.225); person.add(nose);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 9, 6, 0, Math.PI * 2, 0, Math.PI * 0.48), palette.cloth);
  cap.position.set(0, 1.78, 0); person.add(cap);
  const capBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.055, 10), palette.cloth);
  capBrim.position.y = 1.73; person.add(capBrim);
  addBox(person, 0, 0.72, 0, 0.52, 0.09, 0.4, palette.dark);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.09, 0.035), material(0xc5a45c, 0.5, { metalness: 0.25 }));
  buckle.position.set(0, 0.72, 0.215); person.add(buckle);
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.22, 0.13), palette.wood);
  pouch.position.set(-0.31, 0.72, 0.04); person.add(pouch);
  const armL = addBox(person, -0.36, 1.1, 0, 0.16, 0.68, 0.18, tunic);
  const armR = addBox(person, 0.36, 1.1, 0, 0.16, 0.68, 0.18, tunic);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.095, 7, 6), palette.skin);
  handL.position.set(-0.37, 0.73, 0.02); person.add(handL);
  const handR = handL.clone(); handR.position.x = 0.37; person.add(handR);
  const cart = new THREE.Group();
  const cargoWood = material(0x795332);
  const wheelWood = material(0x463629);
  const wheelMetal = material(0x77776d, 0.62, { metalness: 0.35 });
  addBox(cart, 0, 0.47, -1.12, 0.98, 0.16, 1.25, cargoWood);
  for (const x of [-0.48, 0.48]) {
    addBox(cart, x, 0.72, -1.12, 0.12, 0.43, 1.24, cargoWood);
    addBox(cart, x * 0.72, 0.82, -0.42, 0.09, 0.09, 1.04, wheelWood);
  }
  for (const x of [-0.58, 0.58]) {
    const wheel = new THREE.Group();
    wheel.position.set(x, 0.32, -1.18);
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.13, 12), wheelWood);
    disk.rotation.z = Math.PI / 2;
    disk.castShadow = true;
    wheel.add(disk);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 6, 16), wheelMetal);
    rim.rotation.y = Math.PI / 2;
    rim.castShadow = true;
    wheel.add(rim);
    cart.add(wheel);
    cart.userData.wheels ||= [];
    cart.userData.wheels.push(wheel);
  }
  const cargo = new THREE.Group();
  const cargoCloth = material(0xb39a66);
  const cargoManure = material(0x725235);
  const cargoStone = material(0x858477);
  const cargoGold = material(0xc4a24d, 0.55, { metalness: 0.35 });
  addBox(cargo, 0, 0, 0, 0.42, 0.32, 0.34, cargoWood, false);
  const logs = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.82, 7), palette.trunk);
    log.rotation.z = Math.PI / 2;
    log.position.set(0, 0.12 + i * 0.18, (i - 0.5) * 0.09);
    log.castShadow = true;
    logs.add(log);
  }
  logs.visible = false;
  cargo.add(logs);
  for (const x of [-0.13, 0.13]) addBox(cargo, x, 0.17, 0.18, 0.035, 0.36, 0.035, cargoCloth, false);
  const sack = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), cargoCloth);
  sack.scale.set(1, 0.8, 0.86);
  sack.position.set(0, 0.1, 0);
  sack.visible = false;
  cargo.add(sack);
  const manureSack = new THREE.Mesh(new THREE.SphereGeometry(0.23, 8, 6), cargoManure);
  manureSack.scale.set(1, 0.78, 0.86);
  manureSack.position.set(0, 0.1, 0);
  manureSack.visible = false;
  cargo.add(manureSack);
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.23, 0), cargoStone);
  stone.position.y = 0.08;
  stone.visible = false;
  cargo.add(stone);
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.055, 12), cargoGold);
  coin.rotation.z = Math.PI / 2;
  coin.position.set(0, 0.1, 0);
  coin.visible = false;
  cargo.add(coin);
  cargo.position.set(0, 0.72, -1.12);
  cargo.visible = false;
  cart.add(cargo);
  cart.visible = false;
  person.add(cart);
  const legL = addBox(person, -0.14, 0.28, 0, 0.17, 0.56, 0.19, palette.dark);
  const legR = addBox(person, 0.14, 0.28, 0, 0.17, 0.56, 0.19, palette.dark);
  addBox(person, -0.14, 0.075, 0.08, 0.2, 0.16, 0.31, palette.dark);
  addBox(person, 0.14, 0.075, 0.08, 0.2, 0.16, 0.31, palette.dark);
  person.position.set((Math.random() - 0.5) * 12, terrainHeight(0, 0), (Math.random() - 0.5) * 10);
  person.userData = {
    index, phase: Math.random() * 6, speed: 1.25 + Math.random() * 0.45,
    target: new THREE.Vector3(), legL, legR, armL, armR, torso, cargo, cart,
    cartWheels: cart.userData.wheels || [],
    cargoParts: { sack, manureSack, stone, coin, logs }, working: false, state: 'wandering',
    workTimer: 0, wait: Math.random() * 5
  };
  scene.add(person);
  return person;
}

export function createWorld(root) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa3ad96);
  scene.fog = new THREE.FogExp2(0xa3ad96, 0.0039);
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1100);
  camera.position.set(31, 32, 39);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.85));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;
  renderer.domElement.setAttribute('aria-label', 'Vista 3D del reino de Valdemar');
  root.replaceChildren(renderer.domElement);

  const surface = createSurfaceMaterials(THREE);
  const palette = {
    wood: surface.wood, dark: material(0x38291f), stone: surface.stone,
    roof: surface.roof, plaster: surface.plaster, accent: material(0x45352c),
    trunk: surface.bark, leaves: [material(0x3d6038), material(0x506e3e), material(0x66804b), material(0x789054)],
    crop: material(0x637b3e), cropGold: material(0xb5a057), soil: material(0x715d3e),
    cloth: surface.cloth, skin: material(0xd1a17a),
    clothes: [material(0x8a4939), material(0x455d70), material(0x9a8048), material(0x68734a), material(0x784e6b), material(0x8a8b85)],
    deerCoat: material(0x876344), cowCoat: material(0xe3dfce), cowPatch: material(0x443f38),
    cowMuzzle: material(0xc49b91), cowHorn: material(0x514638)
  };
  scene.add(new THREE.HemisphereLight(0xe5ecd9, 0x4a503d, 1.65));
  const sun = new THREE.DirectionalLight(0xffe0b2, 2.55);
  sun.position.set(-35, 55, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -72;
  sun.shadow.camera.right = 72;
  sun.shadow.camera.top = 72;
  sun.shadow.camera.bottom = -72;
  sun.shadow.camera.far = 260;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.00025;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc2d3e4, 0.38);
  fill.position.set(26, 20, -30);
  scene.add(fill);


  const campfire = new THREE.Group();
  campfire.position.set(-1.8, terrainHeight(-1.8, 1.8), 1.8);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const stoneRing = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.24, 0),
      palette.stone
    );
    stoneRing.position.set(Math.cos(angle) * 0.82, 0.18, Math.sin(angle) * 0.82);
    stoneRing.scale.set(1.1, 0.72, 0.9);
    stoneRing.castShadow = true;
    campfire.add(stoneRing);
  }
  const firewoodA = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.15, 7), palette.trunk);
  firewoodA.rotation.z = Math.PI / 2;
  firewoodA.position.y = 0.28;
  campfire.add(firewoodA);
  const firewoodB = firewoodA.clone();
  firewoodB.rotation.x = Math.PI / 2;
  firewoodB.rotation.z = 0.12;
  campfire.add(firewoodB);
  const flameMaterial = new THREE.MeshStandardMaterial({
    color: 0xffa13c, emissive: 0xe85b18, emissiveIntensity: 1.8, roughness: 0.7
  });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.92, 7), flameMaterial);
  flame.position.y = 0.78;
  flame.castShadow = false;
  campfire.add(flame);
  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.19, 0.62, 6),
    new THREE.MeshBasicMaterial({ color: 0xffdf81 })
  );
  innerFlame.position.y = 0.7;
  campfire.add(innerFlame);
  const smokeMaterial = new THREE.MeshBasicMaterial({
    color: 0x77796e, transparent: true, opacity: 0.1, depthWrite: false
  });
  const smokePuffs = [];
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), smokeMaterial);
    puff.position.set((i - 1) * 0.12, 1.5 + i * 0.48, 0);
    puff.scale.set(1, 1.25, 1);
    campfire.add(puff);
    smokePuffs.push(puff);
  }
  scene.add(campfire);
  const fireLight = new THREE.PointLight(0xffa253, 0.8, 17, 2);
  fireLight.position.copy(campfire.position).add(new THREE.Vector3(0, 2.4, 0));
  scene.add(fireLight);

  const groundGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 220, 220);
  const ground = new THREE.Mesh(
    groundGeometry,
    surface.ground
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const positions = ground.geometry.attributes.position;
  const terrainColors = [];
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = -positions.getY(i);
    const height = terrainHeight(x, z);
    positions.setZ(i, height);
    const broad = Math.sin(x * 0.075 + z * 0.032) * 0.055;
    const fine = Math.sin(x * 0.31) * Math.cos(z * 0.27) * 0.035;
    const bank = Math.exp(-Math.pow((x - (18 + Math.sin(z * 0.042) * 3.8)) / 8.5, 2));
    const shade = 0.91 + broad + fine - bank * 0.06 + height * 0.045;
    terrainColors.push(0.36 * shade, 0.47 * shade, 0.27 * shade);
  }
  ground.geometry.setAttribute('color', new THREE.Float32BufferAttribute(terrainColors, 3));
  positions.needsUpdate = true;
  ground.geometry.computeVertexNormals();
  ground.name = 'terrain';
  scene.add(ground);

  const water = makeRiver(scene);

  const rainCount = 360;
  const rainPositions = new Float32Array(rainCount * 2 * 3);
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3).setUsage(THREE.DynamicDrawUsage));
  for (let i = 0; i < rainCount; i++) {
    const x = (Math.random() - 0.5) * 110;
    const y = 4 + Math.random() * 22;
    const z = (Math.random() - 0.5) * 110;
    const offset = i * 6;
    rainPositions[offset] = x;
    rainPositions[offset + 1] = y;
    rainPositions[offset + 2] = z;
    rainPositions[offset + 3] = x - 0.18;
    rainPositions[offset + 4] = y - 1.15;
    rainPositions[offset + 5] = z + 0.08;
  }
  const rain = new THREE.LineSegments(
    rainGeometry,
    new THREE.LineBasicMaterial({ color: 0xb7c9d2, transparent: true, opacity: 0.42, depthWrite: false })
  );
  rain.visible = false;
  rain.frustumCulled = false;
  scene.add(rain);

  const snowCount = 320;
  const snowPositions = new Float32Array(snowCount * 3);
  for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = (Math.random() - 0.5) * 105;
    snowPositions[i * 3 + 1] = Math.random() * 23;
    snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 105;
  }
  const snowGeometry = new THREE.BufferGeometry();
  snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3).setUsage(THREE.DynamicDrawUsage));
  const snow = new THREE.Points(
    snowGeometry,
    new THREE.PointsMaterial({ color: 0xe7eee9, size: 0.14, transparent: true, opacity: 0.82, sizeAttenuation: true, depthWrite: false })
  );
  snow.visible = false;
  snow.frustumCulled = false;
  scene.add(snow);

  const buildings = [];
  const roads = [];
  const roadPaths = [];
  const coreRoadPaths = [];
  const bridgeRoadPaths = new Set();
  const buildingRoads = new Map();
  const villagers = [];
  const caravanVisitors = [];
  let caravanVisible = false;
  const deer = [];
  const livestock = [];
  let livestockStableId = null;
  const stockyard = new THREE.Group();
  const deliveryCounts = { food: 0, wood: 0, stone: 0, gold: 0, manure: 0 };
  scene.add(stockyard);
  const ghost = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.16, 7),
    new THREE.MeshBasicMaterial({ color: 0x6ba56d, transparent: true, opacity: 0.45, depthWrite: false })
  );
  ghost.visible = false;
  ghost.renderOrder = 5;
  scene.add(ghost);

  const grassGeometry = new THREE.ConeGeometry(0.065, 0.42, 4);
  const grassMaterial = material(0x85964f, 1);
  const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, 9000);
  const grassDummy = new THREE.Object3D();
  let grassIndex = 0;
  for (let i = 0; i < 9000; i++) {
    const x = (Math.random() - 0.5) * 390;
    const z = (Math.random() - 0.5) * 390;
    const riverX = 18 + Math.sin(z * 0.042) * 3.8;
    if ((Math.abs(x) < 25 && Math.abs(z) < 25) || Math.abs(x - riverX) < 8.5) continue;
    grassDummy.position.set(x, terrainHeight(x, z) + 0.16, z);
    grassDummy.rotation.y = Math.random() * Math.PI;
    const scale = 0.55 + Math.random() * 0.9;
    grassDummy.scale.set(scale, scale, scale);
    grassDummy.updateMatrix();
    grass.setMatrixAt(grassIndex++, grassDummy.matrix);
  }
  grass.count = grassIndex;
  grass.instanceMatrix.needsUpdate = true;
  grass.castShadow = false;
  grass.receiveShadow = true;
  scene.add(grass);

  const treeLocations = [];
  const forestClusters = [
    [-125, -125], [-132, -35], [-124, 78], [-42, 143], [66, 147],
    [145, 115], [151, 14], [121, -112], [28, -151], [-87, -157],
    [-185, 104], [187, -72]
  ];
  for (const [cx, cz] of forestClusters) {
    const count = 74 + Math.floor(Math.random() * 22);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.sqrt(Math.random()) * 38;
      const x = cx + Math.cos(angle) * radius, z = cz + Math.sin(angle) * radius;
      const riverX = 18 + Math.sin(z * 0.042) * 3.8;
      if (Math.abs(x) > 198 || Math.abs(z) > 198) continue;
      if ((Math.abs(x) < 34 && Math.abs(z) < 34) || Math.abs(x - riverX) < 10) continue;
      treeLocations.push({ x, z, scale: 0.78 + Math.random() * 0.8, yaw: Math.random() * Math.PI * 2 });
    }
  }
  for (let i = 0; i < 240; i++) {
    const x = (Math.random() - 0.5) * 390, z = (Math.random() - 0.5) * 390;
    const riverX = 18 + Math.sin(z * 0.042) * 3.8;
    if ((Math.abs(x) < 35 && Math.abs(z) < 35) || Math.abs(x - riverX) < 10) continue;
    treeLocations.push({ x, z, scale: 0.68 + Math.random() * 0.72, yaw: Math.random() * Math.PI * 2 });
  }
  const treeTrunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.28, 2.1, 7), palette.trunk, treeLocations.length
  );
  const crownLayers = [0, 1, 2].map((layer) => new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.25 - layer * 0.2, 2.15, 7),
    palette.leaves[layer], treeLocations.length
  ));
  const treeDummy = new THREE.Object3D();
  treeLocations.forEach((tree, index) => {
    const baseY = terrainHeight(tree.x, tree.z);
    treeDummy.position.set(tree.x, baseY + 1.05 * tree.scale, tree.z);
    treeDummy.rotation.set(0, tree.yaw, (Math.random() - 0.5) * 0.12);
    treeDummy.scale.setScalar(tree.scale);
    treeDummy.updateMatrix();
    treeTrunks.setMatrixAt(index, treeDummy.matrix);
    crownLayers.forEach((crown, layer) => {
      treeDummy.position.set(
        tree.x + (Math.random() - 0.5) * 0.35 * tree.scale,
        baseY + (2.25 + layer * 0.78) * tree.scale,
        tree.z + (Math.random() - 0.5) * 0.35 * tree.scale
      );
      treeDummy.rotation.set(0, tree.yaw + Math.random() * Math.PI, 0);
      treeDummy.scale.setScalar(tree.scale);
      treeDummy.updateMatrix();
      crown.setMatrixAt(index, treeDummy.matrix);
    });
  });
  treeTrunks.castShadow = true;
  treeTrunks.receiveShadow = true;
  scene.add(treeTrunks);
  crownLayers.forEach((crown) => {
    crown.castShadow = true; crown.receiveShadow = true; scene.add(crown);
  });
  const forestTrees = treeLocations.map((tree, index) => ({ ...tree, index, available: true, regrowAt: 0, reservedBy: null }));
  const stumps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.26, 0.34, 8), palette.trunk, forestTrees.length);
  stumps.castShadow = true; stumps.receiveShadow = true; stumps.frustumCulled = false;
  const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < forestTrees.length; i++) stumps.setMatrixAt(i, zeroMatrix);
  stumps.count = forestTrees.length;
  scene.add(stumps);
  function setTreeVisual(index, alive) {
    const tree = forestTrees[index]; if (!tree) return;
    treeDummy.position.set(tree.x, terrainHeight(tree.x, tree.z) + (alive ? 1.05 : 0.16), tree.z);
    treeDummy.rotation.set(0, tree.yaw, 0); treeDummy.scale.set(tree.scale, alive ? tree.scale : 0.16, tree.scale);
    treeDummy.updateMatrix(); treeTrunks.setMatrixAt(index, treeDummy.matrix);
    crownLayers.forEach((crown, layer) => {
      treeDummy.position.set(tree.x, terrainHeight(tree.x, tree.z) + (2.25 + layer * 0.78) * tree.scale, tree.z);
      treeDummy.rotation.set(0, tree.yaw + layer * 1.8, 0); treeDummy.scale.setScalar(alive ? tree.scale : 0);
      treeDummy.updateMatrix(); crown.setMatrixAt(index, treeDummy.matrix);
    });
    if (!alive) {
      treeDummy.position.set(tree.x, terrainHeight(tree.x, tree.z) + 0.16, tree.z);
      treeDummy.rotation.set(0, tree.yaw, 0); treeDummy.scale.set(tree.scale, 1, tree.scale);
      treeDummy.updateMatrix(); stumps.setMatrixAt(index, treeDummy.matrix);
    } else {
      treeDummy.scale.set(0, 0, 0); treeDummy.updateMatrix(); stumps.setMatrixAt(index, treeDummy.matrix);
    }
    stumps.instanceMatrix.needsUpdate = true; treeTrunks.instanceMatrix.needsUpdate = true;
    crownLayers.forEach((crown) => { crown.instanceMatrix.needsUpdate = true; });
  }
  function findForestTree(person, origin) {
    let best = null, bestScore = Infinity;
    for (const tree of forestTrees) {
      if (!tree.available || (tree.reservedBy !== null && tree.reservedBy !== person.userData.index)) continue;
      const distance = Math.hypot(tree.x - origin.x, tree.z - origin.z);
      if (distance > 175) continue;
      const score = distance + ((tree.index + person.userData.index * 7) % 11) * 0.035;
      if (score < bestScore) { best = tree; bestScore = score; }
    }
    if (best) best.reservedBy = person.userData.index;
    return best;
  }
  function assignForestTarget(person) {
    const p = person.userData;
    if (p.treeIndex !== null && p.treeIndex !== undefined) {
      const previous = forestTrees[p.treeIndex];
      if (previous?.reservedBy === p.index) previous.reservedBy = null;
    }
    const tree = findForestTree(person, person.position); if (!tree) return false;
    p.treeIndex = tree.index; p.workTarget.set(tree.x, 0, tree.z); return true;
  }
  function harvestForestTree(index, elapsed) {
    const tree = forestTrees[index]; if (!tree || !tree.available) return false;
    tree.available = false; tree.reservedBy = null; tree.regrowAt = elapsed + 150 + (index % 5) * 18;
    setTreeVisual(index, false); return true;
  }

  const bushMatrices = [];
  for (let i = 0; i < 460; i++) {
    const x = (Math.random() - 0.5) * 390;
    const z = (Math.random() - 0.5) * 390;
    if ((Math.abs(x) < 24 && Math.abs(z) < 24) || Math.abs(x - (18 + Math.sin(z * 0.042) * 3.8)) < 9) continue;
    const scale = 0.7 + Math.random() * 0.65;
    for (let puff = 0; puff < 4; puff++) {
      bushMatrices.push({
        x: x + (Math.random() - 0.5) * 0.75 * scale,
        y: terrainHeight(x, z) + 0.35 * scale + Math.random() * 0.2,
        z: z + (Math.random() - 0.5) * 0.7 * scale,
        scale: scale * (0.72 + Math.random() * 0.35)
      });
    }
  }
  const bushes = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.45, 1), palette.leaves[1], bushMatrices.length
  );
  bushMatrices.forEach((bush, index) => {
    treeDummy.position.set(bush.x, bush.y, bush.z);
    treeDummy.rotation.set(0, Math.random() * Math.PI, 0);
    treeDummy.scale.set(bush.scale, bush.scale * 0.78, bush.scale);
    treeDummy.updateMatrix();
    bushes.setMatrixAt(index, treeDummy.matrix);
  });
  bushes.castShadow = true;
  bushes.receiveShadow = true;
  scene.add(bushes);

  const rockLocations = [];
  for (let i = 0; i < 270; i++) {
    const x = (Math.random() - 0.5) * 390;
    const z = (Math.random() - 0.5) * 390;
    if ((Math.abs(x) < 23 && Math.abs(z) < 23) || Math.abs(x - (18 + Math.sin(z * 0.042) * 3.8)) < 8) continue;
    rockLocations.push({ x, z, scale: 0.3 + Math.random() * 0.7 });
  }
  const rocks = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0), palette.stone, rockLocations.length
  );
  rockLocations.forEach((rock, index) => {
    treeDummy.position.set(rock.x, terrainHeight(rock.x, rock.z) + rock.scale * 0.38, rock.z);
    treeDummy.rotation.set(Math.random(), Math.random() * 2, Math.random());
    treeDummy.scale.set(1.25 * rock.scale, 0.72 * rock.scale, 0.9 * rock.scale);
    treeDummy.updateMatrix();
    rocks.setMatrixAt(index, treeDummy.matrix);
  });
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  scene.add(rocks);
  const herds = [[-45, -38], [-52, 35], [4, 48], [-34, 63], [-150, -80], [145, 75], [82, -165], [-170, 155]];
  herds.forEach(([x, z], herdIndex) => {
    for (let i = 0; i < 2; i++) deer.push(makeDeer(scene, herdIndex * 2 + i, x, z, palette));
  });

  const neighboringRealms = [
    { name: 'Liria', x: -151, z: -142, color: 0x9c493a },
    { name: 'Arvendel', x: 151, z: -142, color: 0x456e78 },
    { name: 'Monteluz', x: 153, z: 148, color: 0x9d8547 },
    { name: 'Rocabruna', x: -151, z: 148, color: 0x657b4b }
  ];
  for (const [realmIndex, realm] of neighboringRealms.entries()) {
    const settlement = new THREE.Group();
    settlement.position.set(realm.x, terrainHeight(realm.x, realm.z), realm.z);
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + realmIndex * 0.35;
      const radius = 12 + (i % 3) * 3;
      const house = makeBuildingMesh('house', palette);
      house.scale.setScalar(0.68 + (i % 2) * 0.08);
      house.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      house.rotation.y = -angle + Math.PI * 0.5;
      settlement.add(house);
    }
    const keep = makeBuildingMesh('tower', palette); keep.scale.setScalar(0.78); settlement.add(keep);
    for (const side of [-1, 1]) {
      addCylinder(settlement, side * 2.4, 6.2, 0, 0.055, 0.07, 12.4, palette.dark, 6).castShadow = false;
      const banner = addBox(settlement, side * 2.4 + 0.75, 10.7, 0, 1.45, 2.1, 0.08, material(realm.color, 0.9));
      banner.castShadow = false; banner.rotation.z = -0.05;
    }
    const approach = [[realm.x, realm.z + 20], [realm.x + 5, realm.z + 29], [realm.x + 2, realm.z + 39], [realm.x + 13, realm.z + 48]];
    const road = makeRoad(scene, approach, 2.3); road.material = surface.road;
    roadPaths.push(approach); scene.add(settlement);
    const labelCanvas = document.createElement('canvas'); labelCanvas.width = 512; labelCanvas.height = 128;
    const ctx = labelCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(18,25,19,0.72)'; ctx.fillRect(0, 12, 512, 104);
    ctx.strokeStyle = '#d0b77a'; ctx.lineWidth = 4; ctx.strokeRect(4, 14, 504, 100);
    ctx.fillStyle = '#f1e5c7'; ctx.font = 'bold 48px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(realm.name.toUpperCase(), 256, 64);
    const labelTexture = new THREE.CanvasTexture(labelCanvas); labelTexture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthWrite: false }));
    label.position.set(realm.x, terrainHeight(realm.x, realm.z) + 17, realm.z);
    label.scale.set(25, 6.25, 1); scene.add(label);
  }

  const roadMat = surface.road;
  const villageRoads = [
    { points: [[-8, -16], [-6, -12], [-3, -10], [0, -8], [4, -5]], width: 2.7 },
    { points: [[-3, -9], [-6, -5], [-5, 1], [-4, 7]], width: 2.25 },
    { points: [[-7, -13], [-11, -11], [-15, -8], [-17, -3], [-19, 5]], width: 2.35 },
    { points: [[-12, -5], [-18, 0], [-24, 6], [-30, 12], [-34, 16]], width: 1.9 },
    { points: [[-11, -11], [-16, -12], [-22, -13], [-29, -14]], width: 1.65 }
  ];
  villageRoads.forEach(({ points, width }) => {
    const road = makeRoad(scene, points, width);
    road.material = roadMat;
    roads.push(road);
    roadPaths.push(points);
    coreRoadPaths.push(points);
  });

  // A timber bridge gives both banks a connected pedestrian and cart route.
  const westRamp = [[4, -5], [7, -6], [10, -8]];
  const bridgeRoute = [[10, -8], [12.8, -8], [16.8, -8], [20.8, -8], [24, -8]];
  const eastRoad = [[24, -8], [29, -6], [35, -3], [42, 1], [49, 7]];
  const westRampMesh = makeRoad(scene, westRamp, 2.7, 0.045);
  westRampMesh.material = roadMat;
  roads.push(westRampMesh);
  roadPaths.push(westRamp);
  coreRoadPaths.push(westRamp);

  const bridgeOffset = (x, z) => {
    const riverX = 18 + Math.sin(z * 0.042) * 3.8;
    const distance = (x - riverX) / 5.2;
    return 0.16 + Math.exp(-(distance * distance)) * 0.68;
  };
  const bridgeMesh = makeRoad(scene, bridgeRoute, 3.7, bridgeOffset);
  bridgeMesh.material = material(0x76563a, 0.92);
  bridgeMesh.receiveShadow = true;
  roads.push(bridgeMesh);
  roadPaths.push(bridgeRoute);
  coreRoadPaths.push(bridgeRoute);
  bridgeRoadPaths.add(bridgeRoute);

  const bridgeDetails = new THREE.Group();
  const bridgePlank = material(0x806044);
  const bridgeDark = material(0x493526);
  const riverCenter = 18 + Math.sin(-8 * 0.042) * 3.8;
  for (let x = 10.2; x <= 24.1; x += 0.58) {
    addBox(bridgeDetails, x, 0.62, -8, 0.54, 0.16, 3.65, bridgePlank, true);
  }
  for (const side of [-1, 1]) {
    for (let x = 10.5; x <= 24; x += 2.25) {
      addBox(bridgeDetails, x, 1.05, -8 + side * 1.7, 0.18, 0.92, 0.18, bridgeDark, true);
    }
    addBox(bridgeDetails, 17.1, 1.46, -8 + side * 1.7, 13.6, 0.17, 0.18, bridgePlank, true);
    addBox(bridgeDetails, 17.1, 0.86, -8 + side * 1.7, 13.6, 0.14, 0.14, bridgeDark, true);
  }
  for (const x of [13.2, riverCenter, 20.4]) {
    const pier = addCylinder(bridgeDetails, x, -0.12, -8, 0.26, 0.34, 1.5, bridgeDark, 7);
    pier.position.y = -0.12;
    for (const side of [-1, 1]) {
      addBox(bridgeDetails, x, 0.38, -8 + side * 0.92, 0.22, 0.22, 1.7, bridgeDark, true);
    }
  }
  scene.add(bridgeDetails);

  const eastRoadMesh = makeRoad(scene, eastRoad, 2.3, 0.045);
  eastRoadMesh.material = roadMat;
  roads.push(eastRoadMesh);
  roadPaths.push(eastRoad);
  coreRoadPaths.push(eastRoad);

  function emptyStockyard() {
    stockyard.traverse((child) => {
      if (child === stockyard) return;
      child.geometry?.dispose?.();
      if (child.userData.ownsMaterial) child.material?.dispose?.();
    });
    stockyard.clear();
  }

  function positionStockyard(data) {
    const savedCounts = { ...deliveryCounts };
    emptyStockyard();
    stockyard.position.set(data.x + 5.1, terrainHeight(data.x + 5.1, data.z + 2.5), data.z + 2.5);
    for (const key of Object.keys(deliveryCounts)) deliveryCounts[key] = 0;
    addBox(stockyard, 0, 0.08, 0, 6.8, 0.16, 5.8, material(0x786143), false);
    addBox(stockyard, -0.05, 0.18, -2.55, 6.5, 0.12, 0.12, material(0x493a29), false);
    addBox(stockyard, -0.05, 0.18, 2.55, 6.5, 0.12, 0.12, material(0x493a29), false);
    addBox(stockyard, -3.3, 0.18, 0, 0.12, 0.12, 5.1, material(0x493a29), false);
    addBox(stockyard, 3.2, 0.18, 0, 0.12, 0.12, 5.1, material(0x493a29), false);
    setDeliveryCounts(savedCounts);
  }

  function addDeliveredResource(kind) {
    const count = deliveryCounts[kind]++;
    if (count >= 28) return;
    const column = count % 4;
    const row = Math.floor(count / 4);
    const zoneX = kind === 'food' || kind === 'stone' ? -1.65 : 1.65;
    const zoneZ = kind === 'food' || kind === 'wood' ? -1.25 : 1.25;
    const x = zoneX + (column - 1.5) * 0.7;
    const z = zoneZ + (row - 3) * 0.36;
    let item;
    if (kind === 'wood') {
      item = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.85, 7), palette.trunk);
      item.rotation.z = Math.PI / 2;
      item.position.set(x, 0.34 + (row % 2) * 0.22, z);
    } else if (kind === 'stone') {
      item = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), palette.stone);
      item.scale.set(1.2, 0.85, 1);
      item.position.set(x, 0.4, z);
    } else if (kind === 'gold') {
      item = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.07, 12), material(0xc6a24f, 0.55, { metalness: 0.4 }));
      item.position.set(x, 0.3 + (row % 2) * 0.12, z);
    } else if (kind === 'manure') {
      item = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), material(0x62482f));
      item.scale.set(1.25, 0.62, 1);
      item.position.set(x, 0.27, z);
    } else {
      item = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), material(0xb79b66));
      item.scale.set(1.15, 0.8, 0.95);
      item.position.set(x, 0.38, z);
    }
    item.castShadow = true;
    item.receiveShadow = true;
    item.userData.stockItem = true;
    item.userData.ownsMaterial = kind === 'food' || kind === 'gold' || kind === 'manure';
    stockyard.add(item);
  }

  function setLivestock(count) {
    const stableGroup = buildings.find((group) => group.userData.buildingData?.kind === 'stable');
    const stable = stableGroup?.userData.buildingData;
    const stableId = stable ? stable.id : null;
    const amount = Math.max(0, Math.min(12, Math.floor(Number(count) || 0)));
    if (stableId === livestockStableId && amount === livestock.length) return;
    while (livestock.length) {
      const animal = livestock.pop();
      scene.remove(animal);
      animal.traverse((child) => child.geometry?.dispose?.());
    }
    livestockStableId = stableId;
    if (!stable) return;
    const angle = stable.rotation || 0;
    for (let i = 0; i < amount; i++) {
      const localX = (i % 3 - 1) * 2.2;
      const localZ = 5.1 + Math.floor(i / 3) * 1.15;
      const x = stable.x + localX * Math.cos(angle) + localZ * Math.sin(angle);
      const z = stable.z - localX * Math.sin(angle) + localZ * Math.cos(angle);
      livestock.push(makeCow(scene, i, x, z, palette));
    }
  }

  function setDeliveryCounts(counts = {}) {
    [...stockyard.children].forEach((child) => {
      if (!child.userData.stockItem) return;
      stockyard.remove(child);
      child.geometry?.dispose?.();
      if (child.userData.ownsMaterial) child.material?.dispose?.();
    });
    for (const key of Object.keys(deliveryCounts)) {
      deliveryCounts[key] = 0;
      const amount = Math.max(0, Math.min(28, Math.floor(Number(counts[key]) || 0)));
      for (let i = 0; i < amount; i++) addDeliveredResource(key);
    }
  }

  function addBuilding(data) {
    const group = makeBuildingMesh(data.kind, palette);
    group.position.set(data.x, terrainHeight(data.x, data.z), data.z);
    if (data.kind === 'storehouse' && !buildings.some((item) => item.userData.buildingData?.kind === 'storehouse')) {
      positionStockyard(data);
    }
    group.rotation.y = data.rotation || 0;
    group.userData.isBuilding = true;
    group.userData.buildingData = { ...data };
    group.name = data.kind + '-' + data.id;
    scene.add(group);
    buildings.push(group);
    connectBuildingToRoad(data);
    return group;
  }

  function removeBuilding(group) {
    const index = buildings.indexOf(group);
    if (index >= 0) buildings.splice(index, 1);
    scene.remove(group);
    const wasStorehouse = group.userData.buildingData?.kind === 'storehouse';
    group.traverse((child) => child.geometry?.dispose?.());
    const linkedRoad = buildingRoads.get(group.userData.buildingData?.id);
    if (linkedRoad) {
      scene.remove(linkedRoad.road);
      linkedRoad.road.geometry.dispose();
      const roadIndex = roads.indexOf(linkedRoad.road);
      if (roadIndex >= 0) roads.splice(roadIndex, 1);
      const pathIndex = roadPaths.indexOf(linkedRoad.route);
      if (pathIndex >= 0) roadPaths.splice(pathIndex, 1);
      buildingRoads.delete(group.userData.buildingData.id);
    }
    if (wasStorehouse) {
      const replacement = buildings.find((item) => item.userData.buildingData?.kind === 'storehouse');
      if (replacement) positionStockyard(replacement.userData.buildingData);
      else {
        emptyStockyard();
        for (const key of Object.keys(deliveryCounts)) deliveryCounts[key] = 0;
      }
    }
  }

  function clearBuildings() {
    [...buildings].forEach(removeBuilding);
    while (livestock.length) {
      const animal = livestock.pop();
      scene.remove(animal);
      animal.traverse((child) => child.geometry?.dispose?.());
    }
    livestockStableId = null;
    emptyStockyard();
    for (const key of Object.keys(deliveryCounts)) deliveryCounts[key] = 0;
  }

  function addRoadPath(points, width = 1.8, heightOffset = 0.045, isBridge = false) {
    const road = makeRoad(scene, points, width, heightOffset);
    road.material = roadMat;
    roads.push(road);
    roadPaths.push(points);
    if (isBridge) bridgeRoadPaths.add(points);
    return road;
  }


  function roadBankSide(x, z) {
    const riverX = 18 + Math.sin(z * 0.042) * 3.8;
    return Math.sign(x - riverX);
  }

  function findRoadRoute(start, destination) {
    const direct = [destination.clone()];
    if (!roadPaths.length) return direct;

    const nodes = [];
    const nodeLookup = new Map();
    const getNode = (x, z) => {
      const key = Math.round(x * 10) + ':' + Math.round(z * 10);
      if (nodeLookup.has(key)) return nodeLookup.get(key);
      const node = { x, z, bank: roadBankSide(x, z), edges: [] };
      const index = nodes.push(node) - 1;
      nodeLookup.set(key, index);
      return index;
    };
    const link = (a, b, allowCrossBank = false) => {
      if (a === b) return;
      const A = nodes[a];
      const B = nodes[b];
      if (!A || !B || (!allowCrossBank && A.bank !== B.bank)) return;
      const cost = Math.hypot(A.x - B.x, A.z - B.z);
      if (cost < 0.05 || A.edges.some((edge) => edge.to === b)) return;
      A.edges.push({ to: b, cost });
      B.edges.push({ to: a, cost });
    };

    roadPaths.forEach((path) => {
      const sequence = path.map(([x, z]) => getNode(x, z));
      for (let i = 0; i < sequence.length - 1; i++) {
        link(sequence[i], sequence[i + 1], bridgeRoadPaths.has(path));
      }
    });

    // Join road branches whose endpoints or crossings nearly touch.
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (a.bank !== b.bank) continue;
        if (Math.hypot(a.x - b.x, a.z - b.z) <= 4.8) link(i, j);
      }
    }

    const nearestNode = (point) => {
      let best = -1;
      let bestDistance = Infinity;
      const bank = roadBankSide(point.x, point.z);
      nodes.forEach((node, index) => {
        if (node.bank !== bank) return;
        const distance = (node.x - point.x) ** 2 + (node.z - point.z) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      return bestDistance <= 30 * 30 ? best : -1;
    };

    const startNode = nearestNode(start);
    const endNode = nearestNode(destination);
    if (startNode < 0 || endNode < 0) return direct;
    if (startNode === endNode) return direct;

    const distances = new Array(nodes.length).fill(Infinity);
    const previous = new Array(nodes.length).fill(-1);
    const visited = new Uint8Array(nodes.length);
    distances[startNode] = 0;

    for (let pass = 0; pass < nodes.length; pass++) {
      let current = -1;
      let bestDistance = Infinity;
      for (let i = 0; i < nodes.length; i++) {
        if (!visited[i] && distances[i] < bestDistance) {
          bestDistance = distances[i];
          current = i;
        }
      }
      if (current < 0 || current === endNode) break;
      visited[current] = 1;
      nodes[current].edges.forEach(({ to, cost }) => {
        const candidate = distances[current] + cost;
        if (candidate < distances[to]) {
          distances[to] = candidate;
          previous[to] = current;
        }
      });
    }

    if (!Number.isFinite(distances[endNode])) return direct;
    const indices = [];
    for (let cursor = endNode; cursor >= 0; cursor = previous[cursor]) {
      indices.push(cursor);
      if (cursor === startNode) break;
    }
    if (indices[indices.length - 1] !== startNode) return direct;
    indices.reverse();

    const route = [];
    indices.forEach((index, position) => {
      const node = nodes[index];
      const point = new THREE.Vector3(node.x, 0, node.z);
      // Include the road access node unless the worker is already standing on it.
      if (position === 0 && point.distanceTo(start) <= 1.15) return;
      if (!route.length || route[route.length - 1].distanceTo(point) > 1.15) route.push(point);
    });
    if (!route.length || route[route.length - 1].distanceTo(destination) > 0.7) route.push(destination.clone());
    else route[route.length - 1].copy(destination);
    return route.length ? route : direct;
  }

  function assignTravelRoute(person, destination) {
    const p = person.userData;
    const start = new THREE.Vector3(person.position.x, 0, person.position.z);
    p.route = findRoadRoute(start, destination);
    p.routeIndex = 0;
    p.routeUsesRoad = p.route.length > 1;
    p.target.copy(p.route[0] || destination);
  }

  function connectBuildingToRoad(data) {
    if (data.permanent || data.kind === 'fishery' || roadPaths.length === 0) return;
    const angle = Number(data.rotation) || 0;
    const entranceX = data.x + Math.sin(angle) * 3.1;
    const entranceZ = data.z + Math.cos(angle) * 3.1;
    const entranceRiverX = 18 + Math.sin(entranceZ * 0.042) * 3.8;
    const bankSide = Math.sign(entranceX - entranceRiverX);
    let best = null;

    coreRoadPaths.forEach((path) => {
      for (let i = 0; i < path.length - 1; i++) {
        const [ax, az] = path[i];
        const [bx, bz] = path[i + 1];
        const vx = bx - ax;
        const vz = bz - az;
        const lengthSq = vx * vx + vz * vz || 1;
        const t = THREE.MathUtils.clamp(((entranceX - ax) * vx + (entranceZ - az) * vz) / lengthSq, 0, 1);
        const px = ax + vx * t;
        const pz = az + vz * t;
        const riverAtPoint = 18 + Math.sin(pz * 0.042) * 3.8;
        if (bankSide !== 0 && Math.sign(px - riverAtPoint) !== bankSide) continue;
        const distanceSq = (entranceX - px) ** 2 + (entranceZ - pz) ** 2;
        if (!best || distanceSq < best.distanceSq) best = { x: px, z: pz, distanceSq };
      }
    });

    // Avoid drawing implausibly long roads across open country or across the river.
    if (!best || best.distanceSq > 34 * 34) return;
    const distance = Math.sqrt(best.distanceSq) || 1;
    const bend = Math.min(3.2, distance * 0.13);
    const midX = (best.x + entranceX) * 0.5 - ((entranceZ - best.z) / distance) * bend;
    const midZ = (best.z + entranceZ) * 0.5 + ((entranceX - best.x) / distance) * bend;
    const route = [[best.x, best.z], [midX, midZ], [entranceX, entranceZ]];
    const road = addRoadPath(route, 1.35);
    road.userData.connectedBuildingId = data.id;
    buildingRoads.set(data.id, { road, route });
  }

  function setPopulation(count, resetPositions = false) {
    while (villagers.length < count) villagers.push(makeVillager(scene, villagers.length, palette));
    while (villagers.length > count) {
      const person = villagers.pop();
      scene.remove(person);
      person.traverse((child) => child.geometry?.dispose?.());
    }
    if (resetPositions) {
      villagers.forEach((person) => {
        const x = (Math.random() - 0.5) * 12;
        const z = (Math.random() - 0.5) * 10;
        person.position.set(x, terrainHeight(x, z), z);
        person.rotation.set(0, Math.random() * Math.PI * 2, 0);
        const p = person.userData;
        p.working = false;
        p.jobBuilding = null;
        p.route = null;
        p.routeIndex = 0;
        p.routeUsesRoad = false;
        p.state = 'wandering';
        p.wait = Math.random() * 2;
        p.cargo.visible = false;
        p.cart.visible = false;
      });
    }
  }

  function setCaravan(caravan) {
    const visible = Boolean(caravan && Number(caravan.daysLeft) > 0);
    if (visible && caravanVisitors.length === 0) {
      for (let index = 0; index < 2; index++) {
        const visitor = makeVillager(scene, 70 + index, palette);
        const p = visitor.userData;
        p.working = false;
        p.state = 'wandering';
        p.cart.visible = true;
        p.cargo.visible = true;
        p.cargoParts.sack.visible = true;
        p.wait = 999;
        caravanVisitors.push(visitor);
      }
    }
    caravanVisible = visible;
    caravanVisitors.forEach((visitor, index) => {
      visitor.visible = visible;
      if (!visible) return;
      const x = index === 0 ? -2.8 : 1.4;
      const z = -22.8 - index * 1.35;
      visitor.position.set(x, terrainHeight(x, z), z);
      visitor.rotation.y = index === 0 ? 0.12 : -0.16;
      const p = visitor.userData;
      p.phase = index * 1.7;
      p.cart.visible = true;
      p.cargo.visible = true;
      p.cargoParts.sack.visible = true;
    });
  }

  function setJobs(data) {
    const assignments = [];
    data.forEach((building) => {
      for (let i = 0; i < Math.max(0, Number(building.workers) || 0); i++) assignments.push(building);
    });
    const depot = data.find((building) => building.kind === 'storehouse') || data[0] || { x: 0, z: 0 };
    if (!stockyard.children.length && data.some((building) => building.kind === 'storehouse')) {
      positionStockyard(depot);
    }
    villagers.forEach((person, index) => {
      const p = person.userData;
      const job = assignments[index];
      if (p.working === Boolean(job) && p.jobBuilding?.id === job?.id) return;
      if (p.treeIndex !== null && p.treeIndex !== undefined) {
        const previousTree = forestTrees[p.treeIndex];
        if (previousTree?.reservedBy === p.index) previousTree.reservedBy = null;
      }
      p.treeIndex = null;
      p.working = Boolean(job);
      p.jobBuilding = job || null;
      p.state = job ? 'toWork' : 'wandering';
      p.route = null;
      p.routeIndex = 0;
      p.routeUsesRoad = false;
      p.cargo.visible = false;
      p.cart.visible = false;
      if (job) {
        p.cargoType = job.kind === 'farm' ? 'food'
          : job.kind === 'sawmill' ? 'wood'
          : job.kind === 'quarry' ? 'stone'
          : job.kind === 'market' ? 'gold'
          : job.kind === 'stable' ? 'manure' : 'food';
        p.storageTarget = new THREE.Vector3(depot.x + 5.1, 0, depot.z + 2.5);
        if (job.kind === 'fishery') {
          const riverX = 18 + Math.sin(job.z * 0.042) * 3.8;
          p.workTarget = new THREE.Vector3(
            job.x + Math.sign(riverX - job.x) * 3.1,
            0,
            job.z + (index % 2 - 0.5) * 1.25
          );
        } else if (job.kind === 'sawmill' && assignForestTarget(person)) {
          // Lumberjacks travel to an actual standing tree in the forest.
        } else {
          p.workTarget = new THREE.Vector3(
            job.x + (index % 3 - 1) * 1.35, 0,
            job.z + 3.3 + Math.floor(index / 3) * 0.85
          );
        }
        assignTravelRoute(person, p.workTarget);
        p.workTimer = 1.6 + (index % 4) * 0.48;
      } else {
        p.wait = Math.random() * 3;
      }
    });
  }

  function update(dt, elapsed, dayProgress = 0.35, season = 'Primavera', weather = 'Despejado', wildlife = 100) {
    forestTrees.forEach((tree, index) => {
      if (!tree.available && elapsed >= tree.regrowAt) {
        tree.available = true; tree.reservedBy = null; setTreeVisual(index, true);
      }
    });
    const stormy = weather === 'Tormenta';
    const rainy = weather === 'Lluvia' || stormy;
    const snowy = weather === 'Nieve';
    const dry = weather === 'Sequía';
    const overcast = weather === 'Nublado' || rainy || snowy;
    const overcastStrength = stormy ? 0.55 : rainy ? 0.38 : snowy ? 0.43 : overcast ? 0.29 : 0;
    const lightning = stormy ? Math.pow(Math.max(0, Math.sin(elapsed * 1.85 + 0.7)), 28) : 0;
    water.material.opacity = (rainy ? 0.93 : 0.86) + Math.sin(elapsed * 0.8) * 0.035;
    water.position.y = Math.sin(elapsed * 0.48) * 0.025;
    const angle = dayProgress * Math.PI * 2;
    const seasonalGround = { Primavera: 0xf4f5e7, Verano: 0xf1f0dc, Otoño: 0xf1e7d2, Invierno: 0xe7ecea };
    ground.material.color.setHex(seasonalGround[season] || seasonalGround.Primavera);
    if (snowy) ground.material.color.lerp(new THREE.Color(0xcbd3cc), 0.38);
    else if (dry) ground.material.color.lerp(new THREE.Color(0xb49a5e), 0.24);
    ground.material.roughness = stormy ? 0.64 : rainy ? 0.76 : 1;
    sun.position.set(Math.cos(angle) * 42 - 4, Math.sin(angle) * 38 + 18, 22);
    sun.intensity = (0.72 + Math.max(0, Math.sin(angle)) * 2.25) * (1 - overcastStrength) + lightning * 4.8;
    fill.intensity = 0.38 + lightning * 1.5;
    const night = Math.max(0, -Math.sin(angle));
    rain.material.opacity = stormy ? 0.68 : 0.42;

    rain.visible = rainy;
    if (rainy && dt > 0) {
      const positions = rain.geometry.attributes.position;
      for (let i = 0; i < rainCount; i++) {
        const offset = i * 6;
        const x = positions.array[offset];
        let y = positions.array[offset + 1] - dt * (stormy ? 31 : 22);
        let z = positions.array[offset + 2] + dt * (stormy ? 4.6 : 1.9);
        if (y < -1) {
          y = 15 + Math.random() * 13;
          positions.array[offset] = (Math.random() - 0.5) * 110;
          positions.array[offset + 2] = (Math.random() - 0.5) * 110;
          positions.array[offset + 3] = positions.array[offset] - 0.18;
          positions.array[offset + 5] = positions.array[offset + 2] + 0.08;
        }
        positions.array[offset + 1] = y;
        positions.array[offset + 4] = y - (stormy ? 1.8 : 1.15);
        positions.array[offset + 2] = z;
        positions.array[offset + 5] = z + (stormy ? 0.2 : 0.08);
      }
      positions.needsUpdate = true;
    }

    snow.visible = snowy;
    if (snowy && dt > 0) {
      const positions = snow.geometry.attributes.position;
      for (let i = 0; i < snowCount; i++) {
        const index = i * 3;
        positions.array[index] += Math.sin(elapsed * 0.6 + i * 0.23) * dt * 0.34;
        positions.array[index + 1] -= dt * (1.15 + (i % 7) * 0.09);
        positions.array[index + 2] += dt * 0.18;
        if (positions.array[index + 1] < 0) {
          positions.array[index] = (Math.random() - 0.5) * 105;
          positions.array[index + 1] = 18 + Math.random() * 8;
          positions.array[index + 2] = (Math.random() - 0.5) * 105;
        }
      }
      positions.needsUpdate = true;
    }
    flame.scale.set(0.88 + Math.sin(elapsed * 8.2) * 0.08, 0.86 + Math.sin(elapsed * 11.3) * 0.18, 0.88 + Math.cos(elapsed * 7.5) * 0.08);
    innerFlame.scale.y = 0.84 + Math.sin(elapsed * 13.1) * 0.16;
    flame.rotation.y = elapsed * 0.7;
    fireLight.intensity = 0.65 + night * 1.9 + Math.sin(elapsed * 9.4) * 0.12;
    smokePuffs.forEach((puff, index) => {
      const phase = (elapsed * 0.28 + index / 3) % 1;
      puff.position.y = 1.25 + phase * 2.3;
      puff.position.x = Math.sin(elapsed * 0.45 + index) * 0.18;
      puff.scale.setScalar(0.38 + phase * 0.8);
    });
    scene.fog.density = 0.0065 + night * 0.0015 + (rainy ? 0.0028 : snowy ? 0.002 : overcast ? 0.001 : 0) + (dry ? -0.0007 : 0);
    const daylight = Math.max(0, Math.sin(angle));
    scene.background.setRGB(
      (0.64 + daylight * 0.12) * (1 - overcastStrength * 0.2) + lightning * 0.22,
      (0.68 + daylight * 0.1) * (1 - overcastStrength * 0.18) + lightning * 0.24,
      (0.59 + night * 0.1) + (snowy ? 0.12 : rainy ? 0.035 : 0) + lightning * 0.28
    );
    scene.fog.color.copy(scene.background);
    livestock.forEach((animal) => {
      const p = animal.userData;
      p.phase += dt * p.speed;
      p.wait -= dt;
      if (p.wait <= 0) {
        p.target.set(
          p.centerX + (Math.random() - 0.5) * 4.8,
          0,
          p.centerZ + (Math.random() - 0.5) * 3.8
        );
        p.wait = 3.5 + Math.random() * 5.5;
      }
      const dx = p.target.x - animal.position.x;
      const dz = p.target.z - animal.position.z;
      const distance = Math.hypot(dx, dz);
      const moving = distance > 0.4;
      if (moving) {
        const step = Math.min(distance, dt * p.speed * (rainy || snowy ? 0.78 : 1));
        animal.position.x += (dx / distance) * step;
        animal.position.z += (dz / distance) * step;
        animal.rotation.y = Math.atan2(dx, dz);
      }
      animal.position.y = terrainHeight(animal.position.x, animal.position.z);
      const gait = moving ? Math.sin(p.phase * 7) * 0.36 : Math.sin(p.phase * 1.4) * 0.035;
      p.legs.forEach((leg, index) => { leg.rotation.x = gait * (index % 2 ? -1 : 1); });
      p.tail.rotation.x = 0.12 + Math.sin(elapsed * 1.5 + p.index) * 0.2;
    });

    const visibleWildlife = Math.round((deer.length * THREE.MathUtils.clamp(wildlife, 0, 100)) / 100);
    deer.forEach((animal, animalIndex) => {
      animal.visible = animalIndex < visibleWildlife;
      if (!animal.visible) return;
      const p = animal.userData;
      p.phase += dt * p.speed;
      p.wait -= dt;
      if (p.wait <= 0) {
        p.target.set(
          p.centerX + (Math.random() - 0.5) * 13,
          0,
          p.centerZ + (Math.random() - 0.5) * 13
        );
        if (Math.abs(p.target.x - (18 + Math.sin(p.target.z * 0.042) * 3.8)) < 10) p.target.x -= 12;
        p.wait = 4 + Math.random() * 8;
      }
      const dx = p.target.x - animal.position.x;
      const dz = p.target.z - animal.position.z;
      const distance = Math.hypot(dx, dz);
      const moving = distance > 0.65;
      if (moving) {
        const wildlifeWeatherFactor = (stormy || snowy) ? 0.76 : rainy ? 0.9 : 1;
        const step = Math.min(distance, dt * p.speed * wildlifeWeatherFactor);
        animal.position.x += (dx / distance) * step;
        animal.position.z += (dz / distance) * step;
        animal.rotation.y = Math.atan2(dx, dz);
      }
      animal.position.y = terrainHeight(animal.position.x, animal.position.z) + (moving ? Math.abs(Math.sin(p.phase * 5)) * 0.04 : 0);
      p.legs.forEach((leg, index) => {
        leg.rotation.x = moving ? Math.sin(p.phase * 6 + (index % 2) * Math.PI) * 0.42 : 0;
      });
    });

    if (caravanVisible) {
      caravanVisitors.forEach((person, index) => {
        const p = person.userData;
        p.phase += dt * 1.1;
        p.torso.rotation.z = Math.sin(elapsed * 1.7 + index) * 0.025;
        p.armL.rotation.x = -0.08 + Math.sin(elapsed * 1.35 + index) * 0.035;
        p.armR.rotation.x = -0.08 - Math.sin(elapsed * 1.35 + index) * 0.035;
      });
    }

    villagers.forEach((person) => {
      const p = person.userData;
      p.phase += dt * p.speed;
      p.wait -= dt;

      if (p.working && p.jobBuilding) {
        if (p.state === 'working') {
          p.workTimer -= dt;
          if (p.workTimer <= 0) {
            if (p.jobBuilding?.kind === 'sawmill' && p.treeIndex !== null && p.treeIndex !== undefined) {
              harvestForestTree(p.treeIndex, elapsed); p.treeIndex = null;
            }
            p.state = 'toStore';
            assignTravelRoute(person, p.storageTarget);
            p.cart.visible = true;
            p.cargo.visible = true;
            p.cargoParts.sack.visible = p.cargoType === 'food';
            p.cargoParts.manureSack.visible = p.cargoType === 'manure';
            p.cargoParts.stone.visible = p.cargoType === 'stone';
            p.cargoParts.coin.visible = p.cargoType === 'gold';
            p.cargoParts.logs.visible = p.cargoType === 'wood';
          }
        } else if (p.state === 'unloading') {
          p.workTimer -= dt;
          if (p.workTimer <= 0) {
            addDeliveredResource(p.cargoType);
            p.cargo.visible = false;
            p.cart.visible = false;
            p.state = 'toWork';
            if (p.jobBuilding?.kind === 'sawmill' && !assignForestTarget(person)) {
              p.state = 'working'; p.workTimer = 4;
            } else assignTravelRoute(person, p.workTarget);
            p.workTimer = 1.8 + (p.index % 4) * 0.55;
          }
        }
      } else if (p.wait <= 0 && !p.working) {
        p.route = null;
        p.routeIndex = 0;
        p.routeUsesRoad = false;
        p.target.set((Math.random() - 0.5) * 18, 0, (Math.random() - 0.5) * 18);
        p.wait = 3.5 + Math.random() * 8;
      }

      const dx = p.target.x - person.position.x;
      const dz = p.target.z - person.position.z;
      const distance = Math.hypot(dx, dz);
      const moving = distance > 0.55;

      if (moving) {
        const weatherTravelFactor = snowy ? 0.68 : rainy ? 0.84 : 1;
        const transportFactor = (p.cart.visible
          ? (p.routeUsesRoad ? 1.15 : 0.62)
          : (p.routeUsesRoad ? 1.12 : 1)) * weatherTravelFactor;
        const step = Math.min(distance, dt * p.speed * (p.working ? 1.3 : 1) * transportFactor);
        person.position.x += (dx / distance) * step;
        person.position.z += (dz / distance) * step;
        person.rotation.y = Math.atan2(dx, dz);
      } else if (p.route && p.routeIndex < p.route.length - 1) {
        p.routeIndex += 1;
        p.target.copy(p.route[p.routeIndex]);
      } else if (p.working && p.state === 'toWork') {
        p.state = 'working';
        p.route = null;
        p.routeIndex = 0;
        p.workTimer = 2.1 + (p.index % 4) * 0.62;
      } else if (p.working && p.state === 'toStore') {
        p.state = 'unloading';
        p.route = null;
        p.routeIndex = 0;
        p.workTimer = 0.85;
      }

      person.position.y = terrainHeight(person.position.x, person.position.z) + (moving ? Math.abs(Math.sin(p.phase * 5)) * 0.06 : 0);
      const swing = moving ? Math.sin(p.phase * 7) * 0.55 : Math.sin(p.phase * 1.5) * 0.04;
      p.legL.rotation.x = swing;
      p.legR.rotation.x = -swing;
      const workingPose = p.working && p.state === 'working';
      const carryingPose = p.working && p.cart.visible;
      p.armL.rotation.x = workingPose ? Math.sin(p.phase * 5) * 0.65 : carryingPose ? -0.72 : -swing * 0.65;
      p.armR.rotation.x = workingPose ? -Math.sin(p.phase * 5) * 0.65 : carryingPose ? -0.72 : swing * 0.65;
      if (p.cart.visible && moving) {
        p.cartWheels.forEach((wheel) => { wheel.rotation.x -= dt * p.speed * 2.8; });
      }
      p.torso.rotation.z = moving ? Math.sin(p.phase * 3.5) * 0.025 : 0;
    });
  }

  function showGhost(x, z, valid, kind = 'house') {
    const dimensions = kind === 'farm' ? [9.2, 0.16, 8.2]
      : ['sawmill', 'quarry'].includes(kind) ? [7.5, 0.16, 6.8]
      : kind === 'tower' ? [6, 0.16, 6]
      : kind === 'market' ? [7, 0.16, 5.8]
      : kind === 'well' ? [3.2, 0.16, 3.2]
      : kind === 'fishery' ? [7.2, 0.16, 8]
      : kind === 'storehouse' ? [7.4, 0.16, 6.4]
      : kind === 'stable' ? [8.8, 0.16, 10.6]
      : [6, 0.16, 5.5];
    if (ghost.userData.kind !== kind) {
      ghost.geometry.dispose();
      ghost.geometry = new THREE.BoxGeometry(...dimensions);
      ghost.userData.kind = kind;
    }
    ghost.position.set(x, terrainHeight(x, z) + 0.2, z);
    ghost.material.color.set(valid ? 0x75c879 : 0xd65b50);
    ghost.visible = true;
  }

  function hideGhost() {
    ghost.visible = false;
  }

  function setQuality(value) {
    const ratio = value === 'high' ? 2 : value === 'medium' ? 1.5 : 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, ratio));
    renderer.shadowMap.enabled = value !== 'low';
    renderer.shadowMap.needsUpdate = true;
  }

  return {
    scene, camera, renderer, ground, buildings, villagers, addBuilding, removeBuilding,
    clearBuildings, setPopulation, setJobs, setLivestock, setCaravan, update, showGhost, hideGhost,
    getDeliveryCounts: () => ({ ...deliveryCounts }),
    setDeliveryCounts,
    setQuality, render: () => renderer.render(scene, camera), addRoad: addRoadPath
  };
}
