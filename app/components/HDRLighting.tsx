import React, { useState, useEffect } from "react";

/**
 * Component HDR Lighting Environment - Quản Lý Môi Trường HDR
 */

interface HDRLightingProps {
  scene: any;
  environmentType: string;
  setEnvironmentType: (type: string) => void;
  environmentIntensity: number;
  setEnvironmentIntensity: (intensity: number) => void;
  hdrExposure: number;
  setHdrExposure: (exposure: number) => void;
  toneMappingEnabled: boolean;
  setToneMappingEnabled: (enabled: boolean) => void;
  toneMappingType: string;
  setToneMappingType: (type: string) => void;
  environmentReflections: boolean;
  setEnvironmentReflections: (enabled: boolean) => void;
  reflectionIntensity: number;
  setReflectionIntensity: (intensity: number) => void;
}

export default function HDRLighting({
  scene,
  environmentType,
  setEnvironmentType,
  environmentIntensity,
  setEnvironmentIntensity,
  hdrExposure,
  setHdrExposure,
  toneMappingEnabled,
  setToneMappingEnabled,
  toneMappingType,
  setToneMappingType,
  environmentReflections,
  setEnvironmentReflections,
  reflectionIntensity,
  setReflectionIntensity
}: HDRLightingProps) {
  // Effect cập nhật môi trường HDR
  useEffect(() => {
    const updateEnvironment = async () => {
      if (!scene) return;
      
      try {
        const { CubeTexture } = await import("@babylonjs/core");

        // Kiểm tra nếu là môi trường tùy chỉnh
        if (["gradient", "studio", "outdoor", "night", "office"].includes(environmentType)) {
          const customEnvironment = await createCustomEnvironment(scene, environmentType);
          if (customEnvironment) {
            scene.environmentTexture = customEnvironment;
            scene.environmentIntensity = environmentIntensity;
          }
          // Môi trường tùy chỉnh đã cập nhật
        } else {
          // Sử dụng HDR maps từ Babylon
          let environmentUrl = "https://playground.babylonjs.com/textures/room.env";
          switch (environmentType) {
            case "room":
              environmentUrl = "https://playground.babylonjs.com/textures/room.env";
              break;
            default:
              environmentUrl = "https://playground.babylonjs.com/textures/room.env";
          }

          const environmentTexture = new CubeTexture(environmentUrl, scene);
          scene.environmentTexture = environmentTexture;
          scene.environmentIntensity = environmentIntensity;

          // Môi trường HDR đã cập nhật
        }
      } catch (error) {
        // Không thể cập nhật môi trường
      }
    };

    updateEnvironment();
  }, [environmentType, environmentIntensity, scene]);

  // Effect cập nhật HDR advanced settings
  useEffect(() => {
    const updateAdvanced = async () => {
      if (!scene) return;
      await updateHDRAdvanced(scene);
    };

    updateAdvanced();
  }, [hdrExposure, toneMappingEnabled, toneMappingType, scene]);

  // Hàm tạo môi trường tùy chỉnh
  const createCustomEnvironment = async (scene: any, type: string) => {
    try {
      const { CubeTexture, HemisphericLight, DirectionalLight, PointLight, Vector3, Color3 } = await import("@babylonjs/core");

      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (!ctx) return null;

      switch (type) {
        case "gradient":
          // Gradient từ bầu trời đến mặt đất
          const gradient = ctx.createLinearGradient(0, 0, 0, size);
          gradient.addColorStop(0, "#87CEEB"); // Bầu trời xanh
          gradient.addColorStop(0.5, "#E0F6FF"); // Bầu trời nhạt
          gradient.addColorStop(1, "#8B4513"); // Mặt đất nâu
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, size, size);
          break;

        case "studio":
          // Studio lighting với gradient trắng
          const studioGradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
          studioGradient.addColorStop(0, "#FFFFFF"); // Trung tâm sáng
          studioGradient.addColorStop(0.7, "#F0F0F0"); // Giữa
          studioGradient.addColorStop(1, "#E0E0E0"); // Viền
          ctx.fillStyle = studioGradient;
          ctx.fillRect(0, 0, size, size);
          break;

        case "outdoor":
          // Outdoor với ánh sáng mặt trời
          const outdoorGradient = ctx.createLinearGradient(0, 0, 0, size);
          outdoorGradient.addColorStop(0, "#FFD700"); // Mặt trời vàng
          outdoorGradient.addColorStop(0.3, "#87CEEB"); // Bầu trời xanh
          outdoorGradient.addColorStop(0.7, "#98FB98"); // Cây xanh
          outdoorGradient.addColorStop(1, "#8B4513"); // Mặt đất
          ctx.fillStyle = outdoorGradient;
          ctx.fillRect(0, 0, size, size);
          break;

        case "night":
          // Đêm với trăng và sao
          ctx.fillStyle = "#000033"; // Bầu trời đêm
          ctx.fillRect(0, 0, size, size);
          
          // Vẽ trăng
          ctx.fillStyle = "#FFFFF0";
          ctx.beginPath();
          ctx.arc(size * 0.8, size * 0.2, 30, 0, 2 * Math.PI);
          ctx.fill();
          
          // Vẽ sao
          for (let i = 0; i < 50; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size * 0.6;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(x, y, 2, 2);
          }
          break;

        case "office":
          // Văn phòng với ánh sáng huỳnh quang
          ctx.fillStyle = "#F5F5F5"; // Tường trắng
          ctx.fillRect(0, 0, size, size);
          
          // Vẽ đèn huỳnh quang
          for (let i = 0; i < 3; i++) {
            const x = size * 0.2 + i * size * 0.3;
            const y = size * 0.1;
            ctx.fillStyle = "#FFFFE0";
            ctx.fillRect(x, y, 60, 20);
          }
          break;
      }

      const texture = new CubeTexture("", scene);
      texture.updateURL(canvas.toDataURL());
      return texture;
    } catch (error) {
      console.error("❌ Failed to create custom environment:", error);
      return null;
    }
  };

  // Hàm cập nhật HDR advanced settings
  const updateHDRAdvanced = async (scene: any) => {
    try {
      const { ImageProcessingConfiguration } = await import("@babylonjs/core");

      if (!scene.imageProcessingConfiguration) {
        scene.imageProcessingConfiguration = new ImageProcessingConfiguration();
      }

      // Cập nhật exposure
      scene.imageProcessingConfiguration.exposure = hdrExposure;

      // Cập nhật tone mapping
      if (toneMappingEnabled) {
        scene.imageProcessingConfiguration.toneMappingEnabled = true;
        scene.imageProcessingConfiguration.toneMappingType = 
          toneMappingType === "ACES" ? ImageProcessingConfiguration.TONEMAPPING_ACES : ImageProcessingConfiguration.TONEMAPPING_STANDARD;
      } else {
        scene.imageProcessingConfiguration.toneMappingEnabled = false;
      }

      // HDR advanced settings updated
    } catch (error) {
      console.error("❌ Failed to update HDR advanced settings:", error);
    }
  };

  return (
    <div className="mb-4 border-t border-gray-600 pt-4">
      <h4 className="text-md font-semibold mb-3">🌟 Môi Trường HDR</h4>

      {/* Environment Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Loại Môi Trường</label>
        <select
          value={environmentType}
          onChange={(e) => setEnvironmentType(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
        >
          <optgroup label="🌐 Bản Đồ HDR">
            <option value="room">🏠 Phòng (Trong Nhà)</option>
          </optgroup>
          <optgroup label="🎨 Môi Trường Tùy Chỉnh">
            <option value="gradient">🌈 Gradient (Bầu Trời đến Mặt Đất)</option>
            <option value="studio">🎬 Studio (Ánh Sáng Chuyên Nghiệp)</option>
            <option value="outdoor">🌳 Ngoài Trời (Ánh Sáng Tự Nhiên)</option>
            <option value="night">🌙 Đêm (Trăng & Đèn Đường)</option>
            <option value="office">🏢 Văn Phòng (Huỳnh Quang & Tự Nhiên)</option>
          </optgroup>
        </select>
      </div>

      {/* Environment Intensity Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Cường Độ Môi Trường: {environmentIntensity.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={environmentIntensity}
          onChange={(e) => setEnvironmentIntensity(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0 (Tối)</span>
          <span>1 (Bình Thường)</span>
          <span>2 (Sáng)</span>
        </div>
      </div>

      {/* HDR Advanced Controls */}
      <div className="mb-4 border-t border-gray-600 pt-4">
        <h5 className="text-md font-semibold mb-3">🎛️ HDR Nâng Cao</h5>

        {/* HDR Exposure Control */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Độ Phơi Sáng HDR: {hdrExposure.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="4"
            step="0.1"
            value={hdrExposure}
            onChange={(e) => setHdrExposure(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 (Tối)</span>
            <span>1 (Bình Thường)</span>
            <span>4 (Sáng)</span>
          </div>
        </div>

        {/* Tone Mapping Control */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Tone Mapping</label>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={toneMappingEnabled}
              onChange={(e) => setToneMappingEnabled(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Bật Tone Mapping</span>
          </div>
          <select
            value={toneMappingType}
            onChange={(e) => setToneMappingType(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
            disabled={!toneMappingEnabled}
          >
            <option value="ACES">ACES (Tiêu Chuẩn Phim)</option>
            <option value="Standard">Tiêu Chuẩn</option>
          </select>
        </div>

        {/* Environment Reflections Control */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Phản Xạ Môi Trường</label>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={environmentReflections}
              onChange={(e) => setEnvironmentReflections(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Bật Phản Xạ</span>
          </div>
          <label className="block text-sm font-medium mb-2">
            Cường Độ Phản Xạ: {reflectionIntensity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={reflectionIntensity}
            onChange={(e) => setReflectionIntensity(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            disabled={!environmentReflections}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 (Không)</span>
            <span>1 (Bình Thường)</span>
            <span>2 (Mạnh)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
