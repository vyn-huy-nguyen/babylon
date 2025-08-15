# Babylon.js GLTF Model Viewer

A modern 3D model viewer built with Remix, TypeScript, and Babylon.js for loading and viewing GLTF models.

## Features

- ✅ Load and display GLTF models
- ✅ Interactive 3D camera controls
- ✅ Auto-adjust camera to fit model
- ✅ Model information display (meshes, transform nodes, size)
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript support
- ✅ Modern React with hooks

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
babylon/
├── app/
│   ├── components/
│   │   ├── BabylonScene.tsx    # Babylon.js scene wrapper
│   │   └── GLTFViewer.tsx      # GLTF model loader component
│   ├── routes/
│   │   └── _index.tsx          # Main page with 3D viewer
│   └── assets/
│       └── red_house/          # GLTF model files
├── public/
│   └── assets/
│       └── red_house/          # Public assets (symlinked)
└── package.json
```

## Usage

### Adding New GLTF Models

1. Place your GLTF files in `app/assets/your_model/`
2. Create symbolic link to public folder:
   ```bash
   ln -sf ../../app/assets/your_model/* public/assets/your_model/
   ```
3. Update the model path in `app/routes/_index.tsx`:
   ```tsx
   <GLTFViewer
     scene={scene}
     modelPath="/assets/your_model/scene.gltf"
     scale={0.1}
     // ... other props
   />
   ```

### Camera Controls

- **Mouse drag**: Rotate camera around the model
- **Mouse scroll**: Zoom in/out
- **Right click + drag**: Pan camera

### Component API

#### GLTFViewer Props

```tsx
interface GLTFViewerProps {
  scene: Scene;                    // Babylon.js scene
  modelPath: string;              // Path to GLTF file
  scale?: number;                 // Model scale (default: 1)
  position?: Vector3;             // Model position (default: Vector3.Zero())
  rotation?: Vector3;             // Model rotation (default: Vector3.Zero())
  onModelLoaded?: (meshes: AbstractMesh[], transformNodes: TransformNode[]) => void;
}
```

#### BabylonScene Props

```tsx
interface BabylonSceneProps {
  antialias?: boolean;            // Enable antialiasing (default: true)
  engineOptions?: any;            // Babylon.js engine options
  adaptToDeviceRatio?: boolean;   // Adapt to device pixel ratio (default: true)
  sceneOptions?: any;             // Babylon.js scene options
  onRender?: (scene: Scene) => void;
  onSceneReady?: (scene: Scene) => void;
  id?: string;                    // Canvas ID (default: "babylon-canvas")
  className?: string;             // Canvas CSS class (default: "babylon-canvas")
}
```

## Technologies Used

- **Remix**: Full-stack React framework
- **TypeScript**: Type-safe JavaScript
- **Babylon.js**: 3D graphics engine
- **Tailwind CSS**: Utility-first CSS framework

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run typecheck`: Run TypeScript type checking

### Code Quality

- All comments are in English
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Proper error handling and logging

## License

This project is licensed under the MIT License.
