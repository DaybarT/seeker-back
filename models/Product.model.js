const { Schema, model } = require("mongoose");

const productSchema = new Schema(
  {
    SKU: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    img: {
      type: String,
      required: false,
      trim: true,
    }
  },
  { versionKey: false }
);

const Product = model("Product", productSchema);

module.exports = Product;
