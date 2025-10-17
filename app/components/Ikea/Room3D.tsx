import { Color4, Vector3, MeshBuilder } from "@babylonjs/core";
import { useEffect, useRef, useState } from "react";

interface Room3DProps {
  width: number;
  length: number;
  furniture?: Array<{
    id: string;
    name: string;
    color: string;
    position: { x: number; z: number };
    rotation: number;
    modelFile: string;
    scale: number;
    yOffset: number;
  }>;
  onFurnitureMove?: (id: string, position: { x: number; z: number }) => void;
  onFurnitureRemove?: (furnitureId: string) => void;
  onSceneLoaded?: (loaded: boolean) => void;
}

// Helper function to get furniture name from ID
const getFurnitureName = (furnitureId: string, furniture: any[]) => {
  const furnitureIdOnly = furnitureId.replace("furniture_", "");
  const furnitureItem = furniture.find((item) => item.id === furnitureIdOnly);
  return furnitureItem?.name || "Furniture";
};

export function Room3D({
  width,
  length,
  furniture = [],
  onFurnitureMove,
  onFurnitureRemove,
  onSceneLoaded,
}: Room3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const engineRef = useRef<any>(null);
  // Drag/click discrimination refs
  const isDraggingRef = useRef<boolean>(false);
  const dragInitiatedRef = useRef<boolean>(false);
  const downClientPosRef = useRef<{ x: number; y: number } | null>(null);
  const selectedFurnitureIdRef = useRef<string | null>(null);

  // Track all furniture meshes and their children
  const furnitureMeshesRef = useRef<Set<string>>(new Set());

  // Store furniture state (position, rotation) to preserve when adding new furniture
  const furnitureStateRef = useRef<
    Map<string, { position: { x: number; z: number }; rotation: number }>
  >(new Map());

  // Track which furniture has been created to avoid reloading
  const createdFurnitureRef = useRef<Set<string>>(new Set());

  // List of fixed mesh names that should not be interactive
  const fixedMeshNames = [
    "floor",
    "ceiling",
    "frontWall",
    "backWall",
    "leftWall",
    "rightWall",
    "frontWallBase",
    "backWallBase",
    "leftWallBase",
    "rightWallBase",
    "frontCeilingBase",
    "backCeilingBase",
    "leftCeilingBase",
    "rightCeilingBase",
    "frontLeftCornerBase",
    "frontRightCornerBase",
    "backLeftCornerBase",
    "backRightCornerBase",
    "testBox",
  ];

  // Function to check if a mesh is furniture (interactive)
  const isFurnitureMesh = (mesh: any) => {
    if (!mesh) return false;

    // First check if it's a fixed mesh (not interactive)
    if (fixedMeshNames.includes(mesh.name)) {
      return false;
    }

    // Check if mesh name is in furniture meshes set
    if (furnitureMeshesRef.current.has(mesh.name)) {
      return true;
    }

    // Check if mesh is a child of furniture mesh
    let currentMesh = mesh;
    while (currentMesh.parent) {
      if (furnitureMeshesRef.current.has(currentMesh.parent.name)) {
        return true;
      }
      currentMesh = currentMesh.parent;
    }

    return false;
  };

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    furnitureId: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    furnitureId: "",
  });

  // Rotation slider state
  const [rotationSlider, setRotationSlider] = useState<{
    visible: boolean;
    value: number;
  }>({
    visible: false,
    value: 0,
  });

  // Main useEffect to initialize scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Reset scene loaded state when dimensions change
    if (onSceneLoaded) {
      onSceneLoaded(false);
    }

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
          PointLight,
          SpotLight,
          ShadowGenerator,
          Texture,
          Matrix,
        } = await import("@babylonjs/core");

        // Convert from meters to 3D units (scale down by 100)
        const scaledWidth = width / 100;
        const scaledLength = length / 100;
        const wallHeight = 2;

        // Initialize Babylon.js engine and scene
        const engine = new Engine(canvasRef.current, true);
        const scene = new Scene(engine);
        // scene.clearColor = new Color4(0.8, 0.8, 0.8, 1.0);

        engineRef.current = engine;
        sceneRef.current = scene;

        // Store room dimensions in scene metadata for collision detection
        scene.metadata = {
          scaledWidth: scaledWidth,
          scaledLength: scaledLength,
          wallHeight: wallHeight,
        };

        // Create camera
        const camera = new ArcRotateCamera(
          "camera",
          -Math.PI / 2,
          Math.PI / 3,
          Math.max(scaledWidth, scaledLength, wallHeight) * 2,
          Vector3.Zero(),
          scene
        );

        // Set zoom limits
        camera.setTarget(Vector3.Zero());
        camera.lowerRadiusLimit = Math.max(scaledWidth, scaledLength) * 0.5;
        camera.upperRadiusLimit =
          Math.max(scaledWidth, scaledLength, wallHeight) * 4;

        // Attach camera controls
        if (canvasRef.current) {
          camera.attachControl(canvasRef.current, true);
        }

        // Remove ambient lighting to see shadows better
        // const hemisphericLight = new HemisphericLight(
        //   "hemisphericLight",
        //   new Vector3(0, 1, 0),
        //   scene
        // );
        // hemisphericLight.intensity = 1.2;

        // const ambientLight = new HemisphericLight(
        //   "ambientLight",
        //   new Vector3(0, -1, 0),
        //   scene
        // );
        // ambientLight.intensity = 0.3;

        // Create single ceiling light in the center of the room
        const lightIntensity = 1.5; // Reduced intensity for softer lighting

        // Use PointLight for shadow casting
        const centerLight = new PointLight(
          "centerLight",
          new Vector3(0, wallHeight + 1, 0), // Position at ceiling
          scene
        );
        centerLight.intensity = lightIntensity;
        centerLight.range = Math.max(scaledWidth, scaledLength) * 3; // Larger range

        // Create a visible sphere to represent the light source
        const lightSphere = MeshBuilder.CreateSphere(
          "lightSphere",
          { diameter: 0.3 },
          scene
        );
        lightSphere.position = new Vector3(0, wallHeight - 0.1, 0);

        // Create glowing material for the light sphere
        const lightMaterial = new StandardMaterial("lightMaterial", scene);
        lightMaterial.diffuseColor = new Color3(1, 1, 0.8); // Warm white
        lightMaterial.emissiveColor = new Color3(0.5, 0.5, 0.3); // Glowing effect
        lightMaterial.specularColor = new Color3(1, 1, 1);
        lightSphere.material = lightMaterial;

        // Create room floor with texture and shadows
        const floor = MeshBuilder.CreateGround(
          "floor",
          {
            width: scaledWidth,
            height: scaledLength,
          },
          scene
        );

        const floorMaterial = new StandardMaterial("floorMaterial", scene);
        const floorTexture = new Texture("/assets/ikea/floor.jpg", scene);
        floorTexture.uScale = scaledWidth / 2;
        floorTexture.vScale = scaledLength / 2;
        floorMaterial.diffuseTexture = floorTexture;
        floorMaterial.diffuseColor = new Color3(1, 1, 1); // White base color
        floorMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        floorMaterial.backFaceCulling = false;
        floor.material = floorMaterial;

        // Create 4 wall bases (along walls) - always visible
        const baseHeight = 0.1;
        const baseThickness = 0.05;

        const baseMaterial = new StandardMaterial("baseMaterial", scene);
        baseMaterial.diffuseColor = new Color3(1, 1, 1);
        baseMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

        // Front wall base
        const frontWallBase = MeshBuilder.CreateBox(
          "frontWallBase",
          {
            width: scaledWidth,
            height: baseHeight,
            depth: baseThickness,
          },
          scene
        );
        frontWallBase.position = new Vector3(
          0,
          baseHeight / 2,
          scaledLength / 2 - baseThickness / 2
        );
        frontWallBase.material = baseMaterial;

        // Back wall base
        const backWallBase = MeshBuilder.CreateBox(
          "backWallBase",
          {
            width: scaledWidth,
            height: baseHeight,
            depth: baseThickness,
          },
          scene
        );
        backWallBase.position = new Vector3(
          0,
          baseHeight / 2,
          -scaledLength / 2 + baseThickness / 2
        );
        backWallBase.material = baseMaterial;

        // Left wall base
        const leftWallBase = MeshBuilder.CreateBox(
          "leftWallBase",
          {
            width: baseThickness,
            height: baseHeight,
            depth: scaledLength,
          },
          scene
        );
        leftWallBase.position = new Vector3(
          -scaledWidth / 2 + baseThickness / 2,
          baseHeight / 2,
          0
        );
        leftWallBase.material = baseMaterial;

        // Right wall base
        const rightWallBase = MeshBuilder.CreateBox(
          "rightWallBase",
          {
            width: baseThickness,
            height: baseHeight,
            depth: scaledLength,
          },
          scene
        );
        rightWallBase.position = new Vector3(
          scaledWidth / 2 - baseThickness / 2,
          baseHeight / 2,
          0
        );
        rightWallBase.material = baseMaterial;

        // Create ceiling wall bases (wall-ceiling contact)
        const ceilingBaseHeight = 0.1;
        const ceilingBaseThickness = 0.05;

        // Front ceiling base
        const frontCeilingBase = MeshBuilder.CreateBox(
          "frontCeilingBase",
          {
            width: scaledWidth,
            height: ceilingBaseHeight,
            depth: ceilingBaseThickness,
          },
          scene
        );
        frontCeilingBase.position = new Vector3(
          0,
          wallHeight - ceilingBaseHeight / 2,
          scaledLength / 2 - ceilingBaseThickness / 2
        );
        frontCeilingBase.material = baseMaterial;

        // Back ceiling base
        const backCeilingBase = MeshBuilder.CreateBox(
          "backCeilingBase",
          {
            width: scaledWidth,
            height: ceilingBaseHeight,
            depth: ceilingBaseThickness,
          },
          scene
        );
        backCeilingBase.position = new Vector3(
          0,
          wallHeight - ceilingBaseHeight / 2,
          -scaledLength / 2 + ceilingBaseThickness / 2
        );
        backCeilingBase.material = baseMaterial;

        // Left ceiling base
        const leftCeilingBase = MeshBuilder.CreateBox(
          "leftCeilingBase",
          {
            width: ceilingBaseThickness,
            height: ceilingBaseHeight,
            depth: scaledLength,
          },
          scene
        );
        leftCeilingBase.position = new Vector3(
          -scaledWidth / 2 + ceilingBaseThickness / 2,
          wallHeight - ceilingBaseHeight / 2,
          0
        );
        leftCeilingBase.material = baseMaterial;

        // Right ceiling base
        const rightCeilingBase = MeshBuilder.CreateBox(
          "rightCeilingBase",
          {
            width: ceilingBaseThickness,
            height: ceilingBaseHeight,
            depth: scaledLength,
          },
          scene
        );
        rightCeilingBase.position = new Vector3(
          scaledWidth / 2 - ceilingBaseThickness / 2,
          wallHeight - ceilingBaseHeight / 2,
          0
        );
        rightCeilingBase.material = baseMaterial;

        // Create corner bases (wall-wall contact at corners)
        const cornerBaseHeight = wallHeight;
        const cornerBaseThickness = 0.05;

        // Front-left corner base
        const frontLeftCornerBase = MeshBuilder.CreateBox(
          "frontLeftCornerBase",
          {
            width: cornerBaseThickness,
            height: cornerBaseHeight,
            depth: cornerBaseThickness,
          },
          scene
        );
        frontLeftCornerBase.position = new Vector3(
          -scaledWidth / 2 + cornerBaseThickness / 2,
          cornerBaseHeight / 2,
          scaledLength / 2 - cornerBaseThickness / 2
        );
        frontLeftCornerBase.material = baseMaterial;

        // Front-right corner base
        const frontRightCornerBase = MeshBuilder.CreateBox(
          "frontRightCornerBase",
          {
            width: cornerBaseThickness,
            height: cornerBaseHeight,
            depth: cornerBaseThickness,
          },
          scene
        );
        frontRightCornerBase.position = new Vector3(
          scaledWidth / 2 - cornerBaseThickness / 2,
          cornerBaseHeight / 2,
          scaledLength / 2 - cornerBaseThickness / 2
        );
        frontRightCornerBase.material = baseMaterial;

        // Back-left corner base
        const backLeftCornerBase = MeshBuilder.CreateBox(
          "backLeftCornerBase",
          {
            width: cornerBaseThickness,
            height: cornerBaseHeight,
            depth: cornerBaseThickness,
          },
          scene
        );
        backLeftCornerBase.position = new Vector3(
          -scaledWidth / 2 + cornerBaseThickness / 2,
          cornerBaseHeight / 2,
          -scaledLength / 2 + cornerBaseThickness / 2
        );
        backLeftCornerBase.material = baseMaterial;

        // Back-right corner base
        const backRightCornerBase = MeshBuilder.CreateBox(
          "backRightCornerBase",
          {
            width: cornerBaseThickness,
            height: cornerBaseHeight,
            depth: cornerBaseThickness,
          },
          scene
        );
        backRightCornerBase.position = new Vector3(
          scaledWidth / 2 - cornerBaseThickness / 2,
          cornerBaseHeight / 2,
          -scaledLength / 2 + cornerBaseThickness / 2
        );
        backRightCornerBase.material = baseMaterial;

        // Create room walls
        const wallThickness = 0.02;

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

        // Create wall material
        const wallMaterial = new StandardMaterial("wallMaterial", scene);
        wallMaterial.diffuseColor = new Color3(0.9, 0.9, 0.9);
        // wallMaterial.diffuseColor = new Color3(0.9, 0.75, 0.6); // Brighter light brown color
        wallMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

        // Function to update wall visibility based on camera angle
        const updateWallVisibility = () => {
          const cameraPosition = camera.position;
          const walls = [frontWall, backWall, leftWall, rightWall];
          const wallPositions = [
            new Vector3(0, wallHeight / 2, scaledLength / 2),
            new Vector3(0, wallHeight / 2, -scaledLength / 2),
            new Vector3(-scaledWidth / 2, wallHeight / 2, 0),
            new Vector3(scaledWidth / 2, wallHeight / 2, 0),
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

          // Hide ceiling bases and corner bases based on which walls are hidden
          const hiddenWalls = distances.slice(0, 2).map(({ wall }) => wall);

          // Hide ceiling bases for hidden walls
          frontCeilingBase.isVisible = !hiddenWalls.includes(frontWall);
          backCeilingBase.isVisible = !hiddenWalls.includes(backWall);
          leftCeilingBase.isVisible = !hiddenWalls.includes(leftWall);
          rightCeilingBase.isVisible = !hiddenWalls.includes(rightWall);

          // Calculate distances from camera to corner bases
          const cornerBasePositions = [
            new Vector3(-scaledWidth / 2, wallHeight / 2, scaledLength / 2),
            new Vector3(scaledWidth / 2, wallHeight / 2, scaledLength / 2),
            new Vector3(-scaledWidth / 2, wallHeight / 2, -scaledLength / 2),
            new Vector3(scaledWidth / 2, wallHeight / 2, -scaledLength / 2),
          ];

          const cornerBases = [
            frontLeftCornerBase,
            frontRightCornerBase,
            backLeftCornerBase,
            backRightCornerBase,
          ];
          const cornerDistances = cornerBases.map((base, index) => ({
            base,
            distance: Vector3.Distance(
              cameraPosition,
              cornerBasePositions[index]
            ),
          }));

          // Sort by distance and hide closest corner base
          cornerDistances.sort((a, b) => a.distance - b.distance);

          // Show all corner bases first
          cornerBases.forEach((base) => {
            base.isVisible = true;
          });

          // Hide closest corner base
          cornerDistances[0].base.isVisible = false;
        };

        // Apply initial material to all walls
        [frontWall, backWall, leftWall, rightWall].forEach((wall) => {
          wall.material = wallMaterial;
        });

        // Update wall visibility when camera moves
        scene.registerBeforeRender(() => {
          updateWallVisibility();
        });

        // Create ceiling
        const ceiling = MeshBuilder.CreateGround(
          "ceiling",
          {
            width: scaledWidth,
            height: scaledLength,
          },
          scene
        );
        ceiling.position = new Vector3(0, wallHeight, 0);
        ceiling.rotation = new Vector3(Math.PI, 0, 0);

        const ceilingMaterial = new StandardMaterial("ceilingMaterial", scene);
        ceilingMaterial.diffuseColor = new Color3(0.6, 0.4, 0.2);
        ceilingMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        ceiling.material = ceilingMaterial;

        // Create test box to verify shadows
        // const testBox = MeshBuilder.CreateBox(
        //   "testBox",
        //   { size: 0.5 },
        //   scene
        // );
        // testBox.position = new Vector3(0, 1, 0); // Raise box higher

        // const testBoxMaterial = new StandardMaterial("testBoxMaterial", scene);
        // testBoxMaterial.diffuseColor = new Color3(1, 0, 0); // Red color
        // testBox.material = testBoxMaterial;

        // Create shadow generator with simple configuration
        const shadowGenerator = new ShadowGenerator(1024, centerLight);

        // Configure shadow generator with basic settings
        shadowGenerator.useBlurExponentialShadowMap = false; // Disable blur for testing
        shadowGenerator.darkness = 0.8; // Very dark shadows

        // Enable shadows on the light
        centerLight.shadowEnabled = true;

        // Store shadow generator in scene metadata for later access
        scene.metadata = {
          ...scene.metadata,
          shadowGenerator: shadowGenerator,
        };

        // Add room elements as shadow casters
        shadowGenerator.addShadowCaster(floor);
        [frontWall, backWall, leftWall, rightWall, ceiling].forEach((mesh) => {
          shadowGenerator.addShadowCaster(mesh);
        });

        // Add test box as shadow caster
        // shadowGenerator.addShadowCaster(testBox);

        // Set up shadow receivers for all room elements
        floor.receiveShadows = true;
        [frontWall, backWall, leftWall, rightWall].forEach((wall) => {
          wall.receiveShadows = true;
        });

        // Force all meshes to be shadow casters and receivers
        scene.meshes.forEach((mesh: any) => {
          if (
            mesh.name !== "__root__" &&
            !mesh.name.includes("lightSphere") &&
            !mesh.name.startsWith("furniture_")
          ) {
            shadowGenerator.addShadowCaster(mesh);
            mesh.receiveShadows = true;
          }
        });

        // Force shadow map update
        shadowGenerator.getShadowMap()?.render();

        // Debug shadow map
        const shadowMap = shadowGenerator.getShadowMap();

        // Setup drag drop for furniture meshes only
        scene.onPointerObservable.add((pointerInfo: any) => {
          switch (pointerInfo.type) {
            case 1: // POINTERDOWN
              if (
                pointerInfo.pickInfo.hit &&
                isFurnitureMesh(pointerInfo.pickInfo.pickedMesh)
              ) {
                // Use the root furniture mesh for dragging
                let furnitureMesh = pointerInfo.pickInfo.pickedMesh;

                // Find the root furniture mesh
                if (!furnitureMesh.name.startsWith("furniture_")) {
                  let currentMesh = furnitureMesh;
                  while (
                    currentMesh.parent &&
                    !currentMesh.name.startsWith("furniture_")
                  ) {
                    currentMesh = currentMesh.parent;
                  }
                  if (currentMesh.name.startsWith("furniture_")) {
                    furnitureMesh = currentMesh;
                  }
                }

                // Handle selection first - LEFT CLICK ONLY
                if (pointerInfo.event.button === 0) {
                  // LEFT CLICK
                  // First deselect all other furniture
                  scene.meshes.forEach((mesh: any) => {
                    if (
                      mesh.name.startsWith("furniture_") &&
                      mesh !== furnitureMesh
                    ) {
                      mesh.isSelected = false;
                      mesh.renderOutline = false;
                    }
                  });

                  // Always select the clicked furniture
                  (furnitureMesh as any).isSelected = true;
                  (furnitureMesh as any).renderOutline = (
                    furnitureMesh as any
                  ).isSelected;

                  // Change cursor
                  if ((furnitureMesh as any).isSelected) {
                    document.body.style.cursor = "move";
                  } else {
                    document.body.style.cursor = "default";
                  }

                  // Show context menu immediately on left click
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    const rawX = pointerInfo.event.clientX - rect.left;
                    const rawY = pointerInfo.event.clientY - rect.top;
                    const menuWidth = 220;
                    const menuHeight = 180;
                    const clampedX = Math.max(
                      0,
                      Math.min(rawX, rect.width - menuWidth)
                    );
                    const clampedY = Math.max(
                      0,
                      Math.min(rawY, rect.height - menuHeight)
                    );
                    setContextMenu({
                      visible: true,
                      x: clampedX,
                      y: clampedY,
                      furnitureId: furnitureMesh.name,
                    });
                  } else {
                    setContextMenu({
                      visible: true,
                      x: pointerInfo.event.clientX,
                      y: pointerInfo.event.clientY,
                      furnitureId: furnitureMesh.name,
                    });
                  }

                  // Prepare for drag detection
                  isDraggingRef.current = false;
                  dragInitiatedRef.current = false;
                  downClientPosRef.current = {
                    x: pointerInfo.event.clientX,
                    y: pointerInfo.event.clientY,
                  };
                  selectedFurnitureIdRef.current = furnitureMesh.name;
                }
              } else {
                // Clicked on empty space or room elements - deselect all furniture
                scene.meshes.forEach((mesh: any) => {
                  if (mesh.name.startsWith("furniture_") && mesh.isSelected) {
                    mesh.isSelected = false;
                    mesh.renderOutline = false;
                  }
                });
                document.body.style.cursor = "default";

                // Hide context menu and rotation slider if not clicking on UI elements
                if (
                  !pointerInfo.event.target ||
                  pointerInfo.event.target === canvasRef.current
                ) {
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                  setRotationSlider((prev) => ({ ...prev, visible: false }));
                }
              }
              break;
            case 2: // POINTERUP
              // Complete drag if it was initiated
              pointerUp(scene, canvasRef.current);
              // Always show menu after pointer up (whether dragged or not)
              if (selectedFurnitureIdRef.current) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  const rawX = pointerInfo.event.clientX - rect.left;
                  const rawY = pointerInfo.event.clientY - rect.top;
                  const menuWidth = 220;
                  const menuHeight = 180;
                  const clampedX = Math.max(
                    0,
                    Math.min(rawX, rect.width - menuWidth)
                  );
                  const clampedY = Math.max(
                    0,
                    Math.min(rawY, rect.height - menuHeight)
                  );
                  setContextMenu({
                    visible: true,
                    x: clampedX,
                    y: clampedY,
                    furnitureId: selectedFurnitureIdRef.current,
                  });
                } else {
                  setContextMenu({
                    visible: true,
                    x: pointerInfo.event.clientX,
                    y: pointerInfo.event.clientY,
                    furnitureId: selectedFurnitureIdRef.current,
                  });
                }
              }
              // Reset click/drag refs
              isDraggingRef.current = false;
              dragInitiatedRef.current = false;
              downClientPosRef.current = null;
              selectedFurnitureIdRef.current = null;
              break;
            case 4: // POINTERMOVE
              // If we have a down point, check if movement exceeds threshold to start drag
              if (downClientPosRef.current) {
                const dx =
                  pointerInfo.event.clientX - downClientPosRef.current.x;
                const dy =
                  pointerInfo.event.clientY - downClientPosRef.current.y;
                const movedEnough = dx * dx + dy * dy > 36; // 6px threshold squared
                if (movedEnough) {
                  isDraggingRef.current = true;
                  // Hide menu and rotation slider when starting to drag
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                  setRotationSlider((prev) => ({ ...prev, visible: false }));
                  // Initiate drag lazily once
                  if (
                    !dragInitiatedRef.current &&
                    selectedFurnitureIdRef.current &&
                    sceneRef.current
                  ) {
                    const mesh = sceneRef.current.getMeshByName(
                      selectedFurnitureIdRef.current
                    );
                    if (mesh) {
                      pointerDown(mesh, sceneRef.current, canvasRef.current);
                      dragInitiatedRef.current = true;
                    }
                  }
                }
              }
              // Continue drag movement if active
              pointerMove(scene, furniture, furnitureStateRef);
              break;
          }
        });

        // Position camera to show the room nicely
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

        // Notify parent that scene is loaded
        if (onSceneLoaded) {
          onSceneLoaded(true);
        }
      } catch (error) {
        console.error("Error initializing Babylon.js scene:", error);
        // Notify parent that scene failed to load
        if (onSceneLoaded) {
          onSceneLoaded(false);
        }
      }
    };

    initScene();
  }, [width, length]);

  // Separate useEffect for furniture updates - only create new furniture
  useEffect(() => {
    if (sceneRef.current) {
      console.log("🔄 Room3D useEffect triggered with furniture:", furniture);
      console.log(
        "🔄 Current created furniture:",
        Array.from(createdFurnitureRef.current)
      );

      // Only create furniture that hasn't been created yet
      const newFurniture = furniture.filter(
        (item) => !createdFurnitureRef.current.has(item.id)
      );

      console.log(
        "🔄 New furniture to create:",
        newFurniture.map((f) => f.id)
      );

      // Always call createFurnitureFromProps to handle both creation and removal
      createFurnitureFromProps(
        sceneRef.current,
        furniture, // Pass all furniture, not just new ones
        setContextMenu,
        furnitureMeshesRef,
        furnitureStateRef,
        createdFurnitureRef
      );

      // Update shadow generator for any new meshes
      const shadowGenerator = sceneRef.current.metadata?.shadowGenerator;
      if (shadowGenerator) {
        sceneRef.current.meshes.forEach((mesh: any) => {
          if (
            mesh.name !== "__root__" &&
            !mesh.name.startsWith("furniture_") &&
            !mesh.name.includes("lightSphere")
          ) {
            shadowGenerator.addShadowCaster(mesh);
            mesh.receiveShadows = true;
          }
        });
      }
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

  // Get furniture name for context menu
  const furnitureName = getFurnitureName(contextMenu.furnitureId, furniture);

  return (
    <div
      className="w-full h-full relative"
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ touchAction: "none" }}
      />

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="absolute bg-gray-800 rounded-lg shadow-lg p-2 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            position: "absolute",
            zIndex: 9999,
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm font-medium">
              {furnitureName} Options
            </span>
            <button
              className="text-white hover:text-gray-300 text-lg"
              onClick={() => {
                setContextMenu((prev) => ({ ...prev, visible: false }));
                setRotationSlider((prev) => ({ ...prev, visible: false }));
              }}
            >
              ×
            </button>
          </div>
          <div className="flex flex-col space-y-1">
            <button
              className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-gray-700 rounded transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Get current rotation from furniture state or mesh
                let currentRotation = 0;
                const furnitureId = contextMenu.furnitureId.replace(
                  "furniture_",
                  ""
                );

                // First try to get from saved state
                const savedState = furnitureStateRef.current.get(furnitureId);
                if (savedState && savedState.rotation !== undefined) {
                  currentRotation = savedState.rotation;
                  console.log("🔄 Using saved rotation:", currentRotation);
                } else if (sceneRef.current) {
                  // Fallback to mesh rotation
                  const furniture = sceneRef.current.getMeshByName(
                    contextMenu.furnitureId
                  );
                  if (furniture) {
                    // Check if furniture has a container
                    const container = furniture.parent;
                    if (container && container.name.includes("_container")) {
                      currentRotation = (container.rotation.y * 180) / Math.PI;
                      console.log(
                        "🔄 Using container rotation:",
                        currentRotation
                      );
                    } else {
                      currentRotation = (furniture.rotation.y * 180) / Math.PI;
                      console.log(
                        "🔄 Using furniture rotation:",
                        currentRotation
                      );
                    }
                  }
                }
                // Normalize rotation to 0-360 range
                const normalizedRotation =
                  ((currentRotation % 360) + 360) % 360;
                console.log("🔄 Normalized rotation:", normalizedRotation);

                // Show rotation slider but keep context menu visible
                setRotationSlider({
                  visible: true,
                  value: normalizedRotation,
                });
                // Don't hide context menu - keep it visible with rotation slider
              }}
            >
              <span>🔄</span>
              <span>Rotate</span>
            </button>
            <button
              className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-gray-700 rounded transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Remove furniture
                if (onFurnitureRemove) {
                  const furnitureId = contextMenu.furnitureId.replace(
                    "furniture_",
                    ""
                  );
                  onFurnitureRemove(furnitureId);
                }
                // Close both context menu and rotation slider
                setContextMenu((prev) => ({ ...prev, visible: false }));
                setRotationSlider((prev) => ({ ...prev, visible: false }));
              }}
            >
              <span>🗑️</span>
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {/* Rotation Slider */}
      {rotationSlider.visible && (
        <div
          className="absolute bg-gray-800 rounded-lg shadow-lg p-4 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y + 120,
            width: 250,
            position: "absolute",
            zIndex: 9999,
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-white text-sm font-medium">
              Rotate {furnitureName}
            </span>
            <button
              className="text-white hover:text-gray-300 text-lg"
              onClick={() => {
                setRotationSlider((prev) => ({ ...prev, visible: false }));
                // Don't close context menu - only close rotation slider
              }}
            >
              ×
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs">0°</span>
              <input
                type="range"
                min="0"
                max="360"
                value={rotationSlider.value}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  setRotationSlider((prev) => ({ ...prev, value: newValue }));

                  // Apply rotation to furniture
                  if (sceneRef.current) {
                    const furniture = sceneRef.current.getMeshByName(
                      contextMenu.furnitureId
                    );
                    if (furniture) {
                      console.log("🔄 Rotation slider changed to:", newValue);

                      // Create invisible container approach
                      console.log(
                        "🔄 Creating invisible container for rotation"
                      );

                      // Check if furniture already has a container
                      let container = furniture.parent;
                      if (
                        !container ||
                        !container.name.includes("_container")
                      ) {
                        console.log("🔄 Creating new container for furniture");

                        // Create invisible container
                        const containerName = `${furniture.name}_container`;
                        container = MeshBuilder.CreateBox(
                          containerName,
                          {
                            width: 2,
                            height: 2,
                            depth: 2,
                          },
                          sceneRef.current
                        );

                        // Make container invisible
                        container.isVisible = false;
                        container.enablePointerMoveEvents = false;

                        // Set container position to furniture position
                        container.position = furniture.position.clone();

                        // Make furniture a child of container
                        furniture.setParent(container);

                        // Update furniture position relative to container
                        furniture.position = Vector3.Zero();

                        console.log("🔄 Container created:", container.name);
                        console.log(
                          "🔄 Container position:",
                          container.position
                        );
                        console.log(
                          "🔄 Furniture position relative to container:",
                          furniture.position
                        );
                      } else {
                        console.log(
                          "🔄 Using existing container:",
                          container.name
                        );
                      }

                      // Rotate the container instead of furniture
                      container.rotation.y = (newValue * Math.PI) / 180;
                      console.log(
                        "🔄 Container rotation applied:",
                        container.rotation.y
                      );

                      // Save furniture state using container position
                      const furnitureId = contextMenu.furnitureId.replace(
                        "furniture_",
                        ""
                      );
                      furnitureStateRef.current.set(furnitureId, {
                        position: {
                          x: container.position.x * 100,
                          z: container.position.z * 100,
                        },
                        rotation: newValue,
                      });

                      // Don't call onFurnitureMove during rotation to prevent reload
                      // The rotation state is already saved in furnitureStateRef
                      console.log(
                        "🔄 Rotation applied, skipping onFurnitureMove to prevent reload"
                      );
                    }
                  }
                }}
                className="flex-1"
              />
              <span className="text-white text-xs">360°</span>
            </div>
            <div className="text-center">
              <span className="text-white text-sm">
                {Math.round(rotationSlider.value)}°
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to create furniture from props using table.glb model
async function createFurnitureFromProps(
  scene: any,
  furniture: any[],
  setContextMenu: any,
  furnitureMeshesRef: any,
  furnitureStateRef: any,
  createdFurnitureRef?: any
) {
  await import("@babylonjs/loaders/glTF");
  const { SceneLoader, Color3, Vector3, MeshBuilder, StandardMaterial } =
    await import("@babylonjs/core");

  console.log(
    "🪑 Creating furniture:",
    furniture.map((f) => f.id)
  );

  // Get existing furniture meshes in scene
  const existingFurniture = scene.meshes.filter((mesh: any) =>
    mesh.name.startsWith("furniture_")
  );

  console.log(
    "🪑 Existing furniture in scene:",
    existingFurniture.map((m: any) => m.name)
  );

  // Get existing furniture IDs
  const existingFurnitureIds = new Set(
    existingFurniture.map((mesh: any) => mesh.name.replace("furniture_", ""))
  );

  console.log("🪑 Existing furniture IDs:", Array.from(existingFurnitureIds));

  // Get new furniture IDs from props
  const newFurnitureIds = new Set(furniture.map((item) => item.id));

  console.log("🪑 New furniture IDs from props:", Array.from(newFurnitureIds));

  // Only remove furniture that was previously created but no longer in props
  const furnitureToRemove = existingFurniture.filter((mesh: any) => {
    const furnitureId = mesh.name.replace("furniture_", "");
    const wasCreated = createdFurnitureRef?.current.has(furnitureId);
    const notInProps = !newFurnitureIds.has(furnitureId);
    
    // Only remove if it was created before but not in current props
    return wasCreated && notInProps;
  });

  console.log(
    "🪑 Furniture to remove:",
    furnitureToRemove.map((m: any) => m.name)
  );
  console.log("🪑 Created furniture ref:", Array.from(createdFurnitureRef?.current || []));

  furnitureToRemove.forEach((mesh: any) => {
    console.log("🗑️ Disposing furniture mesh:", mesh.name);

    // Remove all child meshes from tracking
    const childMeshes = scene.meshes.filter(
      (childMesh: any) =>
        childMesh.parent === mesh ||
        (childMesh.parent && childMesh.parent.name === mesh.name)
    );

    console.log(
      "🗑️ Child meshes to dispose:",
      childMeshes.map((m: any) => m.name)
    );

    // Remove from shadow generator
    const shadowGenerator = scene.metadata?.shadowGenerator;
    if (shadowGenerator) {
      // Remove main mesh
      shadowGenerator.removeShadowCaster(mesh);
      // Remove all child meshes
      childMeshes.forEach((childMesh: any) => {
        shadowGenerator.removeShadowCaster(childMesh);
      });
    }

    childMeshes.forEach((childMesh: any) => {
      furnitureMeshesRef.current.delete(childMesh.name);
    });

    mesh.dispose();
    furnitureMeshesRef.current.delete(mesh.name);
    console.log("🗑️ Furniture mesh disposed:", mesh.name);
  });

  // Remove from created furniture tracking
  furnitureToRemove.forEach((mesh: any) => {
    const furnitureId = mesh.name.replace("furniture_", "");
    if (createdFurnitureRef) {
      createdFurnitureRef.current.delete(furnitureId);
      console.log("🗑️ Removed from created furniture tracking:", furnitureId);
    }
  });

  // Don't create furniture if no furniture items
  if (furniture.length === 0) {
    return;
  }

  // Only create new furniture (no updating existing furniture)
  for (const item of furniture) {
    // Skip if furniture already exists in scene
    if (existingFurnitureIds.has(item.id)) {
      console.log("🪑 Skipping existing furniture:", item.id);
      continue;
    }
    
    // Skip if furniture was already created (to avoid duplicates)
    if (createdFurnitureRef?.current.has(item.id)) {
      console.log("🪑 Skipping already created furniture:", item.id);
      continue;
    }
    
    console.log("🪑 Creating furniture item:", item.id);

    // Use saved state if available, otherwise use item position
    const savedState = furnitureStateRef.current.get(item.id);
    const scaledX = savedState
      ? savedState.position.x / 100
      : item.position.x / 100;
    const scaledZ = savedState
      ? savedState.position.z / 100
      : item.position.z / 100;

    // Create fallback box first
    const fallbackBox = MeshBuilder.CreateBox(
      `fallback_${item.id}`,
      { size: 0.5 },
      scene
    );
    fallbackBox.position = new Vector3(scaledX, 0.25, scaledZ);
    fallbackBox.name = `furniture_${item.id}`;

    // Use saved rotation if available, otherwise use item rotation
    const rotation = savedState
      ? (savedState.rotation * Math.PI) / 180
      : (item.rotation * Math.PI) / 180;

    // Apply rotation to fallback box
    fallbackBox.rotation.y = rotation;

    // Create container for rotation if rotation is not 0
    if (Math.abs(rotation) > 0.001) {
      console.log(
        "🔄 Creating container for new furniture with rotation:",
        rotation
      );

      // Create invisible container
      const containerName = `furniture_${item.id}_container`;
      const container = MeshBuilder.CreateBox(
        containerName,
        {
          width: 2,
          height: 2,
          depth: 2,
        },
        scene
      );

      // Make container invisible
      container.isVisible = false;
      container.enablePointerMoveEvents = false;

      // Set container position to furniture position
      container.position = new Vector3(scaledX, 0.25, scaledZ);

      // Make furniture a child of container
      fallbackBox.setParent(container);

      // Update furniture position relative to container
      fallbackBox.position = Vector3.Zero();

      // Apply rotation to container
      container.rotation.y = rotation;

      console.log("🔄 Container created for new furniture:", container.name);
      console.log("🔄 Container position:", container.position);
      console.log("🔄 Container rotation:", container.rotation.y);
    }

    const fallbackMaterial = new StandardMaterial(
      `fallbackMaterial_${item.id}`,
      scene
    );
    fallbackMaterial.diffuseColor = Color3.FromHexString(item.color);
    fallbackBox.material = fallbackMaterial;

    // Load model using ImportMesh with modelFile and scale from furniture item
    SceneLoader.ImportMesh(
      "",
      "/assets/ikea/",
      item.modelFile,
      scene,
      async function (meshes, particleSystems, skeletons, animationGroups) {
        if (meshes.length > 0) {
          // Check if fallback box has a container before disposing
          const fallbackContainer = fallbackBox.parent;
          const hasContainer =
            fallbackContainer && fallbackContainer.name.includes("_container");

          // Remove fallback box
          fallbackBox.dispose();

          // Get the first mesh (root node)
          const furnitureMesh = meshes[0];

          // Scale and position the loaded model
          furnitureMesh.scaling.scaleInPlace(item.scale);

          if (hasContainer) {
            // If fallback had a container, use the container for the loaded model
            console.log("🔄 Preserving container for loaded model");
            furnitureMesh.position = Vector3.Zero(); // Position relative to container
            furnitureMesh.rotation.y = 0; // Reset rotation since container handles it
            furnitureMesh.name = `furniture_${item.id}`;

            // Make loaded model a child of the container
            furnitureMesh.setParent(fallbackContainer);

            console.log(
              "🔄 Loaded model added to existing container:",
              fallbackContainer.name
            );
          } else {
            // No container, position and rotate directly
            furnitureMesh.position = new Vector3(
              scaledX,
              item.yOffset,
              scaledZ
            );
            const rotation = savedState
              ? (savedState.rotation * Math.PI) / 180
              : (item.rotation * Math.PI) / 180;
            furnitureMesh.rotation.y = rotation;
            furnitureMesh.name = `furniture_${item.id}`;
          }

          // Add all meshes to furniture tracking
          meshes.forEach((mesh: any) => {
            furnitureMeshesRef.current.add(mesh.name);
          });

          // Add furniture to shadow generator
          const shadowGenerator = scene.metadata?.shadowGenerator;

          if (shadowGenerator) {
            meshes.forEach((mesh: any) => {
              shadowGenerator.addShadowCaster(mesh);
              mesh.receiveShadows = true;
            });
          }

          // Add custom drag drop functionality
          addCustomDragDrop(furnitureMesh, scene, item);

          // Add selection effect
          await addSelectionEffect(furnitureMesh, scene, setContextMenu);

          // Mark furniture as created
          if (createdFurnitureRef) {
            createdFurnitureRef.current.add(item.id);
            console.log("🪑 Marked furniture as created:", item.id);
          }
        }
      },
      function (progress) {
        // Loading progress
      },
      function (error) {
        console.error(`Error loading ${item.modelFile}:`, error);
      }
    );
  }
}

