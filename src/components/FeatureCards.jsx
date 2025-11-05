import { motion } from 'framer-motion'

const FeatureCards = () => {
  const features = [
    {
      icon: '👥',
      title: 'Study Groups',
      description: 'Create and join study groups with public or private access',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: '📅',
      title: 'Session Scheduling',
      description: 'Schedule study sessions and manage your calendar effectively',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: '📁',
      title: 'File Sharing',
      description: 'Share PDFs, documents, and resources with your group members',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '✅',
      title: 'RSVP System',
      description: 'Respond to session invitations and track attendance',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '🔐',
      title: 'Secure Access',
      description: 'Private groups with approval system for controlled access',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '📊',
      title: 'Dashboard Analytics',
      description: 'Track your groups, sessions, and pending requests in one place',
      color: 'from-pink-500 to-rose-500'
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Platform Features</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need for effective study group collaboration
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">🚀 Fast</span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">🔒 Secure</span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">📱 Responsive</span>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative"
            >
              <div className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-8 rounded-3xl card-shadow hover-lift h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
                <div className={`mt-6 h-1 w-0 group-hover:w-full bg-gradient-to-r ${feature.color} transition-all duration-300 rounded-full`}></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default FeatureCards

