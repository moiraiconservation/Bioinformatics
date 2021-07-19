///////////////////////////////////////////////////////////////////////////////
// kruptos.js /////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//  I'm not ashamed to admit that I "Stack Overflow'ed" this one.            //
//  All of the original comments from the author have been left intact.      //
//  The only things I added were "static" variables and functions for        //
//  keeping a constant salt and password so that I can save encrypted        //
//  information to disk and then load it again later.  Yeah, that's not the  //
//  best way to do cryptography, but I'm not saving banking information or   //
//  anything.  I just want to save information that isn't plain-text.        //
//    https://stackoverflow.com/a/62640781                                   //
///////////////////////////////////////////////////////////////////////////////
// REQUIRED COMPONENTS ////////////////////////////////////////////////////////
const crypto = require('crypto');
const { Buffer } = require('buffer');
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
const ALGORITHM = {
  // GCM is an authenticated encryption mode that not only provides confidentiality but also provides integrity in a secured way
  BLOCK_CIPHER: 'aes-256-gcm',
  // 128 bit auth tag is recommended for GCM
  AUTH_TAG_BYTE_LEN: 16,
  // NIST recommends 96 bits or 12 bytes IV for GCM to promote interoperability, efficiency, and simplicity of design
  IV_BYTE_LEN: 12,
  // NOTE: 256 (in algorithm name) is key size (block size for AES is always 128)
  KEY_BYTE_LEN: 32,
  // to prevent rainbow table attacks
  SALT_BYTE_LEN: 16
};
///////////////////////////////////////////////////////////////////////////////
// OBJECT /////////////////////////////////////////////////////////////////////
const STATIC_KEY = {
  PASSWORD: 'hj9i3pj81qdkc58bv3qwfv535fe6hwigk7j96dlvaa9dkhqqnk4w0n7q237hianu',  
  SALT: Buffer.from("∩┐╜∩┐╜∩┐╜sΘî»╔ê'WL∩┐╜∩┐╜qm", 'utf8')
};
///////////////////////////////////////////////////////////////////////////////
// MODULE /////////////////////////////////////////////////////////////////////
module.exports = {
  getRandomKey() { return crypto.randomBytes(ALGORITHM.KEY_BYTE_LEN); },
  // to prevent rainbow table attacks
  getSalt() { return crypto.randomBytes(ALGORITHM.SALT_BYTE_LEN); },
  /**
   *
   * @param {Buffer} password - The password to be used for generating key
   *
   * To be used when key needs to be generated based on password.
   * The caller of this function has the responsibility to clear
   * the Buffer after the key generation to prevent the password
   * from lingering in the memory
   */
  getKeyFromPassword(password, salt) { return crypto.scryptSync(password, salt, ALGORITHM.KEY_BYTE_LEN); },
  /**
   *
   * @param {Buffer} messagetext - The clear text message to be encrypted
   * @param {Buffer} key - The key to be used for encryption
   *
   * The caller of this function has the responsibility to clear
   * the Buffer after the encryption to prevent the message text
   * and the key from lingering in the memory
   */
  encrypt(messagetext, key) {
    const iv = crypto.randomBytes(ALGORITHM.IV_BYTE_LEN);
    const cipher = crypto.createCipheriv(ALGORITHM.BLOCK_CIPHER, key, iv, {
      authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN
    });
    let encryptedMessage = cipher.update(messagetext);
    encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);
    return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()]);
  },
  /**
   *
   * @param {Buffer} ciphertext - Cipher text
   * @param {Buffer} key - The key to be used for decryption
   *
   * The caller of this function has the responsibility to clear
   * the Buffer after the decryption to prevent the message text
   * and the key from lingering in the memory
   */
  decrypt(ciphertext, key) {
    const authTag = ciphertext.slice(-16);
    const iv = ciphertext.slice(0, 12);
    const encryptedMessage = ciphertext.slice(12, -16);
    const decipher = crypto.createDecipheriv(ALGORITHM.BLOCK_CIPHER, key, iv, {
      authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN
    });
    decipher.setAuthTag(authTag);
    const messagetext = decipher.update(encryptedMessage);
    return Buffer.concat([messagetext, decipher.final()]);
  },
  // Static functions
  static_encrypt(messagetext) {
    let key = this.getKeyFromPassword(STATIC_KEY.PASSWORD, STATIC_KEY.SALT);
    const iv = crypto.randomBytes(ALGORITHM.IV_BYTE_LEN);
    const cipher = crypto.createCipheriv(ALGORITHM.BLOCK_CIPHER, key, iv, {
      authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN
    });
    let encryptedMessage = cipher.update(messagetext);
    encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);
    return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()]).toString('base64');
  },
  static_decrypt(ciphertext) {
    ciphertext = Buffer.from(ciphertext, "base64");
    let key = this.getKeyFromPassword(STATIC_KEY.PASSWORD, STATIC_KEY.SALT);
    const authTag = ciphertext.slice(-16);
    const iv = ciphertext.slice(0, 12);
    const encryptedMessage = ciphertext.slice(12, -16);
    const decipher = crypto.createDecipheriv(ALGORITHM.BLOCK_CIPHER, key, iv, {
      authTagLength: ALGORITHM.AUTH_TAG_BYTE_LEN
    });
    decipher.setAuthTag(authTag);
    const messagetext = decipher.update(encryptedMessage);
    return Buffer.concat([messagetext, decipher.final()]).toString();
  }
};
///////////////////////////////////////////////////////////////////////////////