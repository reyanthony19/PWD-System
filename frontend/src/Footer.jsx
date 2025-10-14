import React from "react";

function Footer() {
  return (
    <footer className="bg-sky-700 text-white py-6 text-center mt-12">
      <p className="text-sm">
        © {new Date().getFullYear()} PDAO System, All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
