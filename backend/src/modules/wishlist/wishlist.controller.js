import { prisma } from "../../lib/db";
import { visibleProductWhere } from "../product/product.service";

// GET /api/wishlist
export const getWishlist = async (c) => {
  try {
    const user = c.get("currentUser");

    const items = await prisma.wishlistItem.findMany({
      where: {
        userId: user.id,
        product: { is: visibleProductWhere },
      },
      include: {
        product: {
          include: {
            images: { orderBy: { position: "asc" } },
            shop: {
              select: { id: true, name: true, slug: true, logoUrl: true },
            },
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return c.json({ success: true, wishlist: items });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return c.json({ error: "Failed to retrieve wishlist" }, 500);
  }
};

// POST /api/wishlist
export const addToWishlist = async (c) => {
  try {
    const user = c.get("currentUser");
    const { productId } = await c.req.json();

    if (!productId) {
      return c.json({ error: "productId is required" }, 400);
    }

    // Check if product is publicly sellable
    const product = await prisma.product.findFirst({
      where: { id: productId, AND: [visibleProductWhere] },
    });

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId
        }
      }
    });

    if (existing) {
      return c.json({ success: true, message: "Product already in wishlist", item: existing });
    }

    // Create wishlist item
    const newItem = await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId
      },
      include: {
        product: {
          include: {
            images: { orderBy: { position: "asc" } }
          }
        }
      }
    });

    return c.json({ success: true, message: "Added to wishlist successfully", item: newItem }, 201);
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return c.json({ error: "Failed to add to wishlist" }, 500);
  }
};

// DELETE /api/wishlist/:productId
export const removeFromWishlist = async (c) => {
  try {
    const user = c.get("currentUser");
    const productId = c.req.param("productId");

    if (!productId) {
      return c.json({ error: "productId parameter is required" }, 400);
    }

    // Find and delete wishlist item
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId
        }
      }
    });

    if (!existing) {
      return c.json({ error: "Wishlist item not found" }, 404);
    }

    await prisma.wishlistItem.delete({
      where: {
        id: existing.id
      }
    });

    return c.json({ success: true, message: "Removed from wishlist successfully" });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return c.json({ error: "Failed to remove from wishlist" }, 500);
  }
};
