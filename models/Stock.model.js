const { Schema, model } = require("mongoose");

const stockSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
      trim: true,
    },
    SKU: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
    },
    precio: {
      type: Number,
      required: true,
      trim: true,
    },
    talla: {
      type: String,
      required: true,
      trim: true,
    }
  },
  { versionKey: false }
);

const Stock = model("Stock", stockSchema);

module.exports = Stock;
