(() => {
  const initialView = { yaw: -.22, pitch: .71, zoom: .55, target: 2.65, frameOffset: .04 };
  const unitView = { yaw: -.31, pitch: .53, zoom: .90, target: 5.5 };
  const facadeView = { yaw: .50, pitch: .38, zoom: .88, target: 5.1, frameOffset: .20 };
  const entranceView = { yaw: .34, pitch: .38, zoom: 1.27, target: 2.7 };
  const rearView = { yaw: -1.54, pitch: .72, zoom: .82, target: 5.4 };
  const aerialView = { yaw: -.25, pitch: 1.10, zoom: .25 };
  const sitePlanView = { yaw: 0, pitch: Math.PI / 2, zoom: .43 };
  const walkView = { yaw: 0, pitch: Math.PI / 2, zoom: .23, frameOffset: .08, frameOffsetX: .075 };
  const towerFootprint = [[-4.48,-1.08],[-3.16,-1.08],[-3.16,-5.45],[-1.48,-5.45],
    [-1.48,-1.08],[4.62,-1.08],[4.62,2.56],[-4.48,2.56]];
  const floorHeight = floor => 1.62 + (floor - 1) * 1.04;
  const floor11 = floorHeight(11);
  const balconyEye = [-1.03, (floor11 + .60) * .69, 2.02];
  const balconyViews = {
    east: { yaw: .84, pitch: .23 },
    sea: { yaw: 0, pitch: .26 },
    west: { yaw: -.84, pitch: .23 }
  };
  const lighting = {
    day: { sun: [-.50, .84, .42], shadow: [.28, -.29], tone: 'rgba(39,35,28,', ambient: .15 },
    dusk: { sun: [-.88, .32, .35], shadow: [.63, -.35], tone: 'rgba(42,34,57,', ambient: .29 }
  };
  const unitPresets = { '1103': 'rear', '1108': 'orla' };
  const minZoom = .095;
  const maxZoom = 1.45;
  const fieldOfView = 36;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function buildScene() {
    const surfaces = [];
    function addFace(points, normal, color, floor, details = [], unit = null) {
      surfaces.push({ points, normal, color, floor, details, unit });
    }

    // Every face keeps its own decorative panels in plane, so glass and trim
    // rotate with the geometry and do not interfere with floor picking.
    function box(x1, x2, y1, y2, z1, z2, colors, floor = null, panels = () => []) {
      addFace([[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]], [0,0,1], colors[0], floor, panels('front'));
      addFace([[x2,y1,z1],[x1,y1,z1],[x1,y2,z1],[x2,y2,z1]], [0,0,-1], colors[0], floor, panels('back'));
      addFace([[x2,y1,z2],[x2,y1,z1],[x2,y2,z1],[x2,y2,z2]], [1,0,0], colors[1], floor, panels('right'));
      addFace([[x1,y1,z1],[x1,y1,z2],[x1,y2,z2],[x1,y2,z1]], [-1,0,0], colors[1], floor, panels('left'));
      addFace([[x1,y2,z2],[x2,y2,z2],[x2,y2,z1],[x1,y2,z1]], [0,1,0], colors[2], floor, panels('top'));
    }

    const stone = ['#f0eee7', '#d1c9ba', '#f7f2e6'];
    const plaster = ['#ded9d0', '#b9b0a2', '#eee6d9'];
    const bronze = ['#855d46', '#634838', '#a77a53'];
    const panel = (u1, v1, u2, v2, color) => ({ u1, v1, u2, v2, color });
    const glass = ['#5a6b6a', '#89928a', '#4b595d', '#6f8383', '#626a64'];

    function windows(side, floor, columns) {
      if (side === 'top') return [];
      const result = [];
      for (let i = 0; i < columns; i++) {
        const left = i / columns;
        const right = (i + 1) / columns;
        result.push(
          panel(left, 0, right, 1, '#ad896d'),
          panel(left + .012, .18, right - .009, .91, '#4f4b46'),
          panel(left + .020, .19, right - .017, .81, glass[(floor + i) % glass.length]),
          panel(left + .022, .19, right - .019, .39, '#9da9a3')
        );
      }
      return result;
    }

    function glazing(side, floor) {
      if (side === 'top') return [];
      const columns = side === 'front' || side === 'back' ? 12 : 4;
      const panes = [];
      for (let i = 0; i < columns; i++) {
        const u = i / columns;
        const end = (i + 1) / columns;
        panes.push(panel(u + .008, .10, end - .008, .92, glass[(i + floor) % glass.length]));
        panes.push(panel(u + .012, .55, end - .012, .88, '#b3b6a5'));
        panes.push(panel(u + .019, .12, end - .015, .20, '#d3c4a3'));
      }
      return panes;
    }

    const bayEdges = [-4.25, -3.42, -2.59, -1.76, -.93, -.10, .73, 1.56, 2.39, 3.22, 4.25];
    const darkBays = new Set([2, 4]);
    const railMaterials = ['#7a9395', '#657d7d', '#aec1bd'];
    const darkCladding = ['#393732', '#4d4941', '#5e5449'];
    const balconyInterior = ['#473e34', '#67503c', '#a3815f'];
    const timber = ['#a5754c', '#6d4e35', '#bf9468'];
    function balconyBays(y, floor, id) {
      for (let i = 0; i < bayEdges.length - 1; i++) {
        const left = bayEdges[i];
        const right = bayEdges[i + 1];
        const dark = darkBays.has(i);
        if (dark) {
          box(left, right, y, y + 1.04, 1.63, 2.33, darkCladding, id, side =>
            side === 'front' ? [panel(.14, .28, .87, .72, '#262a28'),
              panel(.19, .31, .82, .68, glass[(floor + i) % glass.length]),
              panel(.59, .31, .64, .68, '#c6b592'), panel(0, 0, 1, .08, '#625d52')] : []);
          continue;
        }
        box(left, right, y, y + .91, 1.50, 1.65, balconyInterior, id, side =>
          side === 'front' ? [panel(.06, .10, .94, .80, glass[(floor + i) % glass.length]),
            panel(.09, .37, .91, .79, '#8fa5a4'), panel(.08, .73, .92, .96, '#ba895d'),
            panel(.22, .12, .36, .71, '#b9b2a0'), panel(.52, .10, .56, .73, '#4d4b43')] : []);
        box(left, left + .08, y, y + .91, 1.64, 2.27, plaster, id);
        box(left + .08, right, y + .76, y + .86, 1.64, 2.12, timber, id);
        box(left + .08, right, y + .025, y + .29, 2.21, 2.25, railMaterials, id, side =>
          side === 'front' ? [panel(.02, .06, .98, .86, '#b4c5c4a3'),
            panel(.48, 0, .51, 1, '#566965'), panel(0, .89, 1, 1, '#d6e0db')] : []);
      }
    }

    function podiumSlats(side) {
      if (side === 'top') return [];
      const count = side === 'front' || side === 'back' ? 43 : 18;
      return Array.from({ length: count }, (_, i) => {
        const u = i / count;
        return panel(u, 0, u + .35 / count, 1, i % 3 === 0 ? '#bf9770' : '#9d6d4d');
      });
    }

    box(-4.48, 4.62, -.23, 0, -1.08, 2.56, ['#a19f91','#777d70','#c6c0ab']);
    box(-3.16, -1.48, -.23, 0, -5.45, -1.08, ['#a19f91','#777d70','#c6c0ab']);
    box(-4.56, 4.50, 0, .73, -.88, 2.27, ['#353a34','#48463c','#9c8b71'], null, side => glazing(side, 1));
    for (const x of [-4.48, -3.22, -1.97, -.52, .79, 2.28, 3.73, 4.38]) {
      box(x, x + .078, .01, .73, 2.25, 2.36, stone);
    }
    box(-4.64, 4.53, .73, 1.18, -.94, 2.43, ['#654632','#5d3d2e','#a77a53'], null, podiumSlats);
    box(-4.48, 4.38, 1.18, 1.52, -.88, 2.02, darkCladding, null, side => glazing(side, 1));
    box(-4.66, 4.55, 1.52, 1.65, -.96, 2.45, stone);
    box(-2.86, -1.70, .69, .79, 2.35, 2.65, bronze);
    box(-3.12, -1.55, 0, 1.62, -5.40, -.96, bronze);

    for (let floor = 1; floor <= 12; floor++) {
      const y = floorHeight(floor);
      const id = String(floor).padStart(2, '0');
      box(-3.04, -1.56, y, y + .94, -4.46, -.72, plaster, id, side => windows(side, floor, 3));
      box(-3.12, -1.49, y + .88, y + 1.04, -4.55, -.84, stone, id);
      box(-4.24, 4.24, y, y + .94, -.72, 1.48, plaster, id, side => windows(side, floor, side === 'back' ? 10 : 3));
      balconyBays(y, floor, id);
      for (const [left, right, first, last] of [[-4.22,-3.67,4,9],[3.60,4.22,2,7]]) {
        if (floor < first || floor > last) continue;
        box(left, right, y, y + 1.04, 2.30, 2.39, bronze, id, side => {
          if (side !== 'front') return [];
          const bottom = floor === first ? .08 : 0;
          const top = floor === last ? .92 : 1;
          return [panel(.08, bottom, .92, top, '#82a5ae'), panel(.13, bottom, .30, top, '#b3cdd0'),
            panel(.67, bottom, .88, top, '#6c939b'), panel(.30, bottom, .33, top, '#d3ded9')];
        });
      }
      box(-4.36, 4.36, y + .86, y + 1.04, -.84, 2.30, stone, id);
      box(-.14, .10, y, y + 1.04, 1.48, 2.36, stone, id);
      box(4.18, 4.38, y, y + 1.04, 1.48, 2.32, stone, id);
    }

    // Highlight the approximate façade positions on the selected floor.
    addFace([[-1.56, floor11, 2.33], [-.50, floor11, 2.33],
      [-.50, floor11 + 1.04, 2.33], [-1.56, floor11 + 1.04, 2.33]],
      [0, 0, 1], '#d8f0a1', '11', [], '1108');
    addFace([[-3.13, floor11, -2.06], [-3.13, floor11, -.88],
      [-3.13, floor11 + 1.04, -.88], [-3.13, floor11 + 1.04, -2.06]],
      [-1, 0, 0], '#d8f0a1', '11', [], '1103');

    const roof = floorHeight(13);
    box(-3.12, -1.49, roof, roof + .20, -4.56, -.83, stone, '12');
    box(-4.38, 4.38, roof, roof + .21, -.84, 2.31, stone, '12');
    box(-4.10, 4.10, roof + .20, roof + .29, -.72, 2.08, ['#c8ab89','#ad9374','#ded0b6'], '12');
    box(-1.60, .78, roof + .28, roof + .33, .73, 1.72, ['#477b7a','#3d7371','#77aca4'], '12');
    box(2.28, 3.96, roof + .28, roof + .77, -.63, .63, plaster, '12');
    for (const x of [1.06, 2.05]) {
      box(x, x + .07, roof + .29, roof + 1.02, 1.67, 1.74, bronze, '12');
    }
    box(.96, 2.21, roof + .99, roof + 1.11, .96, 1.80, bronze, '12');
    return surfaces;
  }

  function neighbourhoodFaces(footprints) {
    const faces = [];
    for (const { outline, height, kind } of footprints) {
      const estimatedMetres = kind === 'apartments' ? 24 : kind === 'residential' ? 10 : 6;
      const top = (height ?? estimatedMetres) / 3.35;
      const base = -.22;
      const centre = outline.reduce(([x, z], point) => [x + point[0] / outline.length, z + point[1] / outline.length], [0, 0]);
      const near = Math.hypot(...centre) < 48;
      const signedArea = outline.reduce((area, [x, z], i) => {
        const [nextX, nextZ] = outline[(i + 1) % outline.length];
        return area + x * nextZ - nextX * z;
      }, 0);
      const winding = Math.sign(signedArea);
      faces.push({ points: outline.map(([x, z]) => [x, top, z]), normal: [0, 1, 0], color: kind === 'apartments' ? '#b6aaa0' : '#a4a29a' });
      for (let i = 0; i < outline.length; i++) {
        const [x, z] = outline[i];
        const [nextX, nextZ] = outline[(i + 1) % outline.length];
        const normal = [winding * (nextZ - z), 0, winding * (x - nextX)];
        const color = Math.abs(normal[0]) > Math.abs(normal[2]) ? '#797e79' : '#918b80';
        const columns = Math.min(14, Math.floor(Math.hypot(nextX - x, nextZ - z) * 1.45));
        const details = [];
        if (near && columns >= 2 && (kind === 'apartments' || height >= 9)) {
          const floors = Math.max(1, Math.min(20, Math.round(top)));
          for (let floor = 0; floor < floors; floor++) {
            details.push({ u1: 0, v1: (floor + .85) / floors, u2: 1, v2: (floor + .99) / floors, color: '#d7cbbb' });
            for (let bay = 0; bay < columns; bay++) {
              details.push({ u1: (bay + .21) / columns, v1: (floor + .21) / floors,
                u2: (bay + .77) / columns, v2: (floor + .76) / floors, color: bay % 3 === 0 ? '#586e6c' : '#76847e' });
            }
          }
        }
        faces.push({ points: [[x, base, z], [nextX, base, nextZ], [nextX, top, nextZ], [x, top, z]], normal, color, details });
      }
    }
    return faces;
  }

  function trace(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.closePath();
  }

  function contains(points, x, y) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j];
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  }

  function palmsAlongParks(parks) {
    const palms = [];
    for (const outline of parks) {
      const left = Math.min(...outline.map(([x]) => x));
      const right = Math.max(...outline.map(([x]) => x));
      const top = Math.min(...outline.map(([, z]) => z));
      const bottom = Math.max(...outline.map(([, z]) => z));
      const polygon = outline.map(([x, z]) => ({ x, y: z }));
      for (let x = left + 1.3; x < right - 1; x += 2.1) {
        const inside = [];
        for (let z = top; z < bottom; z += .26) {
          if (contains(polygon, x, z)) inside.push(z);
        }
        if (inside.length < 2) continue;
        const fractions = inside.length > 12 && Math.sin(x * 2) > -.25 ? [.28, .75] : [.51];
        for (const fraction of fractions) {
          const index = palms.length;
          const z = inside[Math.floor((inside.length - 1) * fraction)];
          palms.push({ x, z, y: 1.28 + .72 * (Math.sin(index * 3.8) + 1) / 2, angle: index * 2.39 });
        }
      }
    }
    return palms;
  }

  function balconySurfaces() {
    const panels = [];
    const edge = 2.49;
    const base = floor11 + .04;
    const top = floor11 + .32;
    panels.push({
      colour: '#a4c9c325',
      points: [[-1.81,base,edge],[-.27,base,edge],[-.27,top,edge],[-1.81,top,edge]]
    });
    panels.push({
      colour: '#69716c',
      points: [[-1.82,top-.005,edge],[-.26,top-.005,edge],[-.26,top+.008,edge],[-1.82,top+.008,edge]]
    });
    for (const x of [-1.81,-1.43,-.61,-.27]) {
      panels.push({
        colour: '#4d5552',
        points: [[x-.006,base,edge],[x+.006,base,edge],[x+.006,top,edge],[x-.006,top,edge]]
      });
    }
    return panels;
  }

  function createBuilding(canvas, { availableFloors, ground, visitPoints, walkPoints, onSelect, onHover, onViewChange, onPosition }) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const tower = buildScene();
    let neighbours = [];
    let streets = [];
    let parks = [];
    let shoreline = [];
    let palms = [];
    const railing = balconySurfaces();
    let contactOutlines = [];
    let selectedUnit = null;
    let floorEmphasis = false;
    const camera = cameraView(initialView);
    let preset = 'orla';
    let outlineVisible = false;
    let walkVisible = false;
    let frontageCameraVisible = false;
    let satelliteOnly = false;
    let width = 0;
    let height = 0;
    let frame = 0;
    let projectedFaces = [];
    let selected = null;
    let hovered = null;
    let simulation = null;
    let balconyPreset = 'sea';
    let light = lighting.day;
    let flight = null;

    function draw(now) {
      frame = 0;
      if (!width || !height) return;
      if (flight) {
        const progress = Math.min(1, (now - flight.start) / 560);
        const eased = progress * progress * (3 - 2 * progress);
        for (const key of ['yaw', 'pitch', 'zoom', 'target', 'frameOffset', 'frameOffsetX']) {
          camera[key] = flight.from[key] + (flight.to[key] - flight.from[key]) * eased;
        }
        if (progress === 1) {
          flight = null;
          reportZoom();
        } else {
          redraw();
        }
      }

      ctx.clearRect(0, 0, width, height);
      const yaw = simulation?.yaw ?? camera.yaw;
      const pitch = simulation?.pitch ?? camera.pitch;
      const streetCamera = !simulation && preset === 'street-camera';
      const firstPerson = Boolean(simulation || streetCamera);
      const eye = streetCamera ? [visitPoints.frontage[0], .46, visitPoints.frontage[2]] : balconyEye;
      const sinYaw = Math.sin(yaw), cosYaw = Math.cos(yaw);
      const sinPitch = Math.sin(pitch), cosPitch = Math.cos(pitch);
      const scale = firstPerson ? Math.min(width, height * 1.8) * (streetCamera ? .48 : .72) / fieldOfView
        : Math.max(5, Math.min((width - 32) / 12.3, (height - 95) / 16.5));
      const distance = fieldOfView / camera.zoom;
      const target = camera.target;
      const centreX = width * (.50 + (firstPerson ? 0 : camera.frameOffsetX));
      const centreY = firstPerson ? height * .47 : height * (.37 - .10 * camera.zoom + camera.frameOffset);

      function homogeneous(x, y, z) {
        if (firstPerson) {
          const [eyeX, eyeY, eyeZ] = eye;
          const dx = x - eyeX, dz = z - eyeZ;
          const ahead = dx * sinYaw + dz * cosYaw;
          const vertical = y * .69 - eyeY;
          const depth = ahead * cosPitch - vertical * sinPitch;
          const w = depth / fieldOfView;
          return {
            x: centreX * w - (dx * cosYaw - dz * sinYaw) * scale,
            y: centreY * w - (vertical * cosPitch + ahead * sinPitch) * scale,
            w,
            depth: -depth
          };
        }
        const ahead = x * sinYaw + z * cosYaw;
        const vertical = y * .69 - target;
        const depth = ahead * cosPitch + vertical * sinPitch;
        const w = (distance - depth) / fieldOfView;
        return {
          x: centreX * w + (x * cosYaw - z * sinYaw) * scale,
          y: centreY * w - (vertical * cosPitch - ahead * sinPitch) * scale,
          w,
          depth
        };
      }

      function project([x, y, z]) {
        const point = homogeneous(x, y, z);
        return { x: point.x / point.w, y: point.y / point.w, depth: point.depth, w: point.w };
      }

      if (ground) {
        // The image is a north-up Web Mercator crop. Its CSS transform uses the
        // same homogeneous projection as the tower, including perspective.
        const { element, size, metresPerPixel, originX, originZ, metresPerUnit } = ground;
        const unitPerPixel = metresPerPixel / metresPerUnit;
        const x = originX / metresPerUnit - size * unitPerPixel / 2;
        const z = originZ / metresPerUnit - size * unitPerPixel / 2;
        const origin = homogeneous(x, -.24, z);
        const right = homogeneous(x + unitPerPixel, -.24, z);
        const down = homogeneous(x, -.24, z + unitPerPixel);
        const matrix = [
          right.x - origin.x, right.y - origin.y, 0, right.w - origin.w,
          down.x - origin.x, down.y - origin.y, 0, down.w - origin.w,
          0, 0, 1, 0,
          origin.x, origin.y, 0, origin.w
        ];
        element.style.transform = 'matrix3d(' + matrix.join(',') + ')';
      }

      const faces = satelliteOnly && !simulation ? [] : cameraFaces();
      const unitPoints = {};
      if (!firstPerson) {
        for (const { surface, points } of faces) {
          if (!surface?.unit) continue;
          const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
          const y = points.reduce((sum, point) => sum + point.y, 0) / points.length;
          if (x < 8 || x > width - 8 || y < 8 || y > height - 8) continue;
          const hit = pickFromFaces(faces, x, y);
          if (hit?.unit === surface.unit) unitPoints[surface.unit] = { x, y };
        }
      }
      onPosition({
        footprint: project([0, -.21, 1.3]),
        rooftop: project([0, floorHeight(13) + .29, .40]),
        floor: project(sinYaw < -.75
          ? [-3.13, floor11 + .56, -4.5]
          : cosYaw < -.30
            ? [-4.36, floor11 + .56, -.84]
            : [4.36, floor11 + .56, 2.31]),
        units: unitPoints,
        beach: project([25, -.24, 24]),
        avenue: project([-17, -.24, 13]),
        visit: Object.fromEntries(Object.entries(visitPoints).map(([id, point]) => [id, project(point)])),
        heading: (firstPerson ? Math.PI - yaw : -yaw) * 180 / Math.PI,
        preset,
        simulationYaw: simulation?.yaw,
        simulationPitch: simulation?.pitch,
        balconyPreset,
        width,
        height
      });

      projectedFaces = firstPerson ? [] : faces;
      if (streetCamera) {
        const pavement = ctx.createLinearGradient(0, height * .85, 0, height);
        pavement.addColorStop(0, '#8c8e7c00');
        pavement.addColorStop(.22, '#9e9b88');
        pavement.addColorStop(1, '#72766c');
        ctx.fillStyle = pavement;
        ctx.fillRect(0, height * .85, width, height * .15);
      }
      if (satelliteOnly && !simulation) {
        drawFootprint();
        drawWalk();
        drawFrontageCamera();
        return;
      }

      function cameraFaces() {
        const visible = [];
        for (const surface of simulation ? neighbours : [...neighbours, ...tower]) {
          const [nx, ny, nz] = surface.normal;
          if (firstPerson) {
            const [x, y, z] = surface.points[0];
            if (nx * (eye[0] - x) + ny * (eye[1] - y * .69) + nz * (eye[2] - z) <= 0) continue;
          } else if (nx * sinYaw * cosPitch + ny * sinPitch + nz * cosYaw * cosPitch <= 0) continue;
          const clipped = streetCamera ? clipNear(surface.points) : null;
          if (clipped && clipped.length < 3) continue;
          const points = clipped ? clipped.map(point => ({ x: point.x / point.w, y: point.y / point.w, depth: point.depth, w: point.w })) : surface.points.map(project);
          if (points.some(point => point.w <= 0)) continue;
          const depth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
          visible.push({ surface, points, depth });
        }
        for (const palm of palms) {
          const base = project([palm.x,-.23,palm.z]);
          const crown = project([palm.x,palm.y,palm.z]);
          if (base.w <= .025 || crown.w <= .025 || crown.x < -90 || crown.x > width + 90) continue;
          visible.push({ palm, depth: crown.depth });
        }
        return visible.sort((a, b) => a.depth - b.depth);
      }
      for (const outline of parks) {
        const points = outline.map(([x, z]) => project([x, -.238, z]));
        if (points.some(point => point.w <= 0)) continue;
        trace(ctx, points);
        ctx.fillStyle = '#53734970';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#bdc39a84';
        ctx.stroke();
      }
      if (!simulation && shoreline.length > 1) {
        const edge = shoreline.map(([x, z]) => project([x, -.235, z]));
        if (edge.every(point => point.w > .02)) {
          ctx.beginPath();
          ctx.moveTo(edge[0].x, edge[0].y);
          for (const point of edge.slice(1)) ctx.lineTo(point.x, point.y);
          ctx.strokeStyle = '#fbefd05e';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }
      const streetOpacity = simulation ? .55 : clamp((camera.zoom - .20) / .44, 0, .76);
      if (streetOpacity > 0) {
        const streetStyles = {
          primary: { colour: '#5d6060', edge: '#a29b8e', width: 1.46, lanes: true },
          residential: { colour: '#656563', edge: '#a9a191', width: .87 },
          footway: { colour: '#d4baa0', edge: '#e1cab1', width: .56 },
          cycleway: { colour: '#8d5c50', edge: '#d4c2aa', width: .34 }
        };
        ctx.save();
        ctx.globalAlpha = streetOpacity;
        for (const { kind, points } of streets) {
          const style = streetStyles[kind];
          for (let i = 1; i < points.length; i++) {
            const [ax, az] = points[i-1];
            const [bx, bz] = points[i];
            const length = Math.hypot(bx-ax, bz-az);
            if (length < .01) continue;
            const edgeX = (az-bz) / length;
            const edgeZ = (bx-ax) / length;
            for (const [spread, colour] of [[style.width / 2 + .13, style.edge], [style.width / 2, style.colour]]) {
              const segment = [[ax+edgeX*spread,-.231,az+edgeZ*spread], [bx+edgeX*spread,-.231,bz+edgeZ*spread],
                [bx-edgeX*spread,-.231,bz-edgeZ*spread], [ax-edgeX*spread,-.231,az-edgeZ*spread]].map(project);
              if (segment.some(point => point.w <= 0)) continue;
              trace(ctx, segment);
              ctx.fillStyle = colour;
              ctx.fill();
            }
            if (style.lanes) {
              const start = project([ax,-.229,az]);
              const end = project([bx,-.229,bz]);
              if (start.w <= 0 || end.w <= 0) continue;
              ctx.beginPath();
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.lineWidth = 1;
              ctx.strokeStyle = '#eee4ca';
              ctx.setLineDash([6, 8]);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
        ctx.restore();
      }

      for (const { outline, top } of simulation ? contactOutlines : [...contactOutlines, { outline: towerFootprint, top: 14 }]) {
        const [shadowX, shadowZ] = light.shadow;
        const offsetX = top * shadowX, offsetZ = top * shadowZ;
        const shadow = outline.map(([x,z]) => project([x + offsetX, -.22, z + offsetZ]));
        if (shadow.some(point => point.w <= 0)) continue;
        trace(ctx, shadow);
        for (let index = 0; index < outline.length; index++) {
          const next = (index + 1) % outline.length;
          const [x, z] = outline[index], [nx, nz] = outline[next];
          const start = project([x, -.22, z]), end = project([nx, -.22, nz]);
          if (start.w <= 0 || end.w <= 0) continue;
          ctx.moveTo(start.x, start.y);
          for (const point of [end, shadow[next], shadow[index]]) ctx.lineTo(point.x, point.y);
          ctx.closePath();
        }
        ctx.fillStyle = '#17252154';
        ctx.fill();
      }

      for (const { surface, points, palm } of faces) {
        if (palm) {
          drawPalm(palm);
          continue;
        }
        if (surface.unit) {
          const active = surface.unit === selectedUnit;
          const highlighted = surface.unit === hovered?.unit;
          trace(ctx, points);
          ctx.fillStyle = active ? '#d8f0a16b' : highlighted ? '#d8f0a19c' : '#d8f0a129';
          ctx.fill();
          if (active || highlighted) {
            ctx.strokeStyle = '#eaffbe';
            ctx.lineWidth = 1.35;
            ctx.stroke();
          }
          continue;
        }
        trace(ctx, points);
        ctx.fillStyle = surface.color;
        ctx.fill();
        const [nx, ny, nz] = surface.normal;
        const direction = Math.hypot(nx, ny, nz) || 1;
        const [sunX, sunY, sunZ] = light.sun;
        const incidence = clamp((sunX * nx + sunY * ny + sunZ * nz) / direction, -.7, 1);
        if (!surface.details) {
          ctx.fillStyle = light.tone + (light.ambient - incidence * .12) + ')';
          ctx.fill();
          continue;
        }
        const [origin, right, , top] = surface.points;
        function onFace(u, v) {
          return project(origin.map((value, axis) => value + (right[axis] - value) * u + (top[axis] - value) * v));
        }
        for (const { u1, v1, u2, v2, color } of surface.details) {
          const panel = [onFace(u1,v1), onFace(u2,v1), onFace(u2,v2), onFace(u1,v2)];
          if (streetCamera && panel.some(point => point.w <= .004)) continue;
          trace(ctx, panel);
          ctx.fillStyle = color;
          ctx.fill();
        }
        if (incidence < .55 || light === lighting.dusk) {
          trace(ctx, points);
          ctx.fillStyle = light.tone + (light.ambient - incidence * .12) + ')';
          ctx.fill();
          if (light === lighting.dusk && incidence > .30) {
            ctx.fillStyle = 'rgba(255,170,94,' + (incidence * .22) + ')';
            ctx.fill();
          }
        }
        const { floor } = surface;
        if (!floor) continue;
        let tint;
        if (floor === selected) tint = availableFloors.has(floor) ? (floorEmphasis ? '#d6f298ad' : selectedUnit ? '#d6f29818' : '#d6f29834') : '#b5d9caa0';
        else if (floor === hovered?.floor && !hovered.unit) tint = '#c2f5d294';
        else if (!selected && availableFloors.has(floor)) tint = '#b8f2cc29';
        if (tint) {
          trace(ctx, points);
          ctx.fillStyle = tint;
          ctx.fill();
        }
      }
      if (simulation) {
        for (const { points, colour } of railing) {
          const clipped = clipNear(points);
          if (clipped.length < 3) continue;
          trace(ctx, clipped.map(point => ({ x: point.x / point.w, y: point.y / point.w })));
          ctx.fillStyle = colour;
          ctx.fill();
        }
      }

      function clipNear(points) {
        const near = .004;
        const source = points.map(point => homogeneous(...point));
        const result = [];
        for (const [i, point] of source.entries()) {
          const previous = source[(i + source.length - 1) % source.length];
          if ((previous.w >= near) !== (point.w >= near)) {
            const t = (near - previous.w) / (point.w - previous.w);
            result.push({ x: previous.x + t * (point.x - previous.x), y: previous.y + t * (point.y - previous.y),
              depth: previous.depth + t * (point.depth - previous.depth), w: near });
          }
          if (point.w >= near) result.push(point);
        }
        return result;
      }

      function drawPalm({ x, z, y, angle }) {
        const base = project([x,-.23,z]);
        const crown = project([x+.08,y,z]);
        const length = Math.hypot(crown.x-base.x,crown.y-base.y);
        if (length < 3) return;
        ctx.strokeStyle = light === lighting.dusk ? '#6a5948' : '#786958';
        ctx.lineWidth = clamp(length * .054, .7, 3.5);
        ctx.beginPath();
        ctx.moveTo(base.x,base.y);
        ctx.lineTo(crown.x,crown.y);
        ctx.stroke();
        for (let i = 0; i < 7; i++) {
          const direction = angle + i * Math.PI * 2 / 7;
          const dx = Math.cos(direction) * .46, dz = Math.sin(direction) * .46;
          const bend = project([x+.08+dx*.65,y+.23,z+dz*.65]);
          const end = project([x+.08+dx,y-.11,z+dz]);
          ctx.fillStyle = light === lighting.dusk
            ? (i % 2 ? '#627044' : '#40593b') : (i % 2 ? '#638853' : '#386b48');
          const frondWidth = clamp(length * .085, .6, 4);
          ctx.beginPath();
          ctx.moveTo(crown.x,crown.y);
          ctx.quadraticCurveTo(bend.x,bend.y-frondWidth,end.x,end.y);
          ctx.quadraticCurveTo(bend.x,bend.y+frondWidth,crown.x,crown.y);
          ctx.fill();
        }
      }
      drawFootprint();
      drawWalk();
      drawFrontageCamera();
      function drawFrontageCamera() {
        if (!frontageCameraVisible || simulation) return;
        const [x, , z] = visitPoints.frontage;
        const azimuth = 331 * Math.PI / 180;
        const start = project([x, -.10, z]);
        const direction = project([x + 6 * Math.sin(azimuth), -.10, z - 6 * Math.cos(azimuth)]);
        if (start.w <= .02 || direction.w <= .02) return;
        const angle = Math.atan2(direction.y - start.y, direction.x - start.x);
        ctx.save();
        ctx.translate(start.x, start.y);
        ctx.rotate(angle);
        const length = Math.max(16, Math.hypot(direction.x - start.x, direction.y - start.y));
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(length - 9, -3);
        ctx.lineTo(length - 9, -8);
        ctx.lineTo(length, 0);
        ctx.lineTo(length - 9, 8);
        ctx.lineTo(length - 9, 3);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fillStyle = '#80eedc';
        ctx.strokeStyle = '#164b42';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      function drawWalk() {
        if (!walkVisible || simulation) return;
        const projected = walkPoints.map(([x, z]) => project([x, -.14, z]));
        ctx.save();
        ctx.beginPath();
        let penDown = false;
        for (const point of projected) {
          if (point.w <= .004) {
            penDown = false;
          } else {
            if (penDown) ctx.lineTo(point.x, point.y);
            else ctx.moveTo(point.x, point.y);
            penDown = true;
          }
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#103c37';
        ctx.stroke();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#79f1e3';
        ctx.stroke();
        ctx.restore();
      }
      function drawFootprint() {
        if (!outlineVisible || simulation) return;
        trace(ctx, towerFootprint.map(([x, z]) => project([x, -.10, z])));
        ctx.strokeStyle = '#183a31';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.strokeStyle = '#e7f5aa';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    function redraw() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      width = rect.width;
      height = rect.height;
      const resolution = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * resolution);
      canvas.height = Math.round(height * resolution);
      ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
      redraw();
    }

    function pickFromFaces(faces, x, y) {
      for (let i = faces.length - 1; i >= 0; i--) {
        const { surface, points } = faces[i];
        if (surface && contains(points, x, y)) return surface.floor ? surface : null;
      }
      return null;
    }

    function setHover(hit, x, y) {
      const next = hit ? { floor: hit.floor, unit: hit.unit || null } : null;
      if (hovered?.floor !== next?.floor || hovered?.unit !== next?.unit) {
        hovered = next;
        canvas.classList.toggle('over-floor', Boolean(next));
        redraw();
      }
      onHover(next, x, y);
    }

    function reportZoom() {
      onViewChange(camera.zoom <= minZoom, camera.zoom >= maxZoom);
    }

    function cameraView(view) {
      return { frameOffset: 0, frameOffsetX: 0, ...view, target: view.target ?? clamp((view.zoom - .13) * 6.7, .5, 5.25) };
    }

    function moveTo(view) {
      const difference = Math.atan2(Math.sin(view.yaw - camera.yaw), Math.cos(view.yaw - camera.yaw));
      const destination = { ...cameraView(view), yaw: camera.yaw + difference };
      if (reduceMotion.matches) {
        Object.assign(camera, destination);
        reportZoom();
      } else {
        flight = { from: { ...camera }, to: destination, start: performance.now() };
      }
      setHover(null);
      redraw();
    }

    function changeView(action) {
      if (simulation) {
        balconyPreset = action === 'reset' ? 'sea' : null;
        switch (action) {
          case 'left': simulation.yaw = clamp(simulation.yaw + .24, -1.12, 1.12); break;
          case 'right': simulation.yaw = clamp(simulation.yaw - .24, -1.12, 1.12); break;
          case 'up': simulation.pitch = clamp(simulation.pitch - .08, -.08, .58); break;
          case 'down': simulation.pitch = clamp(simulation.pitch + .08, -.08, .58); break;
          case 'reset': simulation = { ...balconyViews.sea }; break;
        }
        redraw();
        return;
      }
      if (preset === 'street-camera') Object.assign(camera, cameraView(facadeView));
      flight = null;
      if (action === 'street-camera') {
        preset = action;
        Object.assign(camera, cameraView({ ...facadeView, yaw: -151 * Math.PI / 180, pitch: -29 * Math.PI / 180 }));
        reportZoom();
        setHover(null);
        redraw();
        return;
      }
      preset = ['orla', 'facade', 'entrance', 'rear', 'aerial', 'site-plan'].includes(action) ? action : null;
      switch (action) {
        case 'left': camera.yaw -= Math.PI / 8; break;
        case 'right': camera.yaw += Math.PI / 8; break;
        case 'up': camera.pitch = clamp(camera.pitch + .10, .37, Math.PI / 2); break;
        case 'down': camera.pitch = clamp(camera.pitch - .10, .37, Math.PI / 2); break;
        case 'in': setZoom(camera.zoom * 1.24); break;
        case 'out': setZoom(camera.zoom / 1.24); break;
        case 'aerial': moveTo(aerialView); return;
        case 'site-plan': moveTo(sitePlanView); return;
        case 'walk': moveTo(walkView); return;
        case 'facade': moveTo(facadeView); return;
        case 'entrance': moveTo(entranceView); return;
        case 'rear': moveTo(rearView); return;
        case 'reset': changeView(outlineVisible ? 'aerial' : 'orla'); return;
        case 'orla':
        case 'model': preset = 'orla'; moveTo(initialView); return;
      }
      reportZoom();
      setHover(null);
      redraw();
    }

    function setZoom(value) {
      const previousTarget = cameraView({ zoom: camera.zoom }).target;
      camera.zoom = clamp(value, minZoom, maxZoom);
      camera.target = clamp(camera.target + cameraView({ zoom: camera.zoom }).target - previousTarget, .5, 6.2);
    }

    const pointers = new Map();
    let dragged = false;
    let start = null;
    function coordinates(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointers.size >= 2) return;
      flight = null;
      const position = coordinates(event);
      if (!pointers.size) {
        start = position;
        dragged = false;
      } else {
        dragged = true;
      }
      pointers.set(event.pointerId, position);
      canvas.setPointerCapture(event.pointerId);
      setHover(null);
    });

    canvas.addEventListener('pointermove', event => {
      const current = coordinates(event);
      const previous = pointers.get(event.pointerId);
      if (!previous) {
        if (!pointers.size && event.pointerType === 'mouse') setHover(pickFromFaces(projectedFaces, current.x, current.y), current.x, current.y);
        return;
      }
      pointers.set(event.pointerId, current);
      if (preset === 'street-camera') return;
      if (!simulation) preset = null;
      if (simulation) {
        if (!dragged && distance(current, start) < 5) return;
        dragged = true;
        balconyPreset = null;
        simulation.yaw = clamp(simulation.yaw + (current.x - previous.x) * .007, -1.12, 1.12);
        simulation.pitch = clamp(simulation.pitch - (current.y - previous.y) * .004, -.08, .58);
      } else if (pointers.size === 2) {
        const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1];
        const previousGap = distance(previous, other);
        if (previousGap > 1) setZoom(camera.zoom * distance(current, other) / previousGap);
        reportZoom();
      } else {
        if (!dragged && distance(current, start) < 5) return;
        dragged = true;
        camera.yaw -= (current.x - previous.x) * .010;
        camera.pitch = clamp(camera.pitch + (current.y - previous.y) * .005, .37, Math.PI / 2);
      }
      canvas.classList.add('dragging');
      redraw();
    });

    function endPointer(event) {
      if (!pointers.delete(event.pointerId)) return;
      if (!pointers.size) {
        canvas.classList.remove('dragging');
        if (!dragged && event.type === 'pointerup') {
          const { x, y } = coordinates(event);
          const hit = pickFromFaces(projectedFaces, x, y);
          if (hit && !simulation) onSelect({ floor: hit.floor, unit: hit.unit });
        }
      }
    }

    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(event, endPointer);
    }
    canvas.addEventListener('pointerleave', () => setHover(null));
    canvas.addEventListener('keydown', event => {
      const action = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        '+': 'in', '=': 'in', '-': 'out', Home: 'reset'
      }[event.key];
      if (!action) return;
      event.preventDefault();
      changeView(action);
    });
    new ResizeObserver(resize).observe(canvas);
    resize();
    return {
      changeView,
      changeLighting(preset) {
        light = lighting[preset];
        redraw();
      },
      lookFromBalcony(preset) {
        if (!simulation) return;
        balconyPreset = preset;
        simulation = { ...balconyViews[preset] };
        redraw();
      },
      showFootprint(visible) {
        outlineVisible = visible;
        redraw();
      },
      showWalk(visible) {
        walkVisible = visible;
        redraw();
      },
      showFrontageCamera(visible) {
        frontageCameraVisible = visible;
        redraw();
      },
      showSatelliteOnly(enabled) {
        satelliteOnly = enabled;
        setHover(null);
        redraw();
      },
      showUnit(id, { rotate = true } = {}) {
        selectedUnit = id;
        if (id && rotate) {
          if (preset === 'street-camera') Object.assign(camera, cameraView(facadeView));
          preset = unitPresets[id];
          moveTo(preset === 'rear' ? rearView : unitView);
        } else redraw();
      },
      emphasizeFloor(enabled) {
        floorEmphasis = enabled;
        redraw();
      },
      simulate(enabled) {
        flight = null;
        balconyPreset = 'sea';
        simulation = enabled ? { ...balconyViews.sea } : null;
        setHover(null);
        redraw();
      },
      setBalconyCamera(yaw, pitch) {
        if (!simulation) return;
        simulation = { yaw: clamp(yaw, -1.12, 1.12), pitch: clamp(pitch, -.08, .58) };
        balconyPreset = Object.keys(balconyViews).find(name => {
          const view = balconyViews[name];
          return view.yaw === simulation.yaw && view.pitch === simulation.pitch;
        }) || null;
        redraw();
      },
      setNeighbours(footprints) {
        neighbours = neighbourhoodFaces(footprints);
        contactOutlines = footprints.map(({ outline, height }) => ({ outline, top: (height ?? 10) / 3.35 }));
        redraw();
      },
      setStreets(features) {
        streets = features;
        redraw();
      },
      setParks(features) {
        parks = features;
        palms = palmsAlongParks(features);
        redraw();
      },
      setShoreline(points) {
        shoreline = points;
        redraw();
      },
      select(floor) {
        selected = floor;
        redraw();
      }
    };
  }

  window.createBuilding = createBuilding;
})();
