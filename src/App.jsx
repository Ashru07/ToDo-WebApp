import { useState, useEffect } from 'react'
import { Plus, Check, Trash2, Edit2, Search, Filter, Sun, Moon, BarChart3, Clock, Flag, Tag } from 'lucide-react'

const PRIORITIES = ['low', 'medium', 'high']
const CATEGORIES = ['personal', 'work', 'shopping', 'health', 'learning', 'other']

function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  })

  const [newTodo, setNewTodo] = useState('')
  const [filter, setFilter] = useState('all') // all, active, completed
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const addTodo = (e) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    const todo = {
      id: Date.now(),
      text: newTodo.trim(),
      completed: false,
      priority: 'medium',
      category: 'personal',
      createdAt: new Date().toISOString(),
      dueDate: null,
    }

    setTodos([todo, ...todos])
    setNewTodo('')
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const startEdit = (id, text) => {
    setEditingId(id)
    setEditText(text)
  }

  const saveEdit = (id) => {
    if (!editText.trim()) return deleteTodo(id)
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, text: editText.trim() } : todo
    ))
    setEditingId(null)
    setEditText('')
  }

  const updatePriority = (id, priority) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, priority } : todo
    ))
  }

  const updateCategory = (id, category) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, category } : todo
    ))
  }

  const filteredTodos = todos.filter(todo => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'active' ? !todo.completed :
      todo.completed

    const matchesSearch = todo.text.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
    byPriority: PRIORITIES.map(p => ({
      priority: p,
      count: todos.filter(t => t.priority === p).length
    })),
    byCategory: CATEGORIES.map(c => ({
      category: c,
      count: todos.filter(t => t.category === c).length
    })),
  }

  const progress = todos.length > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  const PriorityBadge = ({ priority }) => {
    const colors = {
      low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority]}`}>
        {priority}
      </span>
    )
  }

  const CategoryBadge = ({ category }) => {
    const colors = {
      personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      work: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      shopping: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      learning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      other: 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[category]}`}>
        {category}
      </span>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Todo Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Organize your tasks, boost your productivity
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-full glass hover:scale-110 transition-transform duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Flag className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Tasks</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Clock className="text-orange-600 dark:text-orange-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.active}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Check className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.completed}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{progress}%</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Progress</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="glass rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Today's Progress</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Add & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add Todo */}
            <div className="glass rounded-2xl p-6 animate-slide-up">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Plus size={20} className="text-blue-600 dark:text-blue-400" />
                Add New Task
              </h2>
              <form onSubmit={addTodo} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="What needs to be done?"
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Priority
                    </label>
                    <select
                      id="priority"
                      className="input-field"
                      value="medium"
                      disabled
                    >
                      {PRIORITIES.map(p => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      id="category"
                      className="input-field"
                      value="personal"
                      disabled
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Task
                </button>
              </form>
            </div>

            {/* Stats Panel */}
            <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">By Priority</h3>
                <Flag size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-3">
                {stats.byPriority.map(item => (
                  <div key={item.priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={item.priority} />
                      <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                        {item.priority}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">By Category</h3>
                <Tag size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-3">
                {stats.byCategory.map(item => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={item.category} />
                      <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                        {item.category}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Todo List */}
          <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="glass rounded-2xl p-6 min-h-[600px]">
              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="input-field pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'active', 'completed'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        filter === f
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Todo List */}
              {filteredTodos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <div className="p-4 bg-slate-100 dark:bg-slate-700/30 rounded-full mb-4">
                    <Flag size={48} className="text-slate-400" />
                  </div>
                  <p className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-2">
                    {todos.length === 0 ? 'No tasks yet' : 'No matching tasks'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-500">
                    {todos.length === 0
                      ? 'Add your first task to get started!'
                      : 'Try adjusting your search or filter'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTodos.map(todo => (
                    <div
                      key={todo.id}
                      className={`task-item glass rounded-xl p-4 ${todo.completed ? 'opacity-75' : ''}`}
                    >
                      {editingId === todo.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(todo.id)}
                            className="input-field"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(todo.id)}
                              className="btn-primary text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null)
                                setEditText('')
                              }}
                              className="btn-secondary text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleTodo(todo.id)}
                            className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              todo.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                            }`}
                          >
                            {todo.completed && <Check size={14} className="text-white" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-base font-medium text-slate-800 dark:text-slate-100 mb-2 break-words ${
                              todo.completed ? 'line-through text-slate-400' : ''
                            }`}>
                              {todo.text}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                              <PriorityBadge priority={todo.priority} />
                              <CategoryBadge category={todo.category} />
                            </div>

                            <div className="mt-3 flex items-center gap-3">
                              <button
                                onClick={() => startEdit(todo.id, todo.text)}
                                className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          <p>Built with React, Tailwind CSS & Lucide Icons</p>
        </footer>
      </div>
    </div>
  )
}

export default App
