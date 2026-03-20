export default function Button({ children, onClick, type = "button", disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="
        bg-blue-600
        hover:bg-blue-700
        text-white
        font-medium
        px-4
        py-2
        rounded-lg
        transition
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
    >
      {children}
    </button>
  );
}
