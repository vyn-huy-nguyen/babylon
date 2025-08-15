import React, { useState, useEffect } from "react";

/**
 * Component PBR Materials - Quản Lý Vật Liệu PBR
 */

interface PBRMaterialsProps {
  scene: any;
  selectedMesh: string;
  setSelectedMesh: (mesh: string) => void;
  availableMeshes: string[];
  meshInfo: string;
  metallic: number;
  setMetallic: (value: number) => void;
  roughness: number;
  setRoughness: (value: number) => void;
  albedoColor: string;
  setAlbedoColor: (color: string) => void;
}

export default function PBRMaterials({
  scene,
  selectedMesh,
  setSelectedMesh,
  availableMeshes,
  meshInfo,
  metallic,
  setMetallic,
  roughness,
  setRoughness,
  albedoColor,
  setAlbedoColor
}: PBRMaterialsProps) {
  // State cho preset textures
  const [presetTextures] = useState({
    wood: "MF049.jpg",
    metal: "MF042.jpg",
    plastic: "MF045.jpg",
    leather: "MF0022.jpg",
    fabric: "MFMF000722.jpg",
  });
  const [currentPresetTexture, setCurrentPresetTexture] = useState("");
  const [textureLoadingStatus, setTextureLoadingStatus] = useState("");

  // Effect cập nhật material
  useEffect(() => {
    const updateMaterial = async () => {
      if (!scene) return;
      
      const mesh = scene.getMeshByName(selectedMesh);
      if (mesh && mesh.material) {
        const hex = albedoColor.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        const { Color3 } = await import("@babylonjs/core");

        mesh.material.metallic = metallic;
        mesh.material.roughness = roughness;
        mesh.material.albedoColor = new Color3(r, g, b);

        // Vật liệu đã được cập nhật thành công!
      }
    };

    updateMaterial();
  }, [metallic, roughness, albedoColor, selectedMesh, scene]);

  // Hàm load preset texture
  const loadPresetTexture = async (scene: any, presetType: string) => {
    try {
      const { Texture } = await import("@babylonjs/core");
      const textureFileName = presetTextures[presetType as keyof typeof presetTextures];
      
      if (!textureFileName) return false;

      const texturePath = `/assets/interior/${textureFileName}`;
      const texture = new Texture(texturePath, scene);

      setTextureLoadingStatus(`Loading ${textureFileName}...`);

      texture.onLoadObservable.add(() => {
        setTextureLoadingStatus(`✅ Loaded: ${textureFileName}`);
        setCurrentPresetTexture(textureFileName);
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mesh = scene.getMeshByName(selectedMesh);
      if (mesh && mesh.material) {
        mesh.material.albedoTexture = texture;

        // Cập nhật PBR properties
        switch (presetType) {
          case "wood":
            setMetallic(0.0);
            setRoughness(0.8);
            setAlbedoColor("#8B4513");
            break;
          case "metal":
            setMetallic(1.0);
            setRoughness(0.1);
            setAlbedoColor("#C0C0C0");
            break;
          case "plastic":
            setMetallic(0.0);
            setRoughness(0.3);
            setAlbedoColor("#228B22");
            break;
          case "leather":
            setMetallic(0.0);
            setRoughness(0.9);
            setAlbedoColor("#654321");
            break;
          case "fabric":
            setMetallic(0.0);
            setRoughness(0.7);
            setAlbedoColor("#4682B4");
            break;
        }

        return true;
      }
      return false;
    } catch (error) {
      setTextureLoadingStatus(`❌ Error loading texture`);
      return false;
    }
  };

  const applyPresetWithTexture = async (scene: any, presetType: string) => {
    if (!scene) return;
    await loadPresetTexture(scene, presetType);
  };

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-4">🎨 Điều Khiển Vật Liệu PBR</h3>

      {/* Mesh Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Chọn Mesh</label>
        <select
          value={selectedMesh}
          onChange={(e) => setSelectedMesh(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
        >
          {availableMeshes.map((meshName) => (
            <option key={meshName} value={meshName}>
              {meshName}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-400 mt-1">{meshInfo}</div>
      </div>

      {/* Metallic Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Độ Kim Loại: {metallic.toFixed(2)}
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
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0 (Không kim loại)</span>
          <span>1 (Kim loại)</span>
        </div>
      </div>

      {/* Roughness Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Độ Nhám: {roughness.toFixed(2)}
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
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0 (Mịn)</span>
          <span>1 (Nhám)</span>
        </div>
      </div>

      {/* Albedo Color Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Màu Albedo</label>
        <input
          type="color"
          value={albedoColor}
          onChange={(e) => setAlbedoColor(e.target.value)}
          className="w-full h-10 rounded border-2 border-gray-600 cursor-pointer"
        />
      </div>

      {/* Preset Materials */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Mẫu với Textures</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => applyPresetWithTexture(scene, "wood")}
            className="px-3 py-1 bg-yellow-800 hover:bg-yellow-900 rounded text-xs"
          >
            Gỗ + Texture
          </button>
          <button
            onClick={() => applyPresetWithTexture(scene, "metal")}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
          >
            Kim Loại + Texture
          </button>
          <button
            onClick={() => applyPresetWithTexture(scene, "plastic")}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
          >
            Nhựa + Texture
          </button>
          <button
            onClick={() => applyPresetWithTexture(scene, "leather")}
            className="px-3 py-1 bg-brown-800 hover:bg-brown-900 rounded text-xs"
          >
            Da + Texture
          </button>
          <button
            onClick={() => applyPresetWithTexture(scene, "fabric")}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs col-span-2"
          >
            Vải + Texture
          </button>
        </div>

        {/* Texture Status */}
        {textureLoadingStatus && (
          <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
            <div className="font-medium">Trạng Thái Texture:</div>
            <div
              className={
                textureLoadingStatus.includes("✅")
                  ? "text-green-400"
                  : textureLoadingStatus.includes("❌")
                  ? "text-red-400"
                  : "text-yellow-400"
              }
            >
              {textureLoadingStatus}
            </div>
          </div>
        )}

        {currentPresetTexture && (
          <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
            <div className="font-medium">Texture Hiện Tại:</div>
            <div className="text-blue-400">{currentPresetTexture}</div>
          </div>
        )}
      </div>


    </div>
  );
}
