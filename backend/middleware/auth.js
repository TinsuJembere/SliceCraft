import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
    try {
        let token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            // If Authorization header is not present, check x-auth-token
            token = req.header('x-auth-token');
        }

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = {
            id: user._id,
            role: user.role
        };
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export default auth; 