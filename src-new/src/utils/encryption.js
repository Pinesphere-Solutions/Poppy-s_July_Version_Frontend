import CryptoJS from "crypto-js";

const SECRET_KEY = "psuDHOxgq1uzPjkJnUxoA+MjrcAoxR+6MwSt4WU/YGs="; // Use a secure key

// Encrypt data before sending
export const encryptData = (data) => {
  const jsonData = JSON.stringify(data); // Convert data to a JSON string
  const encrypted = CryptoJS.AES.encrypt(jsonData, SECRET_KEY).toString();
  return encrypted;
};

// Decrypt data after receiving
export const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decrypted); // Parse back to JSON
};
