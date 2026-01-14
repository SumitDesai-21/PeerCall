import mongoose, { Schema } from "mongoose";

// create user Schema
const userSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true}
})

const User = mongoose.model("User", userSchema);

export { User };
