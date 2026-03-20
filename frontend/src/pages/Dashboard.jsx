import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] text-white">

      {/* BACKGROUND GLOWS */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/30 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 blur-[120px]" />

      {/* HERO */}
      <div className="relative max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight"
          >
            AI-Powered <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
              Plant Disease Detection
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-6 text-lg text-gray-300 max-w-xl leading-relaxed"
          >
            Advanced computer vision system for detecting crop leaf diseases
            using images, videos, and live camera or drone feeds.
            Designed for farmers, researchers, and agri-tech industries.
          </motion.p>

          {/* BUTTONS */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-10 flex gap-4"
          >
            <Link
              to="/detect"
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600
                         font-semibold shadow-lg shadow-green-500/30
                         hover:shadow-emerald-500/50 hover:scale-[1.02]
                         transition-all duration-300"
            >
              Start Detection
            </Link>

            <a
              href="#features"
              className="px-7 py-3 rounded-xl border border-white/20
                         text-gray-300 backdrop-blur-md
                         hover:border-white/40 hover:text-white
                         transition-all duration-300"
            >
              Learn More
            </a>
          </motion.div>
        </motion.div>

        {/* RIGHT ILLUSTRATION (TRANSPARENT PNG – NO BOX) */}
        {/* RIGHT ILLUSTRATION (CLEAN + JUGNU GLOW) */}
<motion.div
  initial={{ opacity: 0, x: 60, scale: 0.96 }}
  animate={{ opacity: 1, x: 0, scale: 1 }}
  transition={{ duration: 1, ease: "easeOut" }}
  className="relative flex justify-center items-center"
>
  {/* SOFT COLORED GLOW */}
  <div className="absolute w-[320px] h-[320px] bg-emerald-400/25 blur-[120px] rounded-full" />

  {/* JUGNU / FIREFLY PARTICLES */}
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(14)].map((_, i) => (
      <motion.span
        key={i}
        className="absolute w-[6px] h-[6px] rounded-full bg-emerald-400/70"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.2, 1, 0.2],
          scale: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 4 + Math.random() * 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>

  {/* IMAGE */}
  <img
    src="/hero-illustration4.png"
    alt="AI Agriculture"
    className="
      relative
      w-full max-w-lg mx-auto
      brightness-95 contrast-110 saturate-95
    "
  />
</motion.div>

      </div>

      {/* FEATURES */}
      <div id="features" className="relative max-w-6xl mx-auto px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              title: "Image Detection",
              desc: "Upload leaf images and receive instant AI-powered diagnosis.",
            },
            {
              title: "Video Analysis",
              desc: "Analyze crop videos frame-by-frame using AI models.",
            },
            {
              title: "Live Detection",
              desc: "Real-time disease detection using camera or drone feed.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 backdrop-blur-xl
                         rounded-2xl p-6
                         hover:border-green-500/50 hover:bg-white/[0.07]
                         transition-all duration-300"
            >
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