// Global drag drop variables
let startingPoint: any = null;
let currentMesh: any = null;

// Get ground position from pointer for furniture dragging
function getGroundPositionForFurniture(scene: any, furnitureMesh: any) {
  const pickinfo = scene.pick(scene.pointerX, scene.pointerY, (mesh: any) => {
    return mesh.name === "floor";
  });
  if (pickinfo.hit) {
    return pickinfo.pickedPoint;
  }

  // Fallback: create a ray from camera through mouse position
  const camera = scene.cameras[0];
  const ray = camera.getForwardRay();

  // Intersect with ground plane (y = 0)
  const distance = -ray.origin.y / ray.direction.y;
  if (distance > 0) {
    const intersection = ray.origin.add(ray.direction.scale(distance));
    return intersection;
  }

  return null;
}

// Pointer down handler
function pointerDown(mesh: any, scene: any, canvas: any) {
  currentMesh = mesh;
  startingPoint = getGroundPositionForFurniture(scene, mesh);
  if (startingPoint) {
    setTimeout(() => {
      const camera = scene.cameras[0];
      if (camera && camera.detachControl) {
        camera.detachControl(canvas);
      }
    }, 0);
  }
}

// Pointer up handler
function pointerUp(scene: any, canvas: any) {
  const camera = scene.cameras[0];
  if (camera && camera.attachControl) {
    camera.attachControl(canvas, true);
  }
  if (startingPoint) {
    startingPoint = null;
  }
}

