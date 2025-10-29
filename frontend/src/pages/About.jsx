import { motion } from "framer-motion";

export default function About() {
  // ✅ Define reusable variants for smooth stagger animation
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-indigo-50 via-white to-blue-100 min-h-[90vh] py-16 px-6 flex flex-col items-center text-center"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* Heading */}
      <motion.h1
        className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-6"
        variants={fadeInUp}
      >
        About <span className="text-blue-600">QuizNova</span> ⚡
      </motion.h1>

      {/* Intro Paragraph */}
      <motion.p
        className="max-w-3xl text-gray-700 text-lg leading-relaxed mb-12"
        variants={fadeInUp}
      >
        <span className="font-semibold text-indigo-700">QuizNova</span> is an{" "}
        AI-powered quiz platform designed for both{" "}
        <span className="font-semibold text-purple-700">Teachers</span> and{" "}
        <span className="font-semibold text-green-700">Students</span>. Whether
        you’re creating or taking quizzes, QuizNova makes learning smart,
        interactive, and insightful.
      </motion.p>

      {/* Teachers Section */}
      <motion.div
        className="bg-white shadow-md hover:shadow-lg transition-shadow duration-500 rounded-2xl p-6 md:p-10 mb-8 max-w-4xl text-left border border-gray-100"
        variants={fadeInUp}
      >
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">
          👩‍🏫 For Teachers
        </h2>
        <ul className="list-disc ml-6 space-y-2 text-gray-700 leading-relaxed">
          <li>
            Create quizzes{" "}
            <span className="font-semibold text-green-700">manually</span> or{" "}
            <span className="font-semibold text-indigo-700">
              auto-generate with AI
            </span>{" "}
            in seconds.
          </li>
          <li>Update or delete existing quizzes effortlessly.</li>
          <li>
            View{" "}
            <span className="font-semibold text-blue-700">leaderboards</span> — both
            overall and quiz-specific, to track top performers.
          </li>
          <li>Manage your profile and stay in control of your content.</li>
        </ul>
      </motion.div>

      {/* Students Section */}
      <motion.div
        className="bg-white shadow-md hover:shadow-lg transition-shadow duration-500 rounded-2xl p-6 md:p-10 mb-8 max-w-4xl text-left border border-gray-100"
        variants={fadeInUp}
      >
        <h2 className="text-2xl font-bold text-green-700 mb-4">🎓 For Students</h2>
        <ul className="list-disc ml-6 space-y-2 text-gray-700 leading-relaxed">
          <li>
            Access all quizzes created by teachers and{" "}
            <span className="font-semibold text-indigo-700">
              take quizzes anytime.
            </span>
          </li>
          <li>
            Get{" "}
            <span className="font-semibold text-purple-700">
              AI-driven explanations
            </span>{" "}
            after every quiz to understand each answer deeply.
          </li>
          <li>
            Instantly view{" "}
            <span className="font-semibold text-blue-700">
              charts and performance analytics
            </span>{" "}
            to track your progress.
          </li>
          <li>Download your results as a professional PDF report.</li>
          <li>Retake quizzes to improve and update your profile anytime.</li>
        </ul>
      </motion.div>

      {/* Closing Line */}
      <motion.p
        className="text-gray-700 text-lg font-medium mt-6 max-w-2xl"
        variants={fadeInUp}
      >
        💡 With{" "}
        <span className="text-indigo-700 font-semibold">QuizNova</span>, learning
        isn’t just about right or wrong — it’s about{" "}
        <span className="text-green-700 font-semibold">
          understanding, growing,
        </span>{" "}
        and making every question a step toward excellence.
      </motion.p>
    </motion.div>
  );
}
