import * as THREE from 'three';

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function textureCanvas(kind, seed) {
  const size = 512, random = seededRandom(seed);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const base = {
    ground: '#84946b', road: '#927d5b', soil: '#76583c', wood: '#a27b51',
    bark: '#765136', stone: '#aaa18b', plaster: '#d0c09a', roof: '#955348', cloth: '#b49a70'
  }[kind] || '#aaaaaa';
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  const shade = (hex, amount) => {
    const n = parseInt(hex.slice(1), 16);
    return 'rgb(' + Math.max(0, Math.min(255, (n >> 16) + amount)) + ',' +
      Math.max(0, Math.min(255, ((n >> 8) & 255) + amount)) + ',' +
      Math.max(0, Math.min(255, (n & 255) + amount)) + ')';
  };
  if (kind === 'stone') {
    const rowHeight = 54;
    for (let row = 0; row < 10; row++) {
      const y = row * rowHeight; let x = row % 2 ? -48 : -8;
      while (x < size) {
        const width = 72 + random() * 52;
        ctx.fillStyle = shade(base, Math.floor(random() * 26) - 13);
        ctx.fillRect(x + 2, y + 2, width - 4, rowHeight - 5);
        ctx.fillStyle = 'rgba(255,245,218,.15)'; ctx.fillRect(x + 5, y + 5, width - 11, 2);
        ctx.fillStyle = 'rgba(43,36,27,.2)'; ctx.fillRect(x + 4, y + rowHeight - 8, width - 10, 3);
        for (let chip = 0; chip < 4; chip++) {
          ctx.fillStyle = 'rgba(55,48,38,' + (0.05 + random() * 0.12) + ')';
          ctx.fillRect(x + random() * width, y + random() * rowHeight, 2 + random() * 8, 1 + random() * 3);
        }
        x += width;
      }
    }
  } else if (kind === 'wood' || kind === 'bark') {
    const rowHeight = kind === 'wood' ? 86 : 42;
    for (let row = 0; row < size / rowHeight; row++) {
      const y = row * rowHeight;
      ctx.fillStyle = shade(base, Math.floor(random() * 34) - 17); ctx.fillRect(0, y + 2, size, rowHeight - 4);
      ctx.fillStyle = 'rgba(40,25,15,.36)'; ctx.fillRect(0, y, size, 3);
      ctx.fillStyle = 'rgba(244,211,156,.2)'; ctx.fillRect(0, y + 5, size, 2);
      for (let line = 0; line < 13; line++) {
        const yy = y + 9 + random() * (rowHeight - 18);
        ctx.beginPath();
        ctx.strokeStyle = line % 3 ? 'rgba(56,35,19,.14)' : 'rgba(245,205,145,.17)';
        ctx.lineWidth = 1 + random() * 2; ctx.moveTo(0, yy);
        for (let x = 0; x <= size; x += 48) ctx.lineTo(x, yy + Math.sin(x * 0.025 + line) * (1 + random() * 3));
        ctx.stroke();
      }
      if (kind === 'wood' && row % 2 === 0) {
        ctx.beginPath(); ctx.ellipse(70 + random() * 370, y + rowHeight * 0.52, 8, 4, 0.08, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56,33,17,.38)'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
  } else if (kind === 'roof') {
    for (let row = 0; row < 11; row++) {
      const y = row * 48;
      for (let x = (row % 2 ? -24 : 0); x < size; x += 52) {
        ctx.fillStyle = shade(base, Math.floor(random() * 34) - 17);
        ctx.beginPath(); ctx.moveTo(x + 3, y + 4); ctx.quadraticCurveTo(x + 26, y - 1, x + 49, y + 4);
        ctx.lineTo(x + 46, y + 47); ctx.quadraticCurveTo(x + 25, y + 42, x + 6, y + 47);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(47,29,26,.38)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,210,174,.2)'; ctx.beginPath(); ctx.moveTo(x + 8, y + 9);
        ctx.quadraticCurveTo(x + 26, y + 4, x + 43, y + 9); ctx.stroke();
      }
    }
  } else if (kind === 'plaster') {
    for (let i = 0; i < 1300; i++) {
      const alpha = 0.025 + random() * 0.1;
      ctx.fillStyle = random() > 0.52 ? 'rgba(72,57,39,' + alpha + ')' : 'rgba(255,244,213,' + alpha + ')';
      ctx.fillRect(random() * size, random() * size, 1 + random() * 7, 1 + random() * 3);
    }
  } else if (kind === 'soil' || kind === 'road') {
    for (let i = 0; i < 95; i++) {
      const y = random() * size, x = random() * size;
      ctx.beginPath(); ctx.strokeStyle = kind === 'soil' ? 'rgba(43,28,17,.18)' : 'rgba(64,52,37,.16)';
      ctx.lineWidth = 2 + random() * 4; ctx.moveTo(x, y); ctx.lineTo(x + 25 + random() * 75, y + random() * 7 - 3); ctx.stroke();
    }
    for (let i = 0; i < 1800; i++) {
      const alpha = 0.04 + random() * 0.12;
      ctx.fillStyle = random() > 0.5 ? 'rgba(31,43,25,' + alpha + ')' : 'rgba(216,193,145,' + alpha + ')';
      ctx.fillRect(random() * size, random() * size, 1 + random() * 4, 1 + random() * 2);
    }
  } else if (kind === 'ground') {
    for (let i = 0; i < 1800; i++) {
      const x = random() * size, y = random() * size, radius = 1 + random() * 10;
      ctx.fillStyle = random() > 0.48 ? 'rgba(43,68,38,' + (0.025 + random() * 0.12) + ')' : 'rgba(195,183,132,' + (0.025 + random() * 0.11) + ')';
      ctx.beginPath(); ctx.ellipse(x, y, radius * 1.5, radius, random() * Math.PI, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'cloth') {
    for (let i = 0; i < size; i += 4) {
      ctx.strokeStyle = 'rgba(45,34,24,.11)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }
  }
  const pixels = ctx.getImageData(0, 0, size, size);
  const bumpCanvas = document.createElement('canvas'); bumpCanvas.width = bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d'), bump = bctx.createImageData(size, size);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const l = Math.round(pixels.data[i] * 0.3 + pixels.data[i + 1] * 0.59 + pixels.data[i + 2] * 0.11);
    bump.data[i] = bump.data[i + 1] = bump.data[i + 2] = l; bump.data[i + 3] = 255;
  }
  bctx.putImageData(bump, 0, 0);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
  const bumpMap = new THREE.CanvasTexture(bumpCanvas); bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping; bumpMap.anisotropy = 8;
  return { map, bumpMap };
}

export function createSurfaceMaterials(THREE) {
  const make = (kind, repeat, bumpScale, roughness = 0.92) => {
    const maps = textureCanvas(kind, kind.length * 317);
    maps.map.repeat.set(...repeat); maps.bumpMap.repeat.copy(maps.map.repeat);
    return new THREE.MeshStandardMaterial({ map: maps.map, bumpMap: maps.bumpMap, bumpScale, roughness });
  };
  return {
    ground: make('ground', [38, 38], 0.055, 1),
    road: make('road', [2.6, 2.6], 0.085, 1),
    soil: make('soil', [2.5, 2.5], 0.12, 1),
    wood: make('wood', [2.2, 2.2], 0.075, 0.88),
    bark: make('bark', [1.5, 1.5], 0.1, 0.96),
    stone: make('stone', [1.8, 1.8], 0.11, 0.93),
    plaster: make('plaster', [2, 2], 0.035, 0.94),
    roof: make('roof', [2.5, 2.5], 0.075, 0.9),
    cloth: make('cloth', [1.5, 1.5], 0.025, 0.94)
  };
}
