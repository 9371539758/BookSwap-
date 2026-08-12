import { body, validationResult } from "express-validator";

// ─── REGISTER VALIDATOR ───────────────────────────────────────────────────────
// Middleware array that validates each field before calling the register controller.
// Runs in the route before the controller: POST /api/auth/register
// FIX: username is now REQUIRED (not optional), fullName is optional.

export const registerValidator = [
  // username — required, 3–30 chars
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  // fullName — optional display name
  body("fullName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Full name must be between 2 and 60 characters"),

  // email — required, must be valid format
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address"),

  // password — required, minimum 8 characters
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  // phone — optional, valid Indian phone number
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid Indian phone number"),

  // location — entirely optional nested object
  body("location.city")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 50 })
    .withMessage("City name too long"),

  body("location.state")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 50 })
    .withMessage("State name too long"),

  body("location.country")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Country name too long"),

  // ─── ERROR HANDLER ────────────────────────────────────────────────────────
  // If any validation above fails, return 400 with all error messages.
  // Otherwise, call next() to proceed to the register controller.
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return the first error message to keep it simple for the frontend
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    next();
  },
];
