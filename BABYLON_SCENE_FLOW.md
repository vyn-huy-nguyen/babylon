# BabylonScene Component - Luồng Hoạt Động

## 🎯 **Tổng Quan**

BabylonScene là một React component 3D model viewer với advanced lighting features. Component này sử dụng Babylon.js để render 3D models với các tính năng lighting chuyên nghiệp.

## 📋 **Luồng Hoạt Động Chính**

### **1. Khởi Tạo React State & Refs**
```javascript
// DOM References
const canvasRef = useRef<HTMLCanvasElement>(null);        // Canvas element
const initializedRef = useRef(false);                     // Prevent duplicate initialization

// PBR Material Controls
const [metallic, setMetallic] = useState(0.0);           // Metallic property (0-1)
const [roughness, setRoughness] = useState(0.5);         // Roughness property (0-1)
const [albedoColor, setAlbedoColor] = useState("#8B4513"); // Base color
const [selectedMesh, setSelectedMesh] = useState("chair2"); // Selected mesh name

// HDR Environment Controls
const [environmentIntensity, setEnvironmentIntensity] = useState(0.5);
const [environmentType, setEnvironmentType] = useState("room");

// Advanced Features
const [hdrExposure, setHdrExposure] = useState(1.0);
const [toneMappingEnabled, setToneMappingEnabled] = useState(true);
const [luminance, setLuminance] = useState(1.0);
const [shadowQuality, setShadowQuality] = useState("medium");
```

### **2. Custom Environment Creation Functions**
```javascript
// Các function tạo environment khác nhau:
createCustomEnvironment(scene, type)     // Main function
├── createGradientEnvironment(scene)     // Sky blue to white gradient
├── createStudioEnvironment(scene)       // Professional studio lighting
├── createOutdoorEnvironment(scene)      // Natural sunlight
├── createNightEnvironment(scene)        // Moonlight + street lights
└── createOfficeEnvironment(scene)       // Fluorescent + natural light
```

### **3. Setup Functions**
```javascript
// Các function setup advanced features:
setupHDRAdvanced(scene)                  // HDR exposure, tone mapping, reflection probes
setupLuminanceAdjustment(scene)          // Luminance, gamma, contrast
setupRealisticShadows(scene)             // Soft shadows, ambient occlusion, contact shadows
setupModelComparison(scene)              // Original vs Real-time mode switching
```

### **4. Main Scene Initialization (useEffect)**
```javascript
useEffect(() => {
  // 1. Check canvas and initialization
  const canvas = canvasRef.current;
  if (!canvas || initializedRef.current) return;
  
  // 2. Import Babylon.js modules
  const { Engine, Scene, Vector3, HemisphericLight, ArcRotateCamera, SceneLoader } = 
    await import("@babylonjs/core");
  
  // 3. Create engine and scene
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  
  // 4. Create camera
  const camera = new ArcRotateCamera("camera", Math.PI/2, Math.PI/3, 5, Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  
  // 5. Create basic lighting
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.8;
  
  // 6. Setup HDR environment
  await setupHDREnvironment(scene);
  
  // 7. Setup advanced features
  await setupHDRAdvanced(scene);
  await setupLuminanceAdjustment(scene);
  await setupRealisticShadows(scene);
  
  // 8. Start render loop
  engine.runRenderLoop(() => scene.render());
  
  // 9. Load 3D model
  await SceneLoader.AppendAsync("/assets/interior/", "condominium-room-101.gltf", scene);
  
  // 10. Analyze and setup UI
  analyzeLoadedModel(scene);
  setupUIState(scene);
  
  // 11. Setup cleanup
  engineCleanup = () => { /* cleanup logic */ };
}, []);
```

