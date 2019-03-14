const bcrypt = require('bcrypt');
const salt = 11;


exports.hash = async function (password) {
    return await bcrypt.hash(password, salt);
};

exports.compare = async function (storedHash, toCompare) {
    return await bcrypt.compare(toCompare, storedHash);
};
