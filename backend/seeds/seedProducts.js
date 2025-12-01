const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const Product = require("../models/Product");

const FRONTEND_MOCK = path.resolve(
  __dirname,
  "..",
  "..",
  "frontend",
  "data",
  "mock.ts"
);

async function connect() {
  if (
    !process.env.MONGO_URI ||
    process.env.MONGO_URI.includes("your_mongodb")
  ) {
    console.error(
      "Please set a valid MONGO_URI in backend/.env before running the seed script."
    );
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to MongoDB");
}

function extractProductsFromMock(tsContent) {
  // Find the PRODUCTS array block
  const startIndex = tsContent.indexOf("export const PRODUCTS");
  if (startIndex === -1)
    throw new Error("PRODUCTS export not found in mock.ts");
  // slice from the export onward, then find the '=' sign so we skip any
  // type annotation like `Product[]` which contains its own brackets.
  const after = tsContent.slice(startIndex);
  const eqIndex = after.indexOf("=");
  if (eqIndex === -1)
    throw new Error("Could not find '=' for PRODUCTS assignment");
  const afterEq = after.slice(eqIndex + 1);

  // Now find the array literal starting bracket after the '='
  const arrayStart = afterEq.indexOf("[");
  if (arrayStart === -1)
    throw new Error("Could not find array start for PRODUCTS");

  // find the matching closing bracket for the array by counting
  let idx = arrayStart;
  let open = 0;
  let endIdx = -1;
  for (; idx < afterEq.length; idx++) {
    const ch = afterEq[idx];
    if (ch === "[") open++;
    if (ch === "]") {
      open--;
      if (open === 0) {
        endIdx = idx;
        break;
      }
    }
  }
  if (endIdx === -1) throw new Error("Could not parse PRODUCTS array end");

  const arrayLiteral = afterEq.slice(arrayStart, endIdx + 1);

  // Replace TypeScript enum references like VerticalType.DEALS with strings 'DEALS'
  let jsLiteral = arrayLiteral.replace(/VerticalType\.(\w+)/g, "'$1'");

  // Remove trailing TypeScript-only constructs (if any). For this mock file, it should be plain JS after the above replacement.
  // Evaluate the array literal safely
  const func = new Function("return " + jsLiteral + "");
  const products = func();
  return products;
}

async function seed() {
  try {
    await connect();

    const ts = fs.readFileSync(FRONTEND_MOCK, "utf8");
    console.log("Read frontend mock.ts -- parsing PRODUCTS...");

    const products = extractProductsFromMock(ts);
    console.log(`Parsed ${products.length} products from mock.ts`);

    // Clear existing products (optional)
    await Product.deleteMany({});
    console.log("Cleared existing products collection");

    // Bulk insert
    const docs = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: p.price || 0,
      originalPrice: p.originalPrice || null,
      discount: p.discount || null,
      image: p.image || "",
      category: p.category || "",
      vertical: p.vertical || "",
      storeName: p.storeName || "",
      storeId: p.storeId || "",
      stock: p.stock || 0,
      rating: p.rating || 4.5,
      distance: p.distance || "",
      deliveryTime: p.deliveryTime || "",
      expiryDate: p.expiryDate || null,
      weight: p.weight || null,
      origin: p.origin || null,
      material: p.material || null,
      dimensions: p.dimensions || null,
    }));

    await Product.insertMany(docs);
    console.log("Inserted products into MongoDB");

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
