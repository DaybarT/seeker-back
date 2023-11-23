const { Schema, model } = require("mongoose");

const hypeboostSchema = new Schema(
  {
    SKU: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
    },
    sizePrices: {
      type: JSON,
      required: false,
    },
    Link: {
      type: String,
      required: [true, "Link is required"],
      unique: true,
      trim: true,
    },
    Fecha: {
      type: Date
    },
  },
  { versionKey: false }
);

const Hypeboost = model("Hypeboost", hypeboostSchema);

module.exports = Hypeboost;
