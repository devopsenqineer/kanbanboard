import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

// Import Lucide React Icons
import { Plus, LogOut, Moon, Sun, X, Edit, Trash2, CheckCircle, CircleDot, Circle, Settings } from 'lucide-react';

// Tailwind CSS CDN (will be loaded in the HTML)
// Make sure to include <script src="https://cdn.tailwindcss.com"></script> in your public/index.html

// Context for App State
const AppContext = createContext(null);

// --- Utility Functions for Local Storage ---
const getLocalStorageItem = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        const parsedItem = item ? JSON.parse(item) : defaultValue;
        console.log(`[LocalStorage] Loaded '${key}':`, parsedItem); // Log for debugging
        return parsedItem;
    } catch (error) {
        console.error("Error reading from localStorage", key, error);
        return defaultValue;
    }
};

const setLocalStorageItem = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        console.log(`[LocalStorage] Saved '${key}':`, value); // Log for debugging
    } catch (error) {
        console.error("Error writing to localStorage", key, error);
    }
};

// --- Global App Component ---
const App = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    // Initial page is always 'board', navigate to 'login' via button
    const [currentPage, setCurrentPage] = useState('board');
    const [theme, setTheme] = useState('dark'); // Default to dark mode

    // Initial check for admin status (e.g., if already logged in from a previous session)
    useEffect(() => {
        const storedAdminStatus = getLocalStorageItem('kanban_isAdmin', false);
        setIsAdmin(storedAdminStatus);
    }, []);

    // Set initial theme based on system preference or localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    // Navigate function now only updates internal state
    const navigateTo = (page) => {
        setCurrentPage(page);
    };

    const handleLoginSuccess = () => {
        setIsAdmin(true);
        setLocalStorageItem('kanban_isAdmin', true);
        navigateTo('board'); // Redirect to main board after login
    };

    const handleLogout = () => {
        setIsAdmin(false);
        setLocalStorageItem('kanban_isAdmin', false);
        navigateTo('board'); // Redirect to main board (viewer mode) after logout
    };

    return (
        <AppContext.Provider value={{ isAdmin, setIsAdmin, handleLogout, theme, toggleTheme, navigateTo }}>
            <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 transition-colors duration-300 font-inter">
                {currentPage === 'login' ? (
                    <AuthScreen onLoginSuccess={handleLoginSuccess} />
                ) : (
                    <KanbanBoard />
                )}
            </div>
        </AppContext.Provider>
    );
};

