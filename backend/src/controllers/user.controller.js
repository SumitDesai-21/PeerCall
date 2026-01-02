import { User } from "../models/user.model.js";
import httpStatus from "http-status";
import bcrypt, { hash } from "bcrypt";
import jwt from 'jsonwebtoken';
// register controller
const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      username: username,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(httpStatus.CREATED).json({ message: "User registered" });
  } catch (error) {
    res.json({ message: `Something went wrong ${error}` });
  }
};

// login controller
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Plese provide your details." });
  }
  try {
    const user = await User.findOne({username}); // find user by username

    if(!user){
        return res.status(httpStatus.NOT_FOUND).json({message: "User not found."});
    }

    // else if user exists
    // compare login password & actual password matches or not
    if(await bcrypt.compare(password, user.password)){
        const token = jwt.sign({ username: username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d'});
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
