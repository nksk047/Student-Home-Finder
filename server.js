require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const csv = require("fast-csv");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/housing_db";
const CSV_FILE = "user-data.csv";

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Define Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["tenant", "owner"], required: true },
});

const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image_url: { type: String, required: true },
});

const PropertySchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  college_id: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  rent: { type: Number, required: true },
  images: [{ type: String }],
  description: { type: String },
});

const FavoriteSchema = new mongoose.Schema({
  tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  property_id: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
});

// ✅ Define Models
const User = mongoose.model("User", UserSchema);
const College = mongoose.model("College", CollegeSchema);
const Property = mongoose.model("Property", PropertySchema);
const Favorite = mongoose.model("Favorite", FavoriteSchema);

// ✅ File Upload Handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token.split(" ")[1], JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.user = user;
    next();
  });
};

// ✅ Signup Route (CSV & MongoDB Combined)
app.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  try {
    // Check if user exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to MongoDB
    const newUser = new User({ username, email, password: hashedPassword, role });
    await newUser.save();

    // Save user to CSV
    const csvStream = fs.createWriteStream(CSV_FILE, { flags: "a" });
    csvStream.write(`\n${username},${email},${hashedPassword},${role}`);
    csvStream.end();

    res.status(201).json({ message: "Signup successful!" });
  } catch (error) {
    res.status(500).json({ message: "Signup failed!", error });
  }
});

// ✅ Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token, role: user.role });
});

// ✅ Get All Colleges
app.get("/colleges", async (req, res) => {
  const colleges = await College.find();
  if (!colleges.length) return res.status(404).json({ message: "No colleges found" });

  res.json(colleges);
});

// ✅ Get Properties for a College
app.get("/properties/:college_id", async (req, res) => {
  const properties = await Property.find({ college_id: req.params.college_id }).populate("owner_id");
  if (!properties.length) return res.status(404).json({ message: "No properties found" });

  res.json(properties);
});

// ✅ Add Property (Only for Owners)
app.post("/add-property", authenticateToken, upload.array("images", 5), async (req, res) => {
  if (req.user.role !== "owner") return res.status(403).json({ message: "Access Denied" });

  const { name, address, rent, description, college_id } = req.body;
  const images = req.files.map((file) => `/uploads/${file.filename}`);

  const property = new Property({ owner_id: req.user.userId, college_id, name, address, rent, images, description });
  await property.save();

  res.status(201).json({ message: "Property listed successfully" });
});

// ✅ Add Property to Favorites (Tenant Only)
app.post("/favorite", authenticateToken, async (req, res) => {
  if (req.user.role !== "tenant") return res.status(403).json({ message: "Access Denied" });

  const { property_id } = req.body;
  const favorite = new Favorite({ tenant_id: req.user.userId, property_id });
  await favorite.save();

  res.status(201).json({ message: "Property added to favorites" });
});

// ✅ Get Tenant's Favorite Properties
app.get("/favorites/:tenant_id", authenticateToken, async (req, res) => {
  const favorites = await Favorite.find({ tenant_id: req.params.tenant_id }).populate("property_id");
  if (!favorites.length) return res.status(404).json({ message: "No favorite properties found" });

  res.json(favorites.map((fav) => fav.property_id));
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
