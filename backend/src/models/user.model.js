import mongoose, { Schema } from "mongoose";

// create user Schema
const userSchema = new Schema({
    name: {type: String, required: true},
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    token: {type: String } // Only token would be stored in local storage.     
})

const User = mongoose.model("User", userSchema);

export { User };
