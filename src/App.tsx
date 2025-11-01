function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white flex items-center justify-center px-6">
      <div className="text-center max-w-4xl w-full space-y-16">
        <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg tracking-tight">
          Welcome to My Task Manager
        </h1>

        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          <button className="w-full md:w-64 px-12 py-6 bg-white text-blue-600 text-xl font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-blue-50">
            Login
          </button>

          <button className="w-full md:w-64 px-12 py-6 bg-white text-blue-600 text-xl font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-blue-50">
            Signup
          </button>

          <button className="w-full md:w-64 px-12 py-6 bg-white text-blue-600 text-xl font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:bg-blue-50">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
