

const AIStatusBanner = ({ source, reason }) => {
  if (!source || source === "ai") return null; // AI worked fine — show nothing

  return (
    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg px-4 py-3 mb-4 text-sm shadow-sm">
      <span className="text-xl mt-0.5">⚠️</span>
      <div>
        <p className="font-semibold">AI Unavailable</p>
        <p className="text-yellow-700 mt-0.5">
          {reason || "AI could not generate questions right now. Showing preset questions instead."}
        </p>
      </div>
    </div>
  );
};

export default AIStatusBanner;

