import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use();
app.get("/", (req, res) => {
  res.json({ message: "hello there! This is the node js backend" });
});
app.listen(3000, () => {
  console.log("running on port 3000");
});
