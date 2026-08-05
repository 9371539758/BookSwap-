import { body, validationResult } from "express-validator";

export const registerValidator = [
  body("username")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Name must be between 3 and 30 characters"),

  body("email").trim().isEmail().withMessage("Invalid email"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("location.city")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  body("location.state")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("State is required"),

  body("location.country")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Country is required"),

  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .isMobilePhone("en-IN")
    .withMessage("Enter a valid Indian phone number"),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    next();
  },
];