### **5. Update Effects (useEffect)**
```javascript
// PBR Material Updates
useEffect(() => {
  updatePBRMaterial(scene, selectedMesh, metallic, roughness, albedoColor);
}, [metallic, roughness, albedoColor, selectedMesh]);

// HDR Environment Updates
useEffect(() => {
  updateHDREnvironment(scene, environmentType, environmentIntensity);
}, [environmentType, environmentIntensity]);

// HDR Advanced Updates
useEffect(() => {
  updateHDRAdvanced(scene, hdrExposure, toneMappingEnabled, toneMappingType);
}, [hdrExposure, toneMappingEnabled, toneMappingType]);

// Luminance & Shadow Updates
useEffect(() => {
  updateLuminanceSettings(scene, luminance, gamma);
}, [luminance, gamma]);

useEffect(() => {
  updateShadowSettings(scene, shadowQuality, softShadows, ambientOcclusion, contactShadows);
}, [shadowQuality, softShadows, ambientOcclusion, contactShadows]);

// Texture Switching Updates
useEffect(() => {
  updateTextureSwitching(scene, autoTextureSwitch, metallic, roughness, albedoColor);
}, [autoTextureSwitch, metallic, roughness, albedoColor]);

// Model Comparison Updates
useEffect(() => {
  updateModelComparison(scene, lightingMode);
}, [lightingMode]);
```

## 🔄 **Data Flow**

### **State Changes → Effects → Scene Updates**
```
User Input (UI Controls)
    ↓
State Updates (useState)
    ↓
Effects Trigger (useEffect)
    ↓
Scene Updates (Babylon.js)
    ↓
Visual Changes (Render Loop)
```

### **Scene Access Pattern**
```javascript
// Lưu scene vào window object để access từ effects
(window as any).currentScene = scene;

// Access scene từ effects
const scene = (window as any).currentScene;
if (scene) {
  // Update scene
}
```

## 🎨 **UI Structure**

### **Control Panels**
```
PBR Material Controls
├── Mesh Selector
├── Metallic Slider
├── Roughness Slider
├── Albedo Color Picker
└── Material Presets

Texture Switching Controls
├── Auto Switch Toggle
└── Current Texture Display

HDR Environment Controls
├── Environment Type Selector
└── Environment Intensity Slider

HDR Advanced Controls
├── HDR Exposure Slider
├── Tone Mapping Toggle
├── Tone Mapping Type Selector
├── Environment Reflections Toggle
└── Reflection Intensity Slider

Luminance & Shadow Controls
├── Luminance Slider
├── Gamma Correction Slider
├── Shadow Quality Selector
├── Soft Shadows Toggle
├── Ambient Occlusion Toggle
└── Contact Shadows Toggle

Model Comparison Controls
├── Model Mode Selector (Original vs Real-time)
├── Comparison Details
├── Performance Info
└── Quality Info
```

## 🚀 **Performance Considerations**

### **Optimization Techniques**
1. **Initialization Guard**: `initializedRef` prevents duplicate scene creation
2. **Lazy Loading**: Babylon.js modules imported only when needed
3. **Efficient Updates**: Effects only run when dependencies change
4. **Memory Management**: Proper cleanup with `dispose()` methods
5. **Render Loop**: Single render loop for all updates

### **Memory Management**
```javascript
// Cleanup function
engineCleanup = () => {
  window.removeEventListener("resize", handleResize);
  scene.dispose();    // Dispose scene and all objects
  engine.dispose();   // Dispose engine and WebGL context
  initializedRef.current = false;
};
```

## 🐛 **Debugging Features**

### **Console Logging**
- Model analysis on load
- Lighting setup confirmation
- Material updates tracking
- Error handling with detailed messages

### **UI Debug Info**
- Mesh selection info
- Material type display
- Current texture type
- Performance indicators

## 📚 **Key Concepts**

### **PBR (Physically Based Rendering)**
- **Metallic**: Controls metal vs non-metal appearance
- **Roughness**: Controls surface smoothness
- **Albedo**: Base color of the material

### **HDR (High Dynamic Range)**
- **Environment Maps**: 360° lighting environment
- **Exposure**: Controls overall brightness
- **Tone Mapping**: Converts HDR to displayable range

### **Shadows**
- **Soft Shadows**: Realistic shadow edges
- **Ambient Occlusion**: Darkening in corners
- **Contact Shadows**: Shadows at contact points

### **Lighting Modes**
- **Original**: Basic lighting, model as-is
- **Real-time**: Advanced lighting with all features
