import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import GroupChat from '../components/GroupChat';
import { formatDate, formatTime } from '../utils/dateFormatter';

// Helper to get current user
const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [files, setFiles] = useState([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    fetchGroupDetails();
    fetchMembers();
    fetchSessions();
    fetchFiles();
  }, [id]);

  useEffect(() => {
    if (currentUser && members.length > 0) {
      const membership = members.find(m => m.user_id === currentUser.user_id);
      setIsMember(membership && (membership.status === 'approved' || membership.status === 'creator'));
    }
  }, [currentUser, members]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/groups/${id}`);
      const result = await response.json();
      if (result.success) {
        setGroup(result.data);
      } else {
        showToast('Error fetching group details: ' + result.error, 'error');
        setTimeout(() => navigate('/groups'), 1500);
      }
    } catch (error) {
      console.error('Error fetching group:', error);
      showToast('Failed to fetch group details', 'error');
      setTimeout(() => navigate('/groups'), 1500);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/memberships/group/${id}`);
      const result = await response.json();
      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/sessions/group/${id}`);
      const result = await response.json();
      if (result.success) {
        setSessions(result.data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/files/group/${id}`);
      const result = await response.json();
      if (result.success) {
        setFiles(result.data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('group_id', id);
    formData.append('uploaded_by', currentUser.user_id);

    try {
      const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        body: formData,
      });

          const result = await response.json();
          if (result.success) {
            showToast('File uploaded successfully!', 'success');
            setShowFileUpload(false);
            fetchFiles();
            e.target.reset();
          } else {
            showToast('Error: ' + result.error, 'error');
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          showToast('Failed to upload file. Please try again.', 'error');
        }
  };

  const handleApproveMember = async (membershipId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/memberships/${membershipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      const result = await response.json();
      if (result.success) {
        showToast('Member approved successfully!', 'success');
        fetchMembers();
        fetchGroupDetails(); // Refresh member count
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error approving member:', error);
      showToast('Failed to approve member', 'error');
    }
  };

  const handleRejectMember = async (membershipId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/memberships/${membershipId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        showToast('Member request rejected', 'success');
        fetchMembers();
        fetchGroupDetails();
      }
    } catch (error) {
      console.error('Error rejecting member:', error);
      showToast('Failed to reject member', 'error');
    }
  };

  const handleUpdateMemberRole = async (membershipId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5000/api/memberships/${membershipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const result = await response.json();
      if (result.success) {
        showToast(`Member role updated to ${newRole}`, 'success');
        fetchMembers();
      } else {
        showToast('Error updating role: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      showToast('Failed to update member role', 'error');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        showToast('Group deleted successfully', 'success');
        setTimeout(() => navigate('/groups'), 1000);
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      showToast('Failed to delete group', 'error');
    }
  };

  const isOwner = currentUser && group && currentUser.user_id === group.creator_id;
  
  // Get current user's role in the group
  const getUserRole = () => {
    if (!currentUser || !members.length) return null;
    const membership = members.find(m => m.user_id === currentUser.user_id);
    if (!membership) return null;
    if (membership.status === 'creator' || membership.role === 'owner') return 'owner';
    return membership.role || 'member';
  };
  
  const userRole = getUserRole();
  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const isModerator = userRole === 'moderator' || isAdmin;
  const canManageContent = isOwner || isAdmin; // Owner and Admin can manage files/sessions

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Group not found</h2>
          <button
            onClick={() => navigate('/groups')}
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <button
                onClick={() => navigate('/groups')}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 flex items-center"
              >
                ← Back to Groups
              </button>
              <div className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-8 rounded-2xl card-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">{group.name}</h1>
                    <p className="text-2xl text-indigo-600 dark:text-indigo-400 font-semibold mb-2">{group.course_name}</p>
                    {group.course_code && (
                      <p className="text-gray-500 dark:text-gray-400">{group.course_code}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      group.group_type === 'public'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    }`}>
                      {group.group_type}
                    </span>
                    {isOwner && (
                      <div className="flex gap-2">
                        <Link
                          to={`/group/${id}/edit`}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => setDeleteFileId('GROUP_DELETE')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
            
            {group.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{group.description}</p>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Members:</span>
                <p className="font-semibold text-gray-800 dark:text-white">{group.current_members || 0} / {group.max_capacity}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Creator:</span>
                <p className="font-semibold text-gray-800 dark:text-white">{group.creator_name}</p>
              </div>
              {group.meeting_schedule && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Schedule:</span>
                  <p className="font-semibold text-gray-800 dark:text-white">{group.meeting_schedule}</p>
                </div>
              )}
              {group.meeting_location && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Location:</span>
                  <p className="font-semibold text-gray-800 dark:text-white">{group.meeting_location}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Members */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Members ({members.filter(m => m.status === 'approved' || m.status === 'creator').length})
              {members.filter(m => m.status === 'pending').length > 0 && (
                  <span className="ml-2 text-sm text-yellow-600 dark:text-yellow-400">
                  ({members.filter(m => m.status === 'pending').length} pending)
                </span>
              )}
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {members.map((member) => (
                <div key={member.membership_id} className="flex items-start justify-between p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <p className="font-semibold text-gray-800 dark:text-white text-lg">{member.name}</p>
                      {(member.role === 'owner' || member.status === 'creator') && (
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-xs font-semibold">
                          👑 Owner
                        </span>
                      )}
                      {member.role === 'admin' && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-semibold">
                          ⚡ Admin
                        </span>
                      )}
                      {member.role === 'moderator' && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold">
                          🛡️ Moderator
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">📧 {member.email}</p>
                    {member.university && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        <span className="font-medium">🏫 University:</span> {member.university}
                      </p>
                    )}
                    {member.semester && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">📚 Semester:</span> {member.semester}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Joined: {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {member.status}
                    </span>
                    {isOwner && member.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApproveMember(member.membership_id)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 transition-colors"
                          title="Approve"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleRejectMember(member.membership_id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600 transition-colors"
                          title="Reject"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                    {isOwner && member.status === 'approved' && member.user_id !== currentUser?.user_id && (
                      <div className="flex flex-col gap-1">
                        <select
                          value={member.role || 'member'}
                          onChange={(e) => handleUpdateMemberRole(member.membership_id, e.target.value)}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-semibold border border-gray-300 dark:border-gray-600"
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sessions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Sessions ({sessions.length})</h2>
              <div className="flex items-center gap-2">
              {canManageContent && (
                      <Link
                        to={`/create-session?group=${id}`}
                        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-sm"
                      >
                        + Create
                      </Link>
                    )}
                <Link
                  to={`/sessions?group=${id}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-semibold"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sessions scheduled yet</p>
              ) : (
                sessions.slice(0, 5).map((session) => (
                  <div key={session.session_id} className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white flex-1">{session.title}</h3>
                      {(isOwner || isAdmin) && currentUser?.user_id === session.creator_id && (
                        <div className="flex gap-1 ml-2">
                          <Link
                            to={`/session/${session.session_id}/edit`}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs"
                            title="Edit"
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
                                    fetchSessions();
                                  } else {
                                    showToast('Error: ' + result.error, 'error');
                                  }
                                } catch (error) {
                                  showToast('Failed to delete session', 'error');
                                }
                              }
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      📅 {formatDate(session.session_date)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      ⏱️ {session.duration_minutes} minutes
                    </p>
                    {session.location && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">📍 {session.location}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>👥 {session.attending_count || 0} attending</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Group Chat - Only for members */}
        {isMember && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <GroupChat 
              groupId={id} 
              currentUser={currentUser} 
              members={members}
            />
          </motion.div>
        )}

        {/* Files Section - Only for members */}
        {isMember && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Shared Files ({files.length})</h2>
              {canManageContent && (
                <button
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                >
                  {showFileUpload ? 'Cancel' : '+ Upload File'}
                </button>
              )}
            </div>

            {showFileUpload && canManageContent && (
              <form onSubmit={handleFileUpload} className="mb-6 p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select File (PDF, Images, Documents)
                  </label>
                  <input
                    type="file"
                    name="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    placeholder="File description..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Upload File
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-4">No files shared yet</p>
              ) : (
                files.map((file) => (
                  <div key={file.file_id} className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-white truncate">{file.file_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          By {file.uploaded_by_name}
                        </p>
                        {file.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{file.description}</p>
                        )}
                      </div>
                      {(isOwner || isAdmin) && (
                        <button
                          onClick={() => setDeleteFileId(file.file_id)}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <a
                      href={`http://localhost:5000${file.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-semibold"
                    >
                      Download →
                    </a>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Join Group Button - For non-members */}
        {currentUser && !isMember && currentUser.user_id !== group.creator_id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <button
              onClick={async () => {
                try {
                  const response = await fetch('http://localhost:5000/api/memberships', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      user_id: currentUser.user_id,
                      group_id: id,
                    }),
                  });

                  const result = await response.json();
                  if (result.success) {
                    if (group.group_type === 'public') {
                      showToast('Successfully joined the group!', 'success');
                      fetchMembers();
                      fetchGroupDetails();
                    } else {
                      showToast('Join request sent! Waiting for owner approval.', 'info');
                      fetchMembers();
                    }
                  } else {
                    showToast('Error: ' + result.error, 'error');
                  }
                } catch (error) {
                  console.error('Error joining group:', error);
                  showToast('Failed to join group. Please try again.', 'error');
                }
              }}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              {group.group_type === 'public' ? 'Join Group' : 'Request to Join'}
            </button>
          </motion.div>
        )}

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={deleteFileId !== null && deleteFileId !== 'GROUP_DELETE'}
          onClose={() => setDeleteFileId(null)}
          onConfirm={async () => {
            try {
              const response = await fetch(`http://localhost:5000/api/files/${deleteFileId}`, {
                method: 'DELETE',
              });
              const result = await response.json();
              if (result.success) {
                showToast('File deleted successfully', 'success');
                fetchFiles();
              } else {
                showToast('Error deleting file', 'error');
              }
            } catch (error) {
              console.error('Error deleting file:', error);
              showToast('Failed to delete file', 'error');
            }
            setDeleteFileId(null);
          }}
          title="Delete File"
          message="Are you sure you want to delete this file? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
        <ConfirmModal
          isOpen={deleteFileId === 'GROUP_DELETE'}
          onClose={() => setDeleteFileId(null)}
          onConfirm={() => {
            handleDeleteGroup();
            setDeleteFileId(null);
          }}
          title="Delete Group"
          message="Are you sure you want to delete this group? This will permanently delete all sessions, memberships, and files associated with this group. This action cannot be undone."
          confirmText="Delete Group"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </div>
  );
};

export default GroupDetail;

