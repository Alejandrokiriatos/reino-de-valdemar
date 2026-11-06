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
  const legL = addBox(person, -0.14, 0.28, 0, 0.16, 0.56, 0.18, palette.dark);
  const legR = addBox(person, 0.14, 0.28, 0, 0.16, 0.56, 0.18, palette.dark);
  person.position.set((Math.random() - 0.5) * 12, terrainHeight(0, 0), (Math.random() - 0.5) * 10);
  person.userData = {
    index, phase: Math.random() * 6, speed: 1.25 + Math.random() * 0.45,
    target: new THREE.Vector3(), legL, legR, armL, armR, torso, working: false,
    wait: Math.random() * 5
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
    clothes: [material(0x8a4939), material(0x455d70), material(0x9a8048), material(0x68734a), material(0x784e6b), material(0x8a8b85)]
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

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 120, 120), material(0x6c8050, 1));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const positions = ground.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = -positions.getY(i);
    positions.setZ(i, terrainHeight(x, z));
  }
  positions.needsUpdate = true;
  ground.geometry.computeVertexNormals();
  ground.name = 'terrain';
  scene.add(ground);

  const water = makeRiver(scene);
  const buildings = [];
  const roads = [];
  const villagers = [];
  const ghost = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.16, 7),
    new THREE.MeshBasicMaterial({ color: 0x6ba56d, transparent: true, opacity: 0.45, depthWrite: false })
  );
  ghost.visible = false;
  ghost.renderOrder = 5;
  scene.add(ghost);

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

  makeRoad(scene, [[-8, -5], [-4, -1], [-2, 4], [0, 9]], 2.6);
  makeRoad(scene, [[-4, 4], [3, 3], [8, 1], [10, -4]], 2.1);
  makeRoad(scene, [[-8, -5], [-11, -1], [-12, 5]], 2.1);
  const roadMat = material(0x756044, 1);

  function addBuilding(data) {
    const group = makeBuildingMesh(data.kind, palette);
    group.position.set(data.x, terrainHeight(data.x, data.z), data.z);
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
    group.traverse((child) => child.geometry?.dispose?.());
  }

  function clearBuildings() {
    [...buildings].forEach(removeBuilding);
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
    villagers.forEach((person, index) => {
      const p = person.userData;
      const job = assignments[index];
      p.working = Boolean(job);
      p.jobBuilding = job || null;
      if (job) p.target.set(job.x + (index % 3 - 1) * 1.35, 0, job.z + 4 + Math.floor(index / 3) * 1.2);
      else p.wait = 0;
    });
  }

  function update(dt, elapsed, dayProgress = 0.35) {
    water.material.opacity = 0.86 + Math.sin(elapsed * 0.8) * 0.035;
    water.position.y = Math.sin(elapsed * 0.48) * 0.025;
    const angle = dayProgress * Math.PI * 2;
    sun.position.set(Math.cos(angle) * 42 - 4, Math.sin(angle) * 38 + 18, 22);
    sun.intensity = 0.72 + Math.max(0, Math.sin(angle)) * 2.25;
    const night = Math.max(0, -Math.sin(angle));
    scene.fog.density = 0.0065 + night * 0.0015;
    scene.background.setRGB(
      0.64 + Math.max(0, Math.sin(angle)) * 0.12,
      0.68 + Math.max(0, Math.sin(angle)) * 0.1,
      0.59 + night * 0.1
    );
    villagers.forEach((person) => {
      const p = person.userData;
      p.phase += dt * p.speed;
      p.wait -= dt;
      if (p.wait <= 0 && !p.working) {
        p.target.set((Math.random() - 0.5) * 14, 0, (Math.random() - 0.5) * 14);
        p.wait = 3.5 + Math.random() * 8;
      }
      if (p.working && p.jobBuilding) {
        p.target.set(p.jobBuilding.x + (p.index % 3 - 1) * 1.35, 0, p.jobBuilding.z + 4 + Math.floor(p.index / 3) * 1.2);
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
      }
      person.position.y = terrainHeight(person.position.x, person.position.z) + (moving ? Math.abs(Math.sin(p.phase * 5)) * 0.06 : 0);
      const swing = moving ? Math.sin(p.phase * 7) * 0.55 : Math.sin(p.phase * 1.5) * 0.04;
      p.legL.rotation.x = swing;
      p.legR.rotation.x = -swing;
      p.armL.rotation.x = -swing * 0.65;
      p.armR.rotation.x = swing * 0.65;
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
    setQuality, render: () => renderer.render(scene, camera), addRoad: addRoadPath
  };
}
