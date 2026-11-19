import { prisma } from "../../lib/db";
import {
  visibleProductWhere,
  isProductPubliclyVisible,
} from "../product/product.service";

// GET /api/cart
export const getCart = async (c) => {
  try {
    const user = c.get("currentUser");

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { position: "asc" }
                },
                shop: {
                  select: { id: true, name: true, slug: true, status: true }
                },
                customOptions: {
                  include: {
                    values: true
                  }
                }
              }
            },
            accessories: {
              include: {
                accessory: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { position: "asc" }
                  },
                  shop: {
                    select: { id: true, name: true, slug: true, status: true }
                  },
                  customOptions: {
                    include: {
                      values: true
                    }
                  }
                }
              },
              accessories: {
                include: {
                  accessory: true
                }
              }
            }
          }
        }
      });
    }

    // ไม่ส่งข้อมูลสินค้าที่ถูกซ่อน/ร้านถูกระงับกลับไป และล้างรายการนั้นออกจากตะกร้า
    const visibleItems = cart.items.filter((item) =>
      isProductPubliclyVisible(item.product),
    );
    const hiddenItemIds = cart.items
      .filter((item) => !isProductPubliclyVisible(item.product))
      .map((item) => item.id);

    if (hiddenItemIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { id: { in: hiddenItemIds } },
      });
    }

    return c.json({
      success: true,
      cart: { ...cart, items: visibleItems },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return c.json({ error: "Failed to retrieve cart" }, 500);
  }
};

// POST /api/cart
export const addToCart = async (c) => {
  try {
    const user = c.get("currentUser");
    const { productId, quantity = 1, customDetails = null, accessories = [] } = await c.req.json();

    if (!productId) {
      return c.json({ error: "productId is required" }, 400);
    }

    // 1. Verify product exists and is publicly sellable
    const product = await prisma.product.findFirst({
      where: { id: productId, AND: [visibleProductWhere] },
    });

    if (!product) {
      return c.json(
        { error: "สินค้านี้ไม่พร้อมจำหน่ายหรือถูกปิดการมองเห็น" },
        404,
      );
    }

    // Check stock if READY_TO_SHIP
    if (product.type === "READY_TO_SHIP" && product.stock < quantity) {
      return c.json({ error: `Not enough stock. Available: ${product.stock}` }, 400);
    }

    // 2. Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id }
      });
    }

    // 3. Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      }
    });

    let cartItem;

    if (existingItem) {
      // Update quantity and replace/update accessories & customDetails
      const newQuantity = existingItem.quantity + quantity;
      if (product.type === "READY_TO_SHIP" && product.stock < newQuantity) {
        return c.json({ error: `Not enough stock to add more. Current in cart: ${existingItem.quantity}, Available: ${product.stock}` }, 400);
      }

      // Update the CartItem
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          customDetails: customDetails !== null ? customDetails : existingItem.customDetails
        }
      });

      // Update accessories if provided in the payload
      if (accessories && accessories.length > 0) {
        // Clear existing accessories
        await prisma.cartItemAccessory.deleteMany({
          where: { cartItemId: cartItem.id }
        });

        // Add new accessories
        for (const acc of accessories) {
          await prisma.cartItemAccessory.create({
            data: {
              cartItemId: cartItem.id,
              accessoryId: acc.accessoryId,
              quantity: acc.quantity || 1
            }
          });
        }
      }
    } else {
      // Create new CartItem
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity,
          customDetails: customDetails
        }
      });

      // Add accessories
      if (accessories && accessories.length > 0) {
        for (const acc of accessories) {
          await prisma.cartItemAccessory.create({
            data: {
              cartItemId: cartItem.id,
              accessoryId: acc.accessoryId,
              quantity: acc.quantity || 1
            }
          });
        }
      }
    }

    return c.json({
      success: true,
      message: "Item added to cart successfully",
      cartItem
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return c.json({ error: "Failed to add item to cart" }, 500);
  }
};

