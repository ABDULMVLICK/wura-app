// Polyfills MUST load before expo-router to ensure global.crypto is ready for Web3Auth
import './globals.js';
import 'expo-router/entry';