// Pointer move handler with collision detection
function pointerMove(scene: any, furniture: any[], furnitureStateRef: any) {
  if (!startingPoint) {
    return;
  }
  const current = getGroundPositionForFurniture(scene, currentMesh);
  if (!current) {
    return;
  }

  const diff = current.subtract(startingPoint);

  // Check if furniture has a container (after rotation)
  const container = currentMesh.parent;
  const isInContainer = container && container.name.includes("_container");

  // Calculate new position - use container position if in container
  const basePosition = isInContainer
    ? container.position
    : currentMesh.position;
  const newPosition = basePosition.add(diff);

  // Get furniture item from furniture array
  let furnitureItem = null;
  if (currentMesh && currentMesh.name) {
    const furnitureId = currentMesh.name.replace("furniture_", "");
    // Find furniture item in the furniture array
    furnitureItem = furniture.find((item) => item.id === furnitureId) || {
      scale: 0.2,
    };
  }

  // Check collision with room boundaries
  if (checkCollisionWithRoom(newPosition, scene, currentMesh, furnitureItem)) {
    return; // Don't move if collision detected
  }

  // Move the furniture if no collision
  if (isInContainer) {
    // Move container instead of furniture
    container.position.addInPlace(diff);
    console.log("🔄 Moved container to:", container.position);
  } else {
    // Move furniture directly
    currentMesh.position.addInPlace(diff);
    console.log("🔄 Moved furniture to:", currentMesh.position);
  }
  startingPoint = current;

  // Save furniture state
  const furnitureId = currentMesh.name.replace("furniture_", "");
  const savePosition = isInContainer
    ? container.position
    : currentMesh.position;
  const saveRotation = isInContainer
    ? container.rotation.y
    : currentMesh.rotation.y;

  furnitureStateRef.current.set(furnitureId, {
    position: {
      x: savePosition.x * 100, // Convert back to meters
      z: savePosition.z * 100,
    },
    rotation: (saveRotation * 180) / Math.PI, // Convert back to degrees
  });

  // Update outline position if it exists
  if (currentMesh.updateOutlinePosition) {
    currentMesh.updateOutlinePosition();
  }
}

