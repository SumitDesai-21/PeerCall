import { User } from "../models/user.model.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
// register controller
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(httpStatus.CREATED).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: `Something went wrong ${error}` });
  }
};

// login controller
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide your email and password." });
  }
  try {
    const user = await User.findOne({ email }); // find user by email

    if(!user){
        return res.status(httpStatus.NOT_FOUND).json({message: "User not found."});
    }

    // else if user exists
    // compare login password & actual password matches or not
    if(await bcrypt.compare(password, user.password)){
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d'});
        return res.status(httpStatus.OK).json({token: token});
    }
    else{
        return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid credentials"});
    }
  } catch (error) {
    return res.status(500).json({message: `Something went wrong ${error}`}); // server error
  }
};

export { register, login };
