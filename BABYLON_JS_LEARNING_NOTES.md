# Babylon.js Learning Notes

## 📚 Tổng quan
- **Framework**: Babylon.js v8.22.3
- **Dự án**: GLTF Model Viewer với Remix + TypeScript
- **Lộ trình học**: Từ scene 3D cơ bản đến thao tác model nâng cao

---

## 🎯 Tiến độ học tập

### ✅ Đã hoàn thành

#### 1. Thiết lập Scene cơ bản
- [x] **Tạo Engine & Scene**
  - `Engine(canvas, antialias)` - Core renderer với WebGL
  - `Scene(engine)` - Container chứa tất cả objects 3D
  - `engine.runRenderLoop()` - Render liên tục

- [x] **Thiết lập Camera**
  - `ArcRotateCamera(name, alpha, beta, radius, target, scene)`
  - `camera.attachControl(canvas, true)` - Bật điều khiển người dùng
  - Định vị camera: `alpha` (ngang), `beta` (dọc), `radius` (khoảng cách)
  - `camera.setTarget()` - Focus camera vào điểm cụ thể

- [x] **Ánh sáng**
  - `HemisphericLight(name, direction, scene)` - Mô phỏng ánh sáng tự nhiên
  - `light.intensity` - Điều khiển cường độ ánh sáng (0-1)

#### 2. Load Model
- [x] **Load GLTF/GLB**
  - Import: `await import("@babylonjs/loaders/glTF")`
  - Load: `SceneLoader.AppendAsync(path, filename, scene)`
  - Xử lý lỗi khi load thất bại

- [x] **Phân tích Model**
  - `scene.meshes` - Truy cập tất cả objects 3D
  - `scene.materials` - Truy cập tất cả materials
  - `scene.textures` - Truy cập tất cả textures
  - `scene.lights` - Truy cập tất cả lights
  - `scene.cameras` - Truy cập tất cả cameras

#### 3. Điều khiển Camera
- [x] **Tương tác người dùng**
  - Kéo chuột: Xoay camera
  - Scroll: Zoom in/out
  - Right-click + kéo: Di chuyển camera
  - `camera.wheelPrecision` - Điều khiển tốc độ zoom
  - `camera.pinchPrecision` - Tốc độ zoom trên mobile

- [x] **Tự động định vị Camera**
  - `mesh.getHierarchyBoundingVectors()` - Lấy kích thước model
  - Tính toán trung tâm và kích thước để xem tối ưu
  - Tự động điều chỉnh camera để nhìn hết model

#### 4. Tích hợp React
- [x] **Cấu trúc Component**
  - `useRef` cho canvas element
  - `useEffect` cho lifecycle của scene
  - Cleanup đúng cách với `dispose()`
  - Tránh khởi tạo nhiều lần

- [x] **Quản lý bộ nhớ**
  - `scene.dispose()` - Dọn dẹp scene objects
  - `engine.dispose()` - Dọn dẹp WebGL context
  - Cleanup event listeners

- [x] **Code Organization & Comments**
  - Phân chia code thành sections rõ ràng
  - Comment chi tiết cho từng dòng code
  - Giải thích ý nghĩa của từng parameter
  - Structure code theo logical flow

---

## 🔄 Đang học

### Trọng tâm hiện tại: HDR Lighting Environment
- [x] **Khái niệm HDR**
  - **HDR (High Dynamic Range)**: Kỹ thuật mô phỏng ánh sáng với dải động cao
  - **Dynamic Range**: Khoảng cách giữa ánh sáng tối nhất và sáng nhất
  - **Environment Maps**: Hình ảnh 360° của môi trường xung quanh

- [x] **Ứng dụng thực tế**
  - **Interior Design**: Ánh sáng văn phòng, nhà ở, showroom
  - **Automotive**: Studio lighting, outdoor lighting, showroom
  - **Game Development**: Realistic environments, dynamic lighting

- [x] **Thực hành HDR trong Babylon.js**
  - Tạo environment texture với `CubeTexture`
  - Áp dụng environment vào scene
  - Điều chỉnh environment intensity
  - Chuyển đổi giữa các loại môi trường
  - Tạo custom environments bằng code

