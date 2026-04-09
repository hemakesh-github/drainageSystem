// @ts-check
/** Explicit Metro config for Expo SDK 54 (avoids relying on implicit defaults). */
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
