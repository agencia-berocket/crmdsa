import React, { useState, useEffect } from "react";
import { 
  Check, 
  Plus, 
  Trash2, 
  ChevronDown, 
  MoreVertical, 
  X, 
  Maximize2,
  CheckCircle2,
  Square
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface GoogleTasksSidebarProps {
  onClose: () => void;
}

export default function GoogleTasksSidebar({ onClose }: GoogleTasksSidebarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("dw_crm_tasks");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse tasks", err);
      }
    } else {
      // Seed some starter realistic university CRM tasks
      const starter: Task[] = [
        { id: "1", title: "Fazer follow-up com o Diretor da USP", completed: false, createdAt: new Date().toISOString() },
        { id: "2", title: "Sincronizar planilha de reuniões agendadas", completed: false, createdAt: new Date().toISOString() },
        { id: "3", title: "Enviar proposta para comissão de recepção Unicamp", completed: true, createdAt: new Date().toISOString() }
      ];
      setTasks(starter);
      localStorage.setItem("dw_crm_tasks", JSON.stringify(starter));
    }
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem("dw_crm_tasks", JSON.stringify(newTasks));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    const updated = [task, ...tasks];
    saveTasks(updated);
    setNewTaskTitle("");
    setIsAdding(false);
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans" id="google-tasks-drawer">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex flex-col gap-2 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
            Google Tasks
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              title="Fechar painel"
              id="close-tasks-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1.5 text-base font-medium text-gray-800 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors -ml-2">
            <span>Minhas tarefas</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-3">
        {isAdding ? (
          <form onSubmit={handleAddTask} className="border border-blue-500 rounded-lg p-2 flex flex-col gap-2 bg-blue-50/10">
            <input
              type="text"
              autoFocus
              required
              placeholder="O que precisa ser feito?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="bg-transparent border-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 w-full"
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-3 py-1 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-3 text-left py-2.5 px-4 rounded-full text-blue-600 hover:bg-blue-50/40 hover:shadow-sm border border-transparent hover:border-blue-100 transition-all font-medium text-sm"
            id="add-task-quick-btn"
          >
            <div className="w-5 h-5 rounded-full border border-blue-500 flex items-center justify-center text-blue-600">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Adicionar uma tarefa</span>
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-4">
        {tasks.length === 0 ? (
          /* Empty State as in reference image 21 */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg viewBox="0 0 120 120" className="w-24 h-24 text-gray-300">
                <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M45 60 l10 10 l20 -20" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-800">Não há tarefas</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px] leading-relaxed">
              Adicione suas tarefas do CRM de prospecção acadêmica aqui para acompanhá-las lado a lado.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Active Tasks */}
            {activeTasks.length > 0 && (
              <div className="flex flex-col">
                {activeTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    className="flex items-start gap-3 py-2.5 px-2 hover:bg-gray-50 rounded-lg group transition-colors"
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 text-transparent hover:text-blue-500 transition-colors shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </button>
                    <span className="text-sm text-gray-800 leading-tight flex-1">
                      {task.title}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Divider */}
            {activeTasks.length > 0 && completedTasks.length > 0 && (
              <div className="border-t border-gray-100 my-2" />
            )}

            {/* Completed Tasks Accordion */}
            {completedTasks.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 select-none">
                  Concluídas ({completedTasks.length})
                </span>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 py-2 px-2 hover:bg-gray-50 rounded-lg group transition-colors opacity-60"
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </button>
                    <span className="text-sm text-gray-500 line-through leading-tight flex-1">
                      {task.title}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
