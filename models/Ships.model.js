const { Schema, model } = require("mongoose");

const shipsSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },
    track: {
      type: String,
      required: [true, "track is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "slug is required"],
    },
    destino: {
      type: String,
      trim: true,
      required: false,
    },
    origen: {
      type: String,
      trim: true,
      required: false,
    },
    cPostal: {
      type: Number,
      trim: true,
      required: false,
    },
    fEnvio: {
      type: String,
      trim: true,
      required: false,
    },
    idAfterShip: {
      type: String,
      required: false,
      trim: true,
    },
    isSended: {
        type: Boolean,
        required: false,
        trim: true,
      },
    username: {
      type: String,
      required: [true, "username is required"],
      trim: true,
    },
  },
  { versionKey: false }
);

const Ships = model("Ships", shipsSchema);

module.exports = Ships;
