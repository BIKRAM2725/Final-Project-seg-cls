import { Link, useLocation } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export default function ResultPage() {
  const location = useLocation();
  const data = location.state; // result data comes via navigate

  // 🔴 NO RESULT FOUND
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4
                      bg-gradient-to-br from-[#f6f7f9] via-[#ececf0] to-[#e0e1e7]">

        <div className="bg-white rounded-xl border border-gray-200 p-8
                        max-w-md w-full text-center space-y-4">

          <AlertCircle size={42} className="mx-auto text-gray-400" />

          <h2 className="text-xl font-semibold text-gray-800">
            No Result Found
          </h2>

          <p className="text-sm text-gray-500">
            No detection data is available. Please start a new detection.
          </p>

          <Link
            to="/detect"
            className="inline-block mt-4 px-6 py-2 rounded-lg
                       bg-green-600 text-white font-medium
                       hover:bg-green-700 transition"
          >
            Start Detection
          </Link>
        </div>
      </div>
    );
  }

  //  RESULT FOUND → NORMAL RESULT UI
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* your existing result UI here */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
