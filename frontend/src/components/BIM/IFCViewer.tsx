/**
 * IFC.js 3D BIM Viewer Component
 * Using web-ifc and web-ifc-three for frontend BIM visualization
 * 
 * Goal: "Use IFC.js (web-ifc / web-ifc-three) on the frontend"
 * 
 * Features:
 * - Load and display IFC files
 * - 3D navigation (orbit, zoom, pan)
 * - Element selection and properties
 * - Quantity takeoff visualization
 * 
 * References:
 * - https://ifcjs.github.io/info/
 * - https://github.com/IFCjs/web-ifc
 * - https://github.com/IFCjs/web-ifc-three
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'web-ifc-three/IFCLoader';

interface IFCViewerProps {
  /** IFC file URL or Blob */
  ifcFile?: string | Blob;
  /** Viewer width */
  width?: string | number;
  /** Viewer height */
  height?: string | number;
  /** Callback when element is selected */
  onElementSelect?: (properties: any) => void;
  /** Show loading indicator */
  loading?: boolean;
}

export const IFCViewer: React.FC<IFCViewerProps> = ({
  ifcFile,
  width = '100%',
  height = '600px',
  onElementSelect,
  loading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);
  const [ifcLoader, setIfcLoader] = useState<IFCLoader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<boolean>(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0xf0f0f0);

    // Camera
    const newCamera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    newCamera.position.set(10, 10, 10);
    newCamera.lookAt(0, 0, 0);

    // Renderer
    const newRenderer = new THREE.WebGLRenderer({ antialias: true });
    newRenderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    newRenderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(newRenderer.domElement);

    // Controls
    const newControls = new OrbitControls(newCamera, newRenderer.domElement);
    newControls.enableDamping = true;
    newControls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    newScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    newScene.add(directionalLight);

    // Grid
    const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0xcccccc);
    newScene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5);
    newScene.add(axesHelper);

    // IFC Loader
    const loader = new IFCLoader();
    loader.ifcManager.setWasmPath('/wasm/'); // Path to web-ifc WASM files

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);
    setControls(newControls);
    setIfcLoader(loader);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      newControls.update();
      newRenderer.render(newScene, newCamera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      newCamera.aspect = width / height;
      newCamera.updateProjectionMatrix();
      newRenderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && newRenderer.domElement) {
        containerRef.current.removeChild(newRenderer.domElement);
      }
      newRenderer.dispose();
    };
  }, []);

  // Load IFC file
  useEffect(() => {
    if (!ifcFile || !ifcLoader || !scene) return;

    setLoadingState(true);
    setError(null);

    const loadIFC = async () => {
      try {
        let url: string;

        // Handle Blob or URL
        if (ifcFile instanceof Blob) {
          url = URL.createObjectURL(ifcFile);
        } else {
          url = ifcFile;
        }

        // Load IFC model
        const model = await ifcLoader.loadAsync(url);
        
        // Add model to scene
        scene.add(model);

        // Center camera on model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        if (camera && controls) {
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 1.5; // Zoom out a bit

          camera.position.set(
            center.x + cameraZ,
            center.y + cameraZ,
            center.z + cameraZ
          );
          camera.lookAt(center);
          controls.target.copy(center);
          controls.update();
        }

        // Clean up blob URL if created
        if (ifcFile instanceof Blob) {
          URL.revokeObjectURL(url);
        }

        setLoadingState(false);
      } catch (err) {
        console.error('Error loading IFC file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load IFC file');
        setLoadingState(false);
      }
    };

    loadIFC();
  }, [ifcFile, ifcLoader, scene, camera, controls]);

  // Handle element selection
  useEffect(() => {
    if (!renderer || !scene || !camera || !ifcLoader) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = async (event: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0 && onElementSelect) {
        const object = intersects[0].object;
        
        // Get IFC properties
        try {
          const expressID = await ifcLoader.ifcManager.getExpressId(
            object.geometry,
            intersects[0].faceIndex || 0
          );
          
          const properties = await ifcLoader.ifcManager.getItemProperties(
            0, // Model ID
            expressID
          );
          
          onElementSelect(properties);
        } catch (err) {
          console.error('Error getting element properties:', err);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
    };
  }, [renderer, scene, camera, ifcLoader, onElementSelect]);

  return (
    <div className="relative" style={{ width, height }}>
      <div ref={containerRef} className="w-full h-full" />
      
      {(loading || loadingState) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-700">Loading IFC model...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90">
          <div className="text-center p-4">
            <p className="text-red-600 font-semibold mb-2">Error Loading Model</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {!loading && !loadingState && !error && !ifcFile && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center p-4">
            <p className="text-gray-600">Upload an IFC file to view the 3D model</p>
          </div>
        </div>
      )}
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow text-xs text-gray-600">
        <p><strong>Controls:</strong></p>
        <p>• Left click + drag: Rotate</p>
        <p>• Right click + drag: Pan</p>
        <p>• Scroll: Zoom</p>
        <p>• Click element: View properties</p>
      </div>
    </div>
  );
};

export default IFCViewer;
