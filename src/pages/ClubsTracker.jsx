import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Trash2, Calendar, CheckSquare, Clock, Megaphone, 
  MapPin, Award, CheckCircle2, AlertCircle, ChevronRight, Edit2, Info
} from 'lucide-react';
import { api } from '../utils/api';
import { useStudent } from '../context/StudentContext';

const colorMap = {
  primary: 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30',
  secondary: 'bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30',
  accent: 'bg-accent/20 text-accent border-accent/30 hover:bg-accent/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30'
};

const textColors = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  cyan: 'text-cyan-400'
};

const bgColors = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500'
};

const borderColors = {
  primary: 'border-primary/20',
  secondary: 'border-secondary/20',
  accent: 'border-accent/20',
  emerald: 'border-emerald-500/20',
  amber: 'border-amber-500/20',
  cyan: 'border-cyan-500/20'
};

const ClubsTracker = () => {
  const { currentStudent } = useStudent();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Input states for new Club
  const [newClubName, setNewClubName] = useState('');
  const [newClubRole, setNewClubRole] = useState('Member');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubColor, setNewClubColor] = useState('primary');

  // Input states for new Task
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskClubId, setNewTaskClubId] = useState('');

  // Input states for new Event
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLoc, setNewEventLoc] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  const [newEventClubId, setNewEventClubId] = useState('');

  // Input states for new Activity Log
  const [newActDate, setNewActDate] = useState(new Date().toISOString().split('T')[0]);
  const [newActHours, setNewActHours] = useState('');
  const [newActDesc, setNewActDesc] = useState('');
  const [newActClubId, setNewActClubId] = useState('');

  // Input states for new Update/Milestone
  const [newUpdateTitle, setNewUpdateTitle] = useState('');
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [newUpdateClubId, setNewUpdateClubId] = useState('');

  // Fetch initial data
  useEffect(() => {
    if (currentStudent?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      api.getClubs(currentStudent.id)
        .then(data => {
          setClubs(data || []);
          if (data && data.length > 0) {
            setNewTaskClubId(data[0].id);
            setNewEventClubId(data[0].id);
            setNewActClubId(data[0].id);
            setNewUpdateClubId(data[0].id);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch clubs", err);
          setLoading(false);
        });
    }
  }, [currentStudent?.id]);

  // Helper to persist club data
  const saveClubsState = (updatedClubs) => {
    setClubs(updatedClubs);
    api.saveClubs(currentStudent?.id, updatedClubs);
  };

  // Create a new club
  const handleAddClub = () => {
    if (!newClubName.trim()) return;
    const newClub = {
      id: `club_${Date.now()}`,
      name: newClubName.trim(),
      role: newClubRole,
      description: newClubDesc.trim(),
      color: newClubColor,
      joinedAt: new Date().toISOString(),
      tasks: [],
      events: [],
      activities: [],
      updates: []
    };
    const updated = [newClub, ...clubs];
    saveClubsState(updated);
    
    // Reset forms and set as default selected for forms
    setNewClubName('');
    setNewClubDesc('');
    setNewClubRole('Member');
    setNewClubColor('primary');

    if (!newTaskClubId) setNewTaskClubId(newClub.id);
    if (!newEventClubId) setNewEventClubId(newClub.id);
    if (!newActClubId) setNewActClubId(newClub.id);
    if (!newUpdateClubId) setNewUpdateClubId(newClub.id);
  };

  // Delete a club
  const handleDeleteClub = (clubId) => {
    if (!window.confirm("Are you sure you want to delete this club and all its associated tasks, events, and hours?")) return;
    const updated = clubs.filter(c => c.id !== clubId);
    saveClubsState(updated);
  };

  // Add a task to a club
  const handleAddTask = () => {
    if (!newTaskText.trim() || !newTaskClubId) return;
    const updated = clubs.map(club => {
      if (club.id === newTaskClubId) {
        return {
          ...club,
          tasks: [
            ...(club.tasks || []),
            {
              id: `task_${Date.now()}`,
              text: newTaskText.trim(),
              dueDate: newTaskDueDate || '',
              completed: false
            }
          ]
        };
      }
      return club;
    });
    saveClubsState(updated);
    setNewTaskText('');
    setNewTaskDueDate('');
  };

  // Toggle task completion
  const handleToggleTask = (clubId, taskId) => {
    const updated = clubs.map(club => {
      if (club.id === clubId) {
        return {
          ...club,
          tasks: (club.tasks || []).map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return club;
    });
    saveClubsState(updated);
  };

  // Delete a task
  const handleDeleteTask = (clubId, taskId) => {
    const updated = clubs.map(club => {
      if (club.id === clubId) {
        return {
          ...club,
          tasks: (club.tasks || []).filter(task => task.id !== taskId)
        };
      }
      return club;
    });
    saveClubsState(updated);
  };

  // Add an event to a club
  const handleAddEvent = () => {
    if (!newEventTitle.trim() || !newEventDate || !newEventClubId) return;
    const updated = clubs.map(club => {
      if (club.id === newEventClubId) {
        return {
          ...club,
          events: [
            ...(club.events || []),
            {
              id: `event_${Date.now()}`,
              title: newEventTitle.trim(),
              date: newEventDate,
              location: newEventLoc.trim(),
              notes: newEventNotes.trim()
            }
          ].sort((a, b) => new Date(a.date) - new Date(b.date))
        };
      }
      return club;
    });
    saveClubsState(updated);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventLoc('');
    setNewEventNotes('');
  };

  // Delete an event
  const handleDeleteEvent = (clubId, eventId) => {
    const updated = clubs.map(club => {
      if (club.id === clubId) {
        return {
          ...club,
          events: (club.events || []).filter(e => e.id !== eventId)
        };
      }
      return club;
    });
    saveClubsState(updated);
  };

  // Add activity log (hours) to a club
  const handleAddActivity = () => {
    const hours = parseFloat(newActHours);
    if (isNaN(hours) || hours <= 0 || !newActClubId || !newActDesc.trim()) return;
    const updated = clubs.map(club => {
      if (club.id === newActClubId) {
        return {
          ...club,
          activities: [
            ...(club.activities || []),
            {
              id: `act_${Date.now()}`,
              date: newActDate || new Date().toISOString().split('T')[0],
              hours,
              description: newActDesc.trim()
            }
          ].sort((a, b) => new Date(b.date) - new Date(a.date))
        };
      }
      return club;
    });
    saveClubsState(updated);
    setNewActHours('');
    setNewActDesc('');
  };

  // Delete activity log
  const handleDeleteActivity = (clubId, actId) => {
    const updated = clubs.map(club => {
      if (club.id === clubId) {
        return {
          ...club,
          activities: (club.activities || []).filter(a => a.id !== actId)
        };
      }
      return club;
    });
    saveClubsState(updated);
  };

  // Add update/milestone
  const handleAddUpdate = () => {
    if (!newUpdateTitle.trim() || !newUpdateClubId) return;
    const updated = clubs.map(club => {
      if (club.id === newUpdateClubId) {
        return {
          ...club,
          updates: [
            ...(club.updates || []),
            {
              id: `upd_${Date.now()}`,
              title: newUpdateTitle.trim(),
              content: newUpdateContent.trim(),
              createdAt: new Date().toISOString()
            }
          ]
        };
      }
      return club;
    });
    saveClubsState(updated);
    setNewUpdateTitle('');
    setNewUpdateContent('');
  };

  // Delete an update
  const handleDeleteUpdate = (clubId, updateId) => {
    const updated = clubs.map(club => {
      if (club.id === clubId) {
        return {
          ...club,
          updates: (club.updates || []).filter(u => u.id !== updateId)
        };
      }
      return club;
    });
    saveClubsState(updated);
  };

  // Aggregated data for tabs
  const allTasks = clubs.flatMap(c => (c.tasks || []).map(t => ({ ...t, clubName: c.name, clubColor: c.color, clubId: c.id })))
    .sort((a, b) => a.completed - b.completed || new Date(a.dueDate) - new Date(b.dueDate));

  const allEvents = clubs.flatMap(c => (c.events || []).map(e => ({ ...e, clubName: c.name, clubColor: c.color, clubId: c.id })))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const allActivities = clubs.flatMap(c => (c.activities || []).map(a => ({ ...a, clubName: c.name, clubColor: c.color, clubId: c.id })))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const allUpdates = clubs.flatMap(c => (c.updates || []).map(u => ({ ...u, clubName: c.name, clubColor: c.color, clubId: c.id })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalHours = allActivities.reduce((sum, act) => sum + act.hours, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold">Loading clubs profile...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'My Clubs', icon: Users },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare, count: allTasks.filter(t => !t.completed).length },
    { id: 'events', name: 'Dates & Events', icon: Calendar, count: allEvents.filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0)).length },
    { id: 'activities', name: 'Activity & Hours', icon: Clock },
    { id: 'updates', name: 'Updates & Milestones', icon: Megaphone }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Clubs & Extracurriculars
          </h1>
          <p className="text-gray-400">Manage leadership roles, volunteer hours, tasks, and meetings in one syncable dashboard.</p>
        </div>
        
        {/* Quick Stats Panel */}
        <div className="flex gap-4 items-center bg-surface/30 border border-white/5 backdrop-blur-md p-4 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Clubs</p>
              <p className="font-bold text-lg leading-tight">{clubs.length}</p>
            </div>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Logged Hours</p>
              <p className="font-bold text-lg leading-tight text-emerald-400">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/10 overflow-x-auto scrollbar-none gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3.5 px-4 font-semibold text-sm border-b-2 transition-all shrink-0 relative
                ${isActive ? 'text-primary border-primary' : 'text-gray-400 border-transparent hover:text-white'}
              `}
            >
              <Icon size={18} />
              <span>{tab.name}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${isActive ? 'bg-primary text-white' : 'bg-white/10 text-gray-300'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Add Club Form */}
              <div className="bg-surface/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="text-primary" size={20} /> Register New Club
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Club Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Speech & Debate, Robotics Team"
                      value={newClubName}
                      onChange={(e) => setNewClubName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Your Role</label>
                    <input
                      type="text"
                      placeholder="e.g. President, Treasurer, Member"
                      value={newClubRole}
                      onChange={(e) => setNewClubRole(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Theme Color</label>
                    <select
                      value={newClubColor}
                      onChange={(e) => setNewClubColor(e.target.value)}
                      className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white"
                    >
                      <option value="primary">Indigo</option>
                      <option value="secondary">Purple</option>
                      <option value="accent">Pink</option>
                      <option value="emerald">Emerald</option>
                      <option value="amber">Amber</option>
                      <option value="cyan">Cyan</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description / Goal</label>
                    <input
                      type="text"
                      placeholder="Brief note about the club's activity or your responsibilities..."
                      value={newClubDesc}
                      onChange={(e) => setNewClubDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <button
                      onClick={handleAddClub}
                      className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Add Club
                    </button>
                  </div>
                </div>
              </div>

              {/* Clubs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.length > 0 ? (
                  clubs.map((club) => {
                    const pendingTasks = (club.tasks || []).filter(t => !t.completed).length;
                    const loggedHours = (club.activities || []).reduce((sum, a) => sum + a.hours, 0);
                    const upcomingEvents = (club.events || []).filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0)).length;
                    const themeColor = club.color || 'primary';

                    return (
                      <motion.div
                        key={club.id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`bg-surface/50 border ${borderColors[themeColor]} rounded-3xl p-6 relative group overflow-hidden flex flex-col justify-between h-full`}
                      >
                        {/* Glowing backdrop based on color */}
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-[50px] opacity-10 pointer-events-none ${bgColors[themeColor]}`} />
                        
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className={`px-3 py-1 rounded-xl text-xs font-bold ${colorMap[themeColor]} border`}>
                              {club.role || 'Member'}
                            </div>
                            <button
                              onClick={() => handleDeleteClub(club.id)}
                              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <h3 className="text-xl font-bold mb-1 text-white group-hover:text-primary transition-colors">
                            {club.name}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-2 mb-6">
                            {club.description || 'No description provided.'}
                          </p>
                        </div>

                        {/* Club Stats Footer */}
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 text-center">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Tasks</p>
                            <p className="text-sm font-bold mt-0.5 text-gray-200">
                              {pendingTasks > 0 ? (
                                <span className={textColors[themeColor]}>{pendingTasks} pending</span>
                              ) : (
                                '0'
                              )}
                            </p>
                          </div>
                          <div className="border-x border-white/5">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Events</p>
                            <p className="text-sm font-bold mt-0.5 text-gray-200">
                              {upcomingEvents > 0 ? (
                                <span className={textColors[themeColor]}>{upcomingEvents} next</span>
                              ) : (
                                '0'
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Hours</p>
                            <p className="text-sm font-bold mt-0.5 text-emerald-400">{loggedHours.toFixed(1)}h</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-3xl bg-surface/10">
                    <Users size={36} className="mx-auto text-gray-600 mb-3" />
                    <h3 className="font-bold text-gray-400 mb-1">No clubs added yet</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">Create a club record above to start tracking leadership, activities, tasks, and achievements.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Task Add Form */}
              <div className="bg-surface/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 h-fit space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <CheckSquare size={20} className="text-primary" /> Add Task
                </h2>
                {clubs.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select Club</label>
                      <select
                        value={newTaskClubId}
                        onChange={(e) => setNewTaskClubId(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white"
                      >
                        {clubs.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Task Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Design slide deck, Purchase poster boards"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Due Date (Optional)</label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white"
                      />
                    </div>
                    <button
                      onClick={handleAddTask}
                      className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Add Task
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Please register a club in the first tab to assign tasks.</p>
                )}
              </div>

              {/* Task list */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Action Items Checklist
                </h2>
                {allTasks.length > 0 ? (
                  <div className="space-y-3">
                    {allTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-4 bg-surface/50 border border-white/5 rounded-2xl transition-all group ${task.completed ? 'opacity-60 bg-surface/20' : ''}`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <button
                            onClick={() => handleToggleTask(task.clubId, task.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-white/20 hover:border-primary text-transparent'}`}
                          >
                            <CheckCircle2 size={16} className={task.completed ? 'text-white' : ''} />
                          </button>
                          <div>
                            <p className={`text-sm font-semibold text-gray-100 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              {task.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold uppercase tracking-wider ${colorMap[task.clubColor || 'primary']}`}>
                                {task.clubName}
                              </span>
                              {task.dueDate && (
                                <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
                                  <Calendar size={10} /> Due {task.dueDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(task.clubId, task.id)}
                          className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl bg-surface/10">
                    <CheckSquare size={32} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 font-bold mb-1">All clear!</p>
                    <p className="text-sm text-gray-500">No active tasks logged for your clubs.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Event Add Form */}
              <div className="bg-surface/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 h-fit space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Calendar size={20} className="text-primary" /> Schedule Event
                </h2>
                {clubs.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Club</label>
                      <select
                        value={newEventClubId}
                        onChange={(e) => setNewEventClubId(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white"
                      >
                        {clubs.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Event/Meeting Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Weekly Meeting, Bake Sale Event"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Location / Link</label>
                      <input
                        type="text"
                        placeholder="e.g. Room 204, Zoom Link"
                        value={newEventLoc}
                        onChange={(e) => setNewEventLoc(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Agenda / Notes</label>
                      <textarea
                        placeholder="What needs to be brought or discussed?"
                        value={newEventNotes}
                        onChange={(e) => setNewEventNotes(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500 h-20 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleAddEvent}
                      className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Schedule
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Please register a club in the first tab to schedule events.</p>
                )}
              </div>

              {/* Event list / Timeline */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Timeline of Scheduled Events
                </h2>
                {allEvents.length > 0 ? (
                  <div className="relative border-l border-white/10 pl-6 ml-3 space-y-8 py-2">
                    {allEvents.map((event) => {
                      const evDate = new Date(event.date);
                      const isPast = evDate < new Date().setHours(0,0,0,0);
                      const formattedDate = evDate.toLocaleDateString(undefined, { 
                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      });
                      const themeColor = event.clubColor || 'primary';

                      return (
                        <div key={event.id} className="relative group">
                          {/* Timeline dot */}
                          <div className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-2 border-[#0f172a] transition-all group-hover:scale-125
                            ${isPast ? 'bg-gray-600' : bgColors[themeColor]}
                          `} />

                          <div className="bg-surface/50 border border-white/5 p-5 rounded-2xl space-y-3 relative">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h3 className="font-bold text-base text-gray-100 flex items-center gap-2">
                                  {event.title}
                                </h3>
                                <p className="text-xs text-gray-400 font-bold flex items-center gap-1.5 mt-1">
                                  <Calendar size={12} className={textColors[themeColor]} /> {formattedDate}
                                  {event.location && (
                                    <>
                                      <span className="text-gray-600">•</span>
                                      <span className="flex items-center gap-0.5 text-gray-400">
                                        <MapPin size={12} /> {event.location}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold uppercase tracking-wider ${colorMap[themeColor]}`}>
                                  {event.clubName}
                                </span>
                                <button
                                  onClick={() => handleDeleteEvent(event.clubId, event.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {event.notes && (
                              <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-xs text-gray-400 leading-relaxed">
                                <span className="font-bold text-gray-300 block mb-1 flex items-center gap-1"><Info size={12} /> Notes:</span>
                                {event.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl bg-surface/10">
                    <Calendar size={32} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 font-bold mb-1">No upcoming events</p>
                    <p className="text-sm text-gray-500">Plan ahead by registering meeting schedules or event dates.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'activities' && (
            <motion.div
              key="activities"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Activity Log Form */}
              <div className="bg-surface/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 h-fit space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Clock size={20} className="text-primary" /> Log Hours
                </h2>
                {clubs.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Club</label>
                      <select
                        value={newActClubId}
                        onChange={(e) => setNewActClubId(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white"
                      >
                        {clubs.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Hours Spent</label>
                        <input
                          type="number"
                          step="0.25"
                          placeholder="e.g. 1.5, 3"
                          value={newActHours}
                          onChange={(e) => setNewActHours(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                        <input
                          type="date"
                          value={newActDate}
                          onChange={(e) => setNewActDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description of Activity</label>
                      <input
                        type="text"
                        placeholder="e.g. Organized regional math competition, Staffed bake sale"
                        value={newActDesc}
                        onChange={(e) => setNewActDesc(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                      />
                    </div>
                    <button
                      onClick={handleAddActivity}
                      className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Log Hours
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Please register a club in the first tab to log hours.</p>
                )}
              </div>

              {/* Activity Hours log */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Logged Activities & Community Service Hours
                </h2>
                {allActivities.length > 0 ? (
                  <div className="space-y-3">
                    {allActivities.map((act) => {
                      const themeColor = act.clubColor || 'primary';
                      return (
                        <div
                          key={act.id}
                          className="flex items-center justify-between p-4 bg-surface/50 border border-white/5 rounded-2xl transition-all group"
                        >
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-400 font-bold text-sm`}>
                              +{act.hours}h
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-100">{act.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold uppercase tracking-wider ${colorMap[themeColor]}`}>
                                  {act.clubName}
                                </span>
                                <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
                                  <Calendar size={10} /> {act.date}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteActivity(act.clubId, act.id)}
                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl bg-surface/10">
                    <Clock size={32} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 font-bold mb-1">No activity logged</p>
                    <p className="text-sm text-gray-500">Volunteering and club hours logged here will accumulate in your stats dashboard.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'updates' && (
            <motion.div
              key="updates"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Update Log Form */}
              <div className="bg-surface/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 h-fit space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Megaphone size={20} className="text-primary" /> Post Update
                </h2>
                {clubs.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Club</label>
                      <select
                        value={newUpdateClubId}
                        onChange={(e) => setNewUpdateClubId(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white"
                      >
                        {clubs.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Milestone / Update Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Won regional final, Created website"
                        value={newUpdateTitle}
                        onChange={(e) => setNewUpdateTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Details / Achievements</label>
                      <textarea
                        placeholder="Write down the details, awards received, or goals completed..."
                        value={newUpdateContent}
                        onChange={(e) => setNewUpdateContent(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-all text-white placeholder-gray-500 h-24 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleAddUpdate}
                      className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Publish Update
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Please register a club in the first tab to post updates.</p>
                )}
              </div>

              {/* Updates log list */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Updates Feed & Major Milestones
                </h2>
                {allUpdates.length > 0 ? (
                  <div className="space-y-4">
                    {allUpdates.map((update) => {
                      const themeColor = update.clubColor || 'primary';
                      return (
                        <div
                          key={update.id}
                          className="p-5 bg-surface/50 border border-white/5 rounded-2xl space-y-3 relative group"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg ${colorMap[themeColor]} flex items-center justify-center shrink-0`}>
                                <Award size={16} />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-gray-100">{update.title}</h3>
                                <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                                  Posted {new Date(update.createdAt).toLocaleDateString(undefined, { 
                                    month: 'short', day: 'numeric', year: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold uppercase tracking-wider ${colorMap[themeColor]}`}>
                                {update.clubName}
                              </span>
                              <button
                                onClick={() => handleDeleteUpdate(update.clubId, update.id)}
                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {update.content && (
                            <p className="text-xs text-gray-400 leading-relaxed bg-black/10 p-3.5 rounded-xl border border-white/5">
                              {update.content}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl bg-surface/10">
                    <Megaphone size={32} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 font-bold mb-1">No updates posted</p>
                    <p className="text-sm text-gray-500">Record achievements, competition awards, or announcements here.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClubsTracker;
