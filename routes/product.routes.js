const express = require("express");
const router = express.Router();
const Product = require("../models/Product.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { spawn } = require("child_process");
const Hypeboost = require("../models/Hypeboost.model");
const jwt = require("jsonwebtoken");
const Stock = require("../models/Stock.model");

const moment = require("moment");

router.post("/addProduct", isAuthenticated, async (req, res) => {
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

    //recogido del fetch de stock.routes.js
    const { SKU } = req.body;

    // comprobar si existe el producto existe en la bbdd
    const product = await Product.findOne({ SKU });

    if (product) {
      console.log("Producto ya registrado en la BBDD");

      res.status(200).json({ product });
      return;
    }

    const pythonScript = "/Users/daybart/Documents/Seeker/scrapper/scrapHB.py";
    const procesoPython = spawn("python", [pythonScript, SKU]);

    const data = await new Promise((resolve) => {
      procesoPython.stdout.on("data", (data) => resolve(data));
    });

    try {
      const jsonData = JSON.parse(data.toString());
      console.log(jsonData);
      if (jsonData) {
        const newProduct = new Product({
          SKU,
          model: jsonData.name,
          img: jsonData.image,
        });
        await newProduct.save();

        const url = "http://localhost:5005/hb/createhb";
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization,
          },
          body: JSON.stringify({
            SKU: SKU,
            sizePrices: jsonData.size_price,
            Link: jsonData.link,
          }),
        };

        try {
          const response = await fetch(url, options);
          const body = await response.json();
          console.log("Precios registrados:", body);
        } catch (error) {
          console.error("Precios no registrados:", error);
        }
      }
      return res.status(200).json({ message: "Producto guardado con éxito" });
    } catch (error) {
      console.error("Error del script, contacte con el owner", error);
      return res.status(500).json({ error: "Producto no registrado" });
    }
  } catch (error) {
    console.error("Error general en el servidor:", error);
    return res.status(500).json({ error: "Producto no registrado" });
  }
});

router.get("/GetProducts", isAuthenticated, async (req, res) => {
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
    const users = await Stock.find();
    const productData = await Product.find();
    const stockPrices = await Hypeboost.find();

    const productBuilder = productData.map((productItem) => {
      const matchingPrice = stockPrices.find(
        (price) => price.SKU === productItem.SKU
      );

      let formattedDate = null;
      if (matchingPrice && matchingPrice.Fecha) {
        const date = new Date(matchingPrice.Fecha);
        formattedDate = date.toLocaleString(); // Puedes usar otras funciones para el formato deseado
      }
      // Filtrar usuarios que coincidan con el SKU actual
      const matchedUsers = users.filter((user) => user.SKU === productItem.SKU);

      // Obtener solo los nombres de usuario de los usuarios filtrados
      const usernames = matchedUsers.map((user) => ({
        username: user.username,
        talla: user.talla,
      }));

      return {
        SKU: productItem.SKU,
        model: productItem.model,
        img: productItem.img,
        sizePrices: matchingPrice ? matchingPrice.sizePrices : null,
        Fecha: formattedDate,
        stockAvailable: usernames,
      };
    });

    console.log(productBuilder);
    res.status(200).json({ products: productBuilder });
  } catch (error) {
    res.status(500).json({ error: "Error al recuperar productos:" });
  }
});

module.exports = router;
