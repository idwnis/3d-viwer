import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RenderMode } from './Toolbar';
import { ModelMetrics } from './MeshStats';

interface Viewport3DProps {
  model: THREE.Object3D | null;
  renderMode: RenderMode;
  showGrid: boolean;
  autoRotate: boolean;
  resetCameraTrigger: number;
  onMetricsChange: (metrics: ModelMetrics | null) => void;
  engineMode: 'colab' | 'offline';
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  model,
  renderMode,
  showGrid,
  autoRotate,
  resetCameraTrigger,
  onMetricsChange,
  engineMode
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const modelContainerRef = useRef<THREE.Group | null>(null);

  // Cache original materials for switching between textured / clay / wireframe / normals
  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d1117');
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(3, 2, 4);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 20;
    controls.minDistance = 0.5;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.0);
    scene.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x90cdf4, 1.5);
    fillLight.position.set(-5, 4, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    rimLight.position.set(0, -5, -4);
    scene.add(rimLight);

    // 6. Grid Helper & Shadow receiver plane
    const gridHelper = new THREE.GridHelper(10, 20, 0x38bdf8, 0x21262d);
    gridHelper.position.y = -0.001;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const shadowPlaneGeo = new THREE.PlaneGeometry(20, 20);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.002;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 7. Container for active 3D model
    const modelContainer = new THREE.Group();
    scene.add(modelContainer);
    modelContainerRef.current = modelContainer;

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Grid visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Update Auto-Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate]);

  // Reset Camera position
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(3, 2, 4);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, []);

  useEffect(() => {
    if (resetCameraTrigger > 0) {
      resetCamera();
    }
  }, [resetCameraTrigger, resetCamera]);

  // Handle Model Loading & Center/Normalize Scale
  useEffect(() => {
    const container = modelContainerRef.current;
    if (!container) return;

    // Clear previous model
    while (container.children.length > 0) {
      container.remove(container.children[0]);
    }
    originalMaterialsRef.current.clear();

    if (!model) {
      onMetricsChange(null);
      return;
    }

    container.add(model);

    // Compute bounding box and normalize
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center model at (0, 0, 0)
    model.position.x -= center.x;
    model.position.y -= center.y;
    model.position.z -= center.z;

    // Auto-scale to fit roughly a 2.5 unit cube
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const targetScale = 2.5 / maxDim;
      model.scale.multiplyScalar(targetScale);
    }

    // Re-adjust height so model sits on top of the ground grid
    const adjustedBox = new THREE.Box3().setFromObject(container);
    container.position.y = -adjustedBox.min.y;

    // Inspect geometry metrics
    let totalVertices = 0;
    let totalFaces = 0;

    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Save original material
        originalMaterialsRef.current.set(mesh, mesh.material);

        const geo = mesh.geometry;
        if (geo) {
          if (geo.attributes.position) {
            totalVertices += geo.attributes.position.count;
          }
          if (geo.index) {
            totalFaces += geo.index.count / 3;
          } else if (geo.attributes.position) {
            totalFaces += geo.attributes.position.count / 3;
          }
        }
      }
    });

    onMetricsChange({
      vertexCount: totalVertices,
      faceCount: Math.round(totalFaces),
      dimensions: { x: size.x, y: size.y, z: size.z },
      engine: engineMode
    });

    resetCamera();
  }, [model, engineMode, onMetricsChange, resetCamera]);

  // Apply Render Mode (Textured, Wireframe, Clay, Normal)
  useEffect(() => {
    const container = modelContainerRef.current;
    if (!container) return;

    container.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const originalMat = originalMaterialsRef.current.get(mesh);

        if (renderMode === 'textured') {
          if (originalMat) mesh.material = originalMat;
        } else if (renderMode === 'wireframe') {
          mesh.material = new THREE.MeshStandardMaterial({
            wireframe: true,
            color: 0x38bdf8,
            roughness: 0.5,
          });
        } else if (renderMode === 'clay') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            roughness: 0.6,
            metalness: 0.05,
            side: THREE.DoubleSide
          });
        } else if (renderMode === 'normal') {
          mesh.material = new THREE.MeshNormalMaterial({
            side: THREE.DoubleSide
          });
        }
      }
    });
  }, [renderMode]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