- [x] **HDR Advanced Features**
  - **HDR Exposure**: Điều chỉnh độ sáng tổng thể (0-4)
  - **Tone Mapping**: Chuyển đổi HDR sang LDR với ACES/Standard
  - **Reflection Probes**: Tạo environment reflections cho objects
  - **True HDR Files**: Load HDR files với `HDRCubeTexture`
  - **PBR Environment Integration**: Áp dụng environment vào materials

- [x] **PBR Texture Switching**
  - **Auto Texture Switch**: Tự động thay đổi texture dựa trên PBR properties
  - **Procedural Textures**: Tạo texture programmatically với Canvas
  - **Texture Types**: Metallic, Wood, Plastic, Smooth patterns
  - **Normal Maps**: Tạo bump maps dựa trên roughness
  - **Real-time Updates**: Texture thay đổi khi điều chỉnh PBR properties

- [x] **Luminance Adjustment & Shadow Rendering**
  - **Luminance Control**: Điều chỉnh độ sáng thực tế (0.1-3.0)
  - **Gamma Correction**: Chuyển đổi color space (1.0-3.0)
  - **Soft Shadows**: Bóng mềm với blur kernel (16-128)
  - **Shadow Quality**: 4 levels (Low, Medium, High, Ultra)
  - **Ambient Occlusion**: Bóng tối ở các góc khuất
  - **Contact Shadows**: Bóng ở điểm tiếp xúc với ground
  - **HDR Integration**: Tích hợp shadows với HDR environment
  - **Ground Plane**: Tạo mặt phẳng để hiển thị shadows

- [x] **Model Comparison: Original vs Real-time Enhanced**
  - **Original Model**: Model gốc với materials/textures có sẵn, basic lighting
  - **Real-time Enhanced**: HDR environment + PBR controls + dynamic shadows
  - **Performance Comparison**: Original (Fast) vs Enhanced (Medium)
  - **Quality Comparison**: Original (Medium) vs Enhanced (High)
  - **Feature Comparison**: Basic vs Advanced lighting features

- [x] **Preset Textures với Real Textures**
  - **Texture Mapping**: Map presets với texture files từ thư mục interior
  - **Real Texture Loading**: Load textures từ `/assets/interior/` files
  - **Preset Types**: Wood, Metal, Plastic, Leather, Fabric
  - **Texture Files**: MF049.jpg, MF042.jpg, MF045.jpg, MF0022.jpg, MFMF000722.jpg
  - **Loading Status**: Real-time feedback về texture loading
  - **PBR Integration**: Kết hợp texture với PBR properties

- [x] **Custom Environment Creation**
  - **Gradient Environment**: Tạo gradient từ sky blue đến white
  - **Studio Environment**: 4 lights (main, fill, rim) cho professional lighting
  - **Outdoor Environment**: Sunlight + ambient light cho môi trường tự nhiên
  - **Night Environment**: Moonlight + street lights cho ban đêm
  - **Office Environment**: Fluorescent ceiling lights + natural window light

- [x] **PBR Materials (Physically Based Rendering)**
  - **Metallic**: Độ kim loại (0-1), 0 = không kim loại, 1 = kim loại hoàn toàn
  - **Roughness**: Độ nhám bề mặt (0-1), 0 = mịn như gương, 1 = rất nhám
  - **Albedo**: Màu sắc cơ bản của vật liệu (không bị ảnh hưởng bởi ánh sáng)

- [x] **Thực hành PBR trong Babylon.js**
  - Tạo PBR material với `PBRMaterial`
  - Áp dụng metallic/roughness workflow
  - Sử dụng texture maps cho PBR properties
  - Tạo UI controls để điều chỉnh PBR properties real-time

- [x] **UI Controls cho PBR**
  - Slider controls cho Metallic và Roughness
  - Color picker cho Albedo color
  - Preset materials (Wood, Metal, Plastic, Leather)
  - Real-time material updates

