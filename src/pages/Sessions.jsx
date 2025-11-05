import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatDate, formatTime } from '../utils/dateFormatter';

const Sessions = () => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(groupId || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [rsvps, setRsvps] = useState({});

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        setCurrentUser(null);
      }
    }
    fetchAllGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupSessions(selectedGroup);
    } else if (groups.length > 0) {
      fetchAllSessions();
    }
  }, [selectedGroup, groups]);

  useEffect(() => {
    if (currentUser && sessions.length > 0) {
      fetchUserRSVPs();
    }
  }, [currentUser, sessions]);

  const fetchUserRSVPs = async () => {
    if (!currentUser) return;
    const rsvpMap = {};
    for (const session of sessions) {
      try {
        const response = await fetch(`http://localhost:5000/api/rsvps/user/${currentUser.user_id}/session/${session.session_id}`);
        const result = await response.json();
        if (result.success && result.data) {
          rsvpMap[session.session_id] = result.data.status;
        }
      } catch (error) {
        console.error('Error fetching RSVP:', error);
      }
    }
    setRsvps(rsvpMap);
  };

  const handleRSVP = async (sessionId, status) => {
    if (!currentUser) {
      showToast('Please login to join sessions', 'warning');
      setTimeout(() => window.location.href = '/login', 1500);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/rsvps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: currentUser.user_id,
          status: status,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setRsvps(prev => ({ ...prev, [sessionId]: status }));
        // Refresh sessions to update attendee count
        if (selectedGroup) {
          fetchGroupSessions(selectedGroup);
        } else {
          fetchAllSessions();
        }
        const messages = {
          attending: 'You are now attending this session!',
          maybe: 'RSVP set to "Maybe"',
          not_attending: 'RSVP updated to "Not Attending"'
        };
        showToast(messages[status] || 'RSVP updated!', 'success');
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error creating RSVP:', error);
      showToast('Failed to join session. Please try again.', 'error');
    }
  };

  const fetchAllGroups = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/groups');
      const result = await response.json();
      if (result.success) {
        setGroups(result.data);
        if (!selectedGroup && result.data.length > 0) {
          fetchAllSessions(result.data);
        } else if (!selectedGroup && result.data.length === 0) {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setLoading(false);
    }
  };

  const fetchAllSessions = async (groupsList = groups) => {
    try {
      setLoading(true);
      const allSessions = [];
      for (const group of groupsList) {
        try {
          const response = await fetch(`http://localhost:5000/api/sessions/group/${group.group_id}`);
          const result = await response.json();
          if (result.success && result.data) {
            allSessions.push(...result.data);
          }
        } catch (error) {
          console.error(`Error fetching sessions for group ${group.group_id}:`, error);
        }
      }
      setSessions(allSessions);
    } catch (error) {
      console.error('Error fetching all sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupSessions = async (groupId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/sessions/group/${groupId}`);
      const result = await response.json();
      if (result.success) {
        setSessions(result.data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Study Sessions</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">View and manage your study sessions</p>
          
          <div className="max-w-2xl mx-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Groups</option>
                {groups.map((group) => (
                  <option key={group.group_id} value={group.group_id}>
                    {group.name} - {group.course_name}
                  </option>
                ))}
              </select>
            </div>
            
            {currentUser && (
              <div className="text-center">
                <Link
                  to="/create-session"
                  className="inline-block bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  + Create New Session
                </Link>
              </div>
            )}
          </div>
        </motion.div>

            {loading ? (
              <LoadingSkeleton count={6} />
            ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-8xl mb-6"
            >
              📅
            </motion.div>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">No sessions found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">Sessions will appear here once created</p>
            {currentUser && (
              <Link
                to="/create-session"
                className="inline-block bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                + Create Your First Session
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session, index) => (
              <motion.div
                key={session.session_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow hover-lift relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full -mr-16 -mt-16"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex-1">{session.title}</h3>
                    {currentUser && currentUser.user_id === session.creator_id && (
                      <div className="flex gap-1 ml-2">
                        <Link
                          to={`/session/${session.session_id}/edit`}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm"
                          title="Edit Session"
                        >
                          ✏️
                        </Link>
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete this session?')) {
                              try {
                                const response = await fetch(`http://localhost:5000/api/sessions/${session.session_id}`, {
                                  method: 'DELETE',
                                });
                                const result = await response.json();
                                if (result.success) {
                                  showToast('Session deleted', 'success');
                                  if (selectedGroup) {
                                    fetchGroupSessions(selectedGroup);
                                  } else {
                                    fetchAllSessions();
                                  }
                                } else {
                                  showToast('Error: ' + result.error, 'error');
                                }
                              } catch (error) {
                                showToast('Failed to delete session', 'error');
                              }
                            }
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                          title="Delete Session"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 p-2 rounded-lg">
                      <span className="mr-2 text-lg">📅</span>
                      <span className="font-medium">{formatDate(session.session_date)}</span>
                    </div>
                    <div className="flex items-center text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 p-2 rounded-lg">
                      <span className="mr-2 text-lg">⏱️</span>
                      <span className="font-medium">{session.duration_minutes} minutes</span>
                    </div>
                    {session.location && (
                      <div className="flex items-center text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 p-2 rounded-lg">
                        <span className="mr-2 text-lg">📍</span>
                        <span className="font-medium">{session.location}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                      <span className="mr-2">👤</span>
                      <span>Created by {session.creator_name}</span>
                    </div>
                  </div>

                  {session.agenda && (
                    <div className="mb-4 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">📝 Agenda:</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{session.agenda}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200 dark:border-gray-700 mb-4">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                      <span className="text-base">👥</span>
                      <span>{session.attending_count || 0} attending</span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {session.total_rsvps || 0} total RSVPs
                    </span>
                  </div>

                  {currentUser && currentUser.user_id !== session.creator_id && (
                    <div className="flex gap-2">
                      {rsvps[session.session_id] === 'attending' ? (
                        <button
                          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                          disabled
                        >
                          ✓ Attending
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRSVP(session.session_id, 'attending')}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                          >
                            Join Session
                          </button>
                          <button
                            onClick={() => handleRSVP(session.session_id, 'maybe')}
                            className="px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
                          >
                            Maybe
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {currentUser && currentUser.user_id === session.creator_id && (
                    <div className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-lg text-sm font-semibold text-center">
                      👑 You are the owner of this session
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {groupId && (
          <div className="mt-8 text-center">
            <Link
              to={`/group/${groupId}`}
              className="inline-block text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
            >
              ← Back to Group
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;
