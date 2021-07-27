const express = require("express");
// const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
const password = "hHDrqMCwoQ3DiH8V";
const user = "user_todolist";

// let items = ["Study", "Eat", "Work", "Sleep"];

app.set("view engine", "ejs");
// app.use(bodyParser.urlencoded());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(
  `mongodb+srv://user_todolist:${password}@cluster0.xltgg.mongodb.net/todolistdb`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
mongoose.set("useFindAndModify", false);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listsSchema);

const study = new Item({
  name: "Study",
});

const eat = new Item({
  name: "Eat",
});

const sleep = new Item({
  name: "Sleep",
});

const options = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};
const today = new Date().toLocaleDateString("en-US", options);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems == 0) {
      Item.insertMany([eat, study, sleep], function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        day: today,
        items: foundItems,
      });
    }
  });
});

app.get("/:listName", function (req, res) {
  const newList = _.capitalize(req.params.listName);
  List.findOne({ name: newList }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: newList,
          items: [eat, study, sleep],
        });
        list.save();
        res.redirect("/" + newList);
      } else {
        res.render("list", {
          day: foundList.name,
          items: foundList.items,
        });
      }
    }
  });
});

app.post("/add", function (req, res) {
  const item = new Item({
    name: req.body.todo,
  });
  if (req.body.button == today) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: req.body.button }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + req.body.button);
    });
  }
});

app.post("/delete", function (req, res) {
  const checked = req.body.checkbox;
  const listName = req.body.listName;
  if (listName == today) {
    Item.deleteOne({ _id: checked }, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted");
        res.redirect("/");
      }
      // deleted at most one tank document
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checked } } },
      function (err, foundList) {
        if (!err) {
          console.log("Successfully deleted");
          res.redirect("/" + listName);
        }
      }
    );
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