- [ ] **Tùy chỉnh Model và Material**
  - Truy cập mesh theo tên: `scene.getMeshByName()`
  - Thay đổi vị trí: `mesh.position = new Vector3(x, y, z)`
  - Thay đổi kích thước: `mesh.scaling = new Vector3(x, y, z)`
  - Thay đổi xoay: `mesh.rotation = new Vector3(x, y, z)`

- [ ] **Tùy chỉnh Material**
  - Thay đổi màu sắc: `material.diffuseColor = new Color3(r, g, b)`
  - Áp dụng texture: `material.diffuseTexture = new Texture()`
  - Thuộc tính material: transparency, reflectivity, etc.

---

## 📋 Kế hoạch học

### Quản lý Scene nâng cao
- [ ] **Nhiều Models**
  - Load nhiều file GLTF
  - Tổ chức scene và hierarchy
  - Chuyển đổi và quản lý model

- [ ] **Animation**
  - Keyframe animations
  - Skeletal animations từ GLTF
  - Custom animations với `Animation`

- [ ] **Physics**
  - Gravity và collision detection
  - Physics bodies và constraints
  - Objects tương tác

### Materials & Effects nâng cao
- [ ] **PBR Materials**
  - Physically Based Rendering
  - Metallic/Roughness workflow
  - Environment maps và reflections

- [ ] **Post-Processing**
  - Bloom, blur, color grading
  - Screen space effects
  - Custom shaders

### Performance & Tối ưu hóa
- [ ] **Level of Detail (LOD)**
  - Nhiều phiên bản mesh cho khoảng cách khác nhau
  - Tự động chuyển đổi LOD
  - Tối ưu hóa performance

- [ ] **Quản lý Assets**
  - Nén texture
  - Tối ưu hóa model
  - Chiến lược loading

---

## 💡 Ví dụ Code

### Thiết lập Scene cơ bản
```javascript
const engine = new Engine(canvas, true);
const scene = new Scene(engine);
const camera = new ArcRotateCamera("camera", 0, 0, 10, Vector3.Zero(), scene);
const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
```

### Load Model
```javascript
await import("@babylonjs/loaders/glTF");
await SceneLoader.AppendAsync("/assets/", "model.gltf", scene);
```

### Điều khiển Camera
```javascript
camera.attachControl(canvas, true);
camera.wheelPrecision = 1; // Zoom nhanh
camera.setTarget(center);
camera.radius = distance;
```

### Thao tác Mesh
```javascript
const mesh = scene.getMeshByName("chair");
if (mesh) {
  mesh.position = new Vector3(2, 0, 2);
  mesh.scaling = new Vector3(1.5, 1, 1);
}
```

### PBR Material Setup
```javascript
// Tạo PBR material
const pbrMaterial = new PBRMaterial("pbr", scene);

// Thiết lập các thuộc tính PBR
pbrMaterial.metallic = 0.8;        // Độ kim loại (0-1)
pbrMaterial.roughness = 0.2;       // Độ nhám (0-1)
pbrMaterial.albedoColor = new Color3(0.8, 0.1, 0.1); // Màu đỏ

// Áp dụng cho mesh
mesh.material = pbrMaterial;
```

### PBR với Texture Maps
```javascript
// Albedo texture (màu sắc cơ bản)
pbrMaterial.albedoTexture = new Texture("albedo.jpg", scene);

// Metallic texture (độ kim loại)
pbrMaterial.metallicTexture = new Texture("metallic.jpg", scene);

// Roughness texture (độ nhám)
pbrMaterial.roughnessTexture = new Texture("roughness.jpg", scene);

// Normal map (chi tiết bề mặt)
pbrMaterial.bumpTexture = new Texture("normal.jpg", scene);
```

