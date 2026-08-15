// validators/book.validator.js
import { body } from "express-validator";

export const addBookValidator = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ max: 200 }).withMessage("Title too long"),

  body("author")
    .trim()
    .notEmpty().withMessage("Author is required")
    .isLength({ max: 100 }).withMessage("Author name too long"),

  body("isbn")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(?:\d{9}[\dX]|\d{13})$/)
    .withMessage("ISBN must be 10 or 13 digits"),

  body("condition")
    .optional({ checkFalsy: true })
    .isIn(["Like New", "Good", "Fair", "Poor"])
    .withMessage("Invalid condition value"),

  body("language")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }),

  body("publicationYear")
    .optional({ checkFalsy: true })
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage("Invalid publication year"),

  body("price")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage("Price cannot be negative"),

  body("category")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }),

  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage("Description too long"),

  body("location.city")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body("location.state")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }),

  body("location.coordinates.latitude")
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid location latitude"),

  body("location.coordinates.longitude")
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid location longitude"),

  body("coverImage")
    .optional({ checkFalsy: true })
    .isURL().withMessage("Cover image must be a valid URL"),
];
