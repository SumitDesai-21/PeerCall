import jwt from 'jsonwebtoken';

export const verifyToken = (socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error("No token provided"));
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error("Invalid or expired token"));
        }
        socket.user = decoded;
        next();
    });
};
