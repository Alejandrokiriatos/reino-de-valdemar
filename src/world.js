import * as THREE from 'three';

export const WORLD_SIZE = 180;

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

function makeRoad(scene, points, width = 2.2) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, terrainHeight(x, z) + 0.045, z)));
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
  const segments = 180;
  for (let i = 0; i <= segments; i++) {
    const z = -88 + (176 * i) / segments;
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
      const z = -85 + i * (170 / 29);
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
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.225, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.56), palette.dark);
  hair.position.y = 1.7;
  person.add(hair);
  const armL = addBox(person, -0.36, 1.1, 0, 0.14, 0.68, 0.16, tunic);
  const armR = addBox(person, 0.36, 1.1, 0, 0.14, 0.68, 0.16, tunic);
  const cargo = new THREE.Group();
  const cargoWood = material(0x795332);
  const cargoCloth = material(0xb39a66);
  const cargoStone = material(0x858477);
  const cargoGold = material(0xc4a24d, 0.55, { metalness: 0.35 });
  addBox(cargo, 0, 0, 0, 0.42, 0.32, 0.34, cargoWood, false);
  for (const x of [-0.13, 0.13]) addBox(cargo, x, 0.17, 0.18, 0.035, 0.36, 0.035, cargoCloth, false);
  const sack = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), cargoCloth);
  sack.scale.set(1, 0.8, 0.86);
  sack.position.set(0, 0.1, 0);
  sack.visible = false;
  cargo.add(sack);
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.23, 0), cargoStone);
  stone.position.y = 0.08;
  stone.visible = false;
  cargo.add(stone);
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.055, 12), cargoGold);
  coin.rotation.z = Math.PI / 2;
  coin.position.set(0, 0.1, 0);
  coin.visible = false;
  cargo.add(coin);
  cargo.position.set(0, 1.12, -0.3);
  cargo.visible = false;
  person.add(cargo);
  const legL = addBox(person, -0.14, 0.28, 0, 0.16, 0.56, 0.18, palette.dark);
  const legR = addBox(person, 0.14, 0.28, 0, 0.16, 0.56, 0.18, palette.dark);
  person.position.set((Math.random() - 0.5) * 12, terrainHeight(0, 0), (Math.random() - 0.5) * 10);
  person.userData = {
    index, phase: Math.random() * 6, speed: 1.25 + Math.random() * 0.45,
    target: new THREE.Vector3(), legL, legR, armL, armR, torso, cargo,
    cargoParts: { sack, stone, coin }, working: false, state: 'wandering',
    workTimer: 0, wait: Math.random() * 5
  };
  scene.add(person);
  return person;
}

