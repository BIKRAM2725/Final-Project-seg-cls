export default function Loader({ text = "Processing..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      
      {/* Spinner */}
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

      {/* Text */}
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}
