const bcrypt = require('bcrypt');



exports.hash = async function (password) {
    return await bcrypt.hash(password, 11);
};

exports.compare = async function (storedHash, toCompare) {
    return await bcrypt.compare(toCompare, storedHash);
};
