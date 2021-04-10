const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { ExtractJwt, Strategy } = require("passport-jwt");
const dotenv = require("dotenv");

dotenv.config();

const userService = require("./user-service.js");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

/* TODO Add Your Routes Here */
app.use(passport.initialize());
passport.use(
  new Strategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async function verify(payload, done) {
      if (!payload) {
        return done(null, false);
      }
      let user;
      try {
        user = await userService.byId(payload._id);
      } catch (err) {
        console.log(err);
        return done(null, false);
      }
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    }
  )
);

function createToken(id, username) {
  const payload = {
    _id: id,
    userName: username,
  };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: "3d" };

  return jwt.sign(payload, secret, options);
}

app.post("api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg });
    })
    .catch((err) => {
      
      res.status(422).json({ message: err });
    });
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      res.json({
        message: "login successful",
        token: createToken(user._id, user.userName),
      });
    })
    .catch((err) => {
      res.status(422).json({ message: err });
    });
});

app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.json({ error: err });
      });
  }
);

app.put(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .addFavourite(req.user._id, req.body)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.json({ error: err });
      });
  }
);

app.delete(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .removeFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.json({ error: err });
      });
  }
);

userService
  .connect()
  .then(() => {
 
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });
