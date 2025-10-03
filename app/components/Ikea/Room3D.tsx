import { useEffect, useRef } from "react";

interface Room3DProps {
  width: number;
  length: number;
  furniture?: Array<{
    id: string;
    name: string;
    width: number;
    length: number;
    height: number;
    color: string;
    position: { x: number; z: number };
    rotation: number;
  }>;
  onFurnitureMove?: (id: string, position: { x: number; z: number }) => void;
}

export function Room3D({
  width,
  length,
  furniture = [],
  onFurnitureMove,
}: Room3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const engineRef = useRef<any>(null);
  const selectedFurnitureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initScene = async () => {
      try {
        // Import Babylon.js modules dynamically
        const {
          Engine,
          Scene,
          ArcRotateCamera,
          HemisphericLight,
          Vector3,
          MeshBuilder,
          StandardMaterial,
          Color3,
          DirectionalLight,
          ShadowGenerator,
          Texture,
        } = await import("@babylonjs/core");

        // Initialize Babylon.js engine and scene
        const engine = new Engine(canvasRef.current, true);
        const scene = new Scene(engine);

        engineRef.current = engine;
        sceneRef.current = scene;

        // Convert from meters to 3D units (scale down by 100)
        const scaledWidth = width / 100;
        const scaledLength = length / 100;
        const wallHeight = 2; // Wall height in 3D units (3 units = 300cm)

        // Create camera
        const camera = new ArcRotateCamera(
          "camera",
          -Math.PI / 2,
          Math.PI / 3,
          Math.max(scaledWidth, scaledLength, wallHeight) * 2, // Adjust camera distance for scaled room
          Vector3.Zero(),
          scene
        );

        // Set zoom limits
        camera.setTarget(Vector3.Zero());
        camera.lowerRadiusLimit = Math.max(scaledWidth, scaledLength) * 0.5; // Minimum zoom distance
        camera.upperRadiusLimit =
          Math.max(scaledWidth, scaledLength, wallHeight) * 4; // Maximum zoom distance

        // Attach camera controls
        if (canvasRef.current) {
          camera.attachControl(canvasRef.current, true);
        }

        // Create lighting
        const hemisphericLight = new HemisphericLight(
          "hemisphericLight",
          new Vector3(0, 1, 0),
          scene
        );
        hemisphericLight.intensity = 0.6;

        const directionalLight = new DirectionalLight(
          "directionalLight",
          new Vector3(-1, -1, -1),
          scene
        );
        directionalLight.intensity = 0.8;
        directionalLight.position = new Vector3(5, 10, 5);

        // Create room floor with texture
        const floor = MeshBuilder.CreateGround(
          "floor",
          {
            width: scaledWidth,
            height: scaledLength,
          },
          scene
        );

        const floorMaterial = new StandardMaterial("floorMaterial", scene);
        // Apply floor texture
        const floorTexture = new Texture("/assets/ikea/floor.jpg", scene);
        floorTexture.uScale = scaledWidth / 2; // Scale texture based on scaled room dimensions
        floorTexture.vScale = scaledLength / 2;
        floorMaterial.diffuseTexture = floorTexture;
        floorMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        floorMaterial.backFaceCulling = false; // Show both sides
        floor.material = floorMaterial;

        // Create room walls
        const wallThickness = 0.02; // Scaled wall thickness

        // Front wall
        const frontWall = MeshBuilder.CreateBox(
          "frontWall",
          {
            width: scaledWidth,
            height: wallHeight,
            depth: wallThickness,
          },
          scene
        );
        frontWall.position = new Vector3(0, wallHeight / 2, scaledLength / 2);

        // Back wall
        const backWall = MeshBuilder.CreateBox(
          "backWall",
          {
            width: scaledWidth,
            height: wallHeight,
            depth: wallThickness,
          },
          scene
        );
        backWall.position = new Vector3(0, wallHeight / 2, -scaledLength / 2);

        // Left wall
        const leftWall = MeshBuilder.CreateBox(
          "leftWall",
          {
            width: wallThickness,
            height: wallHeight,
            depth: scaledLength,
          },
          scene
        );
        leftWall.position = new Vector3(-scaledWidth / 2, wallHeight / 2, 0);

        // Right wall
        const rightWall = MeshBuilder.CreateBox(
          "rightWall",
          {
            width: wallThickness,
            height: wallHeight,
            depth: scaledLength,
          },
          scene
        );
        rightWall.position = new Vector3(scaledWidth / 2, wallHeight / 2, 0);

        // Create wall material with texture
        const wallMaterial = new StandardMaterial("wallMaterial", scene);
        // Apply wall texture
        const wallTexture = new Texture("/assets/ikea/wall.jpg", scene);
        wallTexture.uScale = scaledWidth / 2; // Scale texture based on scaled room dimensions
        wallTexture.vScale = wallHeight / 2; // Scale based on wall height
        wallMaterial.diffuseTexture = wallTexture;
        wallMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

        // Create invisible wall material for closest walls
        const invisibleWallMaterial = new StandardMaterial(
          "invisibleWallMaterial",
          scene
        );
        invisibleWallMaterial.diffuseTexture = wallTexture;
        invisibleWallMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        invisibleWallMaterial.alpha = 0; // Completely invisible
        invisibleWallMaterial.backFaceCulling = false; // Show both sides

        // Function to update wall visibility based on camera angle
        const updateWallVisibility = () => {
          const cameraPosition = camera.position;
          const walls = [frontWall, backWall, leftWall, rightWall];
          const wallPositions = [
            new Vector3(0, wallHeight / 2, scaledLength / 2), // Front
            new Vector3(0, wallHeight / 2, -scaledLength / 2), // Back
            new Vector3(-scaledWidth / 2, wallHeight / 2, 0), // Left
            new Vector3(scaledWidth / 2, wallHeight / 2, 0), // Right
          ];

          // Calculate distances from camera to each wall
          const distances = walls.map((wall, index) => ({
            wall,
            distance: Vector3.Distance(cameraPosition, wallPositions[index]),
          }));

          // Sort by distance and hide closest 2 walls
          distances.sort((a, b) => a.distance - b.distance);

          // Show all walls first
          walls.forEach((wall) => {
            wall.isVisible = true;
            wall.material = wallMaterial;
          });

          // Hide closest 2 walls completely
          distances.slice(0, 2).forEach(({ wall }) => {
            wall.isVisible = false;
          });

          // Hide ceiling when looking down from above
          if (cameraPosition.y > wallHeight) {
            ceiling.isVisible = false;
          } else {
            ceiling.isVisible = true;
          }
        };

        // Apply initial material to all walls
        [frontWall, backWall, leftWall, rightWall].forEach((wall) => {
          wall.material = wallMaterial;
        });

        // Update wall visibility when camera moves
        scene.registerBeforeRender(() => {
          updateWallVisibility();
        });

        // Create ceiling (at wall height)
        const ceiling = MeshBuilder.CreateGround(
          "ceiling",
          {
            width: scaledWidth,
            height: scaledLength,
          },
          scene
        );
        ceiling.position = new Vector3(0, wallHeight, 0); // At wall height
        ceiling.rotation = new Vector3(Math.PI, 0, 0);

        const ceilingMaterial = new StandardMaterial("ceilingMaterial", scene);
        // Apply ceiling texture
        const ceilingTexture = new Texture("/assets/ikea/ceil.jpg", scene);
        ceilingTexture.uScale = scaledWidth / 2; // Scale texture based on scaled room dimensions
        ceilingTexture.vScale = scaledLength / 2;
        ceilingMaterial.diffuseTexture = ceilingTexture;
        ceiling.material = ceilingMaterial;

        // Create test meshes for drag drop - exactly like the example
        const redMat = new StandardMaterial("redMat", scene);
        redMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
        redMat.specularColor = new Color3(0.4, 0.4, 0.4);
        redMat.emissiveColor = new Color3(1, 0, 0); // Red

        const greenMat = new StandardMaterial("greenMat", scene);
        greenMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
        greenMat.specularColor = new Color3(0.4, 0.4, 0.4);
        greenMat.emissiveColor = new Color3(0, 1, 0); // Green

        const blueMat = new StandardMaterial("blueMat", scene);
        blueMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
        blueMat.specularColor = new Color3(0.4, 0.4, 0.4);
        blueMat.emissiveColor = new Color3(0, 0, 1); // Blue

        const purpleMat = new StandardMaterial("purpleMat", scene);
        purpleMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
        purpleMat.specularColor = new Color3(0.4, 0.4, 0.4);
        purpleMat.emissiveColor = new Color3(1, 0, 1); // Purple

        // Create test meshes - sized relative to room dimensions (like the example)
        const redSphere = MeshBuilder.CreateSphere(
          "red",
          { diameter: 0.5 },
          scene
        );
        redSphere.material = redMat;
        redSphere.position.y = 0.25; // Half of diameter
        redSphere.position.x = -scaledWidth / 4; // Left side of room

        const greenBox = MeshBuilder.CreateBox("green", { size: 0.5 }, scene);
        greenBox.material = greenMat;
        greenBox.position.z = -scaledLength / 4; // Back of room
        greenBox.position.y = 0.25; // Half of size

        const blueBox = MeshBuilder.CreateBox("blue", { size: 0.5 }, scene);
        blueBox.material = blueMat;
        blueBox.position.x = scaledWidth / 4; // Right side of room
        blueBox.position.y = 0.25; // Half of size

        const purpleDonut = MeshBuilder.CreateTorus(
          "purple",
          { diameter: 0.8, thickness: 0.2 },
          scene
        );
        purpleDonut.material = purpleMat;
        purpleDonut.position.y = 0.4; // Half of diameter
        purpleDonut.position.z = scaledLength / 4; // Front of room

        // Basic furniture will be added separately when needed

        // Create shadow generator
        const shadowGenerator = new ShadowGenerator(1024, directionalLight);
        shadowGenerator.addShadowCaster(floor);
        [frontWall, backWall, leftWall, rightWall, ceiling].forEach((mesh) => {
          shadowGenerator.addShadowCaster(mesh);
        });

        // Add test meshes to shadow generator
        [redSphere, greenBox, blueBox, purpleDonut].forEach((mesh) => {
          shadowGenerator.addShadowCaster(mesh);
        });

        // Set up shadows
        floor.receiveShadows = true;

        // Setup drag drop for test meshes only (not room elements)
        scene.onPointerObservable.add((pointerInfo: any) => {
          switch (pointerInfo.type) {
            case 1: // POINTERDOWN
              if (
                pointerInfo.pickInfo.hit &&
                pointerInfo.pickInfo.pickedMesh !== floor &&
                pointerInfo.pickInfo.pickedMesh !== ceiling &&
                pointerInfo.pickInfo.pickedMesh !== frontWall &&
                pointerInfo.pickInfo.pickedMesh !== backWall &&
                pointerInfo.pickInfo.pickedMesh !== leftWall &&
                pointerInfo.pickInfo.pickedMesh !== rightWall
              ) {
                pointerDown(
                  pointerInfo.pickInfo.pickedMesh,
                  scene,
                  canvasRef.current
                );
              }
              break;
            case 2: // POINTERUP
              pointerUp(scene, canvasRef.current);
              break;
            case 4: // POINTERMOVE
              pointerMove(scene);
              break;
          }
        });

        // Load table model directly
        console.log("Loading table model directly in initScene...");
        const tableItem = {
          id: "table_1",
          name: "Table",
          category: "Furniture",
          width: 1.0,
          length: 1.0,
          height: 1.0,
          color: "#8B4513",
          position: { x: 0, z: 0 },
          rotation: 0,
        };

        // loadTableModel(
        //   scene,
        //   tableItem,
        //   0, // scaledX
        //   0, // scaledZ
        //   width,
        //   length,
        //   onFurnitureMove
        // );

        // Position camera to show the room nicely (use scaled dimensions)
        camera.setTarget(new Vector3(0, wallHeight / 2, 0));
        camera.radius = Math.max(scaledWidth, scaledLength, wallHeight) * 2;
        camera.alpha = -Math.PI / 4;
        camera.beta = Math.PI / 4;

        // Render loop
        const renderLoop = () => {
          scene.render();
        };

        engine.runRenderLoop(renderLoop);

        // Handle window resize
        const handleResize = () => {
          engine.resize();
        };

        window.addEventListener("resize", handleResize);

        // Store cleanup function
        const cleanup = () => {
          window.removeEventListener("resize", handleResize);
          engine.dispose();
        };

        // Store cleanup function for later use
        (engine as any).cleanup = cleanup;
      } catch (error) {
        console.error("Error initializing Babylon.js scene:", error);
      }
    };

    initScene();
  }, [width, length]);

  // Separate useEffect for furniture updates
  useEffect(() => {
    if (sceneRef.current) {
      createFurnitureFromProps(sceneRef.current, furniture);
    }
  }, [furniture, onFurnitureMove]);

  // Update camera when room dimensions change
  useEffect(() => {
    if (sceneRef.current && engineRef.current) {
      const scene = sceneRef.current;
      const camera = scene.cameras[0];

      if (camera) {
        // Import Vector3 dynamically
        import("@babylonjs/core").then(({ Vector3 }) => {
          // Convert from meters to 3D units (scale down by 100)
          const scaledWidth = width / 100;
          const scaledLength = length / 100;
          const wallHeight = 2;

          // Update camera position and limits
          camera.setTarget(new Vector3(0, wallHeight / 2, 0));
          camera.radius = Math.max(scaledWidth, scaledLength, wallHeight) * 2;
          camera.lowerRadiusLimit = Math.max(scaledWidth, scaledLength) * 0.5;
          camera.upperRadiusLimit =
            Math.max(scaledWidth, scaledLength, wallHeight) * 4;

          console.log("Camera updated for new room dimensions:", {
            width: scaledWidth,
            length: scaledLength,
            radius: camera.radius,
          });
        });
      }
    }
  }, [width, length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        if ((engineRef.current as any).cleanup) {
          (engineRef.current as any).cleanup();
        } else {
          engineRef.current.dispose();
        }
      }
    };
  }, []);

  return (
    <div className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}