// PUT /api/cart
export const updateCartItem = async (c) => {
  try {
    const user = c.get("currentUser");
    const { productId, quantity, customDetails, accessories } = await c.req.json();

    if (!productId) {
      return c.json({ error: "productId is required" }, 400);
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    });

    if (!cart) {
      return c.json({ error: "Cart not found" }, 404);
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      }
    });

    if (!cartItem) {
      return c.json({ error: "Cart item not found" }, 404);
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, AND: [visibleProductWhere] },
    });
    if (!product) {
      return c.json(
        { error: "สินค้านี้ไม่พร้อมจำหน่ายหรือถูกปิดการมองเห็น" },
        409,
      );
    }

    // Verify stock if quantity is updated and product is READY_TO_SHIP
    if (
      quantity !== undefined &&
      product.type === "READY_TO_SHIP" &&
      product.stock < quantity
    ) {
      return c.json(
        { error: `Not enough stock. Available: ${product.stock}` },
        400,
      );
    }

    // Update fields
    const updatedCartItem = await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: {
        quantity: quantity !== undefined ? quantity : cartItem.quantity,
        customDetails: customDetails !== undefined ? customDetails : cartItem.customDetails
      }
    });

    // Update accessories if provided
    if (accessories !== undefined) {
      await prisma.cartItemAccessory.deleteMany({
        where: { cartItemId: cartItem.id }
      });

      for (const acc of accessories) {
        await prisma.cartItemAccessory.create({
          data: {
            cartItemId: cartItem.id,
            accessoryId: acc.accessoryId,
            quantity: acc.quantity || 1
          }
        });
      }
    }

    return c.json({
      success: true,
      message: "Cart item updated successfully",
      cartItem: updatedCartItem
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    return c.json({ error: "Failed to update cart item" }, 500);
  }
};

// DELETE /api/cart
export const removeCartItem = async (c) => {
  try {
    const user = c.get("currentUser");
    // Support either query parameter or JSON body
    let productId = c.req.query("productId");
    if (!productId) {
      try {
        const body = await c.req.json();
        productId = body.productId;
      } catch (e) {
        // No body or failed parsing
      }
    }

    if (!productId) {
      return c.json({ error: "productId is required" }, 400);
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    });

    if (!cart) {
      return c.json({ error: "Cart not found" }, 404);
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      }
    });

    if (!cartItem) {
      return c.json({ error: "Cart item not found" }, 404);
    }

    await prisma.cartItem.delete({
      where: { id: cartItem.id }
    });

    return c.json({
      success: true,
      message: "Item removed from cart successfully"
    });
  } catch (error) {
    console.error("Remove cart item error:", error);
    return c.json({ error: "Failed to remove item from cart" }, 500);
  }
};

// POST /api/cart/clear
export const clearCart = async (c) => {
  try {
    const user = c.get("currentUser");

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }

    return c.json({
      success: true,
      message: "Cart cleared successfully"
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    return c.json({ error: "Failed to clear cart" }, 500);
  }
};

// POST /api/cart/merge
export const mergeCart = async (c) => {
  try {
    const user = c.get("currentUser");
    const { items = [] } = await c.req.json();

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id }
      });
    }

    for (const item of items) {
      const { productId, quantity = 1, customDetails = null, accessories = [] } = item;

      if (!productId) continue;

      // Verify product exists and is publicly sellable
      const product = await prisma.product.findFirst({
        where: { id: productId, AND: [visibleProductWhere] },
      });
      if (!product) continue;

      // Check if item already in cart
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: productId
          }
        }
      });

      let cartItem;

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const finalQuantity = product.type === "READY_TO_SHIP" 
          ? Math.min(newQuantity, product.stock) 
          : newQuantity;

        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: finalQuantity,
            customDetails: customDetails !== null ? customDetails : existingItem.customDetails
          }
        });
      } else {
        const finalQuantity = product.type === "READY_TO_SHIP"
          ? Math.min(quantity, product.stock)
          : quantity;

        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: productId,
            quantity: finalQuantity,
            customDetails: customDetails
          }
        });
      }

      // Merge accessories if provided
      if (accessories && accessories.length > 0) {
        await prisma.cartItemAccessory.deleteMany({
          where: { cartItemId: cartItem.id }
        });

        for (const acc of accessories) {
          await prisma.cartItemAccessory.create({
            data: {
              cartItemId: cartItem.id,
              accessoryId: acc.accessoryId,
              quantity: acc.quantity || 1
            }
          });
        }
      }
    }

    return c.json({
      success: true,
      message: "Guest cart merged successfully"
    });
  } catch (error) {
    console.error("Merge cart error:", error);
    return c.json({ error: "Failed to merge cart" }, 500);
  }
};
