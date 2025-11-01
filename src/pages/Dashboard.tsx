import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([
    '1. Finish homework',
    '2. Call John',
    '3. Buy groceries'
  ]);
  const [newTask, setNewTask] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      setTasks([...tasks, `${tasks.length + 1}. ${newTask}`]);
      setNewTask('');
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-12 space-y-8">
          <h1 className="text-5xl font-bold text-blue-600 text-center mb-8">
            Your Tasks
          </h1>

          <div className="bg-blue-50 rounded-xl p-8 space-y-4">
            {tasks.map((task, index) => (
              <div key={index} className="text-xl text-gray-700 font-medium">
                {task}
              </div>
            ))}
          </div>

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

            <button
              type="submit"
              className="w-full px-12 py-4 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-700 hover:scale-105 transition-all duration-300"
            >
              Add Task
            </button>
          </form>

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
