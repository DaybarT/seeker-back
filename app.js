// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/Api", indexRoutes);

const authRoutes = require("./routes/users.routes");
app.use("/auth", authRoutes);

const stockTools = require("./routes/product.routes");
app.use("/productTool", stockTools);

const add = require("./routes/stock.routes");
app.use("/stock", add);

const hb = require("./routes/hypeboost.routes");
app.use("/hb", hb);

const ships = require("./routes/ships.routes");
app.use("/ships", ships);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;
