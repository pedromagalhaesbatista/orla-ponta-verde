(() => {
  const views = {
    overview: { yaw: -.44, pitch: .80, x: 104, z: 132, zoom: 1 },
    living: { yaw: -.64, pitch: .65, x: 65, z: 138, zoom: 1.33 },
    suite: { yaw: .50, pitch: .69, x: 151, z: 153, zoom: 1.32 },
    balcony: { yaw: -.20, pitch: .60, x: 66, z: 192, zoom: 1.32 }
  };

  window.createInterior = (canvas, plan) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const faces = [];
    const shadows = [];
    const plaster = ['#f0e9d9', '#d4cbbb', '#fff8eb'];
    const oak = ['#8c6547', '#765338', '#bb936c'];
    const fabric = ['#bdad97', '#a6947d', '#dbcebb'];
    const green = ['#536457', '#3d4c42', '#718171'];
    const linen = ['#e3d9c8', '#bfb29c', '#faf2e4'];
    const stone = ['#c4b8a6', '#a89987', '#f0e6d4'];
    const glass = ['#85b6b67a', '#79a5a675', '#bad9d590'];
    const metal = ['#354746', '#253c39', '#68807a'];
    const wall = (x1, z1, x2, z2, height = 19) => box(x1, z1, x2, z2, height, plaster);

    function box(x1, z1, x2, z2, h, colors, base = 0) {
      const a = [x1, base, z1], b = [x2, base, z1], c = [x2, base, z2], d = [x1, base, z2];
      const A = [x1, h, z1], B = [x2, h, z1], C = [x2, h, z2], D = [x1, h, z2];
      faces.push(
        { points: [A, B, C, D], normal: [0, 1, 0], color: colors[2] },
        { points: [a, A, D, d], normal: [-1, 0, 0], color: colors[1] },
        { points: [b, c, C, B], normal: [1, 0, 0], color: colors[1] },
        { points: [a, b, B, A], normal: [0, 0, -1], color: colors[0] },
        { points: [d, D, C, c], normal: [0, 0, 1], color: colors[0] }
      );
      if (base === 0 && h > 3) shadows.push([[x1,z1],[x2+2,z1+2],[x2+2,z2+3],[x1,z2+3]]);
    }

    // Cut walls leave the documented door and window openings visible.
    for (const [a, b] of plan.walls) {
      if (a[0] === b[0]) wall(a[0] - 1.5, a[1], b[0] + 1.5, b[1], 14);
      else wall(a[0], a[1] - 1.5, b[0], b[1] + 1.5, 14);
    }
    wall(17, 38, 20, 226, 17);
    wall(188, 38, 191, 226, 23);
    wall(18, 36, 77, 39, 26);
    wall(94, 36, 191, 39, 26);
    wall(113, 225, 127, 228, 9);
    wall(178, 225, 190, 228, 9);
    box(29, 186, 91, 188, 14, glass);
    box(127, 225, 178, 227, 12, glass);
    box(18, 225, 113, 228, 8, glass);
    for (const x of [19, 50, 81, 111]) box(x, 225, x + 1.5, 228, 9, metal);
    box(18, 225, 113, 228, 9, metal, 8);

    // Kitchen, dining table and living room.
    box(96, 42, 111, 109, 13, green);
    box(95, 42, 111, 109, 14.5, stone, 13);
    box(98, 62, 108, 76, 15, metal, 14.5);
    box(99, 89, 108, 100, 15, metal, 14.5);
    for (const [x, z] of [[43, 83], [74, 83], [43, 108], [74, 108]]) {
      box(x - 4, z - 4, x + 4, z + 4, 7, oak);
      box(x - 4, z + 3, x + 4, z + 5, 11, green, 7);
    }
    box(49, 89, 70, 104, 11, oak, 8);
    box(56, 94, 63, 99, 8, oak);
    box(34, 119, 94, 179, .35, ['#aab09a', '#aab09a', '#bac0a9']);
    box(23, 124, 42, 172, 8, fabric);
    box(23, 124, 29, 172, 13, fabric, 8);
    for (const z of [125, 166]) box(28, z, 44, z + 5, 11, fabric, 8);
    box(30, 134, 35, 144, 10, green, 8);
    box(30, 153, 35, 163, 10, linen, 8);
    box(51, 140, 70, 155, 5, oak);
    box(55, 143, 61, 151, 5.5, linen, 5);
    box(103, 130, 111, 168, 8, oak);
    box(107, 134, 109, 163, 15, metal, 8);

    // Suite, bathrooms and terrace furniture.
    box(124, 122, 183, 192, .35, ['#b8ac95', '#b8ac95', '#c6bba6']);
    box(138, 134, 179, 176, 6, oak);
    box(138, 134, 179, 176, 9, linen, 6);
    box(139, 134, 149, 153, 10.5, linen, 9);
    box(139, 156, 149, 175, 10.5, linen, 9);
    box(151, 134, 179, 176, 9.8, green, 9);
    box(136, 133, 139, 177, 13, oak);
    box(133, 120, 145, 130, 8, oak);
    box(133, 180, 145, 191, 8, oak);
    box(172, 41, 188, 95, 24, oak);
    box(161, 196, 181, 213, 8, fabric);
    box(176, 195, 182, 215, 13, fabric, 8);
    for (const [x, z] of [[23, 45], [119, 48]]) {
      box(x, z, x + 12, z + 17, 4.5, linen);
      box(x + 13, z + 2, x + 27, z + 12, 9, stone);
      box(x + 15, z + 4, x + 25, z + 10, 9.5, linen, 9);
    }
    box(24, 195, 43, 212, 7, fabric);
    box(24, 195, 28, 212, 12, fabric, 7);
    box(79, 198, 97, 215, 7, fabric);
    box(93, 198, 97, 215, 12, fabric, 7);
    box(51, 197, 67, 213, 9, oak, 6);
    box(57, 202, 61, 207, 6, oak);
    box(101, 193, 110, 222, 4, oak);
    for (const z of [197, 206, 215]) box(102, z, 109, z + 5, 10, green, 4);

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let camera = views.overview;
    let animation = 0;
    let visible = false;

    function paint() {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * ratio), pixelHeight = Math.round(height * ratio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const { yaw, pitch, x: centreX, z: centreZ, zoom } = camera;
      const sx = Math.sin(yaw), cx = Math.cos(yaw), sy = Math.sin(pitch), cy = Math.cos(pitch);
      const narrow = width < 560;
      const scale = Math.min(width / (narrow ? 282 : 355), height / 262) * zoom;
      function project([x, y, z]) {
        const dx = x - centreX, dz = z - centreZ;
        const depth = dx * sx + dz * cx;
        return { x: width * (narrow ? .51 : .53) + (dx * cx - dz * sx) * scale,
          y: height * (narrow ? .48 : .52) + (depth * sy - y * cy) * scale,
          depth: depth * cy + y * sy };
      }

      function polygon(points, fill, stroke) {
        ctx.beginPath();
        points.map(project).forEach(({ x, y }, index) => {
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.lineWidth = .65;
          ctx.strokeStyle = stroke;
          ctx.stroke();
        }
      }

      const floor = (points, color, y = 0) => polygon(points.map(([x, z]) => [x, y, z]), color);
      floor(plan.outline.map(([x, z]) => [x + 10, z + 10]), '#352e262e', -4);
      floor(plan.outline, '#897c66', -6);
      const base = plan.outline.map(([x, z]) => [x, 0, z]);
      for (const [i, point] of base.entries()) {
        const next = base[(i + 1) % base.length];
        polygon([point, next, [next[0], -6, next[2]], [point[0], -6, point[2]]], i === 2 ? '#6f6553' : '#827660');
      }
      const floorTones = ['#e4d6bc', '#c5ac8a', '#d6dfdb', '#d6dfdb', '#d2b595', '#d1c4ab'];
      for (const [i, room] of plan.rooms.entries()) floor(room.path, floorTones[i]);
      for (let z = 50; z < 225; z += 12) floor([[20,z],[188,z],[188,z+.30],[20,z+.30]], '#74634b30');
      for (const outline of shadows) floor(outline, '#352e2623');
      const ordered = faces.filter(({ normal: [a, b, c] }) => a * sx * cy + b * sy + c * cx * cy > 0)
        .map(face => ({ ...face, depth: face.points.reduce((sum, point) => sum + project(point).depth, 0) / 4 }))
        .sort((a, b) => a.depth - b.depth);
      for (const { points, color } of ordered) polygon(points, color, '#574b3829');
    }

    new ResizeObserver(() => { if (visible) paint(); }).observe(canvas);
    return {
      show(room) {
        visible = true;
        cancelAnimationFrame(animation);
        const from = camera, to = views[room];
        if (motion.matches || from === to || room === 'overview') {
          camera = to;
          paint();
          return;
        }
        const start = performance.now();
        function animate(now) {
          const elapsed = Math.min(1, (now - start) / 460);
          const progress = elapsed * elapsed * (3 - 2 * elapsed);
          camera = Object.fromEntries(Object.keys(to).map(key => [key, from[key] + (to[key] - from[key]) * progress]));
          paint();
          if (elapsed < 1) animation = requestAnimationFrame(animate);
        }
        animation = requestAnimationFrame(animate);
      },
      hide() {
        visible = false;
        cancelAnimationFrame(animation);
        camera = views.overview;
      }
    };
  };
})();
