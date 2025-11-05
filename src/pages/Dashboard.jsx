import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myGroups: 0,
    mySessions: 0,
    pendingRequests: 0,
    upcomingSessions: 0,
  });
  const [recentGroups, setRecentGroups] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      fetchDashboardData(userData.user_id);
    } catch (error) {
      console.error('Error parsing user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchDashboardData = async (userId) => {
    try {
      // Fetch user's groups
      const groupsResponse = await fetch(`http://localhost:5000/api/memberships/user/${userId}`);
      const groupsResult = await groupsResponse.json();
      if (groupsResult.success) {
        const approvedGroups = groupsResult.data.filter(g => g.status === 'approved' || g.status === 'creator');
        setStats(prev => ({ ...prev, myGroups: approvedGroups.length }));
        setRecentGroups(approvedGroups.slice(0, 3));
        
        // Fetch sessions for user's groups
        let allSessions = [];
        for (const group of approvedGroups) {
          try {
            const sessionsResponse = await fetch(`http://localhost:5000/api/sessions/group/${group.group_id}`);
            const sessionsResult = await sessionsResponse.json();
            if (sessionsResult.success) {
              allSessions.push(...sessionsResult.data);
            }
          } catch (e) {
            console.error('Error fetching sessions:', e);
          }
        }
        
        // Filter upcoming sessions
        const upcoming = allSessions
          .filter(s => new Date(s.session_date) > new Date())
          .sort((a, b) => new Date(a.session_date) - new Date(b.session_date))
          .slice(0, 3);
        
        setUpcomingSessions(upcoming);
        setStats(prev => ({ 
          ...prev, 
          mySessions: allSessions.length,
          upcomingSessions: upcoming.length 
        }));
      }

      // Fetch pending membership requests (for groups user owns)
      const groupsOwnedResponse = await fetch('http://localhost:5000/api/groups');
      const groupsOwnedResult = await groupsOwnedResponse.json();
      if (groupsOwnedResult.success) {
        const ownedGroups = groupsOwnedResult.data.filter(g => g.creator_id === userId);
        let pendingCount = 0;
        for (const group of ownedGroups) {
          try {
            const membersResponse = await fetch(`http://localhost:5000/api/memberships/group/${group.group_id}`);
            const membersResult = await membersResponse.json();
            if (membersResult.success) {
              pendingCount += membersResult.data.filter(m => m.status === 'pending').length;
            }
          } catch (e) {
            console.error('Error fetching members:', e);
          }
        }
        setStats(prev => ({ ...prev, pendingRequests: pendingCount }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-8 rounded-2xl card-shadow mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 dark:text-white">
                <span className="gradient-text">Welcome back, {user.name}! 👋</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                Ready to continue your study journey?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last active: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/create-group"
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                + Create Group
              </Link>
              <Link
                to="/create-session"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                + Create Session
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">My Groups</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.myGroups}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">My Sessions</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.mySessions}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.pendingRequests}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.upcomingSessions}</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </motion.div>
        </div>

        {/* Recent Groups & Upcoming Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Groups */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recent Groups</h2>
              <Link
                to="/groups"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 text-sm font-semibold"
              >
                View All →
              </Link>
            </div>
            {recentGroups.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📚</div>
                <p className="text-gray-600 dark:text-gray-400">No groups yet</p>
                <Link
                  to="/create-group"
                  className="text-purple-600 dark:text-purple-400 hover:underline mt-2 inline-block"
                >
                  Create your first group
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGroups.map((group) => (
                  <Link
                    key={group.group_id}
                    to={`/group/${group.group_id}`}
                    className="block p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all"
                  >
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{group.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{group.course_name}</p>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Upcoming Sessions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Upcoming Sessions</h2>
              <Link
                to="/sessions"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 text-sm font-semibold"
              >
                View All →
              </Link>
            </div>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-600 dark:text-gray-400">No upcoming sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.session_id}
                    className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{session.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(session.session_date).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

