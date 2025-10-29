import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Home() {
  // ✨ Define smoother reusable variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-indigo-50 via-white to-blue-100 min-h-[90vh] flex flex-col justify-center items-center text-center px-6 overflow-hidden"
      initial="hidden"
      animate="visible"
    >
      {/* Heading */}
      <motion.h1
        className="mt-10 text-2xl md:text-6xl font-extrabold text-indigo-700 mb-4"
        variants={fadeInUp}
      >
        Welcome to <span className="text-blue-600">QuizNova</span> ⚡
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-gray-700 max-w-2xl mb-4 leading-relaxed text-xl md:text-2xl"
        variants={fadeInUp}
      >
        <span className="font-semibold text-3xl md:text-4xl text-indigo-700 block mb-4">
          “Where Curiosity Meets AI.”
        </span>
        <span className="font-medium text-gray-800">
          Where Teaching Meets Intelligence 💡 — Learning becomes engaging,
          insightful, and full of discovery.
        </span>
      </motion.p>

      {/* Hero Image */}
      <motion.img
        src="/assets/quiz-banner.svg"
        alt="QuizNova banner"
        className="w-60 md:w-48 lg:w-60 mx-auto mb-8 opacity-95"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1.1, ease: "easeOut" }}
      />

      {/* Buttons */}
      <motion.div
        className="flex flex-wrap gap-4 justify-center mt-4"
        variants={fadeIn}
        transition={{ delay: 0.6 }}
      >
        <Link
          to="/register"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md transition-transform duration-300 hover:scale-105"
        >
          🚀 Get Started
        </Link>

        <Link
          to="/login"
          className="border border-indigo-600 text-indigo-700 px-8 py-3 rounded-xl font-semibold shadow-md hover:bg-indigo-50 transition-transform duration-300 hover:scale-105"
        >
          🎓 Login
        </Link>
      </motion.div>

      {/* Gentle floating background accent (optional) */}
      <motion.div
        className="absolute bottom-10 right-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply blur-2xl opacity-30"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-16 left-10 w-28 h-28 bg-indigo-200 rounded-full mix-blend-multiply blur-2xl opacity-30"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