### PBR với UI Controls
```javascript
// State cho PBR controls
const [metallic, setMetallic] = useState(0.0);
const [roughness, setRoughness] = useState(0.5);
const [albedoColor, setAlbedoColor] = useState("#8B4513");

// Effect để cập nhật material khi PBR values thay đổi
useEffect(() => {
  const updateMaterial = async () => {
    const scene = (window as any).currentScene;
    if (scene) {
      const chair = scene.getMeshByName("chair2");
      if (chair && chair.material) {
        // Chuyển đổi hex color sang Color3
        const hex = albedoColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        const { Color3 } = await import("@babylonjs/core");
        chair.material.metallic = metallic;
        chair.material.roughness = roughness;
        chair.material.albedoColor = new Color3(r, g, b);
      }
    }
  };

  updateMaterial();
}, [metallic, roughness, albedoColor]);
```

### UI Controls HTML
```jsx
{/* PBR Controls Panel */}
<div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg min-w-64">
  <h3 className="text-lg font-semibold mb-4">🎨 PBR Material Controls</h3>
  
  {/* Metallic Control */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">
      Metallic: {metallic.toFixed(2)}
    </label>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={metallic}
      onChange={(e) => setMetallic(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
    />
  </div>

  {/* Roughness Control */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">
      Roughness: {roughness.toFixed(2)}
    </label>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={roughness}
      onChange={(e) => setRoughness(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
    />
  </div>

  {/* Albedo Color Control */}
  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">
      Albedo Color
    </label>
    <input
      type="color"
      value={albedoColor}
      onChange={(e) => setAlbedoColor(e.target.value)}
      className="w-full h-10 rounded border-2 border-gray-600 cursor-pointer"
    />
  </div>
</div>
```

### Code Structure & Comments
```javascript
// ===== REACT HOOKS & STATE =====
// Ref để lưu trữ canvas element - cho phép truy cập trực tiếp DOM
const canvasRef = useRef<HTMLCanvasElement>(null);

// ===== PBR MATERIAL STATE =====
// State cho độ kim loại của material (0 = không kim loại, 1 = kim loại hoàn toàn)
const [metallic, setMetallic] = useState(0.0);

// ===== MAIN SCENE INITIALIZATION =====
// useEffect chính - khởi tạo Babylon.js scene
useEffect(() => {
  // Lấy canvas element từ ref
  const canvas = canvasRef.current;
  
  // Kiểm tra nếu canvas không tồn tại hoặc đã khởi tạo rồi thì return
  if (!canvas || initializedRef.current) return;

  // Function khởi tạo scene - async vì cần import modules
  const initScene = async () => {
    // ===== IMPORT BABYLON.JS MODULES =====
    const {
      Engine,        // Engine chính để render 3D - quản lý WebGL context
      Scene,         // Scene chứa tất cả objects 3D, lights, cameras
      Vector3,       // Class để tạo vector 3D (x, y, z coordinates)
    } = await import("@babylonjs/core");
  };
}, []);
```

### HDR Environment Setup
```javascript
// Import HDR loader
const { CubeTexture } = await import("@babylonjs/core");

// Tạo environment texture từ HDR image
const environmentTexture = new CubeTexture(
  "https://playground.babylonjs.com/textures/room.env", // HDR environment map
  scene
);

// Áp dụng environment texture vào scene
scene.environmentTexture = environmentTexture;

// Thiết lập environment intensity (cường độ môi trường)
scene.environmentIntensity = 0.5;
```

### HDR Environment Controls
```javascript
// State cho HDR environment
const [environmentIntensity, setEnvironmentIntensity] = useState(0.5);
const [environmentType, setEnvironmentType] = useState("room");

// Effect để cập nhật HDR environment
useEffect(() => {
  const updateEnvironment = async () => {
    const scene = (window as any).currentScene;
    if (scene) {
      // Chọn environment map dựa trên loại
      let environmentUrl = "https://playground.babylonjs.com/textures/room.env";
      switch (environmentType) {
        case "studio":
          environmentUrl = "https://playground.babylonjs.com/textures/studio.env";
          break;
        case "outdoor":
          environmentUrl = "https://playground.babylonjs.com/textures/outdoor.env";
          break;
      }
      
      // Cập nhật scene environment
      const environmentTexture = new CubeTexture(environmentUrl, scene);
      scene.environmentTexture = environmentTexture;
      scene.environmentIntensity = environmentIntensity;
    }
  };

  updateEnvironment();
}, [environmentType, environmentIntensity]);
```

