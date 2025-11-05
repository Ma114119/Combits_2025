import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const Hero = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-200 dark:bg-indigo-900 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                <span className="block gradient-text animate-fade-in pb-2 md:pb-4">Study Together</span>
                <span className="block text-gray-800 dark:text-white mt-4 md:mt-6 animate-slide-up">Create Study Groups</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto animate-slide-up mt-6">
                Join or create study groups, schedule sessions, and collaborate with fellow students
              </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!user && (
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                Get Started
              </motion.button>
            </Link>
            )}
            {user && (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                Go to Dashboard
              </button>
            )}
            <Link to="/groups">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 px-8 py-4 rounded-full font-semibold text-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-300"
              >
                Browse Groups
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Floating Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {[
            { icon: '⚡', title: 'Fast', desc: 'Lightning fast performance' },
            { icon: '🎨', title: 'Beautiful', desc: 'Stunning designs' },
            { icon: '🚀', title: 'Modern', desc: 'Cutting-edge technology' }
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -10, scale: 1.05 }}
              className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow hover-lift"
            >
              <div className="text-4xl mb-3">{card.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{card.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>
    </section>
  )
}

export default Hero

