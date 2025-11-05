import { motion } from 'framer-motion';

const AboutSection = () => {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* COMSATS 2025 Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">COMSATS University Islamabad</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">Attock Campus - 2025</p>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            This project is developed as part of the Web Development Competition 2025 at COMSATS University Islamabad, Attock Campus. 
            StudyCircle represents our commitment to creating innovative solutions that enhance student collaboration and learning experiences.
          </p>
        </motion.div>

        {/* Developers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">
            <span className="gradient-text">About the Developers</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Developer 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-8 rounded-2xl card-shadow"
            >
              <div className="text-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4">
                  MA
                </div>
                <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Muhammed Anas</h4>
                <p className="text-purple-600 dark:text-purple-400 font-semibold mb-4">Lead Developer</p>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                A passionate web developer specializing in modern full-stack development. 
                Focused on creating intuitive user experiences and scalable applications.
              </p>
            </motion.div>

            {/* Developer 2 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-8 rounded-2xl card-shadow"
            >
              <div className="text-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4">
                  AA
                </div>
                <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Ashir Ali</h4>
                <p className="text-purple-600 dark:text-purple-400 font-semibold mb-4">Co-Developer</p>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                An innovative developer with expertise in database design and backend architecture. 
                Committed to building robust and efficient systems.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Mission & Vision */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          <div className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-8 rounded-2xl card-shadow">
            <div className="text-5xl mb-4">🎯</div>
            <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Our Mission</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              To empower students with a seamless platform for collaborative learning, making study group management 
              effortless and effective for academic success.
            </p>
          </div>

          <div className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-8 rounded-2xl card-shadow">
            <div className="text-5xl mb-4">👁️</div>
            <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Our Vision</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              To become the leading platform for student collaboration, fostering a community where knowledge sharing 
              and peer learning drive academic excellence.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;