// Helper function to load table model
async function loadTableModel(
  scene: any,
  item: any,
  scaledX: number,
  scaledZ: number,
  roomWidth: number,
  roomLength: number,
  onFurnitureMove?: (id: string, position: { x: number; z: number }) => void
) {
  const {
    SceneLoader,
    BoundingBoxGizmo,
    UtilityLayerRenderer,
    Color3,
    Vector3,
    MeshBuilder,
    StandardMaterial,
  } = await import("@babylonjs/core");

  const { SixDofDragBehavior, MultiPointerScaleBehavior } = await import(
    "@babylonjs/core"
  );

  console.log(`Loading Table for furniture: ${item.id}`);

  // Create a fallback box first to ensure something appears
  const fallbackBox = MeshBuilder.CreateBox(
    `fallback_${item.id}`,
    { size: 1 },
    scene
  );
  fallbackBox.position = new Vector3(scaledX, 1.0, scaledZ);
  fallbackBox.name = `furniture_${item.id}`;

  const fallbackMaterial = new StandardMaterial(
    `fallbackMaterial_${item.id}`,
    scene
  );
  fallbackMaterial.diffuseColor = new Color3(1, 0, 0); // Red color for visibility
  fallbackMaterial.emissiveColor = new Color3(0.5, 0, 0); // Glowing red
  fallbackBox.material = fallbackMaterial;

  console.log(
    `Fallback box created for ${item.name} at:`,
    fallbackBox.position
  );

  console.log(`Attempting to load table.glb from /assets/ikea/`);

  SceneLoader.LoadAssetContainer(
    "/assets/ikea/",
    "table.glb",
    scene,
    function (container) {
      console.log(`Table container loaded for ${item.name}:`, container);
      console.log(`Container meshes count:`, container.meshes.length);
      console.log(`Container meshes:`, container.meshes);
      console.log(`Container rootNodes count:`, container.rootNodes.length);
      console.log(`Container rootNodes:`, container.rootNodes);

      if (container.meshes.length > 0) {
        // Remove fallback box
        fallbackBox.dispose();
        console.log(`Fallback box removed for ${item.name}`);

        // Add loaded file to the scene
        container.addAllToScene();

        // Get the first mesh (root node)
        const gltfMesh = container.meshes[0];
        console.log(`Table mesh created:`, gltfMesh);

        // Scale and position the loaded model
        gltfMesh.scaling.scaleInPlace(0.5);
        gltfMesh.position = new Vector3(scaledX, 1.0, scaledZ);
        gltfMesh.rotation.y = (item.rotation * Math.PI) / 180;
        gltfMesh.name = `furniture_${item.id}`;

        console.log(`Table positioned for ${item.name} at:`, gltfMesh.position);

        // Wrap in bounding box mesh to avoid picking perf hit
        const boundingBox =
          BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(gltfMesh as any);
        console.log(`Bounding box created for ${item.name}:`, boundingBox);

        // Create bounding box gizmo
        const utilLayer = new UtilityLayerRenderer(scene);
        utilLayer.utilityLayerScene.autoClearDepthAndStencil = false;
        const gizmo = new BoundingBoxGizmo(
          Color3.FromHexString("#0984e3"),
          utilLayer
        );
        gizmo.attachedMesh = boundingBox;
        console.log(`Gizmo created for ${item.name}:`, gizmo);

        // Create behaviors to drag and scale
        const sixDofDragBehavior = new SixDofDragBehavior();
        boundingBox.addBehavior(sixDofDragBehavior);
        const multiPointerScaleBehavior = new MultiPointerScaleBehavior();
        boundingBox.addBehavior(multiPointerScaleBehavior);
        console.log(`Behaviors added for ${item.name}`);

        // Add constraint to keep furniture within room boundaries
        if (onFurnitureMove) {
          sixDofDragBehavior.onDragObservable.add(() => {
            const halfWidth = roomWidth / 200;
            const halfLength = roomLength / 200;

            // Constrain X position (keep furniture within room bounds)
            boundingBox.position.x = Math.max(
              -halfWidth,
              Math.min(halfWidth, boundingBox.position.x)
            );
            boundingBox.position.z = Math.max(
              -halfLength,
              Math.min(halfLength, boundingBox.position.z)
            );
            boundingBox.position.y = 1.0; // Fixed Y position

            // Update furniture position to match bounding box
            gltfMesh.position = boundingBox.position.clone();

            // Notify parent component
            onFurnitureMove(item.id, {
              x: boundingBox.position.x * 100, // Convert back to meters
              z: boundingBox.position.z * 100,
            });
          });
        }
      } else {
        console.log(`No table meshes found in container, keeping fallback box`);
      }
    },
    function (error) {
      console.error(`Error loading table.glb:`, error);
      console.log(`Keeping fallback box due to error`);
    }
  );
}

