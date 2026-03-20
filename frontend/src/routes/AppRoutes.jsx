import { Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Dashboard from "../pages/Dashboard";
import ImageDetection from "../pages/detection/ImageDetection";
import VideoDetection from "../pages/detection/VideoDetection";
import Result from "../pages/Result";
import DetectionHub from "../pages/DetectionHub";
import VideoResult from "../pages/VideoResult.jsx";
import ImageResult from "../pages/Result";
import LiveResult from "../pages/LiveResult"; 
import StartDetection from "../pages/StartDetection.jsx"




export default function AppRoutes() {
  return (
    <Routes>

      <Route path="/" element={<Dashboard />} />

      <Route element={<MainLayout />}>
        <Route path="/image" element={<ImageDetection />} />
        <Route path="/video" element={<VideoDetection />} />
        <Route path="/detect" element={<DetectionHub />} />
       
        {/* <Route path="/result" element={<Result />} /> */}

        
        {/* RESULT PAGES (SEPARATE & SAFE) */}
        <Route path="/result/image" element={<ImageResult />} />
        <Route path="/result/video" element={<VideoResult />} />
        <Route path="/result/live" element={<LiveResult />} />
        <Route path="/result" element={<StartDetection />} />

      </Route>
    </Routes>
  );
}
