import { useEffect, useRef, useState } from "react";
import PBRMaterials from "./PBRMaterials";
import HDRLighting from "./HDRLighting";
import LuminanceShadows from "./LuminanceShadows";
import ModelComparison from "./ModelComparison";

/**
 * BabylonScene Component - Trình Xem Mô Hình 3D với Ánh Sáng Nâng Cao
 *
 * LUỒNG HOẠT ĐỘNG:
 * 1. Khởi tạo React state và refs
 * 2. Thiết lập Babylon.js scene (Engine, Scene, Camera, Ánh Sáng Cơ Bản)
 * 3. Tải mô hình 3D từ file GLTF
 * 4. Thiết lập ánh sáng nâng cao (HDR, Bóng Đổ, PBR)
 * 5. Thiết lập điều khiển UI và xử lý sự kiện
 * 6. Vòng lặp render và dọn dẹp
 */
export default function BabylonScene() {
  // ===== 1. REACT HOOKS & QUẢN LÝ TRẠNG THÁI =====

  // === Tham Chiếu DOM ===
  // Ref để lưu trữ canvas element - cho phép truy cập trực tiếp DOM
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ref để tránh khởi tạo scene nhiều lần - ngăn chặn việc tạo scene trùng lặp
  const initializedRef = useRef(false);

  // === Điều Khiển Vật Liệu PBR ===
  // State cho độ kim loại của vật liệu (0 = không kim loại, 1 = kim loại hoàn toàn)
  const [metallic, setMetallic] = useState(0.0);

  // State cho độ nhám bề mặt (0 = mịn như gương, 1 = rất nhám)
  const [roughness, setRoughness] = useState(0.5);

  // State cho màu sắc cơ bản của vật liệu (mã màu hex)
  const [albedoColor, setAlbedoColor] = useState("#8B4513"); // Màu nâu mặc định

  // State cho tên mesh đang được chọn để áp dụng PBR
  const [selectedMesh, setSelectedMesh] = useState("chair2");

  // State cho danh sách tất cả meshes có sẵn trong mô hình
  const [availableMeshes, setAvailableMeshes] = useState<string[]>([]);

  // State cho thông tin debug về mesh được chọn
  const [meshInfo, setMeshInfo] = useState<string>("");

  // === Điều Khiển Môi Trường HDR ===
  // State cho cường độ môi trường HDR (0-1)
  const [environmentIntensity, setEnvironmentIntensity] = useState(0.5);

  // State cho loại môi trường HDR
  const [environmentType, setEnvironmentType] = useState("room");

  // === Tính Năng HDR Nâng Cao ===
  // State cho độ phơi sáng HDR (0-4)
  const [hdrExposure, setHdrExposure] = useState(1.0);

  // State cho tone mapping
  const [toneMappingEnabled, setToneMappingEnabled] = useState(true);

  // State cho loại tone mapping
  const [toneMappingType, setToneMappingType] = useState("ACES");

  // State cho phản xạ môi trường
  const [environmentReflections, setEnvironmentReflections] = useState(true);

  // State cho cường độ phản xạ
  const [reflectionIntensity, setReflectionIntensity] = useState(1.0);

  // === Điều Khiển Độ Sáng & Bóng Đổ ===
  // State cho điều chỉnh độ sáng
  const [luminance, setLuminance] = useState(1.0);

  // State cho hiệu chỉnh gamma
  const [gamma, setGamma] = useState(2.2);

  // State cho chất lượng bóng đổ
  const [shadowQuality, setShadowQuality] = useState("medium");

  // State cho bóng đổ mềm
  const [softShadows, setSoftShadows] = useState(true);

  // State cho che khuất môi trường
  const [ambientOcclusion, setAmbientOcclusion] = useState(true);

  // State cho bóng đổ tiếp xúc
  const [contactShadows, setContactShadows] = useState(true);

  // === Điều Khiển So Sánh Mô Hình ===
  // State cho chế độ ánh sáng (gốc vs thời gian thực)
  const [lightingMode, setLightingMode] = useState("realtime");

  // === Điều Khiển Load Thêm Model ===
  // State cho việc load thêm ghế
  const [chairLoaded, setChairLoaded] = useState(false);
  
  // State để theo dõi model đã load xong
  const [modelFullyLoaded, setModelFullyLoaded] = useState(false);

  // ===== 2. CÁC HÀM TẠO MÔI TRƯỜNG TÙY CHỈNH =====

  /**
   * Hàm chính để tạo môi trường tùy chỉnh
   * @param scene - Babylon.js scene
   * @param type - Loại môi trường (gradient, studio, outdoor, night, office)
   * @returns CubeTexture hoặc null
   */
  const createCustomEnvironment = async (scene: any, type: string) => {
    try {
      switch (type) {
        case "gradient":
          // Tạo môi trường gradient từ trên xuống dưới
          return createGradientEnvironment(scene);

        case "studio":
          // Tạo ánh sáng studio với đèn
          return createStudioEnvironment(scene);

        case "outdoor":
          // Tạo môi trường ngoài trời với bầu trời
          return createOutdoorEnvironment(scene);

        case "night":
          // Tạo môi trường đêm với sao
          return createNightEnvironment(scene);

        case "office":
          // Tạo môi trường văn phòng với đèn huỳnh quang
          return createOfficeEnvironment(scene);

        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  };

  /**
   * Tạo môi trường gradient - gradient từ xanh dương bầu trời đến trắng
   * @param scene - Babylon.js scene
   * @returns CubeTexture
   */
  const createGradientEnvironment = (scene: any) => {
    const { CubeTexture } = require("@babylonjs/core");

    // Tạo 6 mặt của cube map với gradient
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Tạo gradient từ xanh dương (trên) đến trắng (dưới)
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, "#87CEEB"); // Xanh dương bầu trời
      gradient.addColorStop(0.5, "#E0F6FF"); // Xanh dương nhạt
      gradient.addColorStop(1, "#FFFFFF"); // Trắng

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    // Tạo cube texture từ canvas
    const cubeTexture = new CubeTexture("", scene);
    cubeTexture.coordinatesIndex = 0;

    return cubeTexture;
  };

  /**
   * Tạo môi trường studio - thiết lập ánh sáng chuyên nghiệp
   * @param scene - Babylon.js scene
   * @returns null (không cần environment texture)
   */
  const createStudioEnvironment = (scene: any) => {
    const {
      HemisphericLight,
      PointLight,
      Vector3,
      Color3,
    } = require("@babylonjs/core");

    // Xóa đèn cũ
    scene.lights.forEach((light: any) => light.dispose());

    // Tạo đèn chính từ trên xuống
    const mainLight = new HemisphericLight(
      "mainLight",
      new Vector3(0, 1, 0),
      scene
    );
    mainLight.intensity = 0.8;
    mainLight.diffuse = new Color3(1, 1, 1);
    mainLight.specular = new Color3(0.5, 0.5, 0.5);

    // Tạo đèn fill
    const fillLight1 = new PointLight(
      "fillLight1",
      new Vector3(5, 2, 0),
      scene
    );
    fillLight1.intensity = 0.3;
    fillLight1.diffuse = new Color3(0.9, 0.9, 1);

    const fillLight2 = new PointLight(
      "fillLight2",
      new Vector3(-5, 2, 0),
      scene
    );
    fillLight2.intensity = 0.3;
    fillLight2.diffuse = new Color3(1, 0.9, 0.9);

    // Tạo đèn viền
    const rimLight = new PointLight("rimLight", new Vector3(0, 1, 5), scene);
    rimLight.intensity = 0.2;
    rimLight.diffuse = new Color3(1, 1, 1);

    // Môi trường studio được tạo với 4 đèn
    return null; // Không cần environment texture cho studio
  };

  /**
   * Tạo môi trường ngoài trời - ánh sáng mặt trời tự nhiên
   * @param scene - Babylon.js scene
   * @returns null (không cần environment texture)
   */
  const createOutdoorEnvironment = (scene: any) => {
    const { HemisphericLight, Vector3, Color3 } = require("@babylonjs/core");

    // Xóa đèn cũ
    scene.lights.forEach((light: any) => light.dispose());

    // Tạo ánh sáng mặt trời
    const sunLight = new HemisphericLight(
      "sunLight",
      new Vector3(0.5, 1, 0.3),
      scene
    );
    sunLight.intensity = 1.2;
    sunLight.diffuse = new Color3(1, 0.95, 0.8); // Ánh sáng mặt trời ấm áp
    sunLight.specular = new Color3(1, 1, 1);

    // Tạo ánh sáng môi trường
    const ambientLight = new HemisphericLight(
      "ambientLight",
      new Vector3(-0.5, -1, -0.3),
      scene
    );
    ambientLight.intensity = 0.4;
    ambientLight.diffuse = new Color3(0.6, 0.7, 1); // Phản xạ bầu trời xanh

    // Môi trường ngoài trời được tạo với ánh sáng mặt trời và môi trường
    return null;
  };

  /**
   * Tạo môi trường đêm - ánh sáng trăng và đèn đường
   * @param scene - Babylon.js scene
   * @returns null (không cần environment texture)
   */
  const createNightEnvironment = (scene: any) => {
    const {
      HemisphericLight,
      PointLight,
      Vector3,
      Color3,
    } = require("@babylonjs/core");

    // Xóa đèn cũ
    scene.lights.forEach((light: any) => light.dispose());

    // Tạo ánh sáng trăng
    const moonLight = new HemisphericLight(
      "moonLight",
      new Vector3(0, 1, 0),
      scene
    );
    moonLight.intensity = 0.3;
    moonLight.diffuse = new Color3(0.8, 0.8, 1); // Ánh sáng trăng xanh
    moonLight.specular = new Color3(0.2, 0.2, 0.3);

    // Tạo đèn đường
    const streetLight1 = new PointLight(
      "streetLight1",
      new Vector3(3, 2, 0),
      scene
    );
    streetLight1.intensity = 0.4;
    streetLight1.diffuse = new Color3(1, 0.9, 0.6); // Đèn đường ấm áp
    streetLight1.range = 10;

    const streetLight2 = new PointLight(
      "streetLight2",
      new Vector3(-3, 2, 0),
      scene
    );
    streetLight2.intensity = 0.4;
    streetLight2.diffuse = new Color3(1, 0.9, 0.6);
    streetLight2.range = 10;

    // Môi trường đêm được tạo với ánh sáng trăng và đèn đường
    return null;
  };

  /**
   * Tạo môi trường văn phòng - đèn huỳnh quang
   * @param scene - Babylon.js scene
   * @returns null (không cần environment texture)
   */
  const createOfficeEnvironment = (scene: any) => {
    const {
      HemisphericLight,
      PointLight,
      Vector3,
      Color3,
    } = require("@babylonjs/core");

    // Xóa đèn cũ
    scene.lights.forEach((light: any) => light.dispose());

    // Tạo đèn trần huỳnh quang
    const ceilingLight1 = new PointLight(
      "ceilingLight1",
      new Vector3(0, 3, 0),
      scene
    );
    ceilingLight1.intensity = 0.6;
    ceilingLight1.diffuse = new Color3(0.9, 0.95, 1); // Huỳnh quang trắng mát
    ceilingLight1.range = 8;

    const ceilingLight2 = new PointLight(
      "ceilingLight2",
      new Vector3(2, 3, 0),
      scene
    );
    ceilingLight2.intensity = 0.6;
    ceilingLight2.diffuse = new Color3(0.9, 0.95, 1);
    ceilingLight2.range = 8;

    const ceilingLight3 = new PointLight(
      "ceilingLight3",
      new Vector3(-2, 3, 0),
      scene
    );
    ceilingLight3.intensity = 0.6;
    ceilingLight3.diffuse = new Color3(0.9, 0.95, 1);
    ceilingLight3.range = 8;

    // Tạo ánh sáng môi trường từ cửa sổ
    const windowLight = new HemisphericLight(
      "windowLight",
      new Vector3(0, 0.5, 1),
      scene
    );
    windowLight.intensity = 0.3;
    windowLight.diffuse = new Color3(0.8, 0.85, 1); // Ánh sáng tự nhiên từ cửa sổ

    // Môi trường văn phòng được tạo với đèn huỳnh quang và ánh sáng tự nhiên
    return null;
  };

  // ===== 3. CÁC HÀM THIẾT LẬP =====

  /**
   * Hàm thiết lập các tính năng HDR nâng cao
   * @param scene - Babylon.js scene
   */
  const setupHDRAdvanced = async (scene: any) => {
    try {
      const {
        ImageProcessingConfiguration,
        ReflectionProbe,
        RenderTargetTexture,
        HDRCubeTexture,
      } = await import("@babylonjs/core");

      // ===== ĐỘ PHƠI SÁNG HDR & TONE MAPPING =====

      // Bật xử lý hình ảnh
      scene.imageProcessingConfiguration = new ImageProcessingConfiguration();

      // Thiết lập độ phơi sáng HDR
      scene.imageProcessingConfiguration.exposure = hdrExposure;

      // Thiết lập tone mapping
      scene.imageProcessingConfiguration.toneMappingEnabled =
        toneMappingEnabled;

      // Thiết lập loại tone mapping
      switch (toneMappingType) {
        case "ACES":
          scene.imageProcessingConfiguration.toneMappingType =
            ImageProcessingConfiguration.TONEMAPPING_ACES;
          break;
        case "Standard":
          scene.imageProcessingConfiguration.toneMappingType =
            ImageProcessingConfiguration.TONEMAPPING_STANDARD;
          break;
        default:
          scene.imageProcessingConfiguration.toneMappingType =
            ImageProcessingConfiguration.TONEMAPPING_ACES;
      }

      // ===== PROBE PHẢN XẠ =====

      if (environmentReflections) {
        // Tạo reflection probe để thu thập phản xạ môi trường
        const reflectionProbe = new ReflectionProbe("mainProbe", 512, scene);
        reflectionProbe.refreshRate =
          RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        reflectionProbe.renderList = scene.meshes;

        // Thiết lập vị trí probe ở trung tâm scene
        reflectionProbe.position = new (
          await import("@babylonjs/core")
        ).Vector3(0, 1, 0);

        // Probe phản xạ được tạo cho phản xạ môi trường
      }

      // ===== HỖ TRỢ FILE HDR THỰC =====

      // Thử tải file HDR thực nếu có
      try {
        const hdrTexture = new HDRCubeTexture(
          "https://playground.babylonjs.com/textures/room.hdr",
          scene,
          512,
          false,
          true,
          false,
          true
        );

        // Áp dụng texture HDR nếu tải thành công
        scene.environmentTexture = hdrTexture;
        // File HDR thực được tải thành công!
      } catch (error) {
        console.log("❌ Failed to load HDR texture:", error);
        // File HDR không khả dụng, sử dụng môi trường chuẩn
      }

      // Thiết lập tính năng HDR nâng cao hoàn tất!
    } catch (error) {
      console.error("❌ Failed to setup HDR advanced features:", error);
    }
  };

  /**
   * Hàm cập nhật cài đặt HDR nâng cao
   * @param scene - Babylon.js scene
   */
  const updateHDRAdvanced = async (scene: any) => {
    if (!scene.imageProcessingConfiguration) return;

    try {
      const { ImageProcessingConfiguration } = await import("@babylonjs/core");

      // Cập nhật độ phơi sáng
      scene.imageProcessingConfiguration.exposure = hdrExposure;

      // Cập nhật tone mapping
      scene.imageProcessingConfiguration.toneMappingEnabled =
        toneMappingEnabled;

      // Cập nhật loại tone mapping
      switch (toneMappingType) {
        case "ACES":
          scene.imageProcessingConfiguration.toneMappingType =
            ImageProcessingConfiguration.TONEMAPPING_ACES;
          break;
        case "Standard":
          scene.imageProcessingConfiguration.toneMappingType =
            ImageProcessingConfiguration.TONEMAPPING_STANDARD;
          break;
      }

      // Cài đặt HDR đã cập nhật
    } catch (error) {
      console.error("❌ Failed to update HDR settings:", error);
    }
  };

  /**
   * Hàm thiết lập điều chỉnh độ sáng
   * @param scene - Babylon.js scene
   */
  const setupLuminanceAdjustment = async (scene: any) => {
    try {
      const { ImageProcessingConfiguration } = await import("@babylonjs/core");

      // Bật xử lý hình ảnh nếu chưa có
      if (!scene.imageProcessingConfiguration) {
        scene.imageProcessingConfiguration = new ImageProcessingConfiguration();
      }

      // Thiết lập điều chỉnh độ sáng
      scene.imageProcessingConfiguration.luminance = luminance;

      // Thiết lập hiệu chỉnh gamma
      scene.imageProcessingConfiguration.gamma = gamma;

      // Thiết lập độ tương phản để tăng độ tương phản
      scene.imageProcessingConfiguration.contrast =
        1.0 + (luminance - 1.0) * 0.5;

      // Thiết lập độ sáng hoàn tất
    } catch (error) {
      console.error("❌ Failed to setup luminance:", error);
    }
  };

  /**
   * Hàm thiết lập render bóng đổ thực tế
   * @param scene - Babylon.js scene
   */
  const setupRealisticShadows = async (scene: any) => {
    try {
      const {
        DirectionalLight,
        ShadowGenerator,
        Vector3,
        Color3,
        HemisphericLight,
        PointLight,
      } = await import("@babylonjs/core");

      // Xóa đèn cũ để tạo thiết lập ánh sáng mới
      scene.lights.forEach((light: any) => light.dispose());

      // ===== THIẾT LẬP ÁNH SÁNG CHÍNH =====

      // Tạo ánh sáng định hướng cho bóng đổ chính
      const mainLight = new DirectionalLight(
        "mainLight",
        new Vector3(-0.5, -1, -0.5), // Hướng ánh sáng
        scene
      );
      mainLight.intensity = 1.0;
      mainLight.diffuse = new Color3(1, 0.95, 0.8); // Ánh sáng mặt trời ấm áp
      mainLight.specular = new Color3(1, 1, 1);

      // ===== BỘ TẠO BÓNG ĐỔ =====

      if (softShadows) {
        // Tạo bộ tạo bóng đổ với bóng đổ mềm
        const shadowGenerator = new ShadowGenerator(2048, mainLight);

        // Thiết lập chất lượng bóng đổ
        switch (shadowQuality) {
          case "low":
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurKernel = 16;
            break;
          case "medium":
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurKernel = 32;
            break;
          case "high":
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurKernel = 64;
            break;
          case "ultra":
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurKernel = 128;
            break;
        }

        // Áp dụng bóng đổ cho tất cả meshes
        scene.meshes.forEach((mesh: any) => {
          if (mesh.name !== "__root__") {
            shadowGenerator.addShadowCaster(mesh, true);
            mesh.receiveShadows = true;
          }
        });

        // Bộ tạo bóng đổ được tạo với chất lượng cao
      }

      // ===== ÁNH SÁNG MÔI TRƯỜNG =====

      // Tạo ánh sáng môi trường để lấp đầy bóng đổ
      const ambientLight = new HemisphericLight(
        "ambientLight",
        new Vector3(0, 1, 0),
        scene
      );
      ambientLight.intensity = 0.3;
      ambientLight.diffuse = new Color3(0.6, 0.7, 1); // Phản xạ bầu trời xanh
      ambientLight.groundColor = new Color3(0.3, 0.2, 0.1); // Phản xạ mặt đất

      // ===== BÓNG ĐỔ TIẾP XÚC =====

      if (contactShadows) {
        // Tạo đèn bổ sung cho bóng đổ tiếp xúc
        const contactLight1 = new PointLight(
          "contactLight1",
          new Vector3(2, 0.1, 2),
          scene
        );
        contactLight1.intensity = 0.2;
        contactLight1.range = 5;

        const contactLight2 = new PointLight(
          "contactLight2",
          new Vector3(-2, 0.1, -2),
          scene
        );
        contactLight2.intensity = 0.2;
        contactLight2.range = 5;

        // Bóng đổ tiếp xúc đã bật
      }

      // ===== CHE KHUẤT MÔI TRƯỜNG =====

      if (ambientOcclusion) {
        // Bật che khuất môi trường trong scene
        scene.ambientOcclusion = true;
        scene.ambientOcclusionIntensity = 0.5;

        // Che khuất môi trường đã bật
      }

      // Thiết lập render bóng đổ thực tế hoàn tất!
    } catch (error) {
      console.error("❌ Failed to setup realistic shadows:", error);
    }
  };

  /**
   * Hàm cập nhật cài đặt độ sáng
   * @param scene - Babylon.js scene
   */
  const updateLuminanceSettings = async (scene: any) => {
    if (!scene.imageProcessingConfiguration) return;

    try {
      // Cập nhật độ sáng
      scene.imageProcessingConfiguration.luminance = luminance;

      // Cập nhật gamma
      scene.imageProcessingConfiguration.gamma = gamma;

      // Cập nhật độ tương phản
      scene.imageProcessingConfiguration.contrast =
        1.0 + (luminance - 1.0) * 0.5;

      // Độ sáng đã cập nhật
    } catch (error) {
      console.error("❌ Failed to update luminance:", error);
    }
  };

  /**
   * Hàm debug để tìm và hiển thị thông tin về chair2
   * @param scene - Babylon.js scene
   */
  const debugChair2 = (scene: any) => {
    console.log("🔍 Tìm kiếm chair2 trong scene...");
    console.log("📋 Tất cả meshes:", scene.meshes.map((m: any) => m.name));
    
    // Tìm tất cả mesh có tên chứa "chair2"
    const chair2Meshes = scene.meshes.filter(
      (m: any) => m.name.includes("chair2")
    );

    if (chair2Meshes.length > 0) {
      console.log("✅ Tìm thấy các mesh chair2:");
      chair2Meshes.forEach((mesh: any, index: number) => {
        console.log(`  ${index + 1}. ${mesh.name}:`);
        console.log(`     📍 Vị trí:`, mesh.position);
        console.log(`     📏 Tỷ lệ:`, mesh.scaling);
        console.log(`     🔄 Xoay:`, mesh.rotation);
        console.log(`     👥 Parent:`, mesh.parent ? mesh.parent.name : "Không có");
      });
      
      // Tìm chair2 chính (không có primitive)
      const mainChair2 = chair2Meshes.find((m: any) => m.name === "chair2");
      if (mainChair2) {
        console.log("🎯 Chair2 chính được tìm thấy:", mainChair2.name);
        return mainChair2;
      }
      
      // Tìm chair2_primitive0 (thường là mesh chính của chair2)
      const chair2Primitive = chair2Meshes.find((m: any) => m.name === "chair2_primitive0");
      if (chair2Primitive) {
        console.log("🎯 Sử dụng chair2_primitive0 làm tham chiếu:", chair2Primitive.name);
        return chair2Primitive;
      }
      
      // Nếu không tìm thấy, sử dụng chair2 đầu tiên
      console.log("⚠️ Không tìm thấy chair2 chính, sử dụng chair2 đầu tiên");
      return chair2Meshes[0];
    } else {
      console.log("❌ Không tìm thấy mesh nào có tên chứa 'chair2'");
      console.log(
        "🔍 Tất cả meshes có 'chair':",
        scene.meshes
          .filter((m: any) => m.name.toLowerCase().includes("chair"))
          .map((m: any) => m.name)
      );
      return null;
    }
  };

  /**
   * Hàm load thêm ghế vào phòng khách
   * @param scene - Babylon.js scene
   */
  const loadAdditionalChair = async (scene: any) => {
    if (chairLoaded) return; // Tránh load trùng lặp

    try {
      const { Vector3 } = await import("@babylonjs/core");

      // Import SceneLoader
      const { SceneLoader } = await import("@babylonjs/core");
      await import("@babylonjs/loaders/glTF");

      // Debug để tìm chair2 và lấy mesh chính
      const chair2Mesh = debugChair2(scene);

      let referencePosition = new Vector3(2, 0, 0); // Vị trí mặc định
      let referenceScale = new Vector3(1, 1, 1); // Tỷ lệ mặc định

      // Sử dụng vị trí camera ban đầu làm tham chiếu
      const camera = scene.activeCamera;
      if (camera) {
        console.log("🎯 Sử dụng vị trí camera ban đầu...");
        console.log("📷 Camera position:", camera.position);
        console.log("📷 Camera target:", camera.target);
        
        // Lấy vị trí camera ban đầu
        referencePosition = camera.position.clone();
        
        // Điều chỉnh vị trí để ghế đặt ở vị trí phù hợp
        // Thay vì đặt ở vị trí camera, đặt ở vị trí gần camera nhưng trên mặt đất
        referencePosition.y = 0; // Đặt ghế trên mặt đất
        referencePosition.x += 2; // Dịch sang phải 2 đơn vị
        referencePosition.z += 2; // Dịch về phía trước 2 đơn vị
        
        // Sử dụng tỷ lệ mặc định
        referenceScale = new Vector3(1, 1, 1);
        
        console.log("📍 Vị trí ghế mới (điều chỉnh từ camera):", referencePosition);
      } else {
        console.log("⚠️ Không tìm thấy camera, sử dụng vị trí mặc định");
        // Sử dụng vị trí mặc định ở trung tâm
        referencePosition = new Vector3(2, 0, 2);
        referenceScale = new Vector3(1, 1, 1);
      }

      console.log("🔄 Bắt đầu load Chair.glb...");
      
      // Load ghế từ file GLB
      await SceneLoader.AppendAsync(
        "/assets/", // Thư mục chứa file
        "Chair.glb", // Tên file GLB
        scene // Scene để thêm model vào
      );

      console.log("✅ Đã load Chair.glb thành công");
      console.log("📋 Meshes sau khi load:", scene.meshes.map((m: any) => m.name));

      // Tìm ghế mới vừa load - tìm mesh có tên chứa "Chair" và không phải chair2
      console.log("🔍 Tìm ghế mới sau khi load...");
      console.log("📋 Tất cả meshes hiện tại:", scene.meshes.map((m: any) => m.name));
      
      const newChair = scene.meshes.find((m: any) => 
        m.name.includes("Chair") && 
        !m.name.includes("chair2") &&
        m.name !== selectedMesh &&
        !m.name.includes("primitive") // Loại bỏ primitive meshes
      );

      if (newChair) {
        console.log("🎯 Tìm thấy ghế mới:", newChair.name);
        console.log("📍 Vị trí ban đầu của ghế mới:", newChair.position);
        
        // Thiết lập vị trí, xoay và tỷ lệ cho ghế mới
        newChair.position = referencePosition;
        newChair.rotation = new Vector3(0, 0, 0); // Không xoay
        newChair.scaling = new Vector3(1, 1, 1); // Tỷ lệ mặc định

        // Đảm bảo ghế mới hiển thị
        newChair.isVisible = true;
        newChair.setEnabled(true);

        console.log("📍 Đã đặt ghế mới tại:", newChair.position);
        console.log("📏 Tỷ lệ ghế mới:", newChair.scaling);
        console.log("👁️ Ghế mới có hiển thị:", newChair.isVisible);

        // Thêm ghế vào danh sách meshes có sẵn
        setAvailableMeshes((prev) => [...prev, newChair.name]);

        setChairLoaded(true);
        console.log("✅ Ghế đã được load thành công!");
      } else {
        console.log("❌ Không tìm thấy ghế mới sau khi load");
        console.log("🔍 Tìm tất cả mesh có 'Chair':", 
          scene.meshes.filter((m: any) => m.name.includes("Chair")).map((m: any) => m.name)
        );
      }
    } catch (error) {
      console.log("❌ Lỗi khi load ghế:", error);
    }
  };

  /**
   * Hàm thiết lập so sánh mô hình
   * @param scene - Babylon.js scene
   */
  const setupModelComparison = async (scene: any) => {
    try {
      if (lightingMode === "original") {
        // ===== ORIGINAL MODEL SETUP =====

        // Tắt tất cả custom lighting
        scene.lights.forEach((light: any) => {
          light.dispose();
        });

        // Tắt environment texture
        scene.environmentTexture = null;
        scene.environmentIntensity = 0;

        // Tắt shadows
        scene.shadowGenerators.forEach((generator: any) => {
          generator.dispose();
        });

        // Tạo basic lighting cho model gốc (đủ sáng để nhìn thấy)
        const { HemisphericLight, Vector3, Color3 } = await import(
          "@babylonjs/core"
        );

        // Main light từ trên xuống
        const mainLight = new HemisphericLight(
          "mainLight",
          new Vector3(0, 1, 0),
          scene
        );
        mainLight.intensity = 0.8;
        mainLight.diffuse = new Color3(1, 1, 1);
        mainLight.groundColor = new Color3(0.3, 0.3, 0.3);

        // Fill light từ bên cạnh
        const fillLight = new HemisphericLight(
          "fillLight",
          new Vector3(1, 0.5, 0.5),
          scene
        );
        fillLight.intensity = 0.3;
        fillLight.diffuse = new Color3(0.9, 0.9, 1);

        // Chế độ mô hình gốc - chỉ ánh sáng cơ bản
      } else {
        // ===== THIẾT LẬP TĂNG CƯỜNG THỜI GIAN THỰC =====

        // Khôi phục ánh sáng thời gian thực
        await setupRealisticShadows(scene);

        // Khôi phục môi trường HDR
        if (environmentType !== "none") {
          // Áp dụng lại environment texture
          const { CubeTexture } = await import("@babylonjs/core");
          const environmentTexture = new CubeTexture(
            "https://playground.babylonjs.com/textures/room.env",
            scene
          );
          scene.environmentTexture = environmentTexture;
          scene.environmentIntensity = environmentIntensity;
        }

        // Chế độ tăng cường thời gian thực - thiết lập ánh sáng đầy đủ
      }
    } catch (error) {
      console.error("❌ Failed to setup model comparison:", error);
    }
  };

  // ===== 4. QUẢN LÝ SCENE =====

  // State để lưu scene hiện tại
  const [currentScene, setCurrentScene] = useState<any>(null);

  // Biến để lưu function dọn dẹp engine - dùng để dọn dẹp tài nguyên
  let engineCleanup: (() => void) | undefined;

  // ===== 5. KHỞI TẠO SCENE CHÍNH =====

  // useEffect chính - khởi tạo Babylon.js scene
  useEffect(() => {
    // Lấy canvas element từ ref
    const canvas = canvasRef.current;

    // Kiểm tra nếu canvas không tồn tại hoặc đã khởi tạo rồi thì return
    if (!canvas || initializedRef.current) return;

    // Đánh dấu đã khởi tạo để tránh tạo trùng lặp
    initializedRef.current = true;

    // Function khởi tạo scene - async vì cần import modules
    const initScene = async () => {
      try {
        // ===== IMPORT CÁC MODULE BABYLON.JS =====

        // Import các module cần thiết từ Babylon.js core
        const {
          Engine, // Engine chính để render 3D - quản lý WebGL context
          Scene, // Scene chứa tất cả objects 3D, lights, cameras
          Vector3, // Class để tạo vector 3D (x, y, z coordinates)
          HemisphericLight, // Loại ánh sáng mô phỏng ánh sáng tự nhiên từ bầu trời
          ArcRotateCamera, // Camera có thể xoay quanh target point - phù hợp cho model viewing
          SceneLoader, // Class để load 3D models từ file (GLTF, GLB, etc.)
        } = await import("@babylonjs/core");

        // Import GLTF loader plugin - cần thiết để load file .gltf và .glb
        await import("@babylonjs/loaders/glTF");

        // ===== TẠO ENGINE & SCENE =====

        // Tạo engine - đây là core của Babylon.js, quản lý WebGL context
        const engine = new Engine(canvas, true); // true = enable antialiasing

        // Tạo scene - container chứa tất cả objects 3D, lights, cameras
        const scene = new Scene(engine);

        // ===== TẠO CAMERA =====

        // Tạo camera ArcRotate - có thể xoay quanh một điểm target
        const camera = new ArcRotateCamera(
          "camera", // Tên camera
          Math.PI / 2, // Alpha (góc xoay ngang) - 90 độ
          Math.PI / 3, // Beta (góc nghiêng) - 60 độ
          5, // Radius (khoảng cách từ camera đến target)
          Vector3.Zero(), // Target point (0, 0, 0)
          scene // Scene chứa camera
        );

        // Gắn camera controls vào canvas - cho phép user điều khiển bằng chuột
        camera.attachControl(canvas, true);

        // ===== TẠO ÁNH SÁNG CƠ BẢN =====

        // Tạo ánh sáng Hemispheric - mô phỏng ánh sáng tự nhiên từ bầu trời
        const light = new HemisphericLight(
          "light", // Tên ánh sáng
          new Vector3(0, 1, 0), // Hướng ánh sáng (từ trên xuống)
          scene // Scene chứa ánh sáng
        );
        light.intensity = 0.8; // Cường độ ánh sáng (0-1)

        // ===== THIẾT LẬP ÁNH SÁNG MÔI TRƯỜNG HDR =====

        // Tạo môi trường HDR để mô phỏng ánh sáng thực tế
        try {
          // Import HDR loader
          const { CubeTexture } = await import("@babylonjs/core");

          // Kiểm tra nếu là môi trường tùy chỉnh
          if (
            ["gradient", "studio", "outdoor", "night", "office"].includes(
              environmentType
            )
          ) {
            // Tạo môi trường tùy chỉnh
            const customEnvironment = await createCustomEnvironment(
              scene,
              environmentType
            );
            if (customEnvironment) {
              scene.environmentTexture = customEnvironment;
              scene.environmentIntensity = environmentIntensity;
            }
            // Môi trường tùy chỉnh được tạo thành công!
          } else {
            // Sử dụng HDR maps từ Babylon
            let environmentUrl =
              "https://playground.babylonjs.com/textures/room.env";
            switch (environmentType) {
              case "room":
                environmentUrl =
                  "https://playground.babylonjs.com/textures/room.env";
                break;
              default:
                environmentUrl =
                  "https://playground.babylonjs.com/textures/room.env";
            }

            // Tạo environment texture từ HDR image
            const environmentTexture = new CubeTexture(
              environmentUrl, // HDR environment map
              scene
            );

            // Áp dụng environment texture vào scene
            scene.environmentTexture = environmentTexture;
            scene.environmentIntensity = environmentIntensity;

            // Môi trường HDR được tải thành công!
          }
        } catch (error) {
          console.log("⚠️ Sử dụng ánh sáng mặc định (HDR không khả dụng)");
        }

        // ===== THIẾT LẬP TÍNH NĂNG NÂNG CAO =====

        // Thiết lập độ phơi sáng HDR, tone mapping và reflection probes
        await setupHDRAdvanced(scene);

        // Thiết lập điều chỉnh độ sáng
        await setupLuminanceAdjustment(scene);

        // Thiết lập render bóng đổ thực tế
        await setupRealisticShadows(scene);

        // ===== BẮT ĐẦU VÒNG LẶP RENDER =====

        // Bắt đầu render loop - vòng lặp render liên tục
        engine.runRenderLoop(() => {
          scene.render(); // Render scene mỗi frame
        });

        // ===== TẢI MÔ HÌNH 3D =====

        try {
          // Tải mô hình GLTF từ file - AppendAsync thêm model vào scene hiện tại
          await SceneLoader.AppendAsync(
            "/assets/interior/", // Thư mục chứa file
            "condominium-room-101.gltf", // Tên file GLTF
            scene // Scene để thêm model vào
          );

          // ===== PHÂN TÍCH MÔ HÌNH ĐÃ TẢI =====

          // Hiển thị thông tin chi tiết về mô hình trong console
          // Lọc bỏ mesh "__root__" vì đây là mesh ảo (virtual mesh)
          const meshes = scene.meshes.filter((m) => m.name !== "__root__");

          // ===== THIẾT LẬP TRẠNG THÁI UI =====

          // Lưu scene vào window object để có thể truy cập từ UI controls
          setCurrentScene(scene);

          // ===== PHÂN TÍCH ÁNH SÁNG MÔ HÌNH =====

          // Cập nhật danh sách meshes có sẵn cho dropdown
          const meshNames = meshes
            .map((m) => m.name)
            .filter((name) => name !== "__root__");
          setAvailableMeshes(meshNames);

          // Tìm ghế và hiển thị thông tin
          const chair = scene.getMeshByName("chair2");
          if (chair) {
            // Nếu tìm thấy chair2, hiển thị thông tin
            setMeshInfo(
              `✅ Tìm thấy chair2 - Vật liệu: ${
                chair.material ? chair.material.getClassName() : "Không có"
              }`
            );
          } else {
            // Nếu không tìm thấy chair2, tìm mesh có tên chứa "chair"
            const chairMeshes = meshes.filter((m) =>
              m.name.toLowerCase().includes("chair")
            );
            if (chairMeshes.length > 0) {
              // Sử dụng ghế đầu tiên tìm được
              setSelectedMesh(chairMeshes[0].name);
              setMeshInfo(`🔍 Sử dụng "${chairMeshes[0].name}" thay vì chair2`);
            } else {
              // Nếu không tìm thấy ghế nào, sử dụng mesh đầu tiên
              setMeshInfo("❌ Không tìm thấy ghế, sử dụng mesh đầu tiên");
              setSelectedMesh(meshNames[0] || "");
            }
          }

          // Đánh dấu model đã load xong
          console.log("✅ Model chính đã load xong hoàn toàn!");
          setModelFullyLoaded(true);

          // ===== HIỂN THỊ THÔNG TIN MÔ HÌNH =====

          // ===== TỰ ĐỘNG ĐIỀU CHỈNH CAMERA =====

          // Điều chỉnh camera để nhìn thấy toàn bộ mô hình
          if (meshes.length > 0) {
            // Lấy thông tin bounding box của mô hình (kích thước và vị trí)
            const boundingInfo = meshes[0].getHierarchyBoundingVectors(true);

            // Tính toán trung tâm của mô hình
            const center = boundingInfo.min.add(boundingInfo.max).scale(0.5);

            // Tính toán kích thước của mô hình
            const size = boundingInfo.max.subtract(boundingInfo.min);

            // Lấy kích thước lớn nhất (width, height, depth)
            const maxDim = Math.max(size.x, size.y, size.z);

            // Điều chỉnh camera để nhìn thấy toàn bộ mô hình
            camera.setTarget(center); // Đặt target vào trung tâm mô hình
            camera.radius = maxDim * 2; // Khoảng cách camera
            camera.alpha = Math.PI / 6; // Góc xoay ngang (30 độ)
            camera.beta = Math.PI / 2.5; // Góc nghiêng (72 độ)
            camera.wheelPrecision = 1; // Tốc độ zoom (số càng nhỏ = zoom càng nhanh)
            camera.pinchPrecision = 1; // Tốc độ zoom trên mobile
          }
        } catch (err) {
          // Xử lý lỗi khi tải mô hình
          console.error("❌ Không thể tải GLTF:", err);
        }

        // ===== THIẾT LẬP XỬ LÝ RESIZE =====

        // Xử lý resize window - đảm bảo canvas luôn đúng kích thước
        const handleResize = () => engine.resize();
        window.addEventListener("resize", handleResize);

        // ===== FUNCTION DỌN DẸP =====

        // Function dọn dẹp - dọn dẹp tài nguyên khi component unmount
        engineCleanup = () => {
          window.removeEventListener("resize", handleResize); // Xóa event listener
          scene.dispose(); // Xóa scene và tất cả objects
          engine.dispose(); // Xóa engine và WebGL context
          initializedRef.current = false; // Reset flag
        };
      } catch (error) {
        // Xử lý lỗi khi khởi tạo scene
        console.error("❌ Lỗi khởi tạo scene:", error);
        if (error instanceof Error) {
          console.error("❌ Chi tiết lỗi:", error.message);
          console.error("❌ Stack lỗi:", error.stack);
        }
        initializedRef.current = false;
      }
    };

    // Khởi tạo scene
    initScene();

    // Function dọn dẹp khi component unmount
    return () => {
      if (engineCleanup) engineCleanup();
    };
  }, []); // Mảng dependency rỗng - chỉ chạy 1 lần khi component mount

  // ===== 6. EFFECT CẬP NHẬT VẬT LIỆU PBR =====

  // Effect để cập nhật vật liệu khi các giá trị PBR thay đổi
  useEffect(() => {
    const updateMaterial = async () => {
      if (currentScene) {
        // Tìm mesh theo tên được chọn
        const mesh = currentScene.getMeshByName(selectedMesh);
        if (mesh && mesh.material) {
          // Đang cập nhật vật liệu

          // Chuyển đổi hex color sang Color3 (RGB values 0-1)
          const hex = albedoColor.replace("#", "");
          const r = parseInt(hex.substr(0, 2), 16) / 255; // Thành phần đỏ
          const g = parseInt(hex.substr(2, 2), 16) / 255; // Thành phần xanh lá
          const b = parseInt(hex.substr(4, 2), 16) / 255; // Thành phần xanh dương

          // Import Color3 class
          const { Color3 } = await import("@babylonjs/core");

          // Cập nhật thuộc tính PBR của vật liệu
          mesh.material.metallic = metallic; // Độ kim loại
          mesh.material.roughness = roughness; // Độ nhám
          mesh.material.albedoColor = new Color3(r, g, b); // Màu sắc cơ bản

          // Cập nhật phản xạ môi trường
          if (environmentReflections) {
            mesh.material.environmentIntensity = reflectionIntensity;
            mesh.material.useEnvironmentAsLighting = true;
          }

          // Vật liệu đã được cập nhật thành công!
        } else {
          // Mesh không tìm thấy hoặc không có vật liệu
        }
      }
    };

    // Gọi function cập nhật vật liệu
    updateMaterial();
  }, [
    metallic,
    roughness,
    albedoColor,
    selectedMesh,
    environmentReflections,
    reflectionIntensity,
    currentScene,
  ]); // Dependencies - chạy khi các values này thay đổi

  // ===== 7. EFFECT CẬP NHẬT MÔI TRƯỜNG HDR =====

  // Effect để cập nhật môi trường HDR khi cài đặt thay đổi
  useEffect(() => {
    const updateEnvironment = async () => {
      if (currentScene) {
        try {
          // Import HDR loader
          const { CubeTexture } = await import("@babylonjs/core");

          // Kiểm tra nếu là môi trường tùy chỉnh
          if (
            ["gradient", "studio", "outdoor", "night", "office"].includes(
              environmentType
            )
          ) {
            // Tạo môi trường tùy chỉnh
            const customEnvironment = await createCustomEnvironment(
              currentScene,
              environmentType
            );
            if (customEnvironment) {
              currentScene.environmentTexture = customEnvironment;
              currentScene.environmentIntensity = environmentIntensity;
            }
            // Môi trường tùy chỉnh đã cập nhật
          } else {
            // Sử dụng HDR maps từ Babylon
            let environmentUrl =
              "https://playground.babylonjs.com/textures/room.env";
            switch (environmentType) {
              case "room":
                environmentUrl =
                  "https://playground.babylonjs.com/textures/room.env";
                break;
              default:
                environmentUrl =
                  "https://playground.babylonjs.com/textures/room.env";
            }

            // Tạo environment texture mới
            const environmentTexture = new CubeTexture(
              environmentUrl,
              currentScene
            );

            // Cập nhật scene environment
            currentScene.environmentTexture = environmentTexture;
            currentScene.environmentIntensity = environmentIntensity;

            // Môi trường HDR đã cập nhật
          }
        } catch (error) {
          // Không thể cập nhật môi trường
        }
      }
    };

    updateEnvironment();
  }, [environmentType, environmentIntensity, currentScene]);

  // ===== 8. EFFECT CẬP NHẬT HDR NÂNG CAO =====

  // Effect để cập nhật cài đặt HDR nâng cao
  useEffect(() => {
    const updateAdvanced = async () => {
      if (currentScene) {
        await updateHDRAdvanced(currentScene);
      }
    };

    updateAdvanced();
  }, [hdrExposure, toneMappingEnabled, toneMappingType, currentScene]);

  // ===== 9. EFFECT CẬP NHẬT ĐỘ SÁNG & BÓNG ĐỔ =====

  // Effect để cập nhật cài đặt độ sáng
  useEffect(() => {
    const updateLuminance = async () => {
      if (currentScene) {
        await updateLuminanceSettings(currentScene);
      }
    };

    updateLuminance();
  }, [luminance, gamma, currentScene]);

  // Effect để cập nhật cài đặt bóng đổ
  useEffect(() => {
    const updateShadows = async () => {
      if (currentScene) {
        await setupRealisticShadows(currentScene);
      }
    };

    updateShadows();
  }, [
    shadowQuality,
    softShadows,
    ambientOcclusion,
    contactShadows,
    currentScene,
  ]);

  // ===== 10. EFFECT CHUYỂN ĐỔI TEXTURE =====

  // ===== 11. EFFECT CẬP NHẬT SO SÁNH ÁNH SÁNG =====

  // Effect để cập nhật chế độ mô hình
  useEffect(() => {
    const updateModel = async () => {
      if (currentScene) {
        await setupModelComparison(currentScene);
      }
    };

    updateModel();
  }, [lightingMode, currentScene]);

  // ===== 12. EFFECT LOAD THÊM GHẾ =====

  // Effect để load thêm ghế khi scene sẵn sàng và model đã load xong
  useEffect(() => {
    const loadChair = async () => {
      if (currentScene && !chairLoaded && modelFullyLoaded && availableMeshes.length > 0) {
        console.log("🚀 Bắt đầu load ghế mới sau khi model đã load xong hoàn toàn...");
        console.log("📋 Số meshes có sẵn:", availableMeshes.length);
        console.log("📋 Meshes có sẵn:", availableMeshes);
        console.log("✅ Model đã load xong:", modelFullyLoaded);
        
        // Đợi thêm một chút để đảm bảo tất cả transform đã được áp dụng
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await loadAdditionalChair(currentScene);
      }
    };

    loadChair();
  }, [currentScene, chairLoaded, modelFullyLoaded, availableMeshes]);



  // ===== 13. RENDER UI =====

  // Render canvas element và UI controls
  return (
    <div className="relative w-full h-full">
      {/* Canvas element cho Babylon.js */}
      <canvas
        ref={canvasRef} // Gắn ref để lấy DOM element
        style={{
          width: "100%", // Chiếm toàn bộ width của parent
          height: "100%", // Chiếm toàn bộ height của parent
          display: "block", // Hiển thị dạng block
        }}
      />

      {/* Panel Điều Khiển - Sử dụng các component tách biệt */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg w-[300px] overflow-y-auto h-[90%]">
        {/* PBR Materials Component */}
        <PBRMaterials
          scene={currentScene}
          selectedMesh={selectedMesh}
          setSelectedMesh={setSelectedMesh}
          availableMeshes={availableMeshes}
          meshInfo={meshInfo}
          metallic={metallic}
          setMetallic={setMetallic}
          roughness={roughness}
          setRoughness={setRoughness}
          albedoColor={albedoColor}
          setAlbedoColor={setAlbedoColor}
        />

        {/* HDR Lighting Component */}
        <HDRLighting
          scene={currentScene}
          environmentType={environmentType}
          setEnvironmentType={setEnvironmentType}
          environmentIntensity={environmentIntensity}
          setEnvironmentIntensity={setEnvironmentIntensity}
          hdrExposure={hdrExposure}
          setHdrExposure={setHdrExposure}
          toneMappingEnabled={toneMappingEnabled}
          setToneMappingEnabled={setToneMappingEnabled}
          toneMappingType={toneMappingType}
          setToneMappingType={setToneMappingType}
          environmentReflections={environmentReflections}
          setEnvironmentReflections={setEnvironmentReflections}
          reflectionIntensity={reflectionIntensity}
          setReflectionIntensity={setReflectionIntensity}
        />

        {/* Luminance & Shadows Component */}
        <LuminanceShadows
          scene={currentScene}
          luminance={luminance}
          setLuminance={setLuminance}
          gamma={gamma}
          setGamma={setGamma}
          shadowQuality={shadowQuality}
          setShadowQuality={setShadowQuality}
          softShadows={softShadows}
          setSoftShadows={setSoftShadows}
          ambientOcclusion={ambientOcclusion}
          setAmbientOcclusion={setAmbientOcclusion}
          contactShadows={contactShadows}
          setContactShadows={setContactShadows}
        />

        {/* Model Comparison Component */}
        <ModelComparison
          scene={currentScene}
          lightingMode={lightingMode}
          setLightingMode={setLightingMode}
        />

        {/* Simple Chair Load Button */}
        <div className="mb-4 border-t border-gray-600 pt-4">
          <h4 className="text-md font-semibold mb-3">🪑 Ghế Thêm</h4>
          
          <button
            onClick={() => {
              setChairLoaded(false);
              if (currentScene) {
                loadAdditionalChair(currentScene);
              }
            }}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
          >
            {chairLoaded ? "🔄 Load Lại Ghế" : "➕ Load Thêm Ghế"}
          </button>
          
          <div className="mt-2 text-xs text-gray-400">
            Ghế mới sẽ được đặt ở vị trí gần camera ban đầu
          </div>
          
          <button
            onClick={() => {
              if (currentScene) {
                const camera = currentScene.activeCamera;
                if (camera) {
                  console.log("🔍 Debug vị trí camera và ghế:");
                  console.log("📷 Camera position:", camera.position);
                  console.log("📷 Camera target:", camera.target);
                  
                  const newChair = currentScene.meshes.find((m: any) => 
                    m.name.includes("Chair") && 
                    !m.name.includes("chair2") &&
                    !m.name.includes("primitive")
                  );
                  
                  if (newChair) {
                    console.log("🎯 Ghế mới position:", newChair.position);
                    console.log("🎯 Ghế mới world position:", newChair.getAbsolutePosition());
                  } else {
                    console.log("❌ Không tìm thấy ghế mới");
                  }
                } else {
                  console.log("❌ Không tìm thấy camera");
                }
              }
            }}
            className="w-full mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium"
          >
            🔍 Debug Vị Trí
          </button>
          
          <button
            onClick={() => {
              if (currentScene) {
                const newChair = currentScene.meshes.find((m: any) => 
                  m.name.includes("Chair") && 
                  !m.name.includes("chair2") &&
                  !m.name.includes("primitive")
                );
                
                if (newChair) {
                  const { Vector3 } = require("@babylonjs/core");
                  
                  // Test các vị trí khác nhau
                  const testPositions = [
                    new Vector3(0, 0, 0), // Trung tâm
                    new Vector3(2, 0, 0), // Bên phải
                    new Vector3(-2, 0, 0), // Bên trái
                    new Vector3(0, 0, 2), // Phía trước
                    new Vector3(0, 0, -2), // Phía sau
                    new Vector3(2, 0, 2), // Góc phải trước
                    new Vector3(-2, 0, 2), // Góc trái trước
                  ];
                  
                  const testIndex = Math.floor(Math.random() * testPositions.length);
                  const testPosition = testPositions[testIndex];
                  
                  newChair.position = testPosition;
                  newChair.isVisible = true;
                  newChair.setEnabled(true);
                  console.log(`🧪 Test vị trí ${testIndex + 1}:`, testPosition);
                } else {
                  console.log("❌ Không tìm thấy ghế mới để test");
                }
              }
            }}
            className="w-full mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
          >
            🧪 Test Vị Trí Khác
          </button>
        </div>
      </div>
    </div>
  );
}
