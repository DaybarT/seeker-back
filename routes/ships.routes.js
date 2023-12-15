const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { AfterShip } = require("aftership");
const Ships = require("../models/Ships.model");
const jwt = require("jsonwebtoken");

const Aftership = new AfterShip(process.env.AFTERSHIP_API_KEY);

router.post("/newTracking", isAuthenticated, async (req, res, next) => {
  const {
    shipName,
    shipTrack,
    slug,
    shipDestino,
    shipOrigen,
    shipCpostal,
    shipFenvio,
  } = req.body;
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await jwt.verify(token, process.env.TOKEN_SECRET);
    //recoge los campos que no esten vacios, los registra en la bbdd dependiendo de eso.
    if (decoded.role !== "owner") {
      const newShip = new Ships({
        name: shipName,
        track: shipTrack,
        slug: slug,
        destino: shipDestino || null,
        origen: shipOrigen || null,
        cPostal: shipCpostal || null,
        fEnvio: shipFenvio || null,
        idAfterShip: null,
        isSended: false,
        username: decoded.username,
      });

      await newShip.save();
      return res.status(200).json(newShip); 
    } else {
      return res
        .status(401)
        .json({
          error: "Solo tienes permisos de administración",
        });
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});


router.get("/getTrackings", isAuthenticated,async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }
    //recupera los envios con el username del token
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await jwt.verify(token, process.env.TOKEN_SECRET);
    let allShips;
    if (decoded.role === "owner") {
      allShips = await Ships.find();
    } else {
      allShips = await Ships.find({ username: decoded.username });
    }
    res.status(200).json({ ships: allShips });
  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//-------------------------------------------------------------------------------------

router.delete(
  "/deleteTracking/:_id",
  isAuthenticated,
  async (req, res, next) => {
    const _id = req.params._id;
    try {
      if (!req.headers.authorization) {
        return res.status(401).json({ message: "Token no proporcionado" });
      }
      const token = req.headers.authorization.split(" ")[1];
      const decoded = await jwt.verify(token, process.env.TOKEN_SECRET);
      const deleteShip = await Ships.findByIdAndDelete(_id);
      //eliminamos por id, porque cuando los recuperamos montamos por id.
      if (deleteShip.AfterShip) {
        Aftership.tracking
          .deleteTracking({
            id: deleteShip.idAfterShip,
          })
          .then((result) => console.log(result))
          .catch((e) => console.log(e));

        console.log(deleteShip.idAfterShip);
      }

      res.status(200).json({ deleteShip });
    } catch (error) {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);
// isAuthenticated

router.get("/goTrack/:_id", isAuthenticated, async (req, res, next) => {
  const _id = req.params._id;
  //con este endpoint haces funcionar la api, haces peticion.
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await jwt.verify(token, process.env.TOKEN_SECRET);
    const ship = await Ships.findById(_id);
    if (!ship) {
      return res.status(401).json({ error: "No registrado en BBDD" });
    }
    if (!ship.slug) {
      return res.status(401).json({ error: "Slug no registrado en BBDD" });
    }
    if (!ship.track) {
      return res.status(401).json({ error: "Tracking no registrado en BBDD" });
    }

    let payload = {
      tracking: {
        slug: ship.slug,
        tracking_number: ship.track,
      },
    };

    if (ship.destino && ship.origen) {
      payload.tracking.tracking_origin_country = ship.origen;
      payload.tracking.tracking_destination_country = ship.destino;
    }

    if (ship.fEnvio) {
      payload.tracking.tracking_ship_date = ship.fEnvio;
    }

    if (ship.tracking_postal_code) {
      payload.tracking.tracking_postal_code = ship.tracking_postal_code;
    }

    console.log(payload);

    const result = await Aftership.tracking.createTracking(payload);

    const updateShip = await Ships.updateOne(
      { _id: _id },
      {
        $set: {
          isSended: true,
          idAfterShip: result.tracking.id,
        },
      }
    );

    res.status(200).json({ trackingData: updateShip });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/getTracking/:_id", isAuthenticated,async (req, res, next) => {
  // ESTO YA FUNCIONA
  //llamada a la api con su id para ver en que puntos esta el pedido
  const _id = req.params._id;
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await jwt.verify(token, process.env.TOKEN_SECRET);
    const ship = await Ships.findById(_id);
    if (!ship) {
      res.status(401).json({ error: "No registrado en BBDD" });
    }
    if (ship.isSended === false) {
      res.status(401).json({ error: "No enviado a la API" });
    }
    if (!ship.idAfterShip) {
      res.status(401).json({ error: "API ID inexistente" });
    }

    await Aftership.tracking
      .getTracking({
        id: ship.idAfterShip,
      })
      .then((result) => {
        console.log(result);
       
        res.status(200).json({ result });
      })
      .catch((e) => {
        console.log(e);
        
        res.status(500).json({ error: "Error al obtener el seguimiento" });
      });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
