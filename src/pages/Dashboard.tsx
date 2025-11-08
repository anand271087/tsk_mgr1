import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Sparkles, Search } from 'lucide-react';
import Profile from '../components/Profile';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'done';
  created_at: string;
}

interface SearchResult {
  id: string;
  title: string;
  priority: string;
  status: string;
  similarity: number;
}

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingSubtasks, setGeneratingSubtasks] = useState<string | null>(null);
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<Record<string, string[]>>({});
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    checkUser();
    fetchTasks();
    fetchAllSubtasks();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubtasks = async () => {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const subtasksByTask: Record<string, Subtask[]> = {};
      data?.forEach((subtask) => {
        if (!subtasksByTask[subtask.task_id]) {
          subtasksByTask[subtask.task_id] = [];
        }
        subtasksByTask[subtask.task_id].push(subtask);
      });

      setSubtasks(subtasksByTask);
    } catch (err: any) {
      console.error('Error fetching subtasks:', err.message);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: insertedTask, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTask,
            priority,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (insertedTask) {
        await generateTaskEmbedding(insertedTask.id, insertedTask.title);
      }

      setNewTask('');
      setPriority('medium');
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateTaskEmbedding = async (taskId: string, taskTitle: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-task-embedding`;

      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, taskTitle }),
      });
    } catch (err: any) {
      console.error('Error generating embedding:', err.message);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'pending' | 'in-progress' | 'done') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
      fetchAllSubtasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateSubtasks = async (taskId: string, taskTitle: string) => {
    setGeneratingSubtasks(taskId);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-subtasks`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskTitle }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate subtasks');
      }

      const { subtasks: suggested } = await response.json();
      setSuggestedSubtasks(prev => ({ ...prev, [taskId]: suggested }));
      setExpandedTasks(prev => new Set(prev).add(taskId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingSubtasks(null);
    }
  };

  const saveSubtask = async (taskId: string, subtaskTitle: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('subtasks')
        .insert([
          {
            task_id: taskId,
            user_id: user.id,
            title: subtaskTitle,
          },
        ]);

      if (error) throw error;

      fetchAllSubtasks();

      setSuggestedSubtasks(prev => {
        const updated = { ...prev };
        updated[taskId] = updated[taskId].filter(s => s !== subtaskTitle);
        return updated;
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ completed: !completed })
        .eq('id', subtaskId);

      if (error) throw error;
      fetchAllSubtasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;
      fetchAllSubtasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/semantic-search`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const { results } = await response.json();
      setSearchResults(results || []);
    } catch (err: any) {
      setError(err.message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500 text-white';
      case 'in-progress': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white flex items-center justify-center">
        <div className="text-2xl text-blue-600 font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl p-12 space-y-8">
              <h1 className="text-5xl font-bold text-blue-600 text-center mb-8">
                Your Tasks
              </h1>

              <form onSubmit={handleSearch} className="space-y-4 bg-blue-50 p-6 rounded-xl">
                <div className="space-y-2">
                  <label htmlFor="smartSearch" className="block text-lg font-semibold text-gray-700">
                    Smart Search
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="smartSearch"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700 text-lg transition-colors"
                      placeholder="Search for similar tasks..."
                    />
                    <button
                      type="submit"
                      disabled={searching || !searchQuery.trim()}
                      className="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {searching ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          Search
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Similar Tasks Found:</p>
                    <ul className="space-y-2">
                      {searchResults.map((result) => (
                        <li
                          key={result.id}
                          className="bg-white rounded-lg p-4 flex items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium">{result.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(result.priority)}`}>
                                {result.priority.charAt(0).toUpperCase() + result.priority.slice(1)}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(result.status)}`}>
                                {result.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {Math.round(result.similarity * 100)}% match
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {searchResults.length === 0 && searchQuery && !searching && (
                  <p className="text-sm text-gray-600 text-center py-2">
                    No similar tasks found. Try a different search term.
                  </p>
                )}
              </form>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="newTask" className="block text-lg font-semibold text-gray-700">
                New Task
              </label>
              <input
                id="newTask"
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700 text-lg transition-colors"
                placeholder="Enter a new task"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="block text-lg font-semibold text-gray-700">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700 text-lg transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-12 py-4 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-700 hover:scale-105 transition-all duration-300"
            >
              Add Task
            </button>
          </form>

          <div className="space-y-4 mt-8">
            {tasks.length === 0 ? (
              <div className="text-center text-gray-500 text-lg py-8">
                No tasks yet. Add your first task above!
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-blue-50 rounded-xl p-6 space-y-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl text-gray-800 font-semibold flex-1">
                      {task.title}
                    </h3>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-700 font-semibold text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-600">Status:</span>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as 'pending' | 'in-progress' | 'done')}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => generateSubtasks(task.id, task.title)}
                      disabled={generatingSubtasks === task.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {generatingSubtasks === task.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Subtasks with AI
                        </>
                      )}
                    </button>

                    {suggestedSubtasks[task.id] && suggestedSubtasks[task.id].length > 0 && (
                      <div className="bg-white rounded-lg p-4 space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Suggested Subtasks:</p>
                        <ul className="space-y-2">
                          {suggestedSubtasks[task.id].map((suggestion, idx) => (
                            <li key={idx} className="flex items-center justify-between gap-2 text-sm">
                              <span className="text-gray-700">{suggestion}</span>
                              <button
                                onClick={() => saveSubtask(task.id, suggestion)}
                                className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors"
                              >
                                Save
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {subtasks[task.id] && subtasks[task.id].length > 0 && (
                      <div className="space-y-2">
                        <button
                          onClick={() => toggleTaskExpansion(task.id)}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {expandedTasks.has(task.id) ? '▼' : '▶'} Subtasks ({subtasks[task.id].length})
                        </button>

                        {expandedTasks.has(task.id) && (
                          <ul className="space-y-2 pl-4">
                            {subtasks[task.id].map((subtask) => (
                              <li key={subtask.id} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={subtask.completed}
                                  onChange={() => toggleSubtask(subtask.id, subtask.completed)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                  {subtask.title}
                                </span>
                                <button
                                  onClick={() => deleteSubtask(subtask.id)}
                                  className="text-red-600 hover:text-red-700 text-xs font-semibold"
                                >
                                  Delete
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

              <div className="pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full px-12 py-4 bg-white text-blue-600 border-2 border-blue-600 text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-50 hover:scale-105 transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <Profile />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
