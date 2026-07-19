import app from '../server/index.js';

// Vercel serverless entry — Express handles /api/* and /health/*
export default function handler(req, res) {
  return app(req, res);
}
