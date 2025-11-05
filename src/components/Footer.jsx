import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer id="contact" className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              StudyCircle
            </h3>
            <p className="text-gray-300 mb-4">
              A collaborative platform for students to create study groups, schedule sessions, and excel together in their academic journey.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-purple-400 transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/groups" className="text-gray-300 hover:text-purple-400 transition-colors duration-200">
                  Groups
                </Link>
              </li>
              <li>
                <Link to="/sessions" className="text-gray-300 hover:text-purple-400 transition-colors duration-200">
                  Sessions
                </Link>
              </li>
              <li>
                <a href="#about" className="text-gray-300 hover:text-purple-400 transition-colors duration-200">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <a href="mailto:m13211911@gmail.com" className="hover:text-purple-400 transition-colors">
                  m13211911@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>📱</span>
                <a href="tel:03350579760" className="hover:text-purple-400 transition-colors">
                  03350579760
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>COMSATS University Islamabad, Attock Campus</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 dark:border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
            <p>&copy; 2025 StudyCircle. All rights reserved.</p>
            <p>
              Developed by <span className="text-purple-400 font-semibold">Muhammed Anas</span> and <span className="text-purple-400 font-semibold">Ashir Ali</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
