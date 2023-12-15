const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const Stock = require("../models/Stock.model");
const Hypeboost = require("../models/Hypeboost.model");
const Product = require("../models/Product.model");
const jwt = require("jsonwebtoken");


router.post("/AddStock", isAuthenticated, async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await jwt.verify(token, process.env.TOKEN_SECRET);

    const { SKU, precio, talla } = req.body;
    // añade stock si no eres owner, si eres owner, inicia el scrapper para la busqueda del producto.
    let newStock;
    if (decoded.role === "owner") {
      const url = "http://localhost:5005/productTool/addProduct";
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.authorization,
        },
        body: JSON.stringify({ SKU }),
      };

      try {
        const response = await fetch(url, options);
        const body = await response.json();
        console.log("Producto registrado:", body);
        return res.status(200).json({ mensaje: "Producto registrado" });
      } catch (error) {
        console.error("Producto fallido:", error);
        return res
          .status(500)
          .json({ error: "Error al scrappear el producto" });
      }
    } else {
      const product = await Product.findOne({ SKU });
      if (product) {
        newStock = new Stock({
          username: decoded.username,
          SKU: SKU,
          precio: precio,
          talla: talla,
        });
      }
    }

    if (newStock) {
      await newStock.save();
      return res.status(200).json({ mensaje: "Producto registrado" });
    } else {
      return res
        .status(400)
        .json({ error: "El SKU no existe, o faltan campos" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Error al añadir el producto a tu stock" });
  }
});


router.get("/GetStock", isAuthenticated,async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await jwt.verify(token, process.env.TOKEN_SECRET);
    let allStock;
    //cogemos el username del token y lo pasamos para recuperar el stock del usuario, excepto si eres owner.
    if (decoded.role === "owner") {
      allStock = await Stock.find();
    } else {
      allStock = await Stock.find({ username: decoded.username });
    }
    const stockPrices = await Hypeboost.find();
    const productData = await Product.find();
    //esto recoge los datos de las 3 tablas y las une en funcion del SKU, de esta manera retornamos un objeto con toda la informacion.
    const stockBuilder = allStock.map((stockItem) => {
      const matchingPrice = stockPrices.find(
        (price) => price.SKU === stockItem.SKU
      );

      const matchingProduct = productData.find(
        (product) => product.SKU === stockItem.SKU
      );

      let formattedDate = null;
      if (matchingPrice && matchingPrice.Fecha) {
        const date = new Date(matchingPrice.Fecha);
        formattedDate = date.toLocaleString(); // Puedes usar otras funciones para el formato deseado
      }

      return {
        username: stockItem.username,
        _id: stockItem._id,
        SKU: stockItem.SKU,
        precio: stockItem.precio,
        talla: stockItem.talla,
        model: matchingProduct ? matchingProduct.model : null,
        img: matchingProduct ? matchingProduct.img : null,
        sizePrices: matchingPrice ? matchingPrice.sizePrices : null,
        Fecha: formattedDate,
      };
    });

    console.log(stockBuilder);
    res.status(200).json({ stock: stockBuilder });
  } catch (error) {
    res.status(500).json({ error: "Error al recuperar productos de stock:" });
  }
});

router.delete("/DeleteStock/:_id", isAuthenticated, async (req, res) => {
  try {
    const _id = req.params._id; // id del producto a eliminar

    const deletedProduct = await Stock.findByIdAndDelete(_id);
    

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ error: "Stock no encontrado para eliminar" });
    }

    res.status(200).json({ message: "Stock eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ "Error al eliminar el Stock:": error });
  }
});

module.exports = router;
