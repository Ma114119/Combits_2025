import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';
import { formatDate, formatTime } from '../utils/dateFormatter';

const GroupChat = ({ groupId, currentUser, members }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/group/${groupId}`);
      const result = await response.json();
      if (result.success) {
        setMessages(result.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: groupId,
          user_id: currentUser.user_id,
          message: newMessage.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setNewMessage('');
        fetchMessages(); // Refresh messages
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          group_id: groupId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showToast('Message deleted', 'success');
        fetchMessages();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('Failed to delete message', 'error');
    }
  };

  const getUserRole = (userId) => {
    const member = members.find(m => m.user_id === userId);
    if (!member) return 'member';
    if (member.status === 'creator' || member.role === 'owner') return 'owner';
    return member.role || 'member';
  };

  if (loading) {
    return (
      <div className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect dark:bg-gray-800/70 dark:border-gray-700 p-6 rounded-2xl card-shadow"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">💬</span>
        Group Chat
      </h2>

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto mb-4 p-4 bg-white/50 dark:bg-gray-700/30 rounded-lg space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = currentUser && message.user_id === currentUser.user_id;
            const userRole = getUserRole(message.user_id);
            const canDelete = isOwnMessage || userRole === 'owner' || userRole === 'admin';

            return (
              <div
                key={message.message_id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    isOwnMessage
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white'
                      : 'bg-white/80 dark:bg-gray-700/80 text-gray-800 dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {message.user_name}
                      {userRole === 'owner' && (
                        <span className="ml-1 text-xs">👑</span>
                      )}
                      {userRole === 'admin' && (
                        <span className="ml-1 text-xs">⚡</span>
                      )}
                      {userRole === 'moderator' && (
                        <span className="ml-1 text-xs">🛡️</span>
                      )}
                    </span>
                    {isOwnMessage && canDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this message?')) {
                            handleDeleteMessage(message.message_id);
                          }
                        }}
                        className="text-xs opacity-70 hover:opacity-100 ml-2"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </motion.div>
  );
};

export default GroupChat;

