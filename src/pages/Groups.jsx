import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', course_name: '', name: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        setCurrentUser(null);
      }
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [filter]);

  const handleJoinGroup = async (group) => {
    if (!currentUser) {
      showToast('Please login to join groups', 'warning');
      setTimeout(() => window.location.href = '/login', 1500);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/memberships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          group_id: group.group_id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        if (group.group_type === 'public') {
          showToast('Successfully joined the group!', 'success');
        } else {
          showToast('Join request sent! Waiting for owner approval.', 'info');
        }
        fetchGroups();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      showToast('Failed to join group. Please try again.', 'error');
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/groups';
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.course_name) params.append('course_name', filter.course_name);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        let filteredGroups = result.data;
        // Filter by name if provided
        if (filter.name) {
          filteredGroups = filteredGroups.filter(g => 
            g.name.toLowerCase().includes(filter.name.toLowerCase()) ||
            g.course_name.toLowerCase().includes(filter.name.toLowerCase())
          );
        }
        setGroups(filteredGroups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Study Groups</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Find or create your perfect study group</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl mb-8 card-shadow"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search by Name</label>
              <input
                type="text"
                value={filter.name}
                onChange={(e) => setFilter({ ...filter, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Search groups..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group Type</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course Name</label>
              <input
                type="text"
                value={filter.course_name}
                onChange={(e) => setFilter({ ...filter, course_name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Filter by course..."
              />
            </div>
            <div className="flex items-end">
              {currentUser && (
                <Link
                  to="/create-group"
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                >
                  + Create Group
                </Link>
              )}
              {!currentUser && (
                <Link
                  to="/login"
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                >
                  Login to Create
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Groups Grid */}
        {loading ? (
          <LoadingSkeleton count={6} />
        ) : groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-8xl mb-6"
            >
              📚
            </motion.div>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">No groups found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Be the first to create a study group!</p>
            {currentUser ? (
              <Link
                to="/create-group"
                className="inline-block bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Create Group
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-block bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Register to Create
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, index) => (
              <motion.div
                key={group.group_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow hover-lift"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white flex-1">{group.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    group.group_type === 'public' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  }`}>
                    {group.group_type}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-semibold">Course:</span> {group.course_name}
                </p>
                {group.course_code && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-semibold">Code:</span> {group.course_code}
                  </p>
                )}
                
                {group.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{group.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span>👥 {group.current_members || 0}/{group.max_capacity} members</span>
                  {group.meeting_location && (
                    <span>📍 {group.meeting_location}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/group/${group.group_id}`}
                    className="flex-1 text-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    View Details
                  </Link>
                  {currentUser && currentUser.user_id !== group.creator_id && (
                    <button
                      onClick={() => handleJoinGroup(group)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      {group.group_type === 'public' ? 'Join Group' : 'Request to Join'}
                    </button>
                  )}
                  {currentUser && currentUser.user_id === group.creator_id && (
                    <div className="flex-1 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-lg font-semibold text-center text-sm">
                      👑 You own this group
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
