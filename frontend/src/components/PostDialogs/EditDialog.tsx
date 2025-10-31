import { useState, useEffect, useCallback, useMemo } from "react";
import { FiX } from "react-icons/fi";
import {
  LuFlipHorizontal,
  LuRotateCw,
  LuRectangleHorizontal,
  LuRectangleVertical,
  LuSquare,
} from "react-icons/lu";
import Cropper from "react-easy-crop";
import { Point, Area } from "react-easy-crop/types";

interface MediaFileWithAlt {
  file: File;
  alt?: string;
}

interface EditDialogProps {
  file: MediaFileWithAlt;
  onClose: () => void;
  onSave: (updated: MediaFileWithAlt) => void;
}

// Removed redundant CropPixels interface; use Area directly

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const rotRad = (rotation * Math.PI) / 180;

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);

  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);

  ctx.rotate(rotRad);

  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(data, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
};

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = (Math.abs(rotation) * Math.PI) / 180;
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

const filterMap: Record<string, string> = {
  none: "none",
  grayscale: "grayscale(100%)",
  sepia: "sepia(100%)",
  contrast: "contrast(120%)",
  brightness: "brightness(110%)",
};

interface AspectRatio {
  label: string;
  value: number | null;
  icon: React.ElementType;
}

const aspectRatios: AspectRatio[] = [
  { label: "Original", value: null, icon: LuRectangleHorizontal },
  { label: "Square", value: 1 / 1, icon: LuSquare },
  { label: "4:1", value: 4 / 1, icon: LuRectangleHorizontal },
  { label: "3:4", value: 3 / 4, icon: LuRectangleVertical },
  { label: "16:9", value: 16 / 9, icon: LuRectangleHorizontal },
];

const EditDialog = ({ file, onClose, onSave }: EditDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"crop" | "filter" | "adjust">(
    "crop"
  );

  const [cropPixels, setCropPixels] = useState<Area | null>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [originalAspect, setOriginalAspect] = useState<number | null>(null);
  const [lockedAspect, setLockedAspect] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filter, setFilter] = useState("none");

  const isImage = file.file.type.startsWith("image");

  useEffect(() => {
    const url = URL.createObjectURL(file.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!isImage || !previewUrl) return;
    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const aspect = img.width / img.height;
      setOriginalAspect(aspect);

      setLockedAspect(aspect);
    };
  }, [previewUrl, isImage]);

  const cropperAspect = useMemo(() => {
    return lockedAspect ?? originalAspect;
  }, [lockedAspect, originalAspect]);

  const combinedFilter = useMemo(() => {
    const base = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    return filter === "none" ? base : `${filterMap[filter]} ${base}`;
  }, [filter, brightness, contrast, saturation]);

  const handleApply = useCallback(async () => {
    if (!isImage) {
      onSave(file);
      return;
    }

    try {
      if (!cropPixels) return;
      const croppedBlob = await getCroppedImg(
        previewUrl,
        cropPixels,
        rotation,
        { horizontal: isFlipped, vertical: false }
      );

      if (!croppedBlob) return;

      const croppedUrl = URL.createObjectURL(croppedBlob);
      const img = new Image();
      img.src = croppedUrl;
      await img.decode();

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.filter = combinedFilter;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((finalBlob) => {
        if (!finalBlob) return;
        const newFile = new File([finalBlob], file.file.name, {
          type: finalBlob.type,
        });
        onSave({ ...file, file: newFile });
        URL.revokeObjectURL(croppedUrl);
      }, croppedBlob.type);
    } catch (e) {
      console.error("Error applying changes:", e);
    }
  }, [
    file,
    previewUrl,
    cropPixels,
    rotation,
    isFlipped,
    combinedFilter,
    isImage,
    onSave,
  ]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const renderSlider = useCallback(
    (
      label: string,
      value: number,
      onChange: (v: number) => void,
      min = 50,
      max = 150,
      step = 1
    ) => (
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-600">{label}</label>
        <input
          aria-label={label}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>
    ),
    []
  );

  const renderAspectButton = (aspect: AspectRatio) => {
    const Icon = aspect.icon;
    const isActive =
      lockedAspect === (aspect.value ?? originalAspect) ||
      (aspect.value === null && lockedAspect === originalAspect);

    const handleClick = () => {
      setLockedAspect(aspect.value ?? originalAspect);
    };

    return (
      <button
        key={aspect.label}
        onClick={handleClick}
        title={aspect.label}
        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md transition ${
          isActive
            ? "bg-blue-100 text-blue-700"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <Icon size={20} />
        <span className="text-xs font-medium">{aspect.label}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

      <div className="relative bg-white w-full max-w-6xl h-[87vh] rounded-lg shadow-2xl flex flex-col overflow-hidden z-10">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Edit Media</h2>
          <button
            title="close"
            onClick={onClose}
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 transition"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div
            className="flex-1 flex items-center justify-center bg-gray-100"
            style={{
              filter: isImage ? combinedFilter : "none",
              transform: isFlipped ? "scaleX(-1)" : "none",
            }}
          >
            {isImage ? (
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={cropperAspect || undefined}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_, croppedAreaPixels) =>
                  setCropPixels(croppedAreaPixels)
                }
                objectFit="contain"
                showGrid
              />
            ) : (
              <video
                src={previewUrl}
                controls
                className="max-h-full max-w-full object-contain rounded"
              />
            )}
          </div>

          <div className="w-96 flex flex-col border-l border-gray-200 bg-white p-4">
            <div className="flex border-b border-gray-200 mb-4">
              {[
                { key: "crop", label: "Crop" },
                { key: "filter", label: "Filter" },
                { key: "adjust", label: "Adjust" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() =>
                    setActiveTab(key as "crop" | "filter" | "adjust")
                  }
                  className={`flex-1 text-sm font-medium py-2 transition ${
                    activeTab === key
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {activeTab === "crop" && isImage && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleRotate}
                      className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition p-2 rounded-md hover:bg-gray-100"
                      title="Rotate 90°"
                    >
                      <LuRotateCw size={22} />
                      <span className="text-xs font-medium">Rotate</span>
                    </button>
                    <button
                      onClick={handleFlip}
                      className="flex flex-col items-center gap-1 text-gray-600 hover:text-blue-600 transition p-2 rounded-md hover:bg-gray-100"
                      title="Flip Horizontal"
                    >
                      <LuFlipHorizontal size={22} />
                      <span className="text-xs font-medium">Flip</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">
                      Aspect Ratio
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {aspectRatios.map(renderAspectButton)}
                    </div>
                  </div>

                  {renderSlider("Zoom", zoom, setZoom, 1, 3, 0.01)}

                  {renderSlider(
                    "Straighten",
                    rotation,
                    setRotation,
                    -45,
                    45,
                    0.1
                  )}
                </div>
              )}

              {activeTab === "filter" && isImage && (
                <div className="flex flex-wrap gap-3">
                  {Object.keys(filterMap).map((key) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-4 py-1.5 rounded-full border text-sm capitalize transition ${
                        filter === key
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "adjust" && isImage && (
                <div className="flex flex-col gap-4">
                  {renderSlider("Brightness", brightness, setBrightness)}
                  {renderSlider("Contrast", contrast, setContrast)}
                  {renderSlider("Saturation", saturation, setSaturation)}
                </div>
              )}

              {!isImage && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-sm p-4 text-center">
                    Filters and adjustments are only available for images.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-semibold"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDialog;