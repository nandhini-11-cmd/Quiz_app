import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="bg-linear-to-br from-indigo-50 via-white to-blue-100 min-h-[90vh] flex flex-col justify-center items-center text-center px-6 overflow-hidden">

   
      <motion.h1
        className="text-5xl md:text-5xl font-extrabold text-indigo-700 mb-2 mt-2"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.10 }}
      >
        Welcome to <span className="text-blue-600">QuizNova</span> ⚡
      </motion.h1>


      <motion.p
        className="text-gray-700 max-w-2xl mb-2 leading-relaxed text-xl text-center mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.10 }}
      >
        <span className="font-semibold text-3xl text-indigo-700 ">
          “Where Curiosity Meets AI.”
        </span>
        <br /><br />
       
     
      <motion.img
  src="/assets/quiz-banner.svg"
  alt="QuizNova banner"
  className="
    w-60    /* scales nicely */
    mx-auto md:ml-20 lg:ml-40                
     mb-6                            
    opacity-95     
  "
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }} 
/>
        <span className="font-semibold text-gray-800 ">Where Teaching Meets Intelligence 💡</span><br /> Learning becomes engaging, insightful, and full of discovery.
      </motion.p>

      
      <motion.div
        className="flex flex-wrap gap-4 justify-center mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Link
          to="/register"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow transition-transform hover:scale-105"
        >
          🚀 Get Started
        </Link>

        <Link
          to="/login"
          className="border border-indigo-600 text-indigo-700 px-6 py-3 rounded-xl font-semibold shadow hover:bg-indigo-50 transition-transform hover:scale-105"
        >
          🎓 Login
        </Link>
      </motion.div>

      
    </div>
  );
}