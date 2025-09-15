import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">Deepfake Detector</Link>
      <div className="space-x-6">
        <Link to="/" className="hover:text-blue-500">Home</Link>
        <Link to="/detect" className="hover:text-blue-500">Detect</Link>
        <Link to="/about" className="hover:text-blue-500">About</Link>
      </div>
    </nav>
  );
}

export default Navbar;