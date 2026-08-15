// test-cloudinary.js
// Quick test: upload a public image URL to Cloudinary using server-side SDK
// Uses backend/utils/cloudinary.js (reads .env).
import cloudinary from '../utils/cloudinary.js';

(async () => {
  try {
    console.log('Testing Cloudinary upload...');
    const result = await cloudinary.uploader.upload('https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png');
    console.log('Upload OK:', result.secure_url);
    process.exit(0);
  } catch (err) {
    console.error('Upload FAILED:', err);
    process.exit(2);
  }
})();
