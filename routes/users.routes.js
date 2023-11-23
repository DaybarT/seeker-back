const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const cloudinary = require("cloudinary");
const { v4: uuidv4 } = require("uuid");

// registro de usuarios -> auth/register
router.post("/register", async (req, res) => {
  try {
    // obtenemos los datos del cuerpo de la solicitud
    const { email, password, fullName, username } = req.body;

    // revisa si los valores no estan vacios
    if (email === "" || password === "" || fullName === "" || username === "") {
      res.status(400).json({ message: "Rellena todos los campos" });
      return;
    }

    // mira si es una email valido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Introduce un email valido" });
      return;
    }

    User.findOne({ email }).then((foundUser) => {
      // si el email ya esta registrado, arrojara un error
      if (foundUser) {
        res.status(400).json({ message: "Email ya registrado" });
        return;
      }
    });

    User.findOne({ username }).then((foundUsername) => {
      // si el nombre de usuario ya esta registrado, arrojara un error
      if (foundUsername) {
        res.status(400).json({ message: "Nombre de usuario ya registrado" });
        return;
      }
    });

    // Genera el hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // creamos una instancia del modelo User
    const newUser = new User({
      email: email,
      password: hashedPassword,
      fullName: fullName,
      image: process.env.IMAGE_DEFAULT,
      username: username,
      role: process.env.ROLE,
    });
    // guardamos el usuario en la base de datos
    await newUser.save();

    res.status(201).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al registrar el usuario" });
  }
});

// inicio de sesión de usuarios -> auth/login
router.post("/login", async (req, res) => {
  try {
    // recogemos los datos del cuerpo de la solicitud
    const { email, password, remember } = req.body;

    // comprobar si existe el email en la bbdd
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({ error: "Email incorrecto" });
    }

    // comprobar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const expirationTime = remember ? "30d" : "3h"; // Ejemplo: 30 días si remember, 3 hora si no

    // Si las credenciales son válidas, generamos un token JWT
    const payload = {
      userId: user._id, // Puedes incluir otros datos del usuario aquí
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      image: user.image,
    };

    const token = jwt.sign(payload, process.env.TOKEN_SECRET, {
      expiresIn: expirationTime,
    });

    //console.log(token);
    res.status(200).json({ message: "Inicio de sesión exitoso", token });
  } catch (error) {
    res.status(500).json({ error: "Error en el inicio de sesión" });
  }
});

// desconectar al usuario
router.get("/disconnect", isAuthenticated, (req, res) => {
  //para que quiero validar el token? y si no es valido no lo desconecto en front?
  try {
    // Verifica si el encabezado Authorization existe
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    // Separa el token del encabezado
    const token = req.headers.authorization.split(" ")[1];

    // Verifica el token usando jwt.verify
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Token no válido" });
      }

      // El token es válido, procede a desconectar al usuario
      res.status(200).json({ message: "Desconectado" });
    });
  } catch (error) {
    res.status(500).json({ error: "Error al desconectar al usuario" });
  }
});

//isAuthenticated
router.get("/verify", isAuthenticated, async (req, res) => {
  try {
    // Verifica si el encabezado Authorization existe
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    // Separa el token del encabezado
    const token = req.headers.authorization.split(" ")[1];

    // Verifica el token usando jwt.verify
    const decoded = await jwt.verify(token, process.env.TOKEN_SECRET);

    // Si el token es válido, respondes con el payload del

    res.status(200).json(decoded);
  } catch (error) {
    console.error("Error al verificar el token:", error);
    return res.status(401).json({ message: "Token no válido" });
  }
});
router.post("/update", isAuthenticated, async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    const token = req.headers.authorization.split(" ")[1];

    const decoded = await jwt.verify(token, process.env.TOKEN_SECRET);

    let newEmail = email ? email : decoded.email;
    let newPassword = password
      ? await bcrypt.hash(password, 10)
      : decoded.password;
    let newFullName = fullName ? fullName : decoded.fullName;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (email && !emailRegex.test(newEmail)) {
      res.status(400).json({ message: "Introduce un email valido" });
      return;
    }

    const updateProfile = await User.updateOne(
      { _id: decoded.userId },
      {
        $set: {
          email: newEmail,
          password: newPassword,
          fullName: newFullName,
        },
      }
    );
    console.log(updateProfile);

    res
      .status(200)
      .json({ message: "Perfil actualizado correctamente", updateProfile });
  } catch (error) {
    res.status(500).json({ message: "Hubo un error al actualizar el perfil" });
  }
});

router.post("/ForgotPassword", async (req, res) => {
  try {
    const { email } = req.body;

    // mira si es un email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Introduce un email válido" });
      return;
    }

    const foundUser = await User.findOne({ email });

    if (foundUser) {
      res.status(200).json({ "usuario encontrado: ": foundUser });
    }
  } catch (error) {
    console.error("Error en la solicitud ForgotPassword:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/UpdatePass", async (req, res) => {
  try {
    const { email, password } = req.body;

    const newPassword = await bcrypt.hash(password, 10);
    const updateProfile = await User.updateOne(
      { email: email },
      {
        $set: {
          password: newPassword,
        },
      }
    );

    if (updateProfile) {
      res.status(200).json({ "Contraseña Cambiada: ": updateProfile });
    }
  } catch (error) {
    console.error("Error en la solicitud UpdatePass:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;

/*
cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

const uniqueId = uuidv4();

cloudinary.v2.uploader.upload(
        newFile,
        {
          public_id: uniqueId,
        },
        async function (error, result) {
          if (error) {
            console.error("Error en la carga de la imagen:", error);
            return res
              .status(500)
              .json({ error: "Error en la carga de la imagen" });
          }

          newImage = result.url; // Asignar a la variable declarada fuera del bloque
          console.log(newImage)
          res.status(200).json({ message: "Imagen subida correctamente" });
        }
      );




*/
