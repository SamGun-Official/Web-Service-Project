const self = require("../controllers/user.controller");
const { response } = require("express");
const express = require("express");
const { Op, DATE } = require("sequelize");
const Joi = require("joi").extend(require("@joi/date"));
//Models:
const notification = require("../models/notification");
const accomodation = require("../models/accomodation");
const h_trans = require("../models/h_trans");
const d_trans = require("../models/d_trans");
const pricelist = require("../models/pricelist");
const usage = require("../models/usage");
const User = require("../models/user");
const router = express.Router();

const jwt = require("jsonwebtoken");
const JWT_KEY = "secret_key";

const auth = require('../controllers/auth.controller');

//npx sequelize-cli db:migrate:undo:all
//npx sequelize-cli db:migrate
//npx sequelize-cli db:seed:all

// function authenticate(roles, message = "Unauthorized") {
//   return (req, res, next) => {
//     const token = req.header("x-auth-token");
//     if (!token) {
//       return res.status(401).send(message);
//     }
//     const payload = jwt.verify(token, JWT_KEY);

//     if (roles.includes("ALL") || roles.includes(payload.role)) {
//       req.body = { ...req.body, ...payload };
//       next();
//     } else {
//       return res.status(401).send(message);
//     }
//   };
// }

router.get("/", async function (req, res) {
  let name = req.query.name ?? "";
  const users = await self.getAll(name);
  return res.status(200).send(users);
});

router.get("/:id", async function (req, res) {
  let id = req.params.id;
  let user = await self.getById(id);
  return res.status(200).send(user);
});

const ROLE = ["Admin", "Developer", "Penyedia tempat tinggal"];
router.post("/login", async function (req, res) {
  let { username, password } = req.body;
  const schema = Joi.object({
    username: Joi.string()
      .required()
      .external(async function () {
        let user_with_username = await User.findOne({
          where: {
            username: {
              [Op.eq]: username,
            },
          },
        });
        if (user_with_username == null) {
          throw Error("Username tidak ditemukan");
        }
        if (user_with_username.password != password) {
          throw Error("Password salah");
        }
      }),
    password: Joi.string().min(5).required(),
  });
  try {
    await schema.validateAsync(req.body);
    let user = await self.login(req, res);
    if (user) {
      return res.status(201).send({
        message: "Berhasil login!",
        user: {
          username: user.username,
          email: user.email,
          role: ROLE[user.role],
          token: user.token,
        },
      });
    }

    return res.status(400).send({
      message: "Gagal login!",
    });
  } catch (e) {
    return res.status(400).send({
      message: e.message,
    });
  }
});
router.post("/register", async function (req, res) {
  let { username, password, name, email, role, phone_number, tanggal_lahir, id_card_number } = req.body;
  //JOI validations
  const schema = Joi.object({
    username: Joi.string()
      .required()
      .external(async function () {
        let user_with_username = await User.findOne({
          where: {
            username: {
              [Op.eq]: username,
            },
          },
        });
        if (user_with_username != null) {
          throw Error("Username harus unik");
        }
      }),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    email: Joi.string()
      .email()
      .required()
      .external(async function () {
        let user_with_email = await User.findOne({
          where: {
            email: {
              [Op.eq]: email,
            },
          },
        });
        if (user_with_email != null) {
          throw Error("Email harus unik");
        }
      }),

    role: Joi.number().valid(2, 3).required(),
    phone_number: Joi.string().pattern(new RegExp("^[0-9]{10,12}$")).required(),
    tanggal_lahir: Joi.date().max("now").required().format("DD/MM/YYYY"),
    id_card_number: Joi.string()
      .pattern(new RegExp("^[0-9]{14}$"))
      .required()
      .external(async function () {
        let user_with_id_card_number = await User.findOne({
          where: {
            id_card_number: {
              [Op.eq]: id_card_number,
            },
          },
        });
        if (user_with_id_card_number != null) {
          throw Error("ID card number harus unik");
        }
      }),
  });

  try {
    await schema.validateAsync(req.body);
    let registerResult = await self.register(req, res);
    if (registerResult) {
      return res.status(201).send({ message: "Berhasil register!" });
    }
    return res.status(400).send({
      message: "Gagal register!",
    });
  } catch (e) {
    return res.status(400).send({
      message: e.message,
    });
  }
});

router.put("/:id/edit", async function (req, res) {
  let id = req.params.id;
  let { username, password, name, email, role, phone_number, tanggal_lahir, id_card_number } = req.body;
  //JOI validations
  const schema = Joi.object({
    username: Joi.string()
      .external(async function () {
        let user_with_username = await User.findOne({
          where: {
            username: {
              [Op.eq]: username,
            },
            id: {
              [Op.ne]: id,
            },
          },
        });
        console.log(user_with_username);
        if (user_with_username != null) {
          throw Error("Username harus unik");
        }
      })
      .allow("", null),
    password: Joi.string().min(6).allow("", null),
    name: Joi.string().allow("", null),
    email: Joi.string()
      .email()
      .external(async function () {
        let user_with_email = await User.findOne({
          where: {
            email: {
              [Op.eq]: email,
            },
            id: {
              [Op.ne]: id,
            },
          },
        });
        if (user_with_email != null) {
          throw Error("Email harus unik");
        }
      })
      .allow("", null),
    role: Joi.number().valid(2, 3).allow("", null),
    phone_number: Joi.string().pattern(new RegExp("^[0-9]{10,12}$")).allow("", null),
    tanggal_lahir: Joi.date().max("now").format("DD/MM/YYYY").allow("", null),
    id_card_number: Joi.string()
      .pattern(new RegExp("^[0-9]{14}$"))
      .external(async function () {
        let user_with_id_card_number = await User.findOne({
          where: {
            id_card_number: {
              [Op.eq]: id_card_number,
            },
            id: {
              [Op.ne]: id,
            },
          },
        });
        if (user_with_id_card_number != null) {
          throw Error("ID card number harus unik");
        }
      })
      .allow("", null),
  }).min(1);
  try {
    await schema.validateAsync(req.body);
    let edited_user = await self.edit(id, req, res);
    return res.status(400).send({ message: "Berhasil edit!", user: edited_user });
  } catch (e) {
    return res.status(400).send({
      message: e.message,
    });
  }
});

router.post("/:id/verify", async function (req, res) {
  let id = req.params.id;
  console.log(id);
  const schema = Joi.object({
    id: Joi.number()
      .required()
      .external(async function () {
        let user_with_id = await User.findOne({
          where: {
            id: {
              [Op.eq]: id,
            },
          },
        });
        if (user_with_id == null) {
          throw Error("ID tidak ditemukan");
        }
      }),
  });

  try {
    await schema.validateAsync(req.params);
    let verifyResult = await self.verify(id,req,res);
    if (verifyResult) {
      return res.status(201).send({ message: "Berhasil upload!" });
    }
    return res.status(400).send({
      message: "Gagal upload!",
    });
  } catch (e) {
    return res.status(400).send({
      message: e.message,
    });
  }
});

module.exports = router;
