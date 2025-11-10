module.exports = function(requiredFields){
    return (req, res, next) => {
    const missing = requiredFields.filter(f => !req.body[f]);
    if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    next();
    }
    }