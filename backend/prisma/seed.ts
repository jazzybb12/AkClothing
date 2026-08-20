import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../src/utils/slugify";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.banner.deleteMany();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.create({
    data: {
      name: "Store Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);

  const demoCustomer = await prisma.user.create({
    data: {
      name: "Ayesha K.",
      email: "customer@example.com",
      passwordHash: await bcrypt.hash("Password123!", 10),
      role: "CUSTOMER",
    },
  });
  console.log("Demo customer created: customer@example.com / Password123!");

  const men = await prisma.category.create({ data: { name: "Men", slug: slugify("Men") } });
  const women = await prisma.category.create({ data: { name: "Women", slug: slugify("Women") } });
  const kids = await prisma.category.create({ data: { name: "Kids", slug: slugify("Kids") } });

  const streetwear = await prisma.category.create({
    data: { name: "Streetwear", slug: slugify("Streetwear"), parentId: men.id },
  });
  const outerwear = await prisma.category.create({
    data: { name: "Outerwear", slug: slugify("Outerwear"), parentId: men.id },
  });
  await prisma.category.create({ data: { name: "Shirts", slug: slugify("Shirts"), parentId: men.id } });

  const lawn = await prisma.category.create({
    data: { name: "Lawn", slug: slugify("Lawn"), parentId: women.id },
  });
  await prisma.category.create({ data: { name: "Stitched", slug: slugify("Stitched"), parentId: women.id } });

  await prisma.category.create({ data: { name: "Boys", slug: slugify("Boys"), parentId: kids.id } });
  await prisma.category.create({ data: { name: "Girls", slug: slugify("Girls"), parentId: kids.id } });

  const tee = await prisma.product.create({
    data: {
      name: "Oversized Vintage Graphic Tee",
      slug: slugify("Oversized Vintage Graphic Tee"),
      description: "Heavyweight 240 GSM organic cotton t-shirt with a relaxed, dropped-shoulder fit.",
      basePrice: 2499,
      categoryId: streetwear.id,
      status: "ACTIVE",
      images: {
        create: [{ url: "https://res.cloudinary.com/demo/image/upload/w_800/sample.jpg", position: 0 }],
      },
      variants: {
        create: [
          { size: "M", color: "Black", sku: "TEE-BLK-M", stockQty: 25 },
          { size: "L", color: "Black", sku: "TEE-BLK-L", stockQty: 20 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Heavyweight Fleece Pullover Hoodie",
      slug: slugify("Heavyweight Fleece Pullover Hoodie"),
      description: "Premium double-lined hood with custom silver eyelets and ribbed cuffs.",
      basePrice: 4999,
      categoryId: outerwear.id,
      status: "ACTIVE",
      images: {
        create: [{ url: "https://res.cloudinary.com/demo/image/upload/w_800/sample.jpg", position: 0 }],
      },
      variants: {
        create: [
          { size: "M", color: "Grey", sku: "HD-GRY-M", stockQty: 18 },
          { size: "L", color: "Grey", sku: "HD-GRY-L", stockQty: 0, isOutOfStock: true },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Embroidered Lawn 3-Piece Suit",
      slug: slugify("Embroidered Lawn 3-Piece Suit"),
      description: "Printed lawn shirt, dupatta, and trouser set with embroidered neckline.",
      basePrice: 3999,
      categoryId: lawn.id,
      status: "ACTIVE",
      images: {
        create: [{ url: "https://res.cloudinary.com/demo/image/upload/w_800/sample.jpg", position: 0 }],
      },
      variants: {
        create: [{ size: "Free Size", color: "Multi", sku: "LAWN-MULTI-FS", stockQty: 15 }],
      },
    },
  });

  await prisma.review.create({
    data: {
      productId: tee.id,
      userId: demoCustomer.id,
      rating: 5,
      comment: "Great quality fabric, fits true to size. Ordered a second one in another color.",
    },
  });
  await prisma.review.create({
    data: {
      productId: tee.id,
      userId: adminUser.id,
      rating: 4,
      comment: "Nice print quality, though it runs slightly large.",
    },
  });

  await prisma.settings.create({
    data: {
      id: "singleton",
      whatsappNumber: process.env.WHATSAPP_DEFAULT_NUMBER || null,
      storeName: "ak.shop",
    },
  });

  await prisma.banner.createMany({
    data: [
      {
        eyebrow: "New Season",
        heading: "New Season, New Styles",
        subtext: "Fresh drops across men's and women's wear — shop the latest arrivals.",
        ctaLabel: "Shop Now",
        ctaHref: "/shop",
        gradientKey: "brand",
        position: 0,
      },
      {
        eyebrow: "Nationwide",
        heading: "Cash on Delivery, Anywhere in Pakistan",
        subtext: "Order now, inspect at your doorstep, pay when it arrives.",
        ctaLabel: "Start Shopping",
        ctaHref: "/shop",
        gradientKey: "emerald",
        position: 1,
      },
      {
        eyebrow: "Limited Time",
        heading: "Seasonal Sale Is Live",
        subtext: "Use a coupon code at checkout and save on your order today.",
        ctaLabel: "Browse Sale",
        ctaHref: "/shop",
        gradientKey: "accent",
        position: 2,
      },
    ],
  });

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