export function createWorld(root) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa3ad96);
  scene.fog = new THREE.FogExp2(0xa3ad96, 0.0065);
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(31, 32, 39);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.setAttribute('aria-label', 'Vista 3D del reino de Valdemar');
  root.replaceChildren(renderer.domElement);

  const palette = {
    wood: material(0x765035), dark: material(0x38291f), stone: material(0x898779),
    roof: material(0x624039), plaster: material(0xc0ad84), accent: material(0x45352c),
    trunk: material(0x59402b), leaves: [material(0x3d6038), material(0x506e3e), material(0x66804b), material(0x789054)],
    crop: material(0x637b3e), cropGold: material(0xb5a057), soil: material(0x715d3e),
    cloth: material(0x9d794a), skin: material(0xd1a17a),
    clothes: [material(0x8a4939), material(0x455d70), material(0x9a8048), material(0x68734a), material(0x784e6b), material(0x8a8b85)],
    deerCoat: material(0x876344)
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
  sun.shadow.bias = -0.00025;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc2d3e4, 0.38);
  fill.position.set(26, 20, -30);
  scene.add(fill);

  const groundGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 120, 120);
  const ground = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, vertexColors: true })
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
  const buildings = [];
  const roads = [];
  const villagers = [];
  const deer = [];
  const stockyard = new THREE.Group();
  const deliveryCounts = { food: 0, wood: 0, stone: 0, gold: 0 };
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
  const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, 1750);
  const grassDummy = new THREE.Object3D();
  let grassIndex = 0;
  for (let i = 0; i < 1750; i++) {
    const x = (Math.random() - 0.5) * 165;
    const z = (Math.random() - 0.5) * 165;
    const riverX = 18 + Math.sin(z * 0.042) * 3.8;
    if ((Math.abs(x) < 18 && Math.abs(z) < 18) || Math.abs(x - riverX) < 8.5) continue;
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

  for (let i = 0; i < 260; i++) {
    const x = (Math.random() - 0.5) * 165;
    const z = (Math.random() - 0.5) * 165;
    if ((Math.abs(x) < 22 && Math.abs(z) < 22) || Math.abs(x - (18 + Math.sin(z * 0.042) * 3.8)) < 9) continue;
    makeTree(scene, x, z, 0.72 + Math.random() * 0.72, palette);
  }
  for (let i = 0; i < 105; i++) {
    const x = (Math.random() - 0.5) * 155;
    const z = (Math.random() - 0.5) * 155;
    if ((Math.abs(x) < 18 && Math.abs(z) < 18) || Math.abs(x - 18) < 9) continue;
    makeBush(scene, x, z, palette, 0.7 + Math.random() * 0.65);
  }
  for (let i = 0; i < 75; i++) {
    const x = (Math.random() - 0.5) * 155;
    const z = (Math.random() - 0.5) * 155;
    if ((Math.abs(x) < 17 && Math.abs(z) < 17) || Math.abs(x - 18) < 8) continue;
    makeRock(scene, x, z, palette.stone, 0.3 + Math.random() * 0.7);
  }
  const herds = [[-45, -38], [-52, 35], [4, 48], [-34, 63]];
  herds.forEach(([x, z], herdIndex) => {
    for (let i = 0; i < 2; i++) deer.push(makeDeer(scene, herdIndex * 2 + i, x, z, palette));
  });

  makeRoad(scene, [[-8, -16], [-6, -12], [-3, -10], [0, -8], [4, -5]], 2.7);
  makeRoad(scene, [[-3, -9], [-6, -5], [-5, 1], [-4, 7]], 2.25);
  makeRoad(scene, [[-7, -13], [-11, -11], [-15, -8], [-17, -3], [-19, 5]], 2.35);
  const roadMat = material(0x756044, 1);

  function emptyStockyard() {
    stockyard.traverse((child) => {
      if (child !== stockyard) child.geometry?.dispose?.();
    });
    stockyard.clear();
  }

  function positionStockyard(data) {
    emptyStockyard();
    stockyard.position.set(data.x + 5.1, terrainHeight(data.x + 5.1, data.z + 2.5), data.z + 2.5);
    for (const key of Object.keys(deliveryCounts)) deliveryCounts[key] = 0;
    addBox(stockyard, 0, 0.08, 0, 6.8, 0.16, 5.8, material(0x786143), false);
    addBox(stockyard, -0.05, 0.18, -2.55, 6.5, 0.12, 0.12, material(0x493a29), false);
    addBox(stockyard, -0.05, 0.18, 2.55, 6.5, 0.12, 0.12, material(0x493a29), false);
    addBox(stockyard, -3.3, 0.18, 0, 0.12, 0.12, 5.1, material(0x493a29), false);
    addBox(stockyard, 3.2, 0.18, 0, 0.12, 0.12, 5.1, material(0x493a29), false);
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
    } else {
      item = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), material(0xb79b66));
      item.scale.set(1.15, 0.8, 0.95);
      item.position.set(x, 0.38, z);
    }
    item.castShadow = true;
    item.receiveShadow = true;
    stockyard.add(item);
  }

  function addBuilding(data) {
    const group = makeBuildingMesh(data.kind, palette);
    group.position.set(data.x, terrainHeight(data.x, data.z), data.z);
    if (data.kind === 'storehouse') positionStockyard(data);
    group.rotation.y = data.rotation || 0;
    group.userData.isBuilding = true;
    group.userData.buildingData = { ...data };
    group.name = data.kind + '-' + data.id;
    scene.add(group);
    buildings.push(group);
    return group;
  }

  function removeBuilding(group) {
    const index = buildings.indexOf(group);
    if (index >= 0) buildings.splice(index, 1);
    scene.remove(group);
    const wasStorehouse = group.userData.buildingData?.kind === 'storehouse';
    group.traverse((child) => child.geometry?.dispose?.());
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
    emptyStockyard();
    for (const key of Object.keys(deliveryCounts)) deliveryCounts[key] = 0;
  }

  function addRoadPath(points, width = 1.8) {
    const road = makeRoad(scene, points, width);
    road.material = roadMat;
    roads.push(road);
    return road;
  }

  function setPopulation(count) {
    while (villagers.length < count) villagers.push(makeVillager(scene, villagers.length, palette));
    while (villagers.length > count) {
      const person = villagers.pop();
      scene.remove(person);
      person.traverse((child) => child.geometry?.dispose?.());
    }
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
      p.working = Boolean(job);
      p.jobBuilding = job || null;
      p.state = job ? 'toWork' : 'wandering';
      p.cargo.visible = false;
      if (job) {
        p.cargoType = job.kind === 'farm' ? 'food'
          : job.kind === 'sawmill' ? 'wood'
          : job.kind === 'quarry' ? 'stone'
          : job.kind === 'market' ? 'gold' : 'food';
        p.storageTarget = new THREE.Vector3(depot.x + 5.1, 0, depot.z + 2.5);
        p.workTarget = new THREE.Vector3(
          job.x + (index % 3 - 1) * 1.35,
          0,
          job.z + 3.3 + Math.floor(index / 3) * 0.85
        );
        p.target.copy(p.workTarget);
        p.workTimer = 1.6 + (index % 4) * 0.48;
      } else {
        p.wait = Math.random() * 3;
      }
    });
  }

  function update(dt, elapsed, dayProgress = 0.35, season = 'Primavera') {
    water.material.opacity = 0.86 + Math.sin(elapsed * 0.8) * 0.035;
    water.position.y = Math.sin(elapsed * 0.48) * 0.025;
    const angle = dayProgress * Math.PI * 2;
    const seasonalGround = { Primavera: 0x6f8352, Verano: 0x71834d, Otoño: 0x88794f, Invierno: 0x778174 };
    ground.material.color.setHex(seasonalGround[season] || seasonalGround.Primavera);
    sun.position.set(Math.cos(angle) * 42 - 4, Math.sin(angle) * 38 + 18, 22);
    sun.intensity = 0.72 + Math.max(0, Math.sin(angle)) * 2.25;
    const night = Math.max(0, -Math.sin(angle));
    scene.fog.density = 0.0065 + night * 0.0015;
    scene.background.setRGB(
      0.64 + Math.max(0, Math.sin(angle)) * 0.12,
      0.68 + Math.max(0, Math.sin(angle)) * 0.1,
      0.59 + night * 0.1
    );
    scene.fog.color.copy(scene.background);
    deer.forEach((animal) => {
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
        const step = Math.min(distance, dt * p.speed);
        animal.position.x += (dx / distance) * step;
        animal.position.z += (dz / distance) * step;
        animal.rotation.y = Math.atan2(dx, dz);
      }
      animal.position.y = terrainHeight(animal.position.x, animal.position.z) + (moving ? Math.abs(Math.sin(p.phase * 5)) * 0.04 : 0);
      p.legs.forEach((leg, index) => {
        leg.rotation.x = moving ? Math.sin(p.phase * 6 + (index % 2) * Math.PI) * 0.42 : 0;
      });
    });

    villagers.forEach((person) => {
      const p = person.userData;
      p.phase += dt * p.speed;
      p.wait -= dt;

      if (p.working && p.jobBuilding) {
        if (p.state === 'working') {
          p.workTimer -= dt;
          if (p.workTimer <= 0) {
            p.state = 'toStore';
            p.target.copy(p.storageTarget);
            p.cargo.visible = true;
            p.cargoParts.sack.visible = p.cargoType === 'food';
            p.cargoParts.stone.visible = p.cargoType === 'stone';
            p.cargoParts.coin.visible = p.cargoType === 'gold';
          }
        } else if (p.state === 'unloading') {
          p.workTimer -= dt;
          if (p.workTimer <= 0) {
            addDeliveredResource(p.cargoType);
            p.cargo.visible = false;
            p.state = 'toWork';
            p.target.copy(p.workTarget);
            p.workTimer = 1.8 + (p.index % 4) * 0.55;
          }
        }
      } else if (p.wait <= 0 && !p.working) {
        p.target.set((Math.random() - 0.5) * 18, 0, (Math.random() - 0.5) * 18);
        p.wait = 3.5 + Math.random() * 8;
      }

      const dx = p.target.x - person.position.x;
      const dz = p.target.z - person.position.z;
      const distance = Math.hypot(dx, dz);
      const moving = distance > 0.55;

      if (moving) {
        const step = Math.min(distance, dt * p.speed * (p.working ? 1.3 : 1));
        person.position.x += (dx / distance) * step;
        person.position.z += (dz / distance) * step;
        person.rotation.y = Math.atan2(dx, dz);
      } else if (p.working && p.state === 'toWork') {
        p.state = 'working';
        p.workTimer = 2.1 + (p.index % 4) * 0.62;
      } else if (p.working && p.state === 'toStore') {
        p.state = 'unloading';
        p.workTimer = 0.85;
      }

      person.position.y = terrainHeight(person.position.x, person.position.z) + (moving ? Math.abs(Math.sin(p.phase * 5)) * 0.06 : 0);
      const swing = moving ? Math.sin(p.phase * 7) * 0.55 : Math.sin(p.phase * 1.5) * 0.04;
      p.legL.rotation.x = swing;
      p.legR.rotation.x = -swing;
      const workingPose = p.working && p.state === 'working';
      const carryingPose = p.working && p.cargo.visible;
      p.armL.rotation.x = workingPose ? Math.sin(p.phase * 5) * 0.65 : carryingPose ? -0.55 : -swing * 0.65;
      p.armR.rotation.x = workingPose ? -Math.sin(p.phase * 5) * 0.65 : carryingPose ? -0.55 : swing * 0.65;
      p.torso.rotation.z = moving ? Math.sin(p.phase * 3.5) * 0.025 : 0;
    });
  }

  function showGhost(x, z, valid, kind = 'house') {
    const dimensions = kind === 'farm' ? [9.2, 0.16, 8.2]
      : ['sawmill', 'quarry'].includes(kind) ? [7.5, 0.16, 6.8]
      : kind === 'tower' ? [6, 0.16, 6]
      : kind === 'market' ? [7, 0.16, 5.8]
      : kind === 'well' ? [3.2, 0.16, 3.2]
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
    clearBuildings, setPopulation, setJobs, update, showGhost, hideGhost,
    getDeliveryCounts: () => ({ ...deliveryCounts }),
    setQuality, render: () => renderer.render(scene, camera), addRoad: addRoadPath
  };
}
