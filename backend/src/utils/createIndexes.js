// utils/createIndexes.js
// Utility to ensure all required MongoDB indexes are created
// Call this once after starting the server

import Book from "../model/book.model.js";

export const createIndexes = async () => {
  try {
    console.log("Creating MongoDB indexes...");

    // Ensure 2dsphere index for geospatial queries
    await Book.collection.createIndex({ "location.geoPoint": "2dsphere" });
    console.log("✓ 2dsphere index created for location.geoPoint");

    // Ensure other indexes
    await Book.collection.createIndex({ userId: 1 });
    console.log("✓ Index created for userId");

    await Book.collection.createIndex({ category: 1 });
    console.log("✓ Index created for category");

    await Book.collection.createIndex({ "location.city": 1 });
    console.log("✓ Index created for location.city");

    await Book.collection.createIndex({ available: 1 });
    console.log("✓ Index created for available");

    console.log("All indexes created successfully!");
  } catch (error) {
    console.error("Error creating indexes:", error.message);
  }
};

export default createIndexes;