// --- Modals (Confirm and Prompt) ---
const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm relative border border-gray-200 dark:border-gray-700">
                <p className="text-gray-800 dark:text-white text-lg mb-6 text-center">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Bestätigen
                    </button>
                    <button
                        onClick={onCancel}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Abbrechen
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const PromptModal = ({ message, defaultValue = '', onConfirm, onCancel }) => {
    const [inputValue, setInputValue] = useState(defaultValue);

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm relative border border-gray-200 dark:border-gray-700">
                <p className="text-gray-800 dark:text-white text-lg mb-4">{message}</p>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-800 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600 mb-4"
                    onKeyDown={(e) => e.key === 'Enter' && onConfirm(inputValue)}
                    autoFocus
                />
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => onConfirm(inputValue)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        OK
                    </button>
                    <button
                        onClick={onCancel}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Abbrechen
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- AuthScreen Component ---
const AuthScreen = ({ onLoginSuccess }) => {
    const { navigateTo } = useContext(AppContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordChangeError, setPasswordChangeError] = useState('');

    // Default admin credentials (can be changed via the UI)
    const ADMIN_USERNAME = 'admin';
    const DEFAULT_ADMIN_PASSWORD = 'password123';
    const getAdminPassword = () => getLocalStorageItem('kanban_admin_password', DEFAULT_ADMIN_PASSWORD);
    const hasPasswordBeenChanged = () => getLocalStorageItem('kanban_password_changed', false);

    useEffect(() => {
        // If already "logged in" (isAdmin true in localStorage) and password hasn't been changed
        // and current password is the default, force password change view.
        if (getLocalStorageItem('kanban_isAdmin', false) && !hasPasswordBeenChanged() && getAdminPassword() === DEFAULT_ADMIN_PASSWORD) {
            setShowPasswordChange(true);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        if (username === ADMIN_USERNAME && password === getAdminPassword()) {
            // If logged in with default password and it hasn't been changed, force password change
            if (password === DEFAULT_ADMIN_PASSWORD && !hasPasswordBeenChanged()) {
                setShowPasswordChange(true);
                // Do NOT call onLoginSuccess here. It will be called after password change.
            } else {
                // Regular successful login with a changed password
                onLoginSuccess();
            }
        } else {
            setError('Ungültiger Benutzername oder Passwort.');
        }
    };

    const handleChangePassword = (e) => {
        e.preventDefault();
        setPasswordChangeError('');
        if (currentPassword !== getAdminPassword()) {
            setPasswordChangeError('Aktuelles Passwort ist falsch.');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordChangeError('Neues Passwort muss mindestens 6 Zeichen lang sein.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordChangeError('Neue Passwörter stimmen nicht überein.');
            return;
        }

        setLocalStorageItem('kanban_admin_password', newPassword);
        setLocalStorageItem('kanban_password_changed', true); // Mark password as changed
        setPasswordChangeError('Passwort erfolgreich geändert!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowPasswordChange(false); // Hide the form after success
        onLoginSuccess(); // Now that password is changed, proceed to board
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-800 dark:to-black p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
                    {showPasswordChange ? 'Passwort ändern' : 'Admin Login'}
                </h2>
                {showPasswordChange ? (
                    <form onSubmit={handleChangePassword}>
                        {passwordChangeError && <p className="text-red-600 dark:text-red-400 text-center mb-4">{passwordChangeError}</p>}
                        {/* Prompt for password change if it hasn't been changed yet */}
                        {!hasPasswordBeenChanged() && getAdminPassword() === DEFAULT_ADMIN_PASSWORD && (
                            <p className="text-yellow-600 dark:text-yellow-400 text-center mb-4 font-semibold">
                                Bitte ändern Sie Ihr Standardpasswort für die Sicherheit.
                            </p>
                        )}
                        <div className="mb-4">
                            <label htmlFor="current-password" className="block text-gray-600 dark:text-gray-300 text-sm font-semibold mb-2">Aktuelles Passwort</label>
                            <input
                                type="password"
                                id="current-password"
                                className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-800 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="new-password" className="block text-gray-600 dark:text-gray-300 text-sm font-semibold mb-2">Neues Passwort</label>
                            <input
                                type="password"
                                id="new-password"
                                className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-800 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="confirm-new-password" className="block text-gray-600 dark:text-gray-300 text-sm font-semibold mb-2">Neues Passwort bestätigen</label>
                            <input
                                type="password"
                                id="confirm-new-password"
                                className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-800 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                        >
                            Passwort ändern
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="mb-6">
                        {error && <p className="text-red-600 dark:text-red-400 text-center mb-4">{error}</p>}
                        <div className="mb-6">
                            <label htmlFor="username" className="block text-gray-600 dark:text-gray-300 text-sm font-semibold mb-2">Benutzername</label>
                            <input
                                type="text"
                                id="username"
                                className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-800 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600"
                                placeholder="admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-8">
                            <label htmlFor="password" className="block text-gray-600 dark:text-gray-300 text-sm font-semibold mb-2">Passwort</label>
                            <input
                                type="password"
                                id="password"
                                className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-800 placeholder-gray-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:border-gray-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                        >
                            Anmelden
                        </button>
                    </form>
                )}

                {!showPasswordChange && (
                    <div className="text-center mt-6">
                        <button
                            onClick={() => navigateTo('board')}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            Zurück zum Board (Viewer)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- KanbanBoard Component ---
const KanbanBoard = () => {
    const { isAdmin, handleLogout, theme, toggleTheme, navigateTo } = useContext(AppContext);
    const [boards, setBoards] = useState([]);
    const [currentBoardId, setCurrentBoardId] = useState(null);
    const [columns, setColumns] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedColumn, setDraggedColumn] = useState(null);

    const [showBoardManagementModal, setShowBoardManagementModal] = useState(false); // New state for board management modal

    // Load data from localStorage on initial render
    useEffect(() => {
        const storedBoards = getLocalStorageItem('kanban_boards', []);
        const storedColumns = getLocalStorageItem('kanban_columns', []);
        const storedTasks = getLocalStorageItem('kanban_tasks', []);
        const storedCurrentBoardId = getLocalStorageItem('kanban_currentBoardId', null);

        setBoards(storedBoards);
        setColumns(storedColumns);
        setTasks(storedTasks);

        if (storedBoards.length > 0) {
            // Ensure currentBoardId is valid or defaults to the first board
            const idToSet = storedCurrentBoardId && storedBoards.some(b => b.id === storedCurrentBoardId)
                           ? storedCurrentBoardId
                           : storedBoards[0].id;
            setCurrentBoardId(idToSet);
            console.log("[KanbanBoard] Setting initial currentBoardId:", idToSet);
        } else {
            setCurrentBoardId(null); // Ensure currentBoardId is null if no boards
            console.log("[KanbanBoard] No boards found, currentBoardId set to null.");
        }
    }, []);

    // Save data to localStorage whenever boards, columns, or tasks change
    useEffect(() => {
        setLocalStorageItem('kanban_boards', boards);
    }, [boards]);

    useEffect(() => {
        setLocalStorageItem('kanban_columns', columns);
    }, [columns]);

    useEffect(() => {
        setLocalStorageItem('kanban_tasks', tasks);
    }, [tasks]);

    useEffect(() => {
        setLocalStorageItem('kanban_currentBoardId', currentBoardId);
    }, [currentBoardId]);

    // Update current board if boards array changes (e.g., board deleted)
    useEffect(() => {
        if (!currentBoardId && boards.length > 0) {
            setCurrentBoardId(boards[0].id);
        } else if (currentBoardId && !boards.some(b => b.id === currentBoardId)) {
            setCurrentBoardId(boards.length > 0 ? boards[0].id : null);
        }
    }, [boards, currentBoardId]);


    const openModal = (content) => {
        setModalContent(content);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalContent(null);
    };

    // Board operations
    // Updated to accept name directly, as it's now called from BoardManagementModal
    const addBoard = (name) => {
        const newId = `board-${Date.now()}`;
        const newBoard = { id: newId, name: name, createdAt: new Date().toISOString() };
        setBoards(prev => {
            const updatedBoards = [...prev, newBoard];
            console.log("[KanbanBoard] Boards after adding:", updatedBoards); // Log after state update
            return updatedBoards;
        });
        setCurrentBoardId(newId);
    };

    const deleteBoard = (boardId) => {
        openModal(
            <ConfirmModal
                message="Bist du sicher, dass du dieses Board und alle zugehörigen Spalten und Aufgaben löschen möchtest?"
                onConfirm={() => {
                    setBoards(prev => prev.filter(b => b.id !== boardId));
                    setColumns(prev => prev.filter(col => col.boardId !== boardId));
                    setTasks(prev => prev.filter(task => task.boardId !== boardId));
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );
    };

    // Column operations
    const addColumn = () => {
        openModal(
            <PromptModal
                message="Name der neuen Spalte:"
                onConfirm={(name) => {
                    if (name && name.trim() !== '' && currentBoardId) {
                        const newId = `column-${Date.now()}`;
                        const newOrder = columns.filter(c => c.boardId === currentBoardId).length > 0 ? Math.max(...columns.filter(c => c.boardId === currentBoardId).map(c => c.order)) + 1 : 0;
                        const newColumn = { id: newId, name: name, boardId: currentBoardId, order: newOrder, createdAt: new Date().toISOString() };
                        setColumns(prev => [...prev, newColumn]);
                    }
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );
    };

    const updateColumnName = (columnId, newName) => {
        if (newName.trim() === '') return;
        setColumns(prev => prev.map(col => col.id === columnId ? { ...col, name: newName } : col));
    };

    const deleteColumn = (columnId) => {
        openModal(
            <ConfirmModal
                message="Bist du sicher, dass du diese Spalte und alle zugehörigen Aufgaben löschen möchtest?"
                onConfirm={() => {
                    setColumns(prev => prev.filter(col => col.id !== columnId));
                    setTasks(prev => prev.filter(task => task.columnId !== columnId));
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );
    };

    // Task operations
    const addTask = (columnId) => {
        openModal(
            <PromptModal
                message="Titel der neuen Aufgabe:"
                onConfirm={(title) => {
                    if (title && title.trim() !== '') {
                        const newId = `task-${Date.now()}`;
                        const tasksInColumn = tasks.filter(task => task.columnId === columnId);
                        const newOrder = tasksInColumn.length > 0 ? Math.max(...tasksInColumn.map(t => t.order)) + 1 : 0;
                        const newTask = {
                            id: newId,
                            title: title,
                            description: '',
                            columnId: columnId,
                            boardId: currentBoardId,
                            order: newOrder,
                            status: 'todo',
                            createdAt: new Date().toISOString()
                        };
                        setTasks(prev => [...prev, newTask]);
                    }
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );
    };

    const updateTask = (taskId, updates) => {
        setTasks(prev => prev.map(task => task.id === taskId ? { ...task, ...updates } : task));
    };

    const deleteTask = (taskId) => {
        openModal(
            <ConfirmModal
                message="Bist du sicher, dass du diese Aufgabe löschen möchtest?"
                onConfirm={() => {
                    setTasks(prev => prev.filter(task => task.id !== taskId));
                    closeModal();
                }}
                onCancel={closeModal}
            />
        );
    };

    // Drag and Drop Logic for Tasks
    const handleDragStart = (e, task) => {
        if (!isAdmin) return; // Disable drag for viewers
        e.stopPropagation(); // Prevent parent (column) drag from initiating
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
    };

    const handleDragOver = (e) => {
        if (!isAdmin) return; // Disable drag for viewers
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, targetColumnId, targetTask = null) => {
        if (!isAdmin) return; // Disable drop for viewers
        e.preventDefault();
        e.stopPropagation(); // Prevent drop event from bubbling up to parent column
        if (!draggedTask) return;

        const sourceColumnId = draggedTask.columnId;
        const taskId = draggedTask.id;

        let updatedTasks = [...tasks];

        // If dropping on the same column, reorder
        if (sourceColumnId === targetColumnId) {
            const tasksInTargetColumn = updatedTasks
                .filter(t => t.columnId === targetColumnId)
                .sort((a, b) => a.order - b.order);

            const draggedIndex = tasksInTargetColumn.findIndex(t => t.id === taskId);
            if (draggedIndex === -1) return;

            const [removed] = tasksInTargetColumn.splice(draggedIndex, 1);
            const targetIndex = targetTask ? tasksInTargetColumn.findIndex(t => t.id === targetTask.id) : tasksInTargetColumn.length;

            tasksInTargetColumn.splice(targetIndex, 0, removed);

            // Update order for all tasks in the affected column
            updatedTasks = updatedTasks.map(t => {
                const reorderedTask = tasksInTargetColumn.find(rt => rt.id === t.id);
                return reorderedTask ? { ...t, order: tasksInTargetColumn.indexOf(reorderedTask) } : t;
            });
        } else {
            // Dropping on a different column
            // Update the dragged task's columnId and place it at the end of the new column
            const tasksInTargetColumn = updatedTasks.filter(t => t.columnId === targetColumnId);
            const newOrder = tasksInTargetColumn.length > 0 ? Math.max(...tasksInTargetColumn.map(t => t.order)) + 1 : 0;

            updatedTasks = updatedTasks.map(t =>
                t.id === taskId ? { ...t, columnId: targetColumnId, order: newOrder } : t
            );

            // Reorder tasks in the source column
            const tasksInSourceColumn = updatedTasks
                .filter(t => t.columnId === sourceColumnId && t.id !== taskId)
                .sort((a, b) => a.order - b.order);
            updatedTasks = updatedTasks.map(t => {
                const reorderedTask = tasksInSourceColumn.find(rt => rt.id === t.id);
                return reorderedTask ? { ...t, order: tasksInSourceColumn.indexOf(reorderedTask) } : t;
            });
        }
        setTasks(updatedTasks);
        setDraggedTask(null);
    };

    // Drag and Drop Logic for Columns
    const handleColumnDragStart = (e, column) => {
        if (!isAdmin) return; // Disable drag for viewers
        setDraggedColumn(column);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", column.id);
    };

    const handleColumnDragOver = (e) => {
        if (!isAdmin) return; // Disable drag for viewers
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleColumnDrop = (e, targetColumn) => {
        if (!isAdmin) return; // Disable drop for viewers
        e.preventDefault();
        if (!draggedColumn || draggedColumn.id === targetColumn.id) return;

        const sourceColumnId = draggedColumn.id;
        const targetColumnId = targetColumn.id;

        let updatedColumns = [...columns].filter(col => col.boardId === currentBoardId).sort((a, b) => a.order - b.order);
        const sourceIndex = updatedColumns.findIndex(col => col.id === sourceColumnId);
        const targetIndex = updatedColumns.findIndex(col => col.id === targetColumnId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        const [removed] = updatedColumns.splice(sourceIndex, 1);
        updatedColumns.splice(targetIndex, 0, removed);

        // Update order for all columns
        updatedColumns = updatedColumns.map((col, index) => ({ ...col, order: index }));

        setColumns(prev => {
            const otherBoardColumns = prev.filter(c => c.boardId !== currentBoardId);
            return [...otherBoardColumns, ...updatedColumns];
        });
        setDraggedColumn(null);
    };


    // Task Detail Modal Component
    const TaskDetailModal = ({ task, onClose, onUpdate, onDelete, isAdmin }) => {
        const [title, setTitle] = useState(task.title);
        const [description, setDescription] = useState(task.description);
        const [status, setStatus] = useState(task.status || 'todo'); // Default status
        const [isEditing, setIsEditing] = useState(false);

        useEffect(() => {
            if (!isAdmin) {
                setIsEditing(false); // Force view mode if not admin
            }
        }, [isAdmin]);

        const handleSave = () => {
            onUpdate(task.id, { title, description, status });
            setIsEditing(false);
        };

        const getStatusIcon = (currentStatus) => {
            switch (currentStatus) {
                case 'todo': return <Circle className="w-5 h-5 text-gray-400" />;
                case 'in-progress': return <CircleDot className="w-5 h-5 text-blue-400" />;
                case 'done': return <CheckCircle className="w-5 h-5 text-green-400" />;
                default: return <Circle className="w-5 h-5 text-gray-400" />;
            }
        };

        return createPortal(
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg relative border border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>

                    {isEditing && isAdmin ? (
                        <>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-200 text-gray-800 text-2xl font-bold mb-4 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full h-32 bg-gray-200 text-gray-800 p-2 rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Aufgabenbeschreibung..."
                            ></textarea>
                            <div className="mb-4">
                                <label htmlFor="status" className="block text-gray-600 dark:text-gray-300 text-sm font-semibold mb-2">Status</label>
                                <select
                                    id="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">In Bearbeitung</option>
                                    <option value="done">Erledigt</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={handleSave}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    Speichern
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                                {getStatusIcon(task.status)}
                                <span className="ml-2">{task.title}</span>
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 min-h-[80px]">{task.description || 'Keine Beschreibung vorhanden.'}</p>
                            {isAdmin && (
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
                                    >
                                        <Edit size={18} className="mr-2" /> Bearbeiten
                                    </button>
                                    <button
                                        onClick={() => { onDelete(task.id); onClose(); }}
                                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
                                    >
                                        <Trash2 size={18} className="mr-2" /> Löschen
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>,
            document.body
        );
    };

    // --- Board Management Modal Component ---
    const BoardManagementModal = ({ boards, currentBoardId, setCurrentBoardId, addBoard, deleteBoard, isAdmin, onClose }) => {
        const [isAddingNewBoard, setIsAddingNewBoard] = useState(false);
        const [newBoardName, setNewBoardName] = useState('');

        const handleAddBoard = () => {
            if (newBoardName.trim() === '') return;
            addBoard(newBoardName);
            setNewBoardName('');
            setIsAddingNewBoard(false);
        };

        const handleDeleteBoard = (boardId) => {
            deleteBoard(boardId); // This will trigger the ConfirmModal from KanbanBoard
        };

        return createPortal(
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-3xl relative border border-gray-200 dark:border-gray-700">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Boards verwalten</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {boards.map(board => (
                            <div
                                key={board.id}
                                className={`
                                    relative p-6 rounded-xl shadow-lg cursor-pointer transition-all duration-300
                                    ${board.id === currentBoardId
                                        ? 'bg-blue-600 dark:bg-blue-700 text-white border-2 border-blue-800 dark:border-blue-500 transform scale-105'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 hover:shadow-xl hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }
                                `}
                                onClick={() => {
                                    setCurrentBoardId(board.id);
                                    onClose();
                                }}
                            >
                                <h3 className="text-xl font-semibold mb-2">{board.name}</h3>
                                <p className="text-sm opacity-80">Erstellt: {new Date(board.createdAt).toLocaleDateString()}</p>
                                {board.id === currentBoardId && (
                                    <span className="absolute top-2 right-2 text-white">
                                        <CheckCircle size={20} />
                                    </span>
                                )}
                                {isAdmin && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click
                                            handleDeleteBoard(board.id);
                                        }}
                                        className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                                        title="Board löschen"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {isAdmin && (
                            isAddingNewBoard ? (
                                <div className="p-6 rounded-xl shadow-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex flex-col justify-between">
                                    <input
                                        type="text"
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 mb-4 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 dark:border-gray-500"
                                        placeholder="Neuer Board Name"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddBoard()}
                                        autoFocus
                                    />
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={handleAddBoard}
                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition duration-300"
                                        >
                                            Hinzufügen
                                        </button>
                                        <button
                                            onClick={() => setIsAddingNewBoard(false)}
                                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition duration-300"
                                        >
                                            Abbrechen
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingNewBoard(true)}
                                    className="p-6 rounded-xl shadow-lg bg-gray-100 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all duration-300 flex flex-col items-center justify-center"
                                >
                                    <Plus size={32} />
                                    <span className="mt-2 text-lg">Neues Board erstellen</span>
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className="flex flex-col flex-1">
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg relative z-10">
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Kanban Board</h1>
                    <div className="relative">
                        <select
                            value={currentBoardId || ''}
                            onChange={(e) => setCurrentBoardId(e.target.value)}
                            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        >
                            {boards.length === 0 && <option value="">Keine Boards</option>}
                            {boards.map(board => (
                                <option key={board.id} value={board.id}>{board.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-800 dark:text-white">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowBoardManagementModal(true)} // Open the new modal
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
                        >
                            <Settings size={20} className="mr-2" /> Boards verwalten
                        </button>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
                        title="Theme wechseln"
                    >
                        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                    {isAdmin ? (
                        <button
                            onClick={handleLogout}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
                        >
                            <LogOut size={20} className="mr-2" /> Abmelden
                        </button>
                    ) : (
                        <button
                            onClick={() => navigateTo('login')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
                        >
                            <Settings size={20} className="mr-2" /> Admin Login
                        </button>
                    )}
                </div>
            </header>

            {/* Kanban Board Area */}
            <div className="flex-1 p-6 flex overflow-x-auto space-x-6">
                {!currentBoardId && boards.length === 0 && (
                    <div className="flex flex-col items-center justify-center w-full h-full text-gray-600 dark:text-gray-400 text-lg">
                        <p className="mb-4">Keine Boards vorhanden. {isAdmin && "Bitte füge ein neues Board hinzu, um zu beginnen."}</p>
                        {isAdmin && (
                            <button
                                onClick={() => setShowBoardManagementModal(true)} // Open modal to add first board
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
                            >
                                <Plus size={24} className="mr-2" /> Neues Board erstellen
                            </button>
                        )}
                    </div>
                )}

                {currentBoardId && (
                    <>
                        {columns
                            .filter(col => col.boardId === currentBoardId)
                            .sort((a, b) => a.order - b.order)
                            .map(column => (
                                <div
                                    key={column.id}
                                    className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col border border-gray-200 dark:border-gray-700"
                                    onDragOver={handleColumnDragOver}
                                    onDrop={(e) => handleDrop(e, column.id)} // Pass column.id for drop
                                    draggable={isAdmin}
                                    onDragStart={(e) => handleColumnDragStart(e, column)}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        {isAdmin ? (
                                            <input
                                                type="text"
                                                value={column.name}
                                                onChange={(e) => updateColumnName(column.id, e.target.value)}
                                                className="flex-1 bg-transparent text-xl font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-0 border-b border-gray-300 dark:border-gray-700 pb-1 mr-2"
                                            />
                                        ) : (
                                            <h3 className="flex-1 text-xl font-semibold text-gray-800 dark:text-white pb-1 mr-2">{column.name}</h3>
                                        )}
                                        {isAdmin && (
                                            <button onClick={() => deleteColumn(column.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                    <div
                                        className="flex-1 overflow-y-auto space-y-3 pb-2"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, column.id)} // Pass column.id for drop
                                    >
                                        {tasks
                                            .filter(task => task.columnId === column.id)
                                            .sort((a, b) => a.order - b.order)
                                            .map(task => (
                                                <div
                                                    key={task.id}
                                                    className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-600"
                                                    draggable={isAdmin}
                                                    onDragStart={(e) => handleDragStart(e, task)}
                                                    onClick={() => openModal(<TaskDetailModal task={task} onClose={closeModal} onUpdate={updateTask} onDelete={deleteTask} isAdmin={isAdmin} />)}
                                                    style={{ cursor: isAdmin ? 'grab' : 'pointer' }}
                                                >
                                                    <h4 className="font-semibold text-gray-800 dark:text-white text-lg">{task.title}</h4>
                                                    {task.description && <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 truncate">{task.description}</p>}
                                                </div>
                                            ))}
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={() => addTask(column.id)}
                                            className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-600 font-semibold py-2 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                                        >
                                            <Plus size={18} className="mr-2" /> Aufgabe hinzufügen
                                        </button>
                                    )}
                                </div>
                            ))}

                        {/* Add Column Section (only for admin) */}
                        {isAdmin && (
                            <button
                                onClick={() => addColumn()} // Now opens a prompt modal
                                className="flex-shrink-0 w-80 h-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex items-center justify-center border border-gray-200 border-dashed text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-all duration-300 dark:border-gray-700 dark:hover:text-blue-400 dark:hover:border-blue-400"
                            >
                                <Plus size={32} />
                                <span className="ml-2 text-lg">Spalte hinzufügen</span>
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Board Management Modal */}
            {showBoardManagementModal && (
                <BoardManagementModal
                    boards={boards}
                    currentBoardId={currentBoardId}
                    setCurrentBoardId={setCurrentBoardId}
                    addBoard={addBoard}
                    deleteBoard={deleteBoard}
                    isAdmin={isAdmin}
                    onClose={() => setShowBoardManagementModal(false)}
                />
            )}

            {/* Modal Portal (for Confirm/Prompt/TaskDetail) */}
            {showModal && React.isValidElement(modalContent) && modalContent}
        </div>
    );
};

export default App;
