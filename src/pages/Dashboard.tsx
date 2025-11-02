import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'done';
  created_at: string;
}

function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkUser();
    fetchTasks();
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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTask,
            priority,
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      setNewTask('');
      setPriority('medium');
      fetchTasks();
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-12 space-y-8">
          <h1 className="text-5xl font-bold text-blue-600 text-center mb-8">
            Your Tasks
          </h1>

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
                  className="bg-blue-50 rounded-xl p-6 space-y-3 hover:shadow-lg transition-shadow"
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
    </div>
  );
}

export default Dashboard;
