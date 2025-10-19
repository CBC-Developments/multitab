// TabVerse Ultimate - To-Do List Widget

class TodoWidget {
  constructor(container) {
    this.container = container;
    this.todos = [];
    this.loadTodos();
  }

  render() {
    this.container.innerHTML = `
      <div class="todo-widget">
        <div class="todo-input-container">
          <input 
            type="text" 
            id="todo-input" 
            placeholder="Add a new task..." 
            data-testid="input-todo"
          />
          <button id="add-todo-btn" class="todo-add-btn" data-testid="button-add-todo">+</button>
        </div>
        <div class="todo-list" id="todo-list">
          <!-- Todos will be rendered here -->
        </div>
        <div class="todo-stats" id="todo-stats" data-testid="text-todo-stats">
          0 tasks
        </div>
      </div>
    `;

    this.setupListeners();
    this.renderTodos();
  }

  setupListeners() {
    const input = this.container.querySelector('#todo-input');
    const addBtn = this.container.querySelector('#add-todo-btn');

    addBtn?.addEventListener('click', () => this.addTodo());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTodo();
    });
  }

  addTodo() {
    const input = this.container.querySelector('#todo-input');
    const text = input?.value.trim();

    if (!text) return;

    const todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    };

    this.todos.unshift(todo);
    this.saveTodos();
    this.renderTodos();
    
    if (input) input.value = '';
  }

  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveTodos();
      this.renderTodos();
    }
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.saveTodos();
    this.renderTodos();
  }

  renderTodos() {
    const listEl = this.container.querySelector('#todo-list');
    const statsEl = this.container.querySelector('#todo-stats');

    if (!listEl) return;

    if (this.todos.length === 0) {
      listEl.innerHTML = '<div class="todo-empty">No tasks yet. Add one above!</div>';
    } else {
      listEl.innerHTML = this.todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}" data-testid="todo-item-${todo.id}">
          <input 
            type="checkbox" 
            ${todo.completed ? 'checked' : ''} 
            class="todo-checkbox"
            data-testid="checkbox-todo-${todo.id}"
          />
          <span class="todo-text" data-testid="text-todo-${todo.id}">${this.escapeHtml(todo.text)}</span>
          <button class="todo-delete-btn" data-testid="button-delete-todo-${todo.id}">×</button>
        </div>
      `).join('');

      // Add event listeners to each item
      listEl.querySelectorAll('.todo-item').forEach(item => {
        const id = parseInt(item.dataset.id);
        
        item.querySelector('.todo-checkbox')?.addEventListener('change', () => {
          this.toggleTodo(id);
        });
        
        item.querySelector('.todo-delete-btn')?.addEventListener('click', () => {
          this.deleteTodo(id);
        });
      });
    }

    // Update stats
    const completed = this.todos.filter(t => t.completed).length;
    const total = this.todos.length;
    if (statsEl) {
      statsEl.textContent = `${completed}/${total} completed`;
    }
  }

  loadTodos() {
    chrome.storage.sync.get(['todos'], (result) => {
      this.todos = result.todos || [];
      this.renderTodos();
    });
  }

  saveTodos() {
    chrome.storage.sync.set({ todos: this.todos });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default TodoWidget;