// Check collision with room boundaries
function checkCollisionWithRoom(
  newPosition: any,
  scene: any,
  furnitureMesh?: any,
  furnitureItem?: any
) {
  // Get room dimensions from scene metadata
  const scaledWidth = scene.metadata?.scaledWidth || 2;
  const scaledLength = scene.metadata?.scaledLength || 2;
  const wallThickness = 0.02;
  const baseThickness = 0.05;

  // Use scale from furniture item or default
  let furnitureSize = 0.2; // Default
  if (furnitureItem && furnitureItem.scale) {
    furnitureSize = furnitureItem.scale * 1.5; // Convert scale to collision size
  }

  // Check collision with walls
  const wallBuffer = wallThickness + baseThickness + 0.1;

  // Left wall collision
  if (newPosition.x - furnitureSize < -scaledWidth / 2 + wallBuffer) {
    return true;
  }

  // Right wall collision
  if (newPosition.x + furnitureSize > scaledWidth / 2 - wallBuffer) {
    return true;
  }

  // Front wall collision
  if (newPosition.z + furnitureSize > scaledLength / 2 - wallBuffer) {
    return true;
  }

  // Back wall collision
  if (newPosition.z - furnitureSize < -scaledLength / 2 + wallBuffer) {
    return true;
  }

  return false; // No collision detected
}

// Custom drag drop function
function addCustomDragDrop(furnitureMesh: any, scene: any, item: any) {
  // This function is handled by the main pointer handler
}

// Add selection effect for furniture
async function addSelectionEffect(
  furnitureMesh: any,
  scene: any,
  setContextMenu: any
) {
  try {
    // Import Color3 from Babylon.js
    const { Color3 } = await import("@babylonjs/core");

    // Enable outline rendering for the furniture mesh
    furnitureMesh.renderOutline = false; // Start with outline hidden
    furnitureMesh.outlineColor = new Color3(1, 1, 0); // Bright yellow outline
    furnitureMesh.outlineWidth = 0.1;

    // Store reference for selection detection
    furnitureMesh.isSelected = false;
  } catch (error) {
    console.error("Error creating selection effect:", error);
  }
}