### Custom Environment Creation
```javascript
// Tạo studio environment với multiple lights
const createStudioEnvironment = (scene) => {
  // Xóa lights cũ
  scene.lights.forEach(light => light.dispose());
  
  // Main light từ trên xuống
  const mainLight = new HemisphericLight("mainLight", new Vector3(0, 1, 0), scene);
  mainLight.intensity = 0.8;
  mainLight.diffuse = new Color3(1, 1, 1);
  
  // Fill lights từ hai bên
  const fillLight1 = new PointLight("fillLight1", new Vector3(5, 2, 0), scene);
  fillLight1.intensity = 0.3;
  fillLight1.diffuse = new Color3(0.9, 0.9, 1);
  
  const fillLight2 = new PointLight("fillLight2", new Vector3(-5, 2, 0), scene);
  fillLight2.intensity = 0.3;
  fillLight2.diffuse = new Color3(1, 0.9, 0.9);
  
  // Rim light từ phía sau
  const rimLight = new PointLight("rimLight", new Vector3(0, 1, 5), scene);
  rimLight.intensity = 0.2;
  rimLight.diffuse = new Color3(1, 1, 1);
};
```

### Gradient Environment Creation
```javascript
// Tạo gradient environment từ canvas
const createGradientEnvironment = (scene) => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Tạo gradient từ xanh dương (trên) đến trắng (dưới)
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, '#87CEEB');   // Sky blue
    gradient.addColorStop(0.5, '#E0F6FF'); // Light blue
    gradient.addColorStop(1, '#FFFFFF');   // White
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  
  // Tạo cube texture từ canvas
  const cubeTexture = new CubeTexture("", scene);
  return cubeTexture;
};
```

### HDR Advanced Setup
```javascript
// Setup HDR exposure và tone mapping
const setupHDRAdvanced = async (scene) => {
  const { ImageProcessingConfiguration, ReflectionProbe, HDRCubeTexture } = await import("@babylonjs/core");
  
  // Enable image processing
  scene.imageProcessingConfiguration = new ImageProcessingConfiguration();
  
  // Setup HDR exposure
  scene.imageProcessingConfiguration.exposure = 1.0;
  
  // Setup tone mapping
  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  
  // Tạo reflection probe
  const reflectionProbe = new ReflectionProbe("mainProbe", 512, scene);
  reflectionProbe.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
  reflectionProbe.renderList = scene.meshes;
  
  // Load true HDR file
  const hdrTexture = new HDRCubeTexture("room.hdr", scene, 512, false, true, false, true);
  scene.environmentTexture = hdrTexture;
};
```

### PBR Environment Integration
```javascript
// Áp dụng environment reflections vào PBR materials
mesh.material.environmentIntensity = 1.0;
mesh.material.useEnvironmentAsLighting = true;

// Cập nhật PBR properties với environment
mesh.material.metallic = metallic;
mesh.material.roughness = roughness;
mesh.material.albedoColor = new Color3(r, g, b);
```

### PBR Texture Switching
```javascript
// Tạo procedural texture dựa trên PBR properties
const createProceduralTexture = async (scene, metallic, roughness, albedoColor) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Xác định loại texture dựa trên properties
  if (metallic > 0.8) {
    // Tạo metallic pattern với brush strokes
    ctx.fillStyle = albedoColor;
    ctx.fillRect(0, 0, 256, 256);
    
    // Thêm metallic brush strokes
    ctx.strokeStyle = '#FFFFFF';
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 256, Math.random() * 256);
      ctx.lineTo(Math.random() * 256, Math.random() * 256);
      ctx.stroke();
    }
  } else if (roughness > 0.7) {
    // Tạo wood grain pattern
    ctx.fillStyle = albedoColor;
    ctx.fillRect(0, 0, 256, 256);
    
    // Thêm wood grain lines
    ctx.strokeStyle = '#654321';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 12);
      ctx.lineTo(256, i * 12 + Math.sin(i) * 5);
      ctx.stroke();
    }
  }
  
  // Tạo texture từ canvas
  const texture = new Texture("", scene);
  texture.updateURL(canvas.toDataURL());
  return texture;
};
```