// Helper function to create furniture from props using sample code approach
async function createFurnitureFromProps(scene: any, furniture: any[]) {
  const {
    Color3,
    Vector3,
    MeshBuilder,
    StandardMaterial,
    // BoundingBoxGizmo,
    // UtilityLayerRenderer
  } = await import("@babylonjs/core");

  // Custom drag drop - no need for behaviors
  // const { SixDofDragBehavior, MultiPointerScaleBehavior } = await import(
  //   "@babylonjs/core"
  // );

  // Clear existing furniture meshes (only furniture, not room elements)
  const existingFurniture = scene.meshes.filter((mesh: any) =>
    mesh.name.startsWith("furniture_")
  );
  existingFurniture.forEach((mesh: any) => {
    if (mesh.name.startsWith("furniture_")) {
      mesh.dispose();
    }
  });

  // Don't create furniture if no furniture items
  if (furniture.length === 0) {
    console.log("No furniture to create");
    return;
  }

  for (const item of furniture) {
    // Convert from meters to 3D units (scale down by 100)
    const scaledX = item.position.x / 100;
    const scaledZ = item.position.z / 100;
    const scaledHeight = item.height / 100;
    const scaledWidth = item.width / 100;
    const scaledLength = item.length / 100;

    // Create simple box for all furniture items
    console.log(
      `Creating box for furniture: ${item.name} at position (${scaledX}, ${scaledZ})`
    );

    const minSize = 0.5;
    const furnitureMesh = MeshBuilder.CreateBox(
      `furniture_${item.id}`,
      {
        width: Math.max(scaledWidth, minSize),
        height: Math.max(scaledHeight, minSize),
        depth: Math.max(scaledLength, minSize),
      },
      scene
    );

    furnitureMesh.position = new Vector3(
      scaledX,
      Math.max(scaledHeight / 2, 0.5),
      scaledZ
    );
    furnitureMesh.rotation.y = (item.rotation * Math.PI) / 180;

    const furnitureMaterial = new StandardMaterial(
      `furnitureMaterial_${item.id}`,
      scene
    );
    const color = Color3.FromHexString(item.color);
    furnitureMaterial.diffuseColor = color;
    furnitureMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    furnitureMaterial.emissiveColor = new Color3(0.1, 0.1, 0.1);
    furnitureMaterial.wireframe = false;
    furnitureMesh.material = furnitureMaterial;

    // Temporarily disable BoundingBoxGizmo to avoid rendering issues
    // const utilLayer = new UtilityLayerRenderer(scene);
    // utilLayer.utilityLayerScene.autoClearDepthAndStencil = false;
    // const gizmo = new BoundingBoxGizmo(
    //   Color3.FromHexString("#0984e3"),
    //   utilLayer
    // );
    // gizmo.attachedMesh = furnitureMesh;
    // console.log(`Gizmo created for ${item.name}:`, gizmo);

    // Add custom drag drop functionality
    addCustomDragDrop(furnitureMesh, scene, item);
    console.log(`Custom drag drop added for ${item.name}`);

    console.log(`Box created for ${item.name} at:`, furnitureMesh.position);
  }
}

