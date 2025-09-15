import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="text-center py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl font-bold mb-4"
      >
        AI Deepfake Detection
      </motion.h1>
      <p className="text-lg mb-6">
        Upload. Detect. Trust. Instantly verify if your content is authentic.
      </p>
      <Link
        to="/detect"
        className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
      >
        Try Now
      </Link>
    </section>
  );
}

export default Hero;