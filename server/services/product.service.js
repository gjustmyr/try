const { Product, Seller } = require("../models");
const { uploadToCloudinary } = require("../config/cloudinary");
const { Op } = require("sequelize");

exports.findAllActiveProducts = async (filters = {}) => {
  const { Review } = require("../models");
  const where = { status: "active" };

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { description: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  const products = await Product.findAll({
    where,
    include: [
      {
        model: Seller,
        as: "seller",
        attributes: ["id", "shopName", "rating"],
      },
    ],
    order: [["createdAt", "DESC"]],
    ...(filters.limit && { limit: filters.limit }),
  });

  // Add rating info to each product
  const productsWithRatings = await Promise.all(
    products.map(async (product) => {
      const reviews = await Review.findAll({
        where: { productId: product.id },
        attributes: ["rating"],
      });

      const totalReviews = reviews.length;
      const avgRating =
        totalReviews > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

      return {
        ...product.toJSON(),
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews,
      };
    }),
  );

  return productsWithRatings;
};

exports.findProductsBySeller = async (sellerId, filters = {}) => {
  const where = { sellerId };

  if (filters.status) {
    where.status = filters.status;
  }

  return Product.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });
};

exports.findProductById = async (productId, includesSeller = false) => {
  const options = {};
  if (includesSeller) {
    options.include = [
      {
        model: Seller,
        as: "seller",
        attributes: ["id", "shopName", "rating"],
      },
    ];
  }
  return Product.findByPk(productId, options);
};

exports.uploadProductImages = async (files) => {
  const images = [];
  for (const file of files) {
    const upload = await uploadToCloudinary(file, "products");
    images.push({
      url: upload.url,
      publicId: upload.publicId,
    });
  }
  return images;
};

exports.createProduct = async (data, images) => {
  return Product.create({
    sellerId: data.sellerId,
    name: data.name,
    description: data.description,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    costPerItem: data.costPerItem,
    sku: data.sku,
    barcode: data.barcode,
    quantity: data.quantity || 0,
    category: data.category,
    tags: data.tags ? JSON.parse(data.tags) : [],
    images,
    status: data.status || "draft",
    weight: data.weight,
    weightUnit: data.weightUnit || "kg",
  });
};

exports.updateProduct = async (product, data, newImages) => {
  return product.update({
    name: data.name || product.name,
    description:
      data.description !== undefined ? data.description : product.description,
    price: data.price || product.price,
    compareAtPrice:
      data.compareAtPrice !== undefined
        ? data.compareAtPrice
        : product.compareAtPrice,
    costPerItem:
      data.costPerItem !== undefined ? data.costPerItem : product.costPerItem,
    sku: data.sku !== undefined ? data.sku : product.sku,
    barcode: data.barcode !== undefined ? data.barcode : product.barcode,
    quantity: data.quantity !== undefined ? data.quantity : product.quantity,
    category: data.category !== undefined ? data.category : product.category,
    tags: data.tags ? JSON.parse(data.tags) : product.tags,
    images: newImages,
    status: data.status || product.status,
    weight: data.weight !== undefined ? data.weight : product.weight,
    weightUnit: data.weightUnit || product.weightUnit,
  });
};

exports.deleteProduct = async (product) => {
  return product.destroy();
};

exports.togglePublish = async (product) => {
  product.isPublished = !product.isPublished;
  product.status = product.isPublished ? "active" : "draft";
  await product.save();
  return product;
};
