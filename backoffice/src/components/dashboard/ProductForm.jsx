"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadService, accessoryService } from "../../services/api";

import ImageCropperModal from "./product-form/ImageCropperModal";
import ImageUploadSection from "./product-form/ImageUploadSection";
import ProductInfoSection from "./product-form/ProductInfoSection";
import CustomOptionsSection from "./product-form/CustomOptionsSection";
import AccessoriesSection from "./product-form/AccessoriesSection";

// Helper to create HTML Image element from URL
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // Prevent CORS issues with canvas
    image.src = url;
  });

// Canvas cropping logic
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // Set width and height of canvas to cropped size (1:1 square)
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  // Return as a blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.95,
    );
  });
};

export default function ProductForm({
  initialValues = {},
  onSubmit,
  submitting = false,
  title = "แบบฟอร์มสินค้า",
  subtitle = "กรอกรายละเอียดข้อมูลสินค้า",
  submitText = "บันทึกสินค้า",
}) {
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [type, setType] = useState("READY_TO_SHIP");
  const [category, setCategory] = useState("BRACELET");
  const [customOptions, setCustomOptions] = useState([]);
  const [showCustomManager, setShowCustomManager] = useState(false);
  const [availableAccessories, setAvailableAccessories] = useState([]);
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState([]);

  // Accessories modal states
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [accessorySearchQuery, setAccessorySearchQuery] = useState("");
  const [activeAccessoryTab, setActiveAccessoryTab] = useState("ALL");

  // Auto-sync custom option size with selected category
  useEffect(() => {
    if (type !== "MADE_TO_ORDER") return;

    if (category === "BRACELET") {
      setCustomOptions((prev) => {
        // Filter out anklet size
        const filtered = prev.filter(
          (opt) =>
            !opt.name.includes("ขนาดข้อเท้า") &&
            !opt.name.includes("Ankle Size")
        );
        // Check if wrist size exists
        const hasWristSize = filtered.some(
          (opt) =>
            opt.name.includes("ขนาดข้อมือ") ||
            opt.name.includes("Wrist Size")
        );
        if (!hasWristSize) {
          return [
            ...filtered,
            {
              name: "ขนาดข้อมือ (Wrist Size)",
              required: true,
              values: [
                { name: "14 cm", priceAdjustment: 0 },
                { name: "15 cm", priceAdjustment: 0 },
                { name: "16 cm", priceAdjustment: 0 },
                { name: "17 cm", priceAdjustment: 10 },
                { name: "18 cm", priceAdjustment: 20 },
              ],
            },
          ];
        }
        return filtered;
      });
    } else if (category === "ANKLET") {
      setCustomOptions((prev) => {
        // Filter out wrist size
        const filtered = prev.filter(
          (opt) =>
            !opt.name.includes("ขนาดข้อมือ") &&
            !opt.name.includes("Wrist Size")
        );
        // Check if anklet size exists
        const hasAnkletSize = filtered.some(
          (opt) =>
            opt.name.includes("ขนาดข้อเท้า") ||
            opt.name.includes("Ankle Size")
        );
        if (!hasAnkletSize) {
          return [
            ...filtered,
            {
              name: "ขนาดข้อเท้า (Ankle Size)",
              required: true,
              values: [
                { name: "20 cm", priceAdjustment: 0 },
                { name: "21 cm", priceAdjustment: 0 },
                { name: "22 cm", priceAdjustment: 0 },
                { name: "23 cm", priceAdjustment: 15 },
                { name: "24 cm", priceAdjustment: 30 },
              ],
            },
          ];
        }
        return filtered;
      });
    }
  }, [category, type]);

  // Separate cover image vs gallery images
  const [coverImage, setCoverImage] = useState(null); // single URL string
  const [galleryImages, setGalleryImages] = useState([]); // array of URLs

  const [uploading, setUploading] = useState(false);

  // Load available accessories
  useEffect(() => {
    accessoryService
      .getAccessories()
      .then((res) => {
        if (res.success && res.accessories) {
          setAvailableAccessories(res.accessories);
        }
      })
      .catch((err) => console.error("Failed to load accessories:", err));
  }, []);

  // Cropping Queue State
  // { file: File, dataUrl: string, target: 'cover' | 'gallery' }
  const [cropQueue, setCropQueue] = useState([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Sync initial values when loaded (first image is cover, rest are gallery)
  useEffect(() => {
    if (initialValues.name !== undefined) setName(initialValues.name);
    if (initialValues.description !== undefined)
      setDescription(initialValues.description || "");
    if (initialValues.price !== undefined)
      setPrice(initialValues.price.toString());
    if (initialValues.originalPrice !== undefined)
      setOriginalPrice(
        initialValues.originalPrice
          ? initialValues.originalPrice.toString()
          : "",
      );
    if (initialValues.stock !== undefined)
      setStock(initialValues.stock.toString());
    if (initialValues.type !== undefined) setType(initialValues.type);
    if (initialValues.category !== undefined)
      setCategory(initialValues.category);
    if (initialValues.images !== undefined) {
      const imgs = initialValues.images.map((img) =>
        typeof img === "string" ? img : img.url,
      );
      setCoverImage(imgs[0] || null);
      setGalleryImages(imgs.slice(1));
    }
    if (
      initialValues.customOptions !== undefined &&
      Array.isArray(initialValues.customOptions)
    ) {
      setCustomOptions(
        initialValues.customOptions.map((opt) => ({
          name: opt.name,
          required: opt.required !== undefined ? opt.required : true,
          values: opt.values
            ? opt.values.map((v) => ({
                name: typeof v === "string" ? v : v.name,
                priceAdjustment: v.priceAdjustment || 0,
              }))
            : [],
        })),
      );
    }
    if (
      initialValues.accessories !== undefined &&
      Array.isArray(initialValues.accessories)
    ) {
      setSelectedAccessoryIds(
        initialValues.accessories.map(
          (a) => a.accessoryId || a.accessory?.id || a,
        ),
      );
    }
  }, [initialValues]);

  // Read files and add them to the cropping queue
  const handleFileSelection = (e, target) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems = [];
    let processed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        newItems.push({
          file,
          dataUrl: reader.result,
          target,
        });
        processed++;
        if (processed === files.length) {
          setCropQueue((prev) => [...prev, ...newItems]);
          // Reset input element value so same file can be chosen again
          e.target.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Process the current item in the crop queue
  const handleCropConfirm = async () => {
    if (cropQueue.length === 0 || !croppedAreaPixels) return;

    const currentItem = cropQueue[0];
    try {
      setUploading(true);
      // Crop image on client side
      const croppedBlob = await getCroppedImg(
        currentItem.dataUrl,
        croppedAreaPixels,
      );
      if (!croppedBlob) throw new Error("Failed to crop image");

      // Store cropped file and a local preview URL
      const croppedFile = new File([croppedBlob], currentItem.file.name, {
        type: "image/jpeg",
      });
      const previewUrl = URL.createObjectURL(croppedBlob);
      const newImgObj = { file: croppedFile, preview: previewUrl };

      if (currentItem.target === "cover") {
        // If there was a previous cover preview, revoke it
        if (coverImage && typeof coverImage !== "string") {
          URL.revokeObjectURL(coverImage.preview);
        }
        setCoverImage(newImgObj);
      } else {
        setGalleryImages((prev) => [...prev, newImgObj]);
      }
    } catch (err) {
      alert("ครอปรูปภาพล้มเหลว: " + err.message);
    } finally {
      setUploading(false);
      // Remove item from queue and reset crop zoom
      setCropQueue((prev) => prev.slice(1));
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  };

  const handleCropCancel = () => {
    // Remove the current item from queue
    setCropQueue((prev) => prev.slice(1));
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleRemoveCover = async () => {
    if (!coverImage) return;
    if (typeof coverImage === "string") {
      if (
        confirm("คุณต้องการลบรูปหน้าปกนี้ออกจากคลาวด์ R2 อย่างถาวรหรือไม่?")
      ) {
        try {
          await uploadService.deleteImage(coverImage);
        } catch (err) {
          console.error("Failed to delete cover image from R2:", err);
        }
      }
    } else {
      URL.revokeObjectURL(coverImage.preview);
    }
    setCoverImage(null);
  };

  const handleRemoveGallery = async (indexToRemove) => {
    const img = galleryImages[indexToRemove];
    if (typeof img === "string") {
      if (confirm("คุณต้องการลบรูปนี้ออกจากคลาวด์ R2 อย่างถาวรหรือไม่?")) {
        try {
          await uploadService.deleteImage(img);
        } catch (err) {
          console.error("Failed to delete gallery image from R2:", err);
        }
      }
    } else {
      URL.revokeObjectURL(img.preview);
    }
    setGalleryImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const [localSubmitting, setLocalSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numericPrice = parseFloat(price) || 0;
    const numericOriginalPrice =
      originalPrice && originalPrice !== "" ? parseFloat(originalPrice) : null;

    if (numericOriginalPrice !== null && numericOriginalPrice <= numericPrice) {
      alert("ราคาเต็มก่อนลดต้องมากกว่าราคาขายจริงเท่านั้น");
      return;
    }

    setLocalSubmitting(true);
    try {
      // 1. Upload cover image if new
      let coverPromise = Promise.resolve(null);
      if (coverImage) {
        if (typeof coverImage === "string") {
          coverPromise = Promise.resolve(coverImage);
        } else {
          const formData = new FormData();
          formData.append("images", coverImage.file);
          coverPromise = uploadService.uploadImages(formData).then((res) => {
            if (res.success && res.urls.length > 0) return res.urls[0];
            throw new Error("Failed to upload cover image");
          });
        }
      }

      // 2. Upload gallery images if new
      const galleryPromises = galleryImages.map((img) => {
        if (typeof img === "string") {
          return Promise.resolve(img);
        } else {
          const formData = new FormData();
          formData.append("images", img.file);
          return uploadService.uploadImages(formData).then((res) => {
            if (res.success && res.urls.length > 0) return res.urls[0];
            throw new Error("Failed to upload gallery image");
          });
        }
      });

      const [uploadedCover, ...uploadedGallery] = await Promise.all([
        coverPromise,
        ...galleryPromises,
      ]);

      const images = uploadedCover
        ? [uploadedCover, ...uploadedGallery]
        : uploadedGallery;

      await onSubmit({
        name,
        price: parseFloat(price) || 0,
        originalPrice:
          originalPrice && originalPrice !== ""
            ? parseFloat(originalPrice)
            : null,
        stock: parseInt(stock) || 0,
        type,
        category,
        description: description || null,
        images,
        customOptions,
        accessories: selectedAccessoryIds,
      });
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึกสินค้า: " + err.message);
    } finally {
      setLocalSubmitting(false);
    }
  };

  const currentCroppingItem = cropQueue[0];

  return (
    <div className="bg-neutral-50/40 p-8 rounded-3xl border border-neutral-200/60 shadow-xs w-full relative">
      {/* ─── Image Crop Modal ─── */}
      {currentCroppingItem && (
        <ImageCropperModal
          currentCroppingItem={currentCroppingItem}
          crop={crop}
          zoom={zoom}
          setCrop={setCrop}
          setZoom={setZoom}
          onCropComplete={onCropComplete}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
          uploading={uploading}
        />
      )}

      {/* ─── Page Header ─── */}
      <div className="flex justify-between items-center mb-8 pb-5 border-b border-neutral-200/60">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h3>
          <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/products")}
          className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-all flex items-center gap-1.5 px-4 py-2 bg-white border border-neutral-200 rounded-full hover:shadow-xs cursor-pointer active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          ย้อนกลับ
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Left Column: Image Management & Description */}
        <div className="space-y-6">
          <ImageUploadSection
            coverImage={coverImage}
            galleryImages={galleryImages}
            uploading={uploading}
            currentCroppingItem={currentCroppingItem}
            handleFileSelection={handleFileSelection}
            handleRemoveCover={handleRemoveCover}
            handleRemoveGallery={handleRemoveGallery}
          />
        </div>

        {/* Right Column: Key Details, Custom Options & Accessories */}
        <div className="space-y-6">
          <ProductInfoSection
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            price={price}
            setPrice={setPrice}
            originalPrice={originalPrice}
            setOriginalPrice={setOriginalPrice}
            stock={stock}
            setStock={setStock}
            type={type}
            setType={setType}
            category={category}
            setCategory={setCategory}
          />

          {/* DYNAMIC CUSTOM OPTIONS FOR MADE_TO_ORDER */}
          {type === "MADE_TO_ORDER" && (
            <CustomOptionsSection
              category={category}
              customOptions={customOptions}
              setCustomOptions={setCustomOptions}
              showCustomManager={showCustomManager}
              setShowCustomManager={setShowCustomManager}
            />
          )}

          {/* LINKED ACCESSORIES SELECTOR */}
          <AccessoriesSection
            availableAccessories={availableAccessories}
            selectedAccessoryIds={selectedAccessoryIds}
            setSelectedAccessoryIds={setSelectedAccessoryIds}
            isAccessoryModalOpen={isAccessoryModalOpen}
            setIsAccessoryModalOpen={setIsAccessoryModalOpen}
            accessorySearchQuery={accessorySearchQuery}
            setAccessorySearchQuery={setAccessorySearchQuery}
            activeAccessoryTab={activeAccessoryTab}
            setActiveAccessoryTab={setActiveAccessoryTab}
          />

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-6 ">
            <button
              type="button"
              onClick={() => router.push("/dashboard/products")}
              className="px-6 py-2.5 border border-neutral-200 hover:bg-neutral-50/50 rounded-full text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting || localSubmitting}
              className="px-6 py-2.5 bg-brand text-white rounded-full text-xs font-bold hover:bg-brand/90 transition-all disabled:bg-neutral-300 cursor-pointer shadow-2xs"
            >
              {submitting || localSubmitting
                ? "กำลังดำเนินรายการ..."
                : submitText}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
