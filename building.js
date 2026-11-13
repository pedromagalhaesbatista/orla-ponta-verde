(() => {
  const initialView = { yaw: -.24, pitch: .94, zoom: .43 };
  const closeView = { yaw: -.29, pitch: .62, zoom: .88 };
  const rearView = { yaw: -1.78, pitch: .78, zoom: .82 };
  const floorHeight = floor => 1.62 + (floor - 1) * 1.04;
  const floor11 = floorHeight(11);
  const balconyEye = [-1.03, (floor11 + .60) * .69, 2.38];
  const unitAngles = { '1103': rearView, '1108': closeView };
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
    const darkBays = new Set([0, 3, 6, 9]);
    const railMaterials = ['#8fa2a2', '#728787', '#a9bab5'];
    const darkCladding = ['#49443f', '#4d4941', '#61594e'];
    const balconyInterior = ['#473e34', '#67503c', '#a3815f'];
    function balconyBays(y, floor, id) {
      for (let i = 0; i < bayEdges.length - 1; i++) {
        const left = bayEdges[i];
        const right = bayEdges[i + 1];
        const dark = darkBays.has(i);
        if (dark) {
          box(left, right, y, y + .91, 1.63, 2.07, darkCladding, id, side =>
            side === 'front' ? [panel(.18, .30, .80, .74, glass[(floor + i) % glass.length])] : []);
          continue;
        }
        box(left, right, y, y + .91, 1.50, 1.65, balconyInterior, id, side =>
          side === 'front' ? [panel(.08, .12, .91, .86, glass[(floor + i) % glass.length]),
            panel(.54, .12, .57, .86, '#4d4b43')] : []);
        box(left, left + .07, y, y + .91, 1.64, 2.27, plaster, id);
        box(left, right, y + .035, y + .34, 2.21, 2.25, railMaterials, id, side =>
          side === 'front' ? [panel(.48, 0, .51, 1, '#586b68'), panel(0, .84, 1, 1, '#c6d2cc')] : []);
      }
    }

    function podiumSlats(side) {
      if (side === 'top') return [];
      const count = side === 'front' || side === 'back' ? 43 : 18;
      return Array.from({ length: count }, (_, i) => {
        const u = i / count;
        return panel(u, 0, u + .35 / count, 1, '#b38967');
      });
    }

    box(-4.48, 4.62, -.23, 0, -1.08, 2.56, ['#a19f91','#777d70','#c6c0ab']);
    box(-3.16, -1.48, -.23, 0, -5.45, -1.08, ['#a19f91','#777d70','#c6c0ab']);
    box(-4.56, 4.50, 0, .73, -.88, 2.27, ['#504c41','#605546','#9c8b71'], null, side => glazing(side, 1));
    for (const x of [-4.48, -3.22, -1.97, -.52, .79, 2.28, 3.73, 4.38]) {
      box(x, x + .078, .01, .73, 2.25, 2.36, stone);
    }
    box(-4.64, 4.53, .73, 1.53, -.94, 2.42, bronze, null, podiumSlats);
    box(-4.66, 4.55, 1.52, 1.65, -.96, 2.45, stone);
    box(-3.12, -1.55, 0, 1.62, -5.40, -.96, bronze);

    for (let floor = 1; floor <= 12; floor++) {
      const y = floorHeight(floor);
      const id = String(floor).padStart(2, '0');
      box(-3.04, -1.56, y, y + .94, -4.46, -.72, plaster, id, side => windows(side, floor, 3));
      box(-3.12, -1.49, y + .88, y + 1.04, -4.55, -.84, stone, id);
      box(-4.24, 4.24, y, y + .94, -.72, 1.48, plaster, id, side => windows(side, floor, side === 'back' ? 10 : 3));
      balconyBays(y, floor, id);
      box(-4.36, 4.36, y + .86, y + 1.04, -.84, 2.30, stone, id);
      box(-.11, .05, y, y + 1.04, 1.48, 2.32, stone, id);
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
        faces.push({ points: [[x, base, z], [nextX, base, nextZ], [nextX, top, nextZ], [x, top, z]], normal, color });
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

  function createBuilding(canvas, { availableFloors, ground, onSelect, onHover, onViewChange, onPosition }) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const tower = buildScene();
    let neighbours = [];
    let streets = [];
    let contactOutlines = [];
    let selectedUnit = null;
    const camera = { ...initialView };
    let width = 0;
    let height = 0;
    let frame = 0;
    let projectedFaces = [];
    let selected = null;
    let hovered = null;
    let simulation = null;
    let flight = null;

    function draw(now) {
      frame = 0;
      if (!width || !height) return;
      if (flight) {
        const progress = Math.min(1, (now - flight.start) / 560);
        const eased = progress * progress * (3 - 2 * progress);
        for (const key of ['yaw', 'pitch', 'zoom']) {
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
      const sinYaw = Math.sin(yaw), cosYaw = Math.cos(yaw);
      const sinPitch = Math.sin(pitch), cosPitch = Math.cos(pitch);
      const scale = simulation ? Math.min(width, height * 1.8) * .72 / fieldOfView
        : Math.max(5, Math.min((width - 32) / 12.3, (height - 95) / 16.5));
      const distance = fieldOfView / camera.zoom;
      const target = clamp((camera.zoom - .13) * 8, .5, 5.4);
      const centreX = width * .50;
      const centreY = simulation ? height * .47 : height * (.42 - .13 * camera.zoom);

      function homogeneous(x, y, z) {
        if (simulation) {
          const [eyeX, eyeY, eyeZ] = balconyEye;
          const dx = x - eyeX, dz = z - eyeZ;
          const ahead = dx * sinYaw + dz * cosYaw;
          const vertical = y * .69 - eyeY;
          const depth = ahead * cosPitch - vertical * sinPitch;
          const w = depth / fieldOfView;
          return {
            x: centreX * w + (dx * cosYaw - dz * sinYaw) * scale,
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

      const faces = cameraFaces();
      const unitPoints = {};
      if (!simulation) {
        for (const { surface, points } of faces) {
          if (!surface.unit) continue;
          const x = points.reduce((sum, point) => sum + point.x, 0) / points.length;
          const y = points.reduce((sum, point) => sum + point.y, 0) / points.length;
          if (x < 8 || x > width - 8 || y < 8 || y > height - 8) continue;
          const hit = pickFromFaces(faces, x, y);
          if (hit?.unit === surface.unit) unitPoints[surface.unit] = { x, y };
        }
      }
      onPosition({
        tower: project([0, 16.2, 0]),
        floor: project(sinYaw < -.75
          ? [-3.13, floor11 + .56, -4.5]
          : cosYaw < -.30
            ? [-4.36, floor11 + .56, -.84]
            : [4.36, floor11 + .56, 2.31]),
        units: unitPoints,
        beach: project([25, -.24, 24]),
        avenue: project([-17, -.24, 13]),
        width,
        height
      });

      function cameraFaces() {
        const visible = [];
        for (const surface of simulation ? neighbours : [...neighbours, ...tower]) {
          const [nx, ny, nz] = surface.normal;
          if (simulation) {
            const [x, y, z] = surface.points[0];
            if (nx * (balconyEye[0] - x) + ny * (balconyEye[1] - y * .69) + nz * (balconyEye[2] - z) <= 0) continue;
          } else if (nx * sinYaw * cosPitch + ny * sinPitch + nz * cosYaw * cosPitch <= 0) continue;
          const points = surface.points.map(project);
          if (points.some(point => point.w <= 0)) continue;
          const depth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
          visible.push({ surface, points, depth });
        }
        return visible.sort((a, b) => a.depth - b.depth);
      }
      const streetOpacity = simulation ? .74 : clamp((camera.zoom - .33) / .35, 0, .82);
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

      const towerGround = [[-4.48,-1.08],[4.62,-1.08],[4.62,2.56],[-4.48,2.56]];
      const towerWing = [[-3.16,-5.45],[-1.48,-5.45],[-1.48,-1.08],[-3.16,-1.08]];
      for (const outline of simulation ? contactOutlines : [...contactOutlines, towerGround, towerWing]) {
        const shadow = outline.map(([x,z]) => project([x+.16,-.23,z-.16]));
        if (shadow.some(point => point.w <= 0)) continue;
        trace(ctx, shadow);
        ctx.fillStyle = '#17292548';
        ctx.shadowColor = '#152c2780';
        ctx.shadowBlur = 5;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      projectedFaces = simulation ? [] : faces;
      for (const { surface, points } of faces) {
        if (surface.unit) {
          const active = surface.unit === selectedUnit;
          const highlighted = surface.unit === hovered?.unit;
          trace(ctx, points);
          ctx.fillStyle = active ? '#d8f0a1df' : highlighted ? '#d8f0a1ab' : '#d8f0a12e';
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
        const light = clamp((-.50 * nx + .84 * ny + .42 * nz) / direction, -.7, 1);
        if (!surface.details) {
          ctx.fillStyle = 'rgba(41,44,38,' + (.15 - light * .12) + ')';
          ctx.fill();
          continue;
        }
        const [origin, right, , top] = surface.points;
        function onFace(u, v) {
          return project(origin.map((value, axis) => value + (right[axis] - value) * u + (top[axis] - value) * v));
        }
        for (const { u1, v1, u2, v2, color } of surface.details) {
          trace(ctx, [onFace(u1,v1), onFace(u2,v1), onFace(u2,v2), onFace(u1,v2)]);
          ctx.fillStyle = color;
          ctx.fill();
        }
        if (light < .55) {
          trace(ctx, points);
          ctx.fillStyle = 'rgba(39,35,28,' + ((.55 - light) * .15) + ')';
          ctx.fill();
        }
        const { floor } = surface;
        if (!floor) continue;
        let tint;
        if (floor === selected) tint = availableFloors.has(floor) ? (selectedUnit ? '#d6f29840' : '#d6f298b5') : '#b5d9caa0';
        else if (floor === hovered?.floor && !hovered.unit) tint = '#c2f5d294';
        else if (!selected && availableFloors.has(floor)) tint = '#b8f2cc29';
        if (tint) {
          trace(ctx, points);
          ctx.fillStyle = tint;
          ctx.fill();
        }
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
        if (contains(points, x, y)) return surface.floor ? surface : null;
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

    function moveTo(view) {
      const difference = Math.atan2(Math.sin(view.yaw - camera.yaw), Math.cos(view.yaw - camera.yaw));
      const destination = { ...view, yaw: camera.yaw + difference };
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
        switch (action) {
          case 'left': simulation.yaw = clamp(simulation.yaw - .24, -1.12, 1.12); break;
          case 'right': simulation.yaw = clamp(simulation.yaw + .24, -1.12, 1.12); break;
          case 'up': simulation.pitch = clamp(simulation.pitch - .08, -.08, .58); break;
          case 'down': simulation.pitch = clamp(simulation.pitch + .08, -.08, .58); break;
          case 'reset': simulation = { yaw: 0, pitch: .29 }; break;
        }
        redraw();
        return;
      }
      flight = null;
      switch (action) {
        case 'left': camera.yaw -= Math.PI / 8; break;
        case 'right': camera.yaw += Math.PI / 8; break;
        case 'up': camera.pitch = clamp(camera.pitch + .10, .37, 1.30); break;
        case 'down': camera.pitch = clamp(camera.pitch - .10, .37, 1.30); break;
        case 'in': camera.zoom = clamp(camera.zoom * 1.24, minZoom, maxZoom); break;
        case 'out': camera.zoom = clamp(camera.zoom / 1.24, minZoom, maxZoom); break;
        case 'aerial': moveTo({ yaw: camera.yaw, pitch: 1.12, zoom: .14 }); return;
        case 'model': moveTo(closeView); return;
        case 'rear': moveTo(rearView); return;
        case 'reset': moveTo(initialView); return;
      }
      reportZoom();
      setHover(null);
      redraw();
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
      if (simulation) {
        if (!dragged && distance(current, start) < 5) return;
        dragged = true;
        simulation.yaw = clamp(simulation.yaw - (current.x - previous.x) * .007, -1.12, 1.12);
        simulation.pitch = clamp(simulation.pitch - (current.y - previous.y) * .004, -.08, .58);
      } else if (pointers.size === 2) {
        const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1];
        const previousGap = distance(previous, other);
        if (previousGap > 1) camera.zoom = clamp(camera.zoom * distance(current, other) / previousGap, minZoom, maxZoom);
        reportZoom();
      } else {
        if (!dragged && distance(current, start) < 5) return;
        dragged = true;
        camera.yaw -= (current.x - previous.x) * .010;
        camera.pitch = clamp(camera.pitch + (current.y - previous.y) * .005, .37, 1.30);
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
      showUnit(id, { rotate = true } = {}) {
        selectedUnit = id;
        if (id && rotate) moveTo(unitAngles[id]);
        else redraw();
      },
      simulate(enabled) {
        flight = null;
        simulation = enabled ? { yaw: 0, pitch: .29 } : null;
        setHover(null);
        redraw();
      },
      setNeighbours(footprints) {
        neighbours = neighbourhoodFaces(footprints);
        contactOutlines = footprints.map(({ outline }) => outline);
        redraw();
      },
      setStreets(features) {
        streets = features;
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
