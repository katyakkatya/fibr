const mongoose = require("mongoose");
const express = require("express");
const app = express();

const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  age: { type: Number, min: 18 },
  created_at: { type: Number, required: true }, // Unix timestamp
  updated_at: { type: Number, required: true }, // Unix timestamp
});

const User = mongoose.model("User", userSchema);

mongoose
  .connect("mongodb://YourMongoAdmin:1234@localhost:27017/admin")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection error:", err));

app.use(express.json());

app.post("/api/users", async (req, res) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const user = new User({
      ...req.body,
      created_at: now,
      updated_at: now,
    });
    await user.save();
    res.status(201).send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findOne({ id: parseInt(req.params.id) });
    if (!user) return res.status(404).send("User not found");
    res.send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.patch("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      { ...req.body, updated_at: Math.floor(Date.now() / 1000) },
      { new: true },
    );
    if (!user) return res.status(404).send("User not found");
    res.send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: parseInt(req.params.id) });
    if (!user) return res.status(404).send("User not found");
    res.send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