### Luminance & Shadow Rendering
```javascript
// Setup luminance adjustment
const setupLuminanceAdjustment = async (scene) => {
  const { ImageProcessingConfiguration } = await import("@babylonjs/core");
  
  // Enable image processing
  scene.imageProcessingConfiguration = new ImageProcessingConfiguration();
  
  // Setup luminance adjustment
  scene.imageProcessingConfiguration.luminance = 1.0;
  
  // Setup gamma correction
  scene.imageProcessingConfiguration.gamma = 2.2;
  
  // Setup contrast
  scene.imageProcessingConfiguration.contrast = 1.0;
};

// Setup realistic shadow rendering
const setupRealisticShadows = async (scene) => {
  const { DirectionalLight, ShadowGenerator, Vector3 } = await import("@babylonjs/core");
  
  // Tạo directional light cho shadows chính
  const mainLight = new DirectionalLight("mainLight", new Vector3(-0.5, -1, -0.5), scene);
  mainLight.intensity = 1.0;
  
  // Tạo shadow generator với soft shadows
  const shadowGenerator = new ShadowGenerator(2048, mainLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 32; // Medium quality
  
  // Áp dụng shadows cho meshes
  scene.meshes.forEach(mesh => {
    if (mesh.name !== "__root__") {
      shadowGenerator.addShadowCaster(mesh, true);
      mesh.receiveShadows = true;
    }
  });
};
```

---

## 🎓 Khái niệm chính

### Scene Graph
- **Scene**: Container gốc
- **Mesh**: Objects 3D (geometry + material)
- **Material**: Thuộc tính bề mặt (màu sắc, texture, etc.)
- **Texture**: Dữ liệu hình ảnh cho materials
- **Light**: Nguồn ánh sáng
- **Camera**: Điểm nhìn và projection

### Hệ tọa độ
- **X-axis**: Trái/Phải
- **Y-axis**: Lên/Xuống  
- **Z-axis**: Trước/Sau
- **Vector3**: Vị trí 3D (x, y, z)

### Các loại Camera
- **ArcRotateCamera**: Xoay quanh điểm target
- **FreeCamera**: Kiểu first-person
- **FollowCamera**: Theo dõi object
- **UniversalCamera**: Kết hợp các tính năng

---

