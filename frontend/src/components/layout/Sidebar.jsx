import { NavLink } from "react-router-dom";
import { House, Scan, FileText, X } from "lucide-react";

const menu = [
  { name: "Home", path: "/", icon: <House size={18} /> },
  { name: "Live Detection", path: "/detect", icon: <Scan size={18} /> },
  { name: "Results", path: "/result", icon: <FileText size={18} /> },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* OVERLAY (mobile only) */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      <aside
        className={`
          fixed z-50 h-screen w-64 bg-slate-900 text-white
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">AgriAI Vision</h1>

          {/* Close button (mobile) */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* MENU */}
        <ul className="mt-6 space-y-1">
          {menu.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 hover:bg-slate-800
                 ${isActive ? "bg-slate-800 border-l-4 border-green-500" : ""}`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </ul>
      </aside>
    </>
  );
}