// Global drag drop variables - exactly like the example
let startingPoint: any = null;
let currentMesh: any = null;

// Get ground position from pointer - exactly like the example
function getGroundPosition(scene: any) {
  const pickinfo = scene.pick(scene.pointerX, scene.pointerY, (mesh: any) => {
    return mesh.name === "floor";
  });
  if (pickinfo.hit) {
    return pickinfo.pickedPoint;
  }
  return null;
}

// Pointer down handler - exactly like the example
function pointerDown(mesh: any, scene: any, canvas: any) {
  currentMesh = mesh;
  startingPoint = getGroundPosition(scene);
  if (startingPoint) {
    // We need to disconnect camera from canvas
    setTimeout(() => {
      const camera = scene.cameras[0];
      if (camera && camera.detachControl) {
        camera.detachControl(canvas);
      }
    }, 0);
  }
}

// Pointer up handler - always reattach camera
function pointerUp(scene: any, canvas: any) {
  const camera = scene.cameras[0];
  if (camera && camera.attachControl) {
    camera.attachControl(canvas, true);
  }
  if (startingPoint) {
    startingPoint = null;
  }
}

// Pointer move handler - exactly like the example
function pointerMove(scene: any) {
  if (!startingPoint) {
    return;
  }
  const current = getGroundPosition(scene);
  if (!current) {
    return;
  }

  const diff = current.subtract(startingPoint);
  currentMesh.position.addInPlace(diff);
  startingPoint = current;
}

// Custom drag drop function based on the example
function addCustomDragDrop(furnitureMesh: any, scene: any, item: any) {
  // Add pointer observable - exactly like the example
  scene.onPointerObservable.add((pointerInfo: any) => {
    switch (pointerInfo.type) {
      case 1: // POINTERDOWN
        if (
          pointerInfo.pickInfo.hit &&
          pointerInfo.pickInfo.pickedMesh === furnitureMesh
        ) {
          pointerDown(
            pointerInfo.pickInfo.pickedMesh,
            scene,
            scene.getEngine().getRenderingCanvas()
          );
        }
        break;
      case 2: // POINTERUP
        pointerUp(scene, scene.getEngine().getRenderingCanvas());
        break;
      case 4: // POINTERMOVE
        pointerMove(scene);
        break;
    }
  });
}
