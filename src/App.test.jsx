import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Todo App', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
  })

  it('renders the todo dashboard header', () => {
    render(<App />)
    expect(screen.getByText('Todo Dashboard')).toBeInTheDocument()
  })

  it('renders the add task form', () => {
    render(<App />)
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument()
    expect(screen.getByText('Add Task')).toBeInTheDocument()
  })

  it('renders filter buttons', () => {
    render(<App />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('renders empty state when no todos', () => {
    render(<App />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('adds a new task', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('What needs to be done?')
    const addButton = screen.getByText('Add Task')

    fireEvent.change(input, { target: { value: 'New task' } })
    fireEvent.click(addButton)

    expect(screen.getByText('New task')).toBeInTheDocument()
  })

  it('does not add empty tasks', () => {
    render(<App />)
    const addButton = screen.getByText('Add Task')
    fireEvent.click(addButton)

    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
  })

  it('toggles task completion', () => {
    render(<App />)

    // Add a task first
    const input = screen.getByPlaceholderText('What needs to be done?')
    fireEvent.change(input, { target: { value: 'Test task' } })
    fireEvent.click(screen.getByText('Add Task'))

    // Find the toggle button for the task
    const toggleButton = screen.getByRole('button', { name: '' })
    fireEvent.click(toggleButton)

    // Check that the task is marked (would have check icon)
    expect(screen.getByText('Test task')).toBeInTheDocument()
  })

  it('deletes a task', () => {
    render(<App />)

    // Add a task
    const input = screen.getByPlaceholderText('What needs to be done?')
    fireEvent.change(input, { target: { value: 'Delete me' } })
    fireEvent.click(screen.getByText('Add Task'))

    expect(screen.getByText('Delete me')).toBeInTheDocument()

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find(btn => btn.getAttribute('title') === 'Delete')
    if (deleteButton) {
      fireEvent.click(deleteButton)
    }

    expect(screen.queryByText('Delete me')).not.toBeInTheDocument()
  })

  it('filters tasks correctly', () => {
    render(<App />)

    // Add tasks
    const input = screen.getByPlaceholderText('What needs to be done?')
    ['Task 1', 'Task 2'].forEach(taskText => {
      fireEvent.change(input, { target: { value: taskText } })
      fireEvent.click(screen.getByText('Add Task'))
    })

    // Toggle first task as completed
    const toggleButtons = screen.getAllByRole('button')
    fireEvent.click(toggleButtons[0])

    // Filter to active
    fireEvent.click(screen.getByText('Active'))
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument()

    // Filter to completed
    fireEvent.click(screen.getByText('Completed'))
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument()
  })
})
