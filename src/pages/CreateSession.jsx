import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';

const CreateSession = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');
  
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    group_id: groupId || '',
    title: '',
    session_date: '',
    duration_minutes: 60,
    location: '',
    agenda: '',
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
    fetchGroups();
  }, [navigate]);

  const fetchGroups = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      
      // Fetch user's memberships to get groups where user is owner, admin, or moderator
      const membershipsResponse = await fetch(`http://localhost:5000/api/memberships/user/${user.user_id}`);
      const membershipsResult = await membershipsResponse.json();
      
      if (membershipsResult.success) {
        // Filter groups where user is owner, admin, or moderator
        const allowedGroups = membershipsResult.data.filter(m => {
          const role = m.role || (m.status === 'creator' ? 'owner' : 'member');
          return role === 'owner' || role === 'admin' || role === 'moderator';
        });
        
        // Fetch full group details
        const groupIds = allowedGroups.map(m => m.group_id);
        if (groupIds.length > 0) {
          const groupsResponse = await fetch('http://localhost:5000/api/groups');
          const groupsResult = await groupsResponse.json();
          if (groupsResult.success) {
            const userGroups = groupsResult.data.filter(g => groupIds.includes(g.group_id));
            // Add role info to each group
            const groupsWithRole = userGroups.map(g => {
              const membership = allowedGroups.find(m => m.group_id === g.group_id);
              return {
                ...g,
                role: membership?.role || (g.creator_id === user.user_id ? 'owner' : 'member')
              };
            });
            setGroups(groupsWithRole);
            if (groupsWithRole.length > 0 && !groupId) {
              setFormData(prev => ({ ...prev, group_id: groupsWithRole[0].group_id }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please login to create sessions', 'warning');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          creator_id: currentUser.user_id,
          duration_minutes: parseInt(formData.duration_minutes),
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        showToast('Session created successfully!', 'success');
        setTimeout(() => navigate(`/group/${formData.group_id}`), 1000);
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to create session. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Create Study Session</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Schedule a new study session for your group</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-8 rounded-2xl card-shadow"
        >
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No groups found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">You can only create sessions for groups where you are:</p>
              <ul className="text-gray-600 dark:text-gray-400 mb-6 text-left max-w-md mx-auto space-y-2">
                <li>• 👑 Owner of the group</li>
                <li>• ⚡ Admin of the group</li>
                <li>• 🛡️ Moderator of the group</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create a group or ask the group owner to make you an admin/moderator.</p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/create-group"
                  className="inline-block bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Create Group
                </a>
                <a
                  href="/groups"
                  className="inline-block glass-effect dark:bg-gray-800/70 dark:border-gray-700 text-indigo-600 dark:text-indigo-400 px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Browse Groups
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Group *
                </label>
                <select
                  required
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a group</option>
                  {groups.map((group) => {
                    const role = group.role || (group.creator_id === currentUser?.user_id ? 'owner' : 'member');
                    const roleBadge = role === 'owner' ? '👑' : role === 'admin' ? '⚡' : '🛡️';
                    return (
                      <option key={group.group_id} value={group.group_id}>
                        {roleBadge} {group.name} - {group.course_name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Chapter 5 Review Session"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Library Room 205"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agenda / Topics
                </label>
                <textarea
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="What will be covered in this session? Topics, chapters, etc."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CreateSession;

