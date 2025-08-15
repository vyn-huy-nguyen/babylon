import React, { useState, useEffect } from "react";

/**
 * Component Luminance & Shadows - Quản Lý Độ Sáng và Bóng Đổ
 */

interface LuminanceShadowsProps {
  scene: any;
  luminance: number;
  setLuminance: (value: number) => void;
  gamma: number;
  setGamma: (value: number) => void;
  shadowQuality: string;
  setShadowQuality: (quality: string) => void;
  softShadows: boolean;
  setSoftShadows: (enabled: boolean) => void;
  ambientOcclusion: boolean;
  setAmbientOcclusion: (enabled: boolean) => void;
  contactShadows: boolean;
  setContactShadows: (enabled: boolean) => void;
}

export default function LuminanceShadows({
  scene,
  luminance,
  setLuminance,
  gamma,
  setGamma,
  shadowQuality,
  setShadowQuality,
  softShadows,
  setSoftShadows,
  ambientOcclusion,
  setAmbientOcclusion,
  contactShadows,
  setContactShadows
}: LuminanceShadowsProps) {
  // Effect cập nhật luminance settings
  useEffect(() => {
    const updateLuminance = async () => {
      if (!scene) return;
      await updateLuminanceSettings(scene);
    };

    updateLuminance();
  }, [luminance, gamma, scene]);

  // Effect cập nhật shadow settings
  useEffect(() => {
    const updateShadows = async () => {
      if (!scene) return;
      await setupRealisticShadows(scene);
    };

    updateShadows();
  }, [shadowQuality, softShadows, ambientOcclusion, contactShadows, scene]);

  // Hàm cập nhật cài đặt độ sáng
  const updateLuminanceSettings = async (scene: any) => {
    try {
      const { ImageProcessingConfiguration } = await import("@babylonjs/core");

      if (!scene.imageProcessingConfiguration) {
        scene.imageProcessingConfiguration = new ImageProcessingConfiguration();
      }

      // Cập nhật độ sáng
      scene.imageProcessingConfiguration.luminance = luminance;

      // Cập nhật gamma
      scene.imageProcessingConfiguration.gamma = gamma;

      // Cập nhật độ tương phản
      scene.imageProcessingConfiguration.contrast =
        1.0 + (luminance - 1.0) * 0.5;

      // Độ sáng đã cập nhật
    } catch (error) {
      console.error("❌ Failed to setup luminance:", error);
    }
  };

  // Hàm thiết lập bóng đổ thực tế
  const setupRealisticShadows = async (scene: any) => {
    try {
      const { ShadowGenerator, DirectionalLight, PointLight, Vector3, Color3 } = await import("@babylonjs/core");

      // Xóa shadow generators cũ
      scene.shadowGenerators.forEach((generator: any) => {
        generator.dispose();
      });

      // Tạo directional light cho shadows
      const shadowLight = new DirectionalLight(
        "shadowLight",
        new Vector3(-1, -2, -1),
        scene
      );
      shadowLight.intensity = 0.3;
      shadowLight.diffuse = new Color3(1, 1, 1);

      // Tạo shadow generator
      const shadowGenerator = new ShadowGenerator(1024, shadowLight);
      
      // Cấu hình shadow quality
      switch (shadowQuality) {
        case "low":
          shadowGenerator.useBlurExponentialShadowMap = false;
          shadowGenerator.blurKernel = 1;
          break;
        case "medium":
          shadowGenerator.useBlurExponentialShadowMap = softShadows;
          shadowGenerator.blurKernel = softShadows ? 16 : 1;
          break;
        case "high":
          shadowGenerator.useBlurExponentialShadowMap = softShadows;
          shadowGenerator.blurKernel = softShadows ? 32 : 1;
          break;
        case "ultra":
          shadowGenerator.useBlurExponentialShadowMap = softShadows;
          shadowGenerator.blurKernel = softShadows ? 64 : 1;
          break;
      }

      // Áp dụng shadows cho tất cả meshes
      scene.meshes.forEach((mesh: any) => {
        if (mesh.name !== "__root__") {
          shadowGenerator.addShadowCaster(mesh, true);
          mesh.receiveShadows = true;
        }
      });

      // Lưu shadow generator vào scene
      (scene as any).mainShadowGenerator = shadowGenerator;

      // Thiết lập ambient occlusion
      if (ambientOcclusion) {
        scene.ambientOcclusion = true;
        scene.ambientOcclusionIntensity = 0.3;
      } else {
        scene.ambientOcclusion = false;
      }

      // Thiết lập contact shadows
      if (contactShadows) {
        // Tạo point lights gần mặt đất để mô phỏng contact shadows
        const contactLight1 = new PointLight(
          "contactLight1",
          new Vector3(0, 0.1, 0),
          scene
        );
        contactLight1.intensity = 0.1;
        contactLight1.range = 2;

        const contactLight2 = new PointLight(
          "contactLight2",
          new Vector3(2, 0.1, 2),
          scene
        );
        contactLight2.intensity = 0.05;
        contactLight2.range = 1.5;
      }

      // Realistic shadows setup completed
    } catch (error) {
      console.error("❌ Failed to setup realistic shadows:", error);
    }
  };

  return (
    <div className="mb-4 border-t border-gray-600 pt-4">
      <h4 className="text-md font-semibold mb-3">🌓 Độ Sáng & Bóng Đổ</h4>

      {/* Luminance Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Độ Sáng: {luminance.toFixed(2)}
        </label>
        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.1"
          value={luminance}
          onChange={(e) => setLuminance(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0.1 (Tối)</span>
          <span>1.0 (Bình Thường)</span>
          <span>3.0 (Sáng)</span>
        </div>
      </div>

      {/* Gamma Correction Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Gamma: {gamma.toFixed(1)}
        </label>
        <input
          type="range"
          min="1.0"
          max="3.0"
          step="0.1"
          value={gamma}
          onChange={(e) => setGamma(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1.0 (Tuyến Tính)</span>
          <span>2.2 (Tiêu Chuẩn)</span>
          <span>3.0 (Cao)</span>
        </div>
      </div>

      {/* Shadow Quality Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Chất Lượng Bóng Đổ
        </label>
        <select
          value={shadowQuality}
          onChange={(e) => setShadowQuality(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
        >
          <option value="low">Thấp (Nhanh)</option>
          <option value="medium">Trung Bình (Cân Bằng)</option>
          <option value="high">Cao (Chất Lượng)</option>
          <option value="ultra">Siêu Cao (Tốt Nhất)</option>
        </select>
      </div>

      {/* Shadow Features Toggles */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={softShadows}
            onChange={(e) => setSoftShadows(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">Bóng Đổ Mềm</span>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={ambientOcclusion}
            onChange={(e) => setAmbientOcclusion(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">Che Khuất Môi Trường</span>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={contactShadows}
            onChange={(e) => setContactShadows(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">Bóng Đổ Tiếp Xúc</span>
        </div>
      </div>

      {/* Shadow Info */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h5 className="text-sm font-medium mb-2">Thông Tin Bóng Đổ:</h5>
        <div className="text-xs space-y-1">
          <div><strong>Chất lượng:</strong> {shadowQuality}</div>
          <div><strong>Bóng mềm:</strong> {softShadows ? "Bật" : "Tắt"}</div>
          <div><strong>Che khuất:</strong> {ambientOcclusion ? "Bật" : "Tắt"}</div>
          <div><strong>Tiếp xúc:</strong> {contactShadows ? "Bật" : "Tắt"}</div>
        </div>
      </div>

      {/* Performance Info */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h5 className="text-sm font-medium mb-2">Hiệu Suất:</h5>
        <div className="text-xs space-y-1">
          <div><strong>Thấp:</strong> ⚡⚡⚡⚡⚡ (Nhanh nhất)</div>
          <div><strong>Trung bình:</strong> ⚡⚡⚡⚡ (Cân bằng)</div>
          <div><strong>Cao:</strong> ⚡⚡⚡ (Chất lượng tốt)</div>
          <div><strong>Siêu cao:</strong> ⚡⚡ (Tốt nhất)</div>
        </div>
      </div>
    </div>
  );
}
