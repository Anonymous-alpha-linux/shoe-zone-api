module.exports = (...roles) => {
    return (req, res, next) => {
        try {
            if (!roles.includes(req.user.role)) {
                throw new Error("You are not allowed to access this route");
            }
            next();
        }
        catch (e) {
            res.status(403).json({
                isLoggedIn: true,
                success: false,
                message: e.message
            })
        }
    }
}