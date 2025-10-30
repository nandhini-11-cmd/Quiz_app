import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Home() {
  // ✨ Animation variants for smoother transitions
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
      className="relative bg-gradient-to-br from-indigo-50 via-white to-blue-100 
                 min-h-[90vh] flex flex-col justify-center items-center 
                 text-center px-6 sm:px-10 overflow-hidden"
      initial="hidden"
      animate="visible"
    >
      {/* Title */}
      <motion.h1
        className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-indigo-700 mb-4 mt-4"
        variants={fadeInUp}
      >
        Welcome to <span className="text-blue-600">QuizNova</span> ⚡
      </motion.h1>

      {/* Taglines */}
      <motion.div
        className="text-gray-700 max-w-2xl sm:max-w-3xl mb-4 leading-relaxed text-lg sm:text-xl md:text-2xl"
        variants={fadeInUp}
      >
        <p className="font-semibold text-indigo-700 text-2xl sm:text-3xl md:text-4xl mb-2">
          “Where Curiosity Meets AI”
        </p>
       
        <p className="text-blue-600 font-semibold sm:text-lg mt-3">
          Learning becomes engaging, insightful, and full of discovery.
        </p>
      </motion.div>

      {/* Hero Image */}
      <motion.img
        src="/assets/quiz-banner.svg"
        alt="QuizNova banner"
        className="w-56  md:w-64 lg:w-68 mx-auto mb-8 opacity-95"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1.1, ease: "easeOut" }}
      />

      {/* Action Buttons */}
      <motion.div
        className="flex flex-wrap gap-4 justify-center mt-4"
        variants={fadeIn}
        transition={{ delay: 0.6 }}
      >
        <Link
          to="/register"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 
                     rounded-xl font-semibold shadow-md 
                     transition-transform duration-300 hover:scale-105 w-40 sm:w-auto"
        >
          🚀 Get Started
        </Link>

        <Link
          to="/login"
          className="border border-indigo-600 text-indigo-700 px-8 py-3 
                     rounded-xl font-semibold shadow-md 
                     hover:bg-indigo-50 transition-transform duration-300 hover:scale-105 w-40 sm:w-auto"
        >
          🎓 Login
        </Link>
      </motion.div>

      {/* Floating Accent Circles */}
      <motion.div
        className="absolute bottom-10 right-10 w-28 sm:w-32 h-28 sm:h-32 
                   bg-blue-200 rounded-full mix-blend-multiply 
                   blur-2xl opacity-30"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-16 left-10 w-24 sm:w-28 h-24 sm:h-28 
                   bg-indigo-200 rounded-full mix-blend-multiply 
                   blur-2xl opacity-30"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
