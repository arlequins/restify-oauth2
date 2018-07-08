const crypto = require('crypto');
const maxStrLength = 30

/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
const genRandomString = (length) => {
  return crypto.randomBytes(Math.ceil(length/2))
    .toString('hex') /** convert to hexadecimal format */
    .slice(0,length);   /** return required number of characters */
};

/**
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
const sha512 = (password, salt) => {
  const hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
  hash.update(password);
  const value = hash.digest('hex');
  return {
      salt:salt,
      passwordHash:value
  };
};

const saltHashPassword = (pwd, maxLength) => {
  const salt = genRandomString(16); /** Gives us salt of length 16 */
  const passwordData = sha512(pwd, salt);
  // console.log('UserPassword = '+pwd);
  // console.log('Passwordhash = '+passwordData.passwordHash);
  // console.log('nSalt = '+passwordData.salt);
  const result = passwordData.passwordHash
  const digest = crypto.createHash('sha256').update(result).digest('hex')
  return digest.slice(0, maxLength)
}

const hmacEncryption = (keys, salts, maxLength) => {
  const randomSalt = genRandomString(16); /** Gives us salt of length 16 */
  const secretKey = salts.length > 0 ? salts : randomSalt;
  const result = crypto.createHmac('sha256', secretKey).update(keys).digest('base64')
  const digest = crypto.createHash('sha256').update(result).digest('hex')
  return digest.slice(0, maxLength)
}

const oauthTools = {
  saltHashPassword: (str) => {
    return saltHashPassword(str, maxStrLength)
  },
  hmacEncryption: (str) => {
    return hmacEncryption(str, '', maxStrLength)
  }
}

module.exports = {
  hmacEncryption: hmacEncryption,
  saltHashPassword: saltHashPassword,
  oauthTools: oauthTools
}
