const { Schema, model } = require("mongoose");
const uuid = require("uuid");

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    fullName: {
      type: String,
      required: [true, "Name is required."],
    },
    image:{
      type: String,
      required: true
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { versionKey: false }
);

const User = model("User", userSchema);

module.exports = User;
