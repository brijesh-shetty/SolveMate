const { check, validationResult } = require("express-validator");
////
const User = require("../models/user");
const bcrypt = require("bcryptjs");
exports.getLogin = (req, res) => {
   // Reset login status

  res.render('auth/login',{errors: [],
    oldInput: {email: ""},
   
  });
};

exports.getSignup = (req, res) => {
  res.render('auth/signin', {
    errors: [],
    oldInput: { firstName: '',lastName: '', email: '', password: '' }
  });
}


exports.postSignup = [
  check("firstName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("First Name should be at least 2 characters long")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("First Name should contain only alphabets"),

  check("lastName")
    .matches(/^[A-Za-z\s]*$/)
    .withMessage("Last Name should contain only alphabets"),

  check("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail()
    .custom(async (value) => {
      const existingUser = await User.findOne({ email: value });
      if (existingUser) {
        throw new Error("Email already registered");
      }
      return true;
    }),

  check("password")
    .isLength({ min: 8 })
    .withMessage("Password should be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password should contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password should contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password should contain at least one number")
    .matches(/[!@&]/)
    .withMessage("Password should contain at least one special character")
    .trim(),

  check("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("terms")
    .notEmpty()
    .withMessage("Please accept the terms and conditions")
    .custom((value) => {
      if (value !== "on") {
        throw new Error("Please accept the terms and conditions");
      }
      return true;
    }),

  async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
          console.log('Signup attempt:', req.body);
      return res.render("auth/signin", {
       
        errors: errors.array().map(err => err.msg),
        oldInput: { firstName, lastName, email, password, confirmPassword: "" }
      });
    }
    // Create new use
    bcrypt.hash(password, 12)
      .then(hashedPassword => {
        console.log('Hashed Password:', hashedPassword);
    const user = new User({
      firstName,
      lastName,
      email,
      hashedPassword,solvedQuestions: []});
      return user.save()
    })
      .then(() => {
        console.log('User created successfully');
        // Store user info in session
        res.redirect('/login'); // Redirect to home page
      })
      .catch(err => {
        console.error('Error creating user:', err);
        return res.render("auth/signin", {
          errors: ["An error occurred while creating your account. Please try again."],
          oldInput: { firstName, lastName, email, password, confirmPassword: "" }
        });
      });
    }
];

exports.postLogin = async(req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("auth/login", {
        errors: ["user not found"],
        oldInput: { email }
      });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.render("auth/login", {
        errors: ["Invalid  password"],
        oldInput: { email }
      });
    }

    // Store user info in session
    req.session.isLoggedIn = true;
    req.session.user = user;
    console.log('User logged in:', user.email);
    res.redirect('/home'); // Redirect to home page
  };

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect("/login");
  })
}