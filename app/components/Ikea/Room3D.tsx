import { useEffect, useRef, useState } from "react";

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
    furnitureId: '',
  });

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

        // Convert from meters to 3D units (scale down by 100)
        const scaledWidth = width / 100;
        const scaledLength = length / 100;
        const wallHeight = 2; // Wall height in 3D units (3 units = 300cm)

        // Initialize Babylon.js engine and scene
        const engine = new Engine(canvasRef.current, true);
        const scene = new Scene(engine);

        engineRef.current = engine;
        sceneRef.current = scene;
        
        // Store room dimensions in scene metadata for collision detection
        scene.metadata = {
          scaledWidth: scaledWidth,
          scaledLength: scaledLength,
          wallHeight: wallHeight
        };

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

        // Create lighting from ceiling only
        const hemisphericLight = new HemisphericLight(
          "hemisphericLight",
          new Vector3(0, 1, 0),
          scene
        );
        hemisphericLight.intensity = 1.2; // Much higher intensity for bright walls

        // Add additional ambient light for walls
        const ambientLight = new HemisphericLight(
          "ambientLight",
          new Vector3(0, -1, 0),
          scene
        );
        ambientLight.intensity = 0.3;

        // Create 4 ceiling lights in 2x2 grid
        const lightIntensity = 0.5;

        // Row 1: 2 lights
        for (let i = 0; i < 2; i++) {
          const light1 = new DirectionalLight(
            `ceilingLight1_${i}`,
            new Vector3(0, -1, 0), // Pointing down from ceiling
            scene
          );
          light1.intensity = lightIntensity;
          light1.direction = new Vector3(0, -1, 0); // Ensure direction is set
          light1.position = new Vector3(
            -scaledWidth / 6 + (i * scaledWidth) / 3, // Spread across width
            wallHeight - 0.1, // Just below ceiling
            -scaledLength / 6 // Front row
          );
        }

        // Row 2: 2 lights
        for (let i = 0; i < 2; i++) {
          const light2 = new DirectionalLight(
            `ceilingLight2_${i}`,
            new Vector3(0, -1, 0), // Pointing down from ceiling
            scene
          );
          light2.intensity = lightIntensity;
          light2.direction = new Vector3(0, -1, 0); // Ensure direction is set
          light2.position = new Vector3(
            -scaledWidth / 6 + (i * scaledWidth) / 3, // Spread across width
            wallHeight - 0.1, // Just below ceiling
            scaledLength / 6 // Back row
          );
        }

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

        // Create 4 wall bases (along walls) - always visible
        const baseHeight = 0.1; // Height of wall bases
        const baseThickness = 0.05; // Thickness of wall bases
        
        // Create wall base material
        const baseMaterial = new StandardMaterial("baseMaterial", scene);
        baseMaterial.diffuseColor = new Color3(1, 1, 1); // White color
        baseMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        
        // Front wall base (along front wall)
        const frontWallBase = MeshBuilder.CreateBox(
          "frontWallBase",
          {
            width: scaledWidth,
            height: baseHeight,
            depth: baseThickness,
          },
          scene
        );
        frontWallBase.position = new Vector3(0, baseHeight / 2, scaledLength / 2 - baseThickness / 2);
        frontWallBase.material = baseMaterial;
        
        // Back wall base (along back wall)
        const backWallBase = MeshBuilder.CreateBox(
          "backWallBase",
          {
            width: scaledWidth,
            height: baseHeight,
            depth: baseThickness,
          },
          scene
        );
        backWallBase.position = new Vector3(0, baseHeight / 2, -scaledLength / 2 + baseThickness / 2);
        backWallBase.material = baseMaterial;
        
        // Left wall base (along left wall)
        const leftWallBase = MeshBuilder.CreateBox(
          "leftWallBase",
          {
            width: baseThickness,
            height: baseHeight,
            depth: scaledLength,
          },
          scene
        );
        leftWallBase.position = new Vector3(-scaledWidth / 2 + baseThickness / 2, baseHeight / 2, 0);
        leftWallBase.material = baseMaterial;
        
        // Right wall base (along right wall)
        const rightWallBase = MeshBuilder.CreateBox(
          "rightWallBase",
          {
            width: baseThickness,
            height: baseHeight,
            depth: scaledLength,
          },
          scene
        );
        rightWallBase.position = new Vector3(scaledWidth / 2 - baseThickness / 2, baseHeight / 2, 0);
        rightWallBase.material = baseMaterial;

        // Create ceiling wall bases (wall-ceiling contact)
        const ceilingBaseHeight = 0.1; // Height of ceiling bases
        const ceilingBaseThickness = 0.05; // Thickness of ceiling bases
        
        // Front ceiling base (along front wall at ceiling level)
        const frontCeilingBase = MeshBuilder.CreateBox(
          "frontCeilingBase",
          {
            width: scaledWidth,
            height: ceilingBaseHeight,
            depth: ceilingBaseThickness,
          },
          scene
        );
        frontCeilingBase.position = new Vector3(0, wallHeight - ceilingBaseHeight / 2, scaledLength / 2 - ceilingBaseThickness / 2);
        frontCeilingBase.material = baseMaterial;
        
        // Back ceiling base (along back wall at ceiling level)
        const backCeilingBase = MeshBuilder.CreateBox(
          "backCeilingBase",
          {
            width: scaledWidth,
            height: ceilingBaseHeight,
            depth: ceilingBaseThickness,
          },
          scene
        );
        backCeilingBase.position = new Vector3(0, wallHeight - ceilingBaseHeight / 2, -scaledLength / 2 + ceilingBaseThickness / 2);
        backCeilingBase.material = baseMaterial;
        
        // Left ceiling base (along left wall at ceiling level)
        const leftCeilingBase = MeshBuilder.CreateBox(
          "leftCeilingBase",
          {
            width: ceilingBaseThickness,
            height: ceilingBaseHeight,
            depth: scaledLength,
          },
          scene
        );
        leftCeilingBase.position = new Vector3(-scaledWidth / 2 + ceilingBaseThickness / 2, wallHeight - ceilingBaseHeight / 2, 0);
        leftCeilingBase.material = baseMaterial;
        
        // Right ceiling base (along right wall at ceiling level)
        const rightCeilingBase = MeshBuilder.CreateBox(
          "rightCeilingBase",
          {
            width: ceilingBaseThickness,
            height: ceilingBaseHeight,
            depth: scaledLength,
          },
          scene
        );
        rightCeilingBase.position = new Vector3(scaledWidth / 2 - ceilingBaseThickness / 2, wallHeight - ceilingBaseHeight / 2, 0);
        rightCeilingBase.material = baseMaterial;

        // Create corner bases (wall-wall contact at corners)
        const cornerBaseHeight = wallHeight; // Full height from floor to ceiling
        const cornerBaseThickness = 0.05; // Thickness of corner bases
        
        // Front-left corner base (where front and left walls meet)
        const frontLeftCornerBase = MeshBuilder.CreateBox(
          "frontLeftCornerBase",
          {
            width: cornerBaseThickness,
            height: cornerBaseHeight,
            depth: cornerBaseThickness,
          },
          scene
        );
        frontLeftCornerBase.position = new Vector3(-scaledWidth / 2 + cornerBaseThickness / 2, cornerBaseHeight / 2, scaledLength / 2 - cornerBaseThickness / 2);
        frontLeftCornerBase.material = baseMaterial;
        
        // Front-right corner base (where front and right walls meet)
        const frontRightCornerBase = MeshBuilder.CreateBox(
          "frontRightCornerBase",
          {
            width: cornerBaseThickness,
            height: cornerBaseHeight,
            depth: cornerBaseThickness,
          },
          scene
        );
        frontRightCornerBase.position = new Vector3(scaledWidth / 2 - cornerBaseThickness / 2, cornerBaseHeight / 2, scaledLength / 2 - cornerBaseThickness / 2);
        frontRightCornerBase.material = baseMaterial;
        
        // Back-left corner base (where back and left walls meet)
        const backLeftCornerBase = MeshBuilder.CreateBox(
          "backLeftCornerBase",
          {
            width: cornerBaseThickness,
            height: cornerBaseHeight,
            depth: cornerBaseThickness,
          },
          scene
        );
        backLeftCornerBase.position = new Vector3(-scaledWidth / 2 + cornerBaseThickness / 2, cornerBaseHeight / 2, -scaledLength / 2 + cornerBaseThickness / 2);
        backLeftCornerBase.material = baseMaterial;
        
        // Back-right corner base (where back and right walls meet)
        const backRightCornerBase = MeshBuilder.CreateBox(
          "backRightCornerBase",
          {
            width: cornerBaseThickness,
            height: cornerBaseHeight,
            depth: cornerBaseThickness,
          },
          scene
        );
        backRightCornerBase.position = new Vector3(scaledWidth / 2 - cornerBaseThickness / 2, cornerBaseHeight / 2, -scaledLength / 2 + cornerBaseThickness / 2);
        backRightCornerBase.material = baseMaterial;

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

        // Create wall material with lighter gray color
        const wallMaterial = new StandardMaterial("wallMaterial", scene);
        wallMaterial.diffuseColor = new Color3(0.9, 0.9, 0.9); // Lighter gray color
        wallMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

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
          
          // Hide ceiling bases and corner bases based on which walls are hidden
          const hiddenWalls = distances.slice(0, 2).map(({ wall }) => wall);
          
          // Hide ceiling bases for hidden walls
          if (hiddenWalls.includes(frontWall)) {
            frontCeilingBase.isVisible = false;
          } else {
            frontCeilingBase.isVisible = true;
          }
          
          if (hiddenWalls.includes(backWall)) {
            backCeilingBase.isVisible = false;
          } else {
            backCeilingBase.isVisible = true;
          }
          
          if (hiddenWalls.includes(leftWall)) {
            leftCeilingBase.isVisible = false;
          } else {
            leftCeilingBase.isVisible = true;
          }
          
          if (hiddenWalls.includes(rightWall)) {
            rightCeilingBase.isVisible = false;
          } else {
            rightCeilingBase.isVisible = true;
          }
          
          // Calculate distances from camera to corner bases
          const cornerBasePositions = [
            new Vector3(-scaledWidth / 2, wallHeight / 2, scaledLength / 2), // Front-left corner
            new Vector3(scaledWidth / 2, wallHeight / 2, scaledLength / 2), // Front-right corner
            new Vector3(-scaledWidth / 2, wallHeight / 2, -scaledLength / 2), // Back-left corner
            new Vector3(scaledWidth / 2, wallHeight / 2, -scaledLength / 2), // Back-right corner
          ];
          
          const cornerBases = [frontLeftCornerBase, frontRightCornerBase, backLeftCornerBase, backRightCornerBase];
          const cornerDistances = cornerBases.map((base, index) => ({
            base,
            distance: Vector3.Distance(cameraPosition, cornerBasePositions[index]),
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
        // Apply brown color to ceiling
        ceilingMaterial.diffuseColor = new Color3(0.6, 0.4, 0.2); // Brown color
        ceilingMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        ceiling.material = ceilingMaterial;

        // Basic furniture will be added separately when needed

        // Create shadow generator using first ceiling light
        const firstLight = scene.getLightByName("ceilingLight1_0") as any;
        const shadowGenerator = new ShadowGenerator(1024, firstLight);
        shadowGenerator.addShadowCaster(floor);
        [frontWall, backWall, leftWall, rightWall, ceiling].forEach((mesh) => {
          shadowGenerator.addShadowCaster(mesh);
        });

        // Set up shadows
        floor.receiveShadows = true;

        // Setup drag drop for furniture meshes only (not room elements)
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
                pointerInfo.pickInfo.pickedMesh !== rightWall &&
                pointerInfo.pickInfo.pickedMesh !== frontWallBase &&
                pointerInfo.pickInfo.pickedMesh !== backWallBase &&
                pointerInfo.pickInfo.pickedMesh !== leftWallBase &&
                pointerInfo.pickInfo.pickedMesh !== rightWallBase &&
                pointerInfo.pickInfo.pickedMesh !== frontCeilingBase &&
                pointerInfo.pickInfo.pickedMesh !== backCeilingBase &&
                pointerInfo.pickInfo.pickedMesh !== leftCeilingBase &&
                pointerInfo.pickInfo.pickedMesh !== rightCeilingBase &&
                pointerInfo.pickInfo.pickedMesh !== frontLeftCornerBase &&
                pointerInfo.pickInfo.pickedMesh !== frontRightCornerBase &&
                pointerInfo.pickInfo.pickedMesh !== backLeftCornerBase &&
                pointerInfo.pickInfo.pickedMesh !== backRightCornerBase &&
                (pointerInfo.pickInfo.pickedMesh.name.startsWith("furniture_") ||
                 pointerInfo.pickInfo.pickedMesh.name.startsWith("pCylinder6_blinn1_0") ||
                 pointerInfo.pickInfo.pickedMesh.parent?.name.startsWith("furniture_"))
              ) {
                // Use the root furniture mesh for dragging
                let furnitureMesh = pointerInfo.pickInfo.pickedMesh;
                console.log("Original picked mesh:", furnitureMesh.name);
                
                // If clicked on child mesh, find the root furniture mesh
                if (furnitureMesh.name.startsWith("pCylinder6_blinn1_0")) {
                  // Find the root furniture mesh by traversing up the parent chain
                  let currentMesh = furnitureMesh;
                  while (currentMesh.parent && !currentMesh.name.startsWith("furniture_")) {
                    currentMesh = currentMesh.parent;
                  }
                  if (currentMesh.name.startsWith("furniture_")) {
                    furnitureMesh = currentMesh;
                    console.log("Found root furniture mesh:", furnitureMesh.name);
                  }
                } else if (furnitureMesh.parent?.name.startsWith("furniture_")) {
                  furnitureMesh = furnitureMesh.parent;
                  console.log("Using parent furniture mesh:", furnitureMesh.name);
                }
                
                console.log("Final furniture mesh for dragging:", furnitureMesh.name);
                
                // Handle selection first
                if (pointerInfo.event.button === 0) { // LEFT CLICK
                  console.log("LEFT CLICK on furniture:", furnitureMesh.name);
                  
                  // First deselect all other furniture
                  scene.meshes.forEach((mesh: any) => {
                    if (mesh.name.startsWith("furniture_") && mesh !== furnitureMesh) {
                      mesh.isSelected = false;
                      mesh.renderOutline = false;
                    }
                  });
                  
                  // Always select the clicked furniture (don't toggle)
                  (furnitureMesh as any).isSelected = true;
                  console.log("Selected furniture:", furnitureMesh.name, "Selected:", (furnitureMesh as any).isSelected);
                  
                  // Show/hide outline
                  console.log("Checking outline properties for:", furnitureMesh.name);
                  console.log("Furniture mesh properties:", {
                    name: furnitureMesh.name,
                    renderOutline: (furnitureMesh as any).renderOutline,
                    outlineColor: (furnitureMesh as any).outlineColor,
                    outlineWidth: (furnitureMesh as any).outlineWidth,
                    isSelected: (furnitureMesh as any).isSelected
                  });
                  
                  // Toggle outline visibility based on selection
                  (furnitureMesh as any).renderOutline = (furnitureMesh as any).isSelected;
                  console.log("Outline rendering set to:", (furnitureMesh as any).renderOutline);
                  console.log("Current outline properties:", {
                    renderOutline: (furnitureMesh as any).renderOutline,
                    outlineColor: (furnitureMesh as any).outlineColor,
                    outlineWidth: (furnitureMesh as any).outlineWidth,
                    isSelected: (furnitureMesh as any).isSelected
                  });
                  
                  // Change cursor
                  if ((furnitureMesh as any).isSelected) {
                    document.body.style.cursor = 'move';
                    console.log("Cursor changed to move");
                  } else {
                    document.body.style.cursor = 'default';
                    console.log("Cursor changed to default");
                  }
                  
                  // Always show context menu when clicking on furniture
                  console.log("Showing context menu for furniture:", furnitureMesh.name);
                  const menuState = {
                    visible: true,
                    x: pointerInfo.event.clientX,
                    y: pointerInfo.event.clientY,
                    furnitureId: furnitureMesh.name,
                  };
                  console.log("Setting context menu to:", menuState);
                  setContextMenu(menuState);
                  
                  // Start drag functionality if selected
                  if ((furnitureMesh as any).isSelected) {
                    console.log("Starting drag for selected furniture");
                    pointerDown(
                      furnitureMesh,
                      scene,
                      canvasRef.current
                    );
                  }
                } else if (pointerInfo.event.button === 2) { // RIGHT CLICK
                  // Show context menu
                  console.log("Right click on furniture:", furnitureMesh.name);
                  setContextMenu({
                    visible: true,
                    x: pointerInfo.event.clientX,
                    y: pointerInfo.event.clientY,
                    furnitureId: furnitureMesh.name,
                  });
                }
              } else {
                // Clicked on empty space or room elements - deselect all furniture
                console.log("Clicked on empty space or room element, deselecting all furniture");
                scene.meshes.forEach((mesh: any) => {
                  if (mesh.name.startsWith("furniture_") && mesh.isSelected) {
                    mesh.isSelected = false;
                    mesh.renderOutline = false;
                    console.log("Deselected:", mesh.name);
                  }
                });
                document.body.style.cursor = 'default';
                
                // Hide context menu
                console.log("Hiding context menu due to empty space click");
                setContextMenu(prev => ({ ...prev, visible: false }));
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
      createFurnitureFromProps(sceneRef.current, furniture, setContextMenu);
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

  // Close context menu when clicking outside - temporarily disabled for debugging
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (contextMenu.visible) {
  //       setContextMenu(prev => ({ ...prev, visible: false }));
  //     }
  //   };

  //   document.addEventListener('click', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('click', handleClickOutside);
  //   };
  // }, [contextMenu.visible]);

  // Debug log for context menu state
  console.log("Context menu render state:", contextMenu);

  return (
    <div className="w-full h-full relative">
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
            top: contextMenu.y - 120, // Position above cursor
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm font-medium">Table Options</span>
            <button 
              className="text-white hover:text-gray-300 text-lg"
              onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
            >
              ×
            </button>
          </div>
          <div className="flex flex-col space-y-1">
            <button 
              className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("=== ROTATE BUTTON CLICKED ===");
                console.log("Rotate clicked for:", contextMenu.furnitureId);
                // Rotate the selected furniture
                if (sceneRef.current) {
                  const furniture = sceneRef.current.getMeshByName(contextMenu.furnitureId);
                  console.log("Found furniture for rotation:", furniture);
                  if (furniture) {
                    furniture.rotation.y += Math.PI / 2; // Rotate 90 degrees
                    console.log("Furniture rotated:", furniture.rotation.y);
                    alert("Furniture rotated 90 degrees!");
                  } else {
                    console.log("Furniture not found for rotation");
                    alert("Furniture not found!");
                  }
                } else {
                  console.log("Scene not found");
                  alert("Scene not found!");
                }
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              <span>🔄</span>
              <span>Rotate</span>
            </button>
            <button 
              className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-gray-700 rounded"
              onClick={() => {
                console.log("Replace clicked for:", contextMenu.furnitureId);
                alert("Replace function - Coming soon!");
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              <span>↔️</span>
              <span>Replace</span>
            </button>
            <button 
              className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-gray-700 rounded"
              onClick={() => {
                console.log("Goes with clicked for:", contextMenu.furnitureId);
                alert("Goes with function - Coming soon!");
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              <span>📚</span>
              <span>Goes with</span>
            </button>
            <button 
              className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-gray-700 rounded"
              onClick={() => {
                console.log("Make copy clicked for:", contextMenu.furnitureId);
                alert("Make copy function - Coming soon!");
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              <span>📋</span>
              <span>Make copy</span>
            </button>
            <button 
              className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("=== REMOVE BUTTON CLICKED ===");
                console.log("Remove clicked for:", contextMenu.furnitureId);
                // Remove the selected furniture
                if (sceneRef.current) {
                  const furniture = sceneRef.current.getMeshByName(contextMenu.furnitureId);
                  console.log("Found furniture for removal:", furniture);
                  if (furniture) {
                    furniture.dispose();
                    console.log("Furniture removed:", contextMenu.furnitureId);
                    alert("Furniture removed!");
                  } else {
                    console.log("Furniture not found for removal");
                    alert("Furniture not found!");
                  }
                } else {
                  console.log("Scene not found");
                  alert("Scene not found!");
                }
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              <span>🗑️</span>
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to create furniture from props using table.glb model
async function createFurnitureFromProps(scene: any, furniture: any[], setContextMenu: any) {
  await import("@babylonjs/loaders/glTF"); // phải trước
  const { SceneLoader, Color3, Vector3, MeshBuilder, StandardMaterial } =
    await import("@babylonjs/core");

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

    console.log(
      `Loading table.glb for furniture: ${item.name} at position (${scaledX}, ${scaledZ})`
    );

    // Create fallback box first
    const fallbackBox = MeshBuilder.CreateBox(
      `fallback_${item.id}`,
      { size: 0.5 },
      scene
    );
    fallbackBox.position = new Vector3(scaledX, 0.25, scaledZ);
    fallbackBox.name = `furniture_${item.id}`;

    const fallbackMaterial = new StandardMaterial(
      `fallbackMaterial_${item.id}`,
      scene
    );
    fallbackMaterial.diffuseColor = Color3.FromHexString(item.color);
    fallbackBox.material = fallbackMaterial;

    // Load table.glb model using ImportMesh
    console.log(`Attempting to load table.glb from /assets/ikea/`);
    SceneLoader.ImportMesh(
      "",
      "/assets/ikea/",
      "table.glb",
      scene,
      async function (meshes, particleSystems, skeletons, animationGroups) {
        console.log(`Table meshes loaded for ${item.name}:`, meshes);
        console.log(`Meshes count:`, meshes.length);
        console.log(`Particle systems:`, particleSystems.length);
        console.log(`Skeletons:`, skeletons.length);
        console.log(`Animation groups:`, animationGroups.length);

        if (meshes.length > 0) {
          // Remove fallback box
          fallbackBox.dispose();
          console.log(`Fallback box removed for ${item.name}`);

          // Get the first mesh (root node)
          const tableMesh = meshes[0];
          console.log(`Table mesh created:`, tableMesh);

          // Scale and position the loaded model
          tableMesh.scaling.scaleInPlace(0.2); // Much smaller scale
          tableMesh.position = new Vector3(scaledX, 0, scaledZ);
          tableMesh.rotation.y = (item.rotation * Math.PI) / 180;
          tableMesh.name = `furniture_${item.id}`;

          console.log(
            `Table positioned for ${item.name} at:`,
            tableMesh.position
          );

          // Add custom drag drop functionality
          addCustomDragDrop(tableMesh, scene, item);
          console.log(`Custom drag drop added for ${item.name}`);
          
          // Add selection effect
          console.log("About to call addSelectionEffect for:", tableMesh.name);
          await addSelectionEffect(tableMesh, scene, setContextMenu);
          console.log(`Selection effect added for ${item.name}`);
          
          // Debug: Check if outline properties were set
          console.log("Table mesh after selection effect:", tableMesh);
          console.log("Outline properties:", {
            renderOutline: (tableMesh as any).renderOutline,
            outlineColor: (tableMesh as any).outlineColor,
            outlineWidth: (tableMesh as any).outlineWidth,
            isSelected: (tableMesh as any).isSelected
          });
        } else {
          console.log(`No table meshes found, keeping fallback box`);
        }
      },
      function (progress) {
        console.log(`Loading progress:`, progress);
      },
      function (error) {
        console.error(`Error loading table.glb:`, error);
        console.log(`Keeping fallback box due to error`);
      }
    );
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

// Get ground position from pointer for furniture dragging
function getGroundPositionForFurniture(scene: any, furnitureMesh: any) {
  // Use the original ground picking method
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
  const distance = -(ray.origin.y) / ray.direction.y;
  if (distance > 0) {
    const intersection = ray.origin.add(ray.direction.scale(distance));
    return intersection;
  }
  
  return null;
}

// Pointer down handler - exactly like the example
function pointerDown(mesh: any, scene: any, canvas: any) {
  console.log("Pointer down on mesh:", mesh.name);
  currentMesh = mesh;
  startingPoint = getGroundPositionForFurniture(scene, mesh);
  console.log("Starting point:", startingPoint);
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

// Pointer move handler with collision detection
function pointerMove(scene: any) {
  if (!startingPoint) {
    return;
  }
  const current = getGroundPositionForFurniture(scene, currentMesh);
  if (!current) {
    return;
  }

  const diff = current.subtract(startingPoint);
  console.log("Moving mesh by:", diff);
  
  // Calculate new position
  const newPosition = currentMesh.position.add(diff);
  
  // Check collision with room boundaries
  if (checkCollisionWithRoom(newPosition, scene)) {
    console.log("Collision detected, preventing movement");
    return; // Don't move if collision detected
  }
  
  // Move the furniture if no collision
  currentMesh.position.addInPlace(diff);
  startingPoint = current;
  
  // Update outline position if it exists
  if (currentMesh.updateOutlinePosition) {
    currentMesh.updateOutlinePosition();
  }
}

// Check collision with room boundaries
function checkCollisionWithRoom(newPosition: any, scene: any) {
  // Get room dimensions from scene metadata
  const scaledWidth = scene.metadata?.scaledWidth || 2; // Default fallback
  const scaledLength = scene.metadata?.scaledLength || 2; // Default fallback
  const wallThickness = 0.02;
  const baseThickness = 0.05;
  
  // Furniture bounding box (approximate size of table)
  const furnitureSize = 0.2; // Half size of furniture
  const furnitureHeight = 0.3; // Height of furniture
  
  // Check collision with walls
  const wallBuffer = wallThickness + baseThickness + 0.1; // Extra buffer for safety
  
  // Left wall collision
  if (newPosition.x - furnitureSize < -scaledWidth / 2 + wallBuffer) {
    console.log("Collision with left wall");
    return true;
  }
  
  // Right wall collision
  if (newPosition.x + furnitureSize > scaledWidth / 2 - wallBuffer) {
    console.log("Collision with right wall");
    return true;
  }
  
  // Front wall collision
  if (newPosition.z + furnitureSize > scaledLength / 2 - wallBuffer) {
    console.log("Collision with front wall");
    return true;
  }
  
  // Back wall collision
  if (newPosition.z - furnitureSize < -scaledLength / 2 + wallBuffer) {
    console.log("Collision with back wall");
    return true;
  }
  
  // Check collision with floor bases (they're always at floor level)
  const baseBuffer = baseThickness + 0.05; // Buffer around bases
  
  // Front wall base collision
  if (newPosition.z + furnitureSize > scaledLength / 2 - baseBuffer && 
      newPosition.z - furnitureSize < scaledLength / 2) {
    console.log("Collision with front wall base");
    return true;
  }
  
  // Back wall base collision
  if (newPosition.z + furnitureSize > -scaledLength / 2 && 
      newPosition.z - furnitureSize < -scaledLength / 2 + baseBuffer) {
    console.log("Collision with back wall base");
    return true;
  }
  
  // Left wall base collision
  if (newPosition.x + furnitureSize > -scaledWidth / 2 && 
      newPosition.x - furnitureSize < -scaledWidth / 2 + baseBuffer) {
    console.log("Collision with left wall base");
    return true;
  }
  
  // Right wall base collision
  if (newPosition.x + furnitureSize > scaledWidth / 2 - baseBuffer && 
      newPosition.x - furnitureSize < scaledWidth / 2) {
    console.log("Collision with right wall base");
    return true;
  }
  
  return false; // No collision detected
}

// Custom drag drop function based on the example
function addCustomDragDrop(furnitureMesh: any, scene: any, item: any) {
  // This function is now handled by the main pointer handler
  // Just store reference for drag functionality
  console.log("Drag drop setup for:", furnitureMesh.name);
}

// Add selection effect for furniture
async function addSelectionEffect(furnitureMesh: any, scene: any, setContextMenu: any) {
  console.log("=== addSelectionEffect called ===");
  console.log("Adding selection effect for:", furnitureMesh.name);
  
  try {
    console.log("Step 1: Setting up outline properties...");
    
    // Import Color3 from Babylon.js
    const { Color3 } = await import("@babylonjs/core");
    
    // Enable outline rendering for the furniture mesh
    furnitureMesh.renderOutline = false; // Start with outline hidden
    furnitureMesh.outlineColor = new Color3(1, 1, 0); // Bright yellow outline
    furnitureMesh.outlineWidth = 0.1;
    
    console.log("Step 1 complete: Outline properties set:", {
      renderOutline: furnitureMesh.renderOutline,
      outlineColor: furnitureMesh.outlineColor,
      outlineWidth: furnitureMesh.outlineWidth
    });
    
    console.log("Step 2: Setting up selection state...");
    // Store reference for selection detection
    furnitureMesh.isSelected = false;
    
    console.log("Step 2 complete: Selection effect setup complete for:", furnitureMesh.name);
    console.log("Final furniture mesh properties:", {
      name: furnitureMesh.name,
      renderOutline: furnitureMesh.renderOutline,
      outlineColor: furnitureMesh.outlineColor,
      outlineWidth: furnitureMesh.outlineWidth,
      isSelected: furnitureMesh.isSelected
    });
  } catch (error) {
    console.error("Error creating selection effect:", error);
    console.error("Error stack:", (error as any).stack);
  }
}
