import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Chat() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState({});
  const [bioInput, setBioInput] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  // Carrega perfil e utilizadores apenas uma vez ao montar o componente ou quando o token muda
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchUsers();
  }, [token]);

  // Procura as mensagens apenas quando o ID do utilizador selecionado mudar
  useEffect(() => {
    if (selectedUser?.id) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser?.id]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data);
        setBioInput(data.bio || '');
        localStorage.setItem('user', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleUpdateBio = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bio: bioInput })
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data);
        setIsEditingBio(false);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating bio:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
        if (data.length > 0 && !selectedUser) setSelectedUser(data[0]);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchMessages = async (recipientId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${recipientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newMessage,
          recipientId: selectedUser.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [...prev, data]);
        setNewMessage('');
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#121212', color: '#fff' }}>
      {/* Sidebar with users and profile customization */}
      <div style={{ width: '280px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box' }}>
        <h3>Profile</h3>
        <div style={{ background: '#1e1e1e', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#3498db' }}>{currentUser.username}</p>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#aaa' }}>{currentUser.bio || 'No bio yet.'}</p>
          
          {isEditingBio ? (
            <form onSubmit={handleUpdateBio} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <input
                type="text"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Write a new bio..."
                style={{ padding: '6px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', gap: '5px' }}>
                <button type="submit" style={{ padding: '4px 8px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem' }}>Save</button>
                <button type="button" onClick={() => setIsEditingBio(false)} style={{ padding: '4px 8px', background: '#555', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setIsEditingBio(true)} style={{ padding: '4px 8px', background: '#333', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit Bio</button>
          )}
        </div>

        <h3>Chats</h3>
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '10px' }}>
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              style={{
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '8px',
                backgroundColor: selectedUser?.id === u.id ? '#1e1e1e' : 'transparent',
                border: selectedUser?.id === u.id ? '1px solid #3498db' : '1px solid transparent'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{u.username}</div>
              {u.bio && <div style={{ fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.bio}</div>}
            </div>
          ))}
        </div>
        <button onClick={handleLogout} style={{ padding: '10px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
          Logout
        </button>
      </div>

      {/* Main chat window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box' }}>
        {selectedUser ? (
          <>
            <header style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              <h3>Chat with {selectedUser.username}</h3>
              {selectedUser.bio && <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#888' }}>{selectedUser.bio}</p>}
            </header>

            {error && <p style={{ color: '#e74c3c', margin: '10px 0' }}>{error}</p>}

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      background: isMe ? '#2980b9' : '#1e1e1e',
                      padding: '10px 15px',
                      borderRadius: '8px',
                      maxWidth: '60%',
                      alignSelf: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <p style={{ margin: 0, wordBreak: 'break-word' }}>{msg.content}</p>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${selectedUser.username}...`}
                style={{ flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff', outline: 'none' }}
              />
              <button type="submit" style={{ padding: '12px 20px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p>Select a user from the sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}