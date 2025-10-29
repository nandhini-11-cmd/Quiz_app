import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // ✅ Get API base for avatar URLs
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // ✅ Build avatar image safely
  const avatarSrc =
    user?.avatar?.startsWith("http") && user?.avatar
      ? user.avatar
      : user?.avatar
      ? `${API_BASE}${user.avatar}`
      : `${API_BASE}/avatars/avatar1.png`; // fallback default avatar

  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        {/* Brand */}
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-wide text-white hover:text-yellow-300 transition duration-300"
        >
          QuizNova <span className="text-yellow-300">⚡</span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden focus:outline-none hover:scale-110 transition"
          onClick={toggleMenu}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 text-sm md:text-base font-medium">
          <NavLinks user={user} handleLogout={handleLogout} />
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-indigo-700 text-white px-4 py-4 flex flex-col space-y-4 text-center animate-fade-in-down">
          <NavLinks
            user={user}
            handleLogout={handleLogout}
            onNavigate={() => setMenuOpen(false)}
            isMobile
          />
        </div>
      )}
    </nav>
  );
};

// ✅ Navigation Links Component
const NavLinks = ({ user, handleLogout, onNavigate, isMobile }) => (
  <>
    <NavItem to="/about" label="About" onClick={onNavigate} />

    <NavItem
      to={
        user
          ? user.role === "teacher"
            ? "/teacher/dashboard"
            : "/student/dashboard"
          : "/"
      }
      label="Dashboard"
      onClick={onNavigate}
    />

    {!user ? (
      <>
        <NavItem to="/login" label="Login" onClick={onNavigate} />
        <NavItem to="/register" label="Register" onClick={onNavigate} />
      </>
    ) : (
      <>
        <NavItem to="/profile" label="Profile" onClick={onNavigate} />

        <div className={isMobile ? "space-y-3" : ""}>
          <button
            onClick={() => {
              handleLogout();
              onNavigate?.();
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold transition duration-300 shadow hover:shadow-lg hover:scale-105"
          >
            Logout
          </button>
        </div>

        {/* ✅ Avatar + Username */}
        {user?.avatar && (
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 mt-3 md:mt-0 group">
            <img
              src={
                user?.avatar?.startsWith("http")
                  ? user.avatar
                  : `${import.meta.env.VITE_API_BASE_URL}${user.avatar}`
              }
              alt="avatar"
              className="w-10 h-10 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition duration-300"
              onError={(e) => {
                e.target.src = `${import.meta.env.VITE_API_BASE_URL}/avatars/avatar1.png`; // fallback if broken
              }}
            />

            <span className="font-semibold text-yellow-300 group-hover:text-white transition duration-300">
              {user.username}
            </span>
          </div>
        )}
      </>
    )}
  </>
);

// ✅ NavItem for reusable menu links
const NavItem = ({ to, label, onClick }) => (
  <div className="py-1">
    <Link
      to={to}
      onClick={onClick}
      className="relative group inline-block text-lg"
    >
      <span className="hover:text-yellow-300 transition duration-300">
        {label}
      </span>
      <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-yellow-300 group-hover:w-full transition-all duration-300"></span>
    </Link>
  </div>
);

export default Navbar;
