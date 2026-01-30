import { User } from "../models/user.model.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { Meeting } from "../models/meeting.model.js";
// Removed unused import 'cache' from 'react'
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
        return res.status(httpStatus.OK).json({token: token, name: user.name});
    }
    else{
        return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid credentials"});
    }
  } catch (error) {
    return res.status(500).json({message: `Something went wrong ${error}`}); // server error
  }
};


// implement history feature
const getUserHistory = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const meetings = await Meeting.find({ email_id: user.email });
    return res.status(200).json(meetings);
  } catch (e) {
    return res.status(401).json({ message: `Invalid or expired token: ${e}` });
  }
};


const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;
  if (!token || !meeting_code) {
    return res.status(400).json({ message: "Token and meeting_code are required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const newMeeting = new Meeting({
      email_id: user.email,
      meetingCode: meeting_code
    });
    await newMeeting.save();
    return res.status(httpStatus.CREATED).json({ message: "Added code to history" });
  } catch (e) {
    return res.status(401).json({ message: `Invalid or expired token: ${e}` });
  }
};

export { register, login, getUserHistory, addToHistory };
