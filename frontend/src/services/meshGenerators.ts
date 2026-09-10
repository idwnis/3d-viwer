import * as THREE from 'three';

export interface MeshGenerationOptions {
  resolution?: number; // e.g. 128x128 grid
  depthScale?: number; // Height intensity
  smoothness?: number; // Blur iterations
  createSolidBase?: boolean; // Watertight for 3D printing
}

/**
 * Computes luminance / estimated depth from an image element
 */
function getImageLuminance(image: HTMLImageElement, width: number, height: number): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  ctx.drawImage(image, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const luminance = new Float32Array(width * height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const a = data[i + 3] / 255;

    // Standard ITU-R BT.601 perceptual luminance
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) * a;
    luminance[i / 4] = lum;
  }

  return luminance;
}

/**
 * Generates a full 3D solid relief mesh from an image using heightfield displacement
 */
export function generateOffline3DMesh(
  image: HTMLImageElement,
  options: MeshGenerationOptions = {}
): THREE.Group {
  const {
    resolution = 120,
    depthScale = 0.35,
    createSolidBase = true
  } = options;

  const aspect = image.width / image.height;
  const gridW = aspect >= 1 ? resolution : Math.round(resolution * aspect);
  const gridH = aspect >= 1 ? Math.round(resolution / aspect) : resolution;

  const luminance = getImageLuminance(image, gridW, gridH);

  // Physical dimensions centered around origin
  const width = aspect >= 1 ? 2.0 : 2.0 * aspect;
  const height = aspect >= 1 ? 2.0 / aspect : 2.0;
  const baseThickness = 0.08;

  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Top displaced surface vertices
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const u = x / (gridW - 1);
      const v = y / (gridH - 1);

      const px = (u - 0.5) * width;
      const py = (0.5 - v) * height;
      const lum = luminance[y * gridW + x];
      const pz = lum * depthScale;

      positions.push(px, py, pz);
      uvs.push(u, 1.0 - v);
    }
  }

  // Top surface triangle indices
  for (let y = 0; y < gridH - 1; y++) {
    for (let x = 0; x < gridW - 1; x++) {
      const i0 = y * gridW + x;
      const i1 = y * gridW + (x + 1);
      const i2 = (y + 1) * gridW + x;
      const i3 = (y + 1) * gridW + (x + 1);

      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  if (createSolidBase) {
    const bottomOffset = positions.length / 3;

    // Bottom flat surface vertices
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const u = x / (gridW - 1);
        const v = y / (gridH - 1);
        const px = (u - 0.5) * width;
        const py = (0.5 - v) * height;
        const pz = -baseThickness;

        positions.push(px, py, pz);
        uvs.push(u, 1.0 - v);
      }
    }

    // Bottom indices (reverse winding for outward normal)
    for (let y = 0; y < gridH - 1; y++) {
      for (let x = 0; x < gridW - 1; x++) {
        const i0 = bottomOffset + (y * gridW + x);
        const i1 = bottomOffset + (y * gridW + (x + 1));
        const i2 = bottomOffset + ((y + 1) * gridW + x);
        const i3 = bottomOffset + ((y + 1) * gridW + (x + 1));

        indices.push(i0, i1, i2);
        indices.push(i1, i3, i2);
      }
    }

    // Side walls: Top border
    for (let x = 0; x < gridW - 1; x++) {
      const topT0 = x;
      const topT1 = x + 1;
      const botB0 = bottomOffset + x;
      const botB1 = bottomOffset + x + 1;
      indices.push(topT0, topT1, botB0);
      indices.push(topT1, botB1, botB0);
    }

    // Side walls: Bottom border
    const lastRowTop = (gridH - 1) * gridW;
    const lastRowBot = bottomOffset + (gridH - 1) * gridW;
    for (let x = 0; x < gridW - 1; x++) {
      const topT0 = lastRowTop + x;
      const topT1 = lastRowTop + x + 1;
      const botB0 = lastRowBot + x;
      const botB1 = lastRowBot + x + 1;
      indices.push(topT0, botB0, topT1);
      indices.push(topT1, botB0, botB1);
    }

    // Side walls: Left border
    for (let y = 0; y < gridH - 1; y++) {
      const topT0 = y * gridW;
      const topT1 = (y + 1) * gridW;
      const botB0 = bottomOffset + y * gridW;
      const botB1 = bottomOffset + (y + 1) * gridW;
      indices.push(topT0, botB0, topT1);
      indices.push(topT1, botB0, botB1);
    }

    // Side walls: Right border
    for (let y = 0; y < gridH - 1; y++) {
      const topT0 = y * gridW + (gridW - 1);
      const topT1 = (y + 1) * gridW + (gridW - 1);
      const botB0 = bottomOffset + y * gridW + (gridW - 1);
      const botB1 = bottomOffset + (y + 1) * gridW + (gridW - 1);
      indices.push(topT0, topT1, botB0);
      indices.push(topT1, botB1, botB0);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  // Create texture from image
  const texture = new THREE.Texture(image);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.45,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const group = new THREE.Group();
  group.name = 'ReconstructedModel';
  group.add(mesh);

  return group;
}
