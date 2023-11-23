const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const Hypeboost = require("../models/Hypeboost.model");
const moment = require("moment");
const { spawn } = require("child_process");
const jwt = require("jsonwebtoken");

//isAuthenticated
router.post("/createhb", isAuthenticated, async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token no válido" });
    }
  });

  //recogido del fetch de product.routes.js
  const { SKU, sizePrices, Link } = req.body;

  try {
    const newHypeboost = new Hypeboost({
      SKU,
      sizePrices: sizePrices,
      Link: Link,
      Fecha: moment(),
    });

    await newHypeboost.save();

    res.status(200).json({ message: "OK" });
  } catch (error) {
    res.status(500).json({ error: "NOK" });
  }
});

router.patch("/update/:sku", isAuthenticated, async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Token no válido" });
      }
    });
    const productSKU = await Hypeboost.findOne({ SKU: req.params.sku });

    // console.log(productSKU.SKU);
    // console.log(productSKU.Link);

    if (!productSKU) {
      res.status(500).json({ "No encontrado": productSKU });
      return;
    }

    // Proceso python para tirar la request con el link

    const pythonScript =
      "/Users/daybart/Documents/Seeker/scrapper/scrapHBwLink.py";
    const procesoPython = spawn("python", [pythonScript, productSKU.Link]);

    // Espera a que el proceso Python termine
    const data = await new Promise((resolve) => {
      procesoPython.stdout.on("data", (data) => resolve(data));
    });

    try {
      const jsonData = JSON.parse(data.toString());
      console.log(jsonData);
      // Realiza cualquier operación adicional aquí con jsonData

      const updateHypeboost = await Hypeboost.updateOne(
        { _id: productSKU._id },
        { $set: { sizePrices: jsonData.size_price, Fecha: moment() } }
      );
      console.log(updateHypeboost);

      res.status(200).json({ message: "Precios actualizados con éxito" });
    } catch (error) {
      res.status(500).json({
        message: "Error del script, contacte con el owner",
        error: error.message,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar los precios", error });
  }
});

module.exports = router;