## 🔗 Tài liệu tham khảo
- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [GLTF Specification](https://www.khronos.org/gltf/)
- [Babylon.js Playground](https://playground.babylonjs.com/)

---

## 📝 Ghi chú

### Câu hỏi & Trả lời

**Q: Có thể thay đổi texture khi điều chỉnh PBR properties không?**
A: Có, có thể tự động thay đổi texture dựa trên metallic, roughness, albedo bằng cách:
- Tạo procedural textures với HTML5 Canvas
- Switch texture maps dựa trên material type
- Tạo normal maps dựa trên roughness

**Q: Procedural textures hoạt động như thế nào?**
A: Sử dụng HTML5 Canvas để tạo texture programmatically:
- **Metallic**: Brush strokes pattern với white highlights
- **Wood**: Wood grain lines pattern
- **Plastic**: Smooth gradient pattern
- **Normal Maps**: Noise pattern dựa trên roughness

**Q: HDR Exposure và Tone Mapping có tác dụng gì?**
A: 
- **HDR Exposure**: Điều chỉnh độ sáng tổng thể của scene (0-4)
- **Tone Mapping**: Chuyển đổi HDR (High Dynamic Range) sang LDR (Low Dynamic Range) để hiển thị trên màn hình
- **ACES**: Film industry standard cho tone mapping
- **Standard**: Basic tone mapping algorithm

**Q: Reflection Probes hoạt động như thế nào?**
A: Reflection probes capture environment xung quanh và tạo reflections cho objects, giúp materials phản xạ môi trường một cách chân thực.

**Q: Có thể tự tạo environment mà không cần tải HDR maps không?**
A: Có, có thể tạo custom environments bằng code sử dụng lights và canvas để tạo gradient textures.

**Q: Custom environments có những loại nào?**
A: 
- **Gradient**: Tạo gradient từ sky blue đến white bằng canvas
- **Studio**: 4 lights (main, fill, rim) cho professional lighting
- **Outdoor**: Sunlight + ambient light cho môi trường tự nhiên
- **Night**: Moonlight + street lights cho ban đêm
- **Office**: Fluorescent ceiling lights + natural window light

**Q: Làm sao để tạo gradient environment?**
A: Sử dụng HTML5 Canvas để tạo gradient, sau đó convert thành CubeTexture cho Babylon.js.

**Q: HDR Lighting Environment là gì và tại sao quan trọng?**
A: HDR (High Dynamic Range) là kỹ thuật mô phỏng ánh sáng với dải động cao, tạo ra môi trường ánh sáng chân thực hơn bằng cách sử dụng environment maps 360°.

**Q: Environment Maps hoạt động như thế nào?**
A: Environment maps là hình ảnh 360° của môi trường xung quanh, được sử dụng để tạo reflections và ambient lighting cho objects trong scene.

**Q: Làm sao để tạo HDR environment trong Babylon.js?**
A: Sử dụng `CubeTexture` để load HDR image và áp dụng vào `scene.environmentTexture`, sau đó điều chỉnh `scene.environmentIntensity`.

**Q: Có thể thay đổi environment real-time không?**
A: Có, có thể thay đổi environment type và intensity real-time bằng cách cập nhật `scene.environmentTexture` và `scene.environmentIntensity`.

**Q: PBR Materials là gì và tại sao quan trọng?**
A: PBR (Physically Based Rendering) là phương pháp render dựa trên vật lý thực tế, tạo ra vật liệu chân thực hơn bằng cách mô phỏng cách ánh sáng tương tác với bề mặt.

**Q: Metallic, Roughness, Albedo có ý nghĩa gì?**
A: 
- **Metallic**: Độ kim loại (0-1), ảnh hưởng đến cách vật liệu phản xạ ánh sáng
- **Roughness**: Độ nhám bề mặt (0-1), quyết định độ mịn hay nhám của bề mặt
- **Albedo**: Màu sắc cơ bản của vật liệu, không bị ảnh hưởng bởi ánh sáng

**Q: Làm sao để tạo PBR material trong Babylon.js?**
A: Sử dụng `PBRMaterial` class và thiết lập các thuộc tính metallic, roughness, albedoColor.

**Q: Có thể sử dụng texture maps cho PBR không?**
A: Có, có thể sử dụng albedoTexture, metallicTexture, roughnessTexture để tạo chi tiết phức tạp.

**Q: Làm sao để truy cập và thay đổi các mesh cụ thể trong GLTF model?**
A: Sử dụng `scene.getMeshByName("tên_mesh")` hoặc lặp qua `scene.meshes` để tìm mesh cần thiết.

**Q: Có thể thay đổi màu sắc của material trong GLTF không?**
A: Có, sử dụng `mesh.material.diffuseColor = new Color3(r, g, b)` để thay đổi màu sắc.

**Q: Làm sao để tạo animation cho model?**
A: Có thể sử dụng keyframe animation hoặc skeletal animation từ GLTF, hoặc tạo custom animation với `Animation` class.

**Q: Có thể load nhiều model cùng lúc không?**
A: Có, có thể load nhiều GLTF files và quản lý chúng trong cùng một scene.

### Thí nghiệm & Phát hiện

**Thí nghiệm**: Tìm hiểu về HDR Advanced Features
**Kết quả**: HDR exposure và tone mapping tạo ra ánh sáng chân thực hơn
**Phát hiện**: Reflection probes cải thiện đáng kể chất lượng reflections trên materials

**Thí nghiệm**: Tạo custom environments bằng code thay vì HDR maps
**Kết quả**: Custom environments cho phép kiểm soát hoàn toàn lighting setup
**Phát hiện**: Có thể tạo professional lighting với multiple lights và colors

**Thí nghiệm**: Tìm hiểu về HDR Lighting Environment
**Kết quả**: HDR tạo ra môi trường ánh sáng chân thực hơn so với basic lighting
**Phát hiện**: Environment maps ảnh hưởng lớn đến reflections và ambient lighting

**Thí nghiệm**: Tìm hiểu về PBR Materials
**Kết quả**: PBR tạo ra vật liệu chân thực hơn so với traditional materials
**Phát hiện**: Metallic và Roughness là hai thuộc tính quan trọng nhất của PBR

**Thí nghiệm**: Thay đổi wheelPrecision để điều chỉnh tốc độ zoom
**Kết quả**: Số càng nhỏ = zoom càng nhanh (wheelPrecision = 1 cho zoom cực nhanh)
**Phát hiện**: Cần import GLTF loader trước khi load model

**Thí nghiệm**: Sử dụng ArcRotateCamera thay vì FreeCamera
**Kết quả**: ArcRotateCamera phù hợp hơn cho việc xem model 3D
**Phát hiện**: Có thể tự động điều chỉnh camera để nhìn hết model

### Mẹo & Thủ thuật

**Mẹo**: Sử dụng HDR exposure để điều chỉnh độ sáng tổng thể
**Lý do**: Exposure ảnh hưởng đến toàn bộ scene, không chỉ environment

**Mẹo**: Kết hợp tone mapping với HDR để có kết quả tốt nhất
**Lý do**: Tone mapping chuyển đổi HDR sang LDR phù hợp với màn hình

**Mẹo**: Sử dụng reflection probes để cải thiện material reflections
**Lý do**: Reflection probes capture environment và tạo reflections chân thực

**Mẹo**: Sử dụng custom environments để có kiểm soát hoàn toàn lighting
**Lý do**: Không phụ thuộc vào external HDR files, có thể tùy chỉnh theo ý muốn

**Mẹo**: Kết hợp multiple lights để tạo professional lighting
**Lý do**: Main light + fill lights + rim light tạo ra lighting setup chuyên nghiệp

**Mẹo**: Sử dụng HTML5 Canvas để tạo gradient environments
**Lý do**: Dễ dàng tạo và tùy chỉnh gradient mà không cần external files

**Mẹo**: Sử dụng HDR environment maps để tạo ánh sáng chân thực
**Lý do**: Environment maps mô phỏng ánh sáng thực tế tốt hơn basic lighting

**Mẹo**: Kết hợp HDR với PBR materials để có kết quả tốt nhất
**Lý do**: HDR cung cấp ánh sáng, PBR mô phỏng vật liệu chân thực

**Mẹo**: Điều chỉnh environment intensity để phù hợp với scene
**Lý do**: Intensity quá cao có thể làm scene quá sáng, quá thấp có thể tối

**Mẹo**: Tổ chức code thành sections rõ ràng với comments
**Lý do**: Giúp code dễ đọc, dễ maintain và dễ debug

**Mẹo**: Comment chi tiết cho từng parameter và function
**Lý do**: Giúp hiểu rõ ý nghĩa và cách sử dụng của từng phần code

**Mẹo**: Sử dụng PBR materials thay vì StandardMaterial cho vật liệu chân thực
**Lý do**: PBR mô phỏng vật lý thực tế tốt hơn

**Mẹo**: Kết hợp metallic và roughness để tạo vật liệu đa dạng
**Lý do**: Hai thuộc tính này tương tác với nhau để tạo hiệu ứng phức tạp

**Mẹo**: Luôn import GLTF loader trước khi load model
**Lý do**: Babylon.js cần plugin để hiểu format GLTF/GLB

**Mẹo**: Sử dụng `initializedRef` để tránh khởi tạo scene nhiều lần
**Lý do**: React strict mode và hot reload có thể gây ra việc khởi tạo nhiều lần

**Mẹo**: Cleanup resources với `dispose()` để tránh memory leak
**Lý do**: WebGL context cần được giải phóng đúng cách

---

*Cập nhật lần cuối: 2024-12-19*
*Trọng tâm tiếp theo: Tùy chỉnh Model và Material*

