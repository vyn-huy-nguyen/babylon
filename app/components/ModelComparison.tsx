import React, { useState, useEffect } from "react";

/**
 * Component Model Comparison - So Sánh Mô Hình Gốc vs Thời Gian Thực
 */

interface ModelComparisonProps {
  scene: any;
  lightingMode: string;
  setLightingMode: (mode: string) => void;
}

export default function ModelComparison({
  scene,
  lightingMode,
  setLightingMode
}: ModelComparisonProps) {


  // Effect cập nhật chế độ mô hình
  useEffect(() => {
    const updateModel = async () => {
      if (!scene) return;
      await setupModelComparison(scene);
    };

    updateModel();
  }, [lightingMode, scene]);

  // Hàm thiết lập so sánh mô hình
  const setupModelComparison = async (scene: any) => {
    try {
      const { HemisphericLight, Vector3, Color3, StandardMaterial, Texture } = await import("@babylonjs/core");

      if (lightingMode === "original") {
        // ===== THIẾT LẬP MÔ HÌNH GỐC =====

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
        const { CubeTexture } = await import("@babylonjs/core");
        const environmentTexture = new CubeTexture(
          "https://playground.babylonjs.com/textures/room.env",
          scene
        );
        scene.environmentTexture = environmentTexture;
        scene.environmentIntensity = 0.5;

        // Chế độ tăng cường thời gian thực - thiết lập ánh sáng đầy đủ
      }
    } catch (error) {
      console.error("❌ Failed to setup model comparison:", error);
    }
  };

  // Hàm thiết lập bóng đổ thực tế (đơn giản hóa)
  const setupRealisticShadows = async (scene: any) => {
    try {
      const { ShadowGenerator, DirectionalLight, Vector3, Color3 } = await import("@babylonjs/core");

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
      shadowGenerator.useBlurExponentialShadowMap = true;
      shadowGenerator.blurKernel = 16;

      // Áp dụng shadows cho tất cả meshes
      scene.meshes.forEach((mesh: any) => {
        if (mesh.name !== "__root__") {
          shadowGenerator.addShadowCaster(mesh, true);
          mesh.receiveShadows = true;
        }
      });

      // Realistic shadows setup completed
    } catch (error) {
      console.error("❌ Failed to setup realistic shadows:", error);
    }
  };



  return (
    <div className="mb-4 border-t border-gray-600 pt-4">
      <h4 className="text-md font-semibold mb-3">🎨 So Sánh Mô Hình</h4>

      {/* Model Mode Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Chế Độ Mô Hình</label>
        <select
          value={lightingMode}
          onChange={(e) => setLightingMode(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
        >
          <option value="original">Mô Hình Gốc</option>
          <option value="realtime">Tăng Cường Thời Gian Thực</option>
        </select>
      </div>

      {/* Comparison Info */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h5 className="text-sm font-medium mb-2">Chi Tiết So Sánh:</h5>
        <div className="text-xs space-y-1">
          <div>
            <strong>Gốc:</strong> Mô hình gốc với ánh sáng cơ bản (đủ sáng)
          </div>
          <div>
            <strong>Thời gian thực:</strong> Ánh sáng HDR + điều khiển PBR + bóng đổ
          </div>
        </div>
      </div>

      {/* Performance Info */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h5 className="text-sm font-medium mb-2">Hiệu Suất:</h5>
        <div className="text-xs space-y-1">
          <div>
            <strong>Gốc:</strong> ⚡⚡⚡⚡⚡ (Nhanh)
          </div>
          <div>
            <strong>Thời gian thực:</strong> ⚡⚡⚡ (Trung bình)
          </div>
        </div>
      </div>

      {/* Quality Info */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h5 className="text-sm font-medium mb-2">Chất Lượng:</h5>
        <div className="text-xs space-y-1">
          <div>
            <strong>Gốc:</strong> 🟡 Trung bình (Ánh sáng cơ bản, có thể nhìn thấy)
          </div>
          <div>
            <strong>Thời gian thực:</strong> 🟢 Cao (Ánh sáng nâng cao)
          </div>
        </div>
      </div>



      {/* Current Mode Display */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h5 className="text-sm font-medium mb-2">Chế Độ Hiện Tại:</h5>
        <div className="text-xs">
          <div className={`font-bold ${lightingMode === "original" ? "text-yellow-400" : "text-green-400"}`}>
            {lightingMode === "original" ? "🎯 Mô Hình Gốc" : "⚡ Tăng Cường Thời Gian Thực"}
          </div>
          <div className="text-gray-400 mt-1">
            {lightingMode === "original" 
              ? "Sử dụng ánh sáng cơ bản để hiển thị mô hình gốc"
              : "Sử dụng ánh sáng HDR, PBR và bóng đổ nâng cao"
            }
          </div>
        </div>
      </div>
    </div>
  );
}
