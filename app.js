const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
const path = require("path");
const Joi = require("joi");

const db = require("./db");
const collection = "todo";

const schema = Joi.object().keys({
  todo: Joi.string().required()
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/getTodos", (req, res) => {
  db.getDB()
    .collection(collection)
    .find({})
    .toArray((err, documents) => {
      if (err) console.log(err);
      else {
        console.log(documents);
        res.json(documents);
      }
    });
});

app.put("/:id", (req, res) => {
  // Primary Key of Todo Document we wish to update
  const todoID = req.params.id;
  // Document used to update
  const userInput = req.body;
  // Find Document By ID and Update
  db.getDB()
    .collection(collection)
    .findOneAndUpdate(
      { _id: db.getPrimaryKey(todoID) },
      { $set: { todo: userInput.todo } },
      { returnOriginal: false },
      (err, result) => {
        if (err) console.log(err);
        else {
          res.json(result);
        }
      }
    );
});

app.post("/", (req, res) => {
  const userInput = req.body;
  Joi.validate(userInput, schema, (err, result) => {
    if (err) {
      const error = new Error("Invalid Input");
      err.status = 400;
      next(error);
    } else {
      db.getDB()
        .collection(collection)
        .insertOne(userInput, (err, result) => {
          if (err) {
            const error = new Error("Failed to insertTodo");
            err.status = 400;
            next(error);
          } else
            res.json({
              result: result,
              documents: result.ops[0],
              msg: "Succesfully inserted",
              error: null
            });
        });
    }
  });
});

app.delete("/:id", (req, res) => {
  const todoId = req.params.id;
  db.getDB()
    .collection(collection)
    .findOneAndDelete({ _id: db.getPrimaryKey(todoId) }, (err, result) => {
      if (err) console.log(err);
      else res.json(result);
    });
});

app.use((err, req, res, next) => {
  res.status(err.status).json({
    error: {
      message: err.message
    }
  });
});

db.connect(err => {
  // If err unable to connect to database
  // End application
  if (err) {
    console.log("unable to connect to database");
    process.exit(1);
  }
  // Successfully connected to database
  // Start up our Express Application
  // And listen for Request
  else {
    app.listen(3000, () => {
      console.log("connected to database, app listening on port 3000");
    });
  }
});
