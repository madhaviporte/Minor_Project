const express = require("express");
const cors = require("cors");
require("dotenv").config();
const fileRoutes = require("./routes/fileRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Secure File Storage Backend is Running!");
});

const PORT = process.env.PORT || 3000;
app.use("/api/files", fileRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});