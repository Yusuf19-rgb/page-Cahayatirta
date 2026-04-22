// ── INTERACTIVE 3D CRYSTAL SCENE (Three.js r128)
(function () {
  function init() {
    const card = document.getElementById('card-3d');
    const canvas = document.getElementById('three-canvas');
    if (!card || !canvas || typeof THREE === 'undefined') return;

    // ── SIZE
    const W = card.clientWidth  || 300;
    const H = card.clientHeight || 200;

    // ── RENDERER
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x0d1a3d, 1);
    renderer.shadowMap.enabled = true;

    // ── SCENE
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d1a3d, 0.08);

    // ── CAMERA
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 5);

    // ── LIGHTS
    const ambientLight = new THREE.AmbientLight(0x7c5cff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x7c5cff, 3, 20);
    pointLight1.position.set(3, 4, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 2, 20);
    pointLight2.position.set(-3, -2, 2);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xa78bfa, 1.5, 15);
    pointLight3.position.set(0, -3, 4);
    scene.add(pointLight3);

    // ── CRYSTAL GROUP
    const group = new THREE.Group();
    scene.add(group);

    // Main crystal body — tall octahedron
    const crystalGeo = new THREE.OctahedronGeometry(1.2, 1);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xa78bfa,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      thickness: 1.5,
      transparent: true,
      opacity: 0.92,
      envMapIntensity: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      ior: 2.0,
      reflectivity: 0.9,
      wireframe: false,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.scale.set(0.9, 1.5, 0.9);
    crystal.castShadow = true;
    group.add(crystal);

    // Inner glow core
    const coreGeo = new THREE.OctahedronGeometry(0.55, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x7c5cff,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.6,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.scale.set(0.9, 1.4, 0.9);
    group.add(core);

    // Small floating shards around crystal
    const shardPositions = [
      [1.6, 0.8, 0.2],
      [-1.5, -0.6, 0.3],
      [0.8, -1.4, 0.5],
      [-0.6, 1.5, -0.3],
      [1.2, -0.4, -0.8],
      [-1.0, 0.9, -0.6],
    ];
    const shards = [];
    shardPositions.forEach(([x, y, z], i) => {
      const size = 0.12 + Math.random() * 0.18;
      const sGeo = new THREE.OctahedronGeometry(size, 0);
      const sMat = new THREE.MeshPhysicalMaterial({
        color: i % 2 === 0 ? 0x7c5cff : 0x3b82f6,
        emissive: i % 2 === 0 ? 0x7c5cff : 0x3b82f6,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.75,
        roughness: 0.05,
        metalness: 0.2,
      });
      const shard = new THREE.Mesh(sGeo, sMat);
      shard.position.set(x, y, z);
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(shard);
      shards.push({ mesh: shard, speed: 0.4 + Math.random() * 0.6, offset: i * 1.1 });
    });

    // Particle field
    const particleCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3]     = (Math.random() - 0.5) * 8;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xa78bfa,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── DRAG ROTATE STATE
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotVel = { x: 0, y: 0 };
    let targetRot = { x: 0, y: 0 };
    let currentRot = { x: 0, y: 0 };

    function getXY(e) {
      if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    canvas.addEventListener('mousedown', e => {
      isDragging = true;
      prevMouse = getXY(e);
      rotVel = { x: 0, y: 0 };
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('touchstart', e => {
      isDragging = true;
      prevMouse = getXY(e);
      rotVel = { x: 0, y: 0 };
    }, { passive: true });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const pos = getXY(e);
      const dx = pos.x - prevMouse.x;
      const dy = pos.y - prevMouse.y;
      rotVel.y = dx * 0.012;
      rotVel.x = dy * 0.012;
      targetRot.y += dx * 0.012;
      targetRot.x += dy * 0.012;
      targetRot.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRot.x));
      prevMouse = pos;
    });
    window.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const pos = getXY(e);
      const dx = pos.x - prevMouse.x;
      const dy = pos.y - prevMouse.y;
      rotVel.y = dx * 0.012;
      rotVel.x = dy * 0.012;
      targetRot.y += dx * 0.012;
      targetRot.x += dy * 0.012;
      targetRot.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRot.x));
      prevMouse = pos;
    }, { passive: true });

    window.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'grab'; });
    window.addEventListener('touchend', () => { isDragging = false; });

    // ── RESIZE
    window.addEventListener('resize', () => {
      const w = card.clientWidth;
      const h = card.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    // ── ANIMATE
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Auto-rotate when not dragging
      if (!isDragging) {
        rotVel.y *= 0.95;
        rotVel.x *= 0.95;
        targetRot.y += 0.004;
      }

      // Smooth lerp
      currentRot.x += (targetRot.x - currentRot.x) * 0.08;
      currentRot.y += (targetRot.y - currentRot.y) * 0.08;

      group.rotation.x = currentRot.x;
      group.rotation.y = currentRot.y;

      // Breathing scale
      const breathe = 1 + Math.sin(t * 1.2) * 0.025;
      group.scale.setScalar(breathe);

      // Core pulse
      core.material.emissiveIntensity = 2.0 + Math.sin(t * 2.5) * 0.8;

      // Shards orbit
      shards.forEach(({ mesh, speed, offset }) => {
        mesh.rotation.x += 0.01 * speed;
        mesh.rotation.y += 0.015 * speed;
        mesh.position.y += Math.sin(t * speed + offset) * 0.003;
      });

      // Lights orbit
      pointLight1.position.x = Math.sin(t * 0.7) * 4;
      pointLight1.position.z = Math.cos(t * 0.7) * 4;
      pointLight2.position.x = Math.sin(t * 0.5 + 2) * -3;
      pointLight2.position.z = Math.cos(t * 0.5 + 2) * 3;

      // Particles slow rotate
      particles.rotation.y = t * 0.05;
      particles.rotation.x = t * 0.02;

      renderer.render(scene, camera);
    }
    animate();
  }

  // Wait for DOM + Three.js to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
