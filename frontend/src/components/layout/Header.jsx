import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Header({ onMenuClick }) {
  return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-4 md:px-6">
      
      {/* LEFT */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>

        <h2 className="text-base sm:text-lg md:text-xl font-semibold">
          AI Plant Disease Detection
        </h2>
      </div>

      

    </header>
  );
}