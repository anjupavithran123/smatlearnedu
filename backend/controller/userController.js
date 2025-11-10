const User = require('../models/user');


const listUsers = async (req, res) => {
try {
const users = await User.find().select('-password');
return res.json({ users });
} catch (err) {
console.error('listUsers error', err);
return res.status(500).json({ message: 'Server error' });
}
};


module.exports = { listUsers };