import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function exportAsGLB(object: THREE.Object3D, filename: string = 'model.glb'): Promise<void> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      object,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          const blob = new Blob([gltf], { type: 'model/gltf-binary' });
          downloadBlob(blob, filename);
          resolve();
        } else {
          const output = JSON.stringify(gltf, null, 2);
          const blob = new Blob([output], { type: 'text/plain' });
          downloadBlob(blob, filename.replace('.glb', '.gltf'));
          resolve();
        }
      },
      (error) => {
        console.error('GLTF Export Error:', error);
        reject(error);
      },
      { binary: true }
    );
  });
}

export function exportAsOBJ(object: THREE.Object3D, filename: string = 'model.obj'): void {
  const exporter = new OBJExporter();
  const result = exporter.parse(object);
  const blob = new Blob([result], { type: 'text/plain' });
  downloadBlob(blob, filename);
}

export function exportAsSTL(object: THREE.Object3D, filename: string = 'model.stl', binary: boolean = true): void {
  const exporter = new STLExporter();
  const result = exporter.parse(object, { binary });
  const blob = new Blob([result as any], { type: binary ? 'application/octet-stream' : 'text/plain' });
  downloadBlob(blob, filename);
}
