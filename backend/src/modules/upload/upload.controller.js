import { uploadToR2, deleteFromR2 } from "../../lib/r2";
import sharp from "sharp";

/**
 * Upload Controller
 * นโยบาย folder:
 * - Employee: เลือก folder ได้ตามที่ส่งมา
 * - Seller/ Buyer ที่สมัครร้าน: ถูกบังคับ folder ตาม shopId หรือ pending/<userId>
 * - การลบไฟล์: ต้องอยู่ใต้ prefix ที่ผู้ใช้มีสิทธิ์เท่านั้น
 */

// POST /api/upload?folder=products
export const uploadMultipleFiles = async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });

    const accountType = c.get("accountType");
    const currentUser = c.get("currentUser");
    const currentShop = c.get("currentShop");

    // Optional ?folder=products query param — defaults to "products"
    const requestedFolder = (c.req.query("folder") || "products")
      .split("/")[0]
      .replace(/[^a-zA-Z0-9_-]/g, "");

    let folder;
    if (accountType === "EMPLOYEE") {
      folder = requestedFolder || "products";
    } else {
      if (!currentUser?.id) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (requestedFolder === "shops") {
        // ผู้สมัครที่ยังไม่มีร้านใช้ pending/<userId> เพื่อแยกไฟล์ของแต่ละคน
        folder = currentShop
          ? `shops/${currentShop.id}`
          : `shops/pending/${currentUser.id}`;
      } else if (requestedFolder === "products") {
        if (!currentShop) {
          return c.json(
            { error: "ต้องมีร้านค้าก่อนจึงจะอัปโหลดรูปสินค้าได้" },
            403,
          );
        }
        folder = `products/${currentShop.id}`;
      } else {
        return c.json({ error: "ไม่ได้รับอนุญาตให้อัปโหลดไปยังโฟลเดอร์นี้" }, 403);
      }
    }

    // Support keys: files, images, file, image
    const files = body.files || body.images || body.file || body.image;

    if (!files) {
      return c.json({ error: "No files found in the request (use 'files' or 'images')" }, 400);
    }

    const fileArray = Array.isArray(files) ? files : [files];
    const uploadedUrls = [];

    for (const file of fileArray) {
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        let mimeType = file.type;
        let cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

        // Convert image to WebP using sharp
        if (file.type.startsWith("image/")) {
          buffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();
          mimeType = "image/webp";

          // Rename filename extension to .webp
          const dotIdx = cleanName.lastIndexOf(".");
          const baseName = dotIdx !== -1 ? cleanName.substring(0, dotIdx) : cleanName;
          cleanName = `${baseName}.webp`;
        }

        const uniqueFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;

        const url = await uploadToR2(buffer, uniqueFileName, mimeType);
        uploadedUrls.push(url);
      }
    }

    return c.json({
      success: true,
      message: `${uploadedUrls.length} file(s) uploaded successfully`,
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("Upload multiple files error:", error);
    return c.json({ error: "Failed to upload files due to an internal error" }, 500);
  }
};

// DELETE /api/upload
export const deleteUploadedFile = async (c) => {
  try {
    const { url } = await c.req.json();
    if (!url) {
      return c.json({ error: "URL is required to delete object from storage" }, 400);
    }

    const accountType = c.get("accountType");
    const currentUser = c.get("currentUser");
    const currentShop = c.get("currentShop");

    if (accountType === "USER") {
      let key = url;
      const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(
        /\/$/,
        "",
      );

      if (publicBase && url.startsWith(publicBase)) {
        key = url.slice(publicBase.length + 1);
      } else if (url.startsWith("http")) {
        try {
          key = new URL(url).pathname.replace(/^\/+/, "");
        } catch {
          return c.json({ error: "รูปแบบ URL ไม่ถูกต้อง" }, 400);
        }
      }

      let decodedKey = key;
      try {
        decodedKey = decodeURIComponent(key);
      } catch {
        decodedKey = key;
      }

      const allowedPrefixes = [`shops/pending/${currentUser.id}/`];
      if (currentShop) {
        allowedPrefixes.push(
          `shops/${currentShop.id}/`,
          `products/${currentShop.id}/`,
        );
      }

      const isAllowed = allowedPrefixes.some((prefix) =>
        decodedKey.startsWith(prefix),
      );
      if (!isAllowed) {
        return c.json({ error: "คุณไม่มีสิทธิ์ลบไฟล์นี้" }, 403);
      }
    }

    const key = await deleteFromR2(url);

    return c.json({
      success: true,
      message: `File '${key}' deleted successfully from storage`,
    });
  } catch (error) {
    console.error("Delete file error:", error);
    return c.json({ error: "Failed to delete file from storage" }, 500);
  }
};

