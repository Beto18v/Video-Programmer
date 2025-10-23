import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X, LogOut, User, Settings, Globe } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import Button from "../ui/Button";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages = [
    { code: "es", name: "Español" },
    { code: "en", name: "English" },
    { code: "pt", name: "Português" },
  ];

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLangMenu(false);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-dark-800">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-red rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">VP</span>
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              Video Programmer
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              <NavLink
                to="/dashboard"
                active={location.pathname === "/dashboard"}
              >
                {t("nav.dashboard")}
              </NavLink>
              <NavLink
                to="/videos"
                active={location.pathname.startsWith("/videos")}
              >
                {t("nav.videos")}
              </NavLink>
              <NavLink
                to="/schedule"
                active={location.pathname === "/schedule"}
              >
                {t("nav.schedule")}
              </NavLink>
              <NavLink to="/plans" active={location.pathname === "/plans"}>
                {t("nav.plans")}
              </NavLink>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 rounded-lg hover:bg-dark-800 transition-colors text-gray-400 hover:text-white"
                aria-label="Select language"
              >
                <Globe className="w-5 h-5" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 glass border border-dark-800 rounded-lg shadow-xl scale-in">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`
                        w-full text-left px-4 py-2 hover:bg-dark-800 transition-colors
                        ${
                          i18n.language === lang.code
                            ? "text-primary-500"
                            : "text-gray-300"
                        }
                      `}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-800 transition-colors"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-white hidden sm:block">
                      {user.name}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 glass border border-dark-800 rounded-lg shadow-xl scale-in">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-3 hover:bg-dark-800 transition-colors text-gray-300 hover:text-white"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>{t("nav.profile")}</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-2 px-4 py-3 hover:bg-dark-800 transition-colors text-gray-300 hover:text-white"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>{t("nav.settings")}</span>
                      </Link>
                      <div className="border-t border-dark-800" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-3 hover:bg-dark-800 transition-colors text-red-400 hover:text-red-300"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t("auth.logout")}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 rounded-lg hover:bg-dark-800 transition-colors text-gray-400 hover:text-white"
                >
                  {showMobileMenu ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    {t("auth.login")}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    {t("auth.register")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && user && (
          <div className="md:hidden py-4 space-y-2 border-t border-dark-800 fade-in">
            <MobileNavLink
              to="/dashboard"
              onClick={() => setShowMobileMenu(false)}
            >
              {t("nav.dashboard")}
            </MobileNavLink>
            <MobileNavLink
              to="/videos"
              onClick={() => setShowMobileMenu(false)}
            >
              {t("nav.videos")}
            </MobileNavLink>
            <MobileNavLink
              to="/schedule"
              onClick={() => setShowMobileMenu(false)}
            >
              {t("nav.schedule")}
            </MobileNavLink>
            <MobileNavLink to="/plans" onClick={() => setShowMobileMenu(false)}>
              {t("nav.plans")}
            </MobileNavLink>
          </div>
        )}
      </div>
    </nav>
  );
};

// NavLink component for desktop
const NavLink = ({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) => (
  <Link
    to={to}
    className={`
      px-4 py-2 rounded-lg transition-colors font-medium
      ${
        active
          ? "text-primary-500 bg-primary-600/10"
          : "text-gray-300 hover:text-white hover:bg-dark-800"
      }
    `}
  >
    {children}
  </Link>
);

// MobileNavLink component
const MobileNavLink = ({
  to,
  children,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
  >
    {children}
  </Link>
);

export default Navbar;
