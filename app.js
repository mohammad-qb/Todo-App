const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path");
const Joi = require("joi");

const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

const db = require("./db");
const collection = "todo";

const schema = Joi.object().keys({
  todo: Joi.string().required(),
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/getTodos", (req, res) => {
  db.getDB()
    .collection(collection)
    .find({})
    .toArray((err, documents) => {
      if (err) {
        console.log(err);
      } else {
        console.log(documents);
        res.json(documents);
      }
    });
});

app.put("/:id", (req, res, next) => {
  const todoID = req.params.id;
  const userInput = req.body;

  Joi.validate(userInput, schema, (err, result) => {
    if (err) {
      const error = new Error("Invalid Input");
      error.status = 400;
      next(error);
    } else {
      db.getDB()
        .collection(collection)
        .findOneAndUpdate(
          { _id: db.getPrimaryKey(todoID) },
          { $set: { todo: userInput.todo } },
          { returnOriginal: false },
          (err, result) => {
            if (err) {
              const error = new Error("Faild to Edit Todo Document");
              error.status = 400;
              next(error);
            } else {
              res.json({
                result,
                msg: "Successfully Edit Todo!!!",
                error: null,
              });
            }
          }
        );
    }
  });
});

app.post("/", (req, res, next) => {
  const userInput = req.body;

  Joi.validate(userInput, schema, (err, result) => {
    if (err) {
      const error = new Error("Invalid Input");
      error.status = 400;
      next(error);
    } else {
      db.getDB()
        .collection(collection)
        .insertOne(userInput, (err, result) => {
          if (err) {
            const error = new Error("Faild to insert Todo Document");
            error.status = 400;
            next(error);
          } else {
            res.json({
              result: result,
              document: result.ops[0],
              msg: "Successfully inserted Todo!!!",
              error: null,
            });
          }
        });
    }
  });
});

app.delete("/:id", (req, res) => {
  const todoID = req.params.id;
  db.getDB()
    .collection(collection)
    .findOneAndDelete({ _id: db.getPrimaryKey(todoID) }, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.json(result);
      }
    });
});

app.use((err, req, res, next) => {
  res.status(err.status).json({
    error: {
      message: err.message,
    },
  });
});

db.connect((err) => {
  if (err) {
    console.log("unable to connect with database");
    process.exit(1);
  } else {
    app.listen(PORT, () =>
      console.log(`connected to databse, app listening on port = ${PORT} `)
    );
  }
});
