const express = require("express");
const cors = require("cors");
require("dotenv").config();

const fileRoutes = require("./routes/fileRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

const PORT = Number(process.env.PORT) || 3000;

// Only the frontend origins listed here may call the API from a browser.
// Default: the Vite development server.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            // Requests without an Origin header (curl, Postman) are allowed.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            callback(null, false);
        }
    })
);

// No JSON API yet, but this keeps simple future endpoints working.
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
    res.send("Secure File Storage Backend is Running!");
});

app.use("/api/files", fileRoutes);

// JSON responses for unknown routes and for all errors (including Multer).
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Allowed frontend origin(s): ${allowedOrigins.join(", ")}`);
});
