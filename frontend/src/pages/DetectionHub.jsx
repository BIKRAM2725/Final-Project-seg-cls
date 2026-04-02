import { useState } from "react";
import { Upload, Video, Camera, Cpu } from "lucide-react";

import ImageDetection from "./detection/ImageDetection";
import VideoDetection from "./detection/VideoDetection";
import LiveDetection from "./detection/LiveDetection";
import DroneDetection from "./DroneDetection";

export default function DetectionHub() {
  const [mode, setMode] = useState(null);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      {/* TITLE */}
      <h1 className="text-xl sm:text-2xl font-bold text-center">
        🌿 Plant Leaf Disease Detection
      </h1>

      {/* MODE SELECTOR */}
      <div className="
        grid grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-4
        gap-4 sm:gap-6
      ">
        <ModeCard
          active={mode === "image"}
          title="Image Upload"
          desc="Upload leaf image"
          icon={<Upload className="text-green-600" />}
          onClick={() => setMode("image")}
        />

        <ModeCard
          active={mode === "video"}
          title="Video Upload"
          desc="Upload crop video"
          icon={<Video className="text-blue-600" />}
          onClick={() => setMode("video")}
        />

        <ModeCard
          active={mode === "live"}
          title="Live (Webcam)"
          desc="Use browser camera"
          icon={<Camera className="text-purple-600" />}
          onClick={() => setMode("live")}
        />

        <ModeCard
          active={mode === "drone"}
          title="Drone / CCTV"
          desc="Raspberry Pi / Drone camera"
          icon={<Cpu className="text-orange-600" />}
          onClick={() => setMode("drone")}
        />
      </div>

      {/* DYNAMIC VIEW */}
      <div className="mt-6">
        {mode === "image" && <ImageDetection />}
        {mode === "video" && <VideoDetection />}
        {mode === "live" && <LiveDetection />}
        {mode === "drone" && <DroneDetection />}

        {!mode && (
          <p className="text-center text-gray-500 text-sm sm:text-base">
            Select a detection mode to start
          </p>
        )}
      </div>

    </div>
  );
}

/* ---------------- MODE CARD ---------------- */

function ModeCard({ title, desc, icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full min-h-[120px]
        bg-white p-5 sm:p-6 rounded-xl shadow
        text-left transition-all duration-300
        hover:ring-2 hover:ring-green-500
        focus:outline-none
        ${active ? "ring-2 ring-green-500 scale-[1.02]" : ""}
      `}
    >
      <div className="mb-3 text-2xl">{icon}</div>
      <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </button>
  );
}