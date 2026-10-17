import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-stone-100 bg-[#FBFBF9] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:justify-between items-center space-y-6 md:space-y-0">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="elkon logo" className="h-8 w-auto opacity-75" />
          </div>
          <p className="text-[10px] text-stone-400 tracking-wider">
            &copy; {new Date().getFullYear()} ELITEIKON. HAK CIPTA DILINDUNGI. ELEGANCE BEYOND APPEARANCE, CONFIDENCE BEYOND TRENDS.
          </p>
        </div>
      </div>
    </footer>
  );
}
