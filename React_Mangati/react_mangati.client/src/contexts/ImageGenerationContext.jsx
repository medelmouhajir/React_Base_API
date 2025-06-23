// src/contexts/ImageGenerationContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

// Create context
const ImageGenerationContext = createContext();

// Export hook for easy use of the context
export const useImageGeneration = () => {
    const context = useContext(ImageGenerationContext);
    if (!context) {
        throw new Error('useImageGeneration must be used within an ImageGenerationProvider');
    }
    return context;
};

// Provider component
export const ImageGenerationProvider = ({ children }) => {
    // State for background tasks
    const [backgroundTasks, setBackgroundTasks] = useState([]);
    // AI status: 'ready' or 'busy'
    const [aiStatus, setAiStatus] = useState('ready');

    // Update AI status based on background tasks
    useEffect(() => {
        setAiStatus(backgroundTasks.length > 0 ? 'busy' : 'ready');
    }, [backgroundTasks]);

    // Add a new background task
    const addBackgroundTask = (task) => {
        // Create a task with unique ID
        const newTask = {
            id: Date.now().toString(),
            ...task,
            status: 'pending',
            startTime: new Date(),
        };

        setBackgroundTasks(prev => [...prev, newTask]);
        return newTask.id;
    };

    // Update a task by ID
    const updateTask = (taskId, updates) => {
        setBackgroundTasks(prev =>
            prev.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
            )
        );
    };

    // Complete a task
    const completeTask = (taskId, result) => {
        // First update the task
        updateTask(taskId, {
            status: 'completed',
            result,
            completedTime: new Date()
        });

        // Find the task to show notification
        const task = backgroundTasks.find(t => t.id === taskId);
        if (task) {
            // Show notification
            toast.success(
                <div>
                    <strong>{task.title} completed!</strong>
                    <p>{task.description}</p>
                </div>,
                {
                    autoClose: 5000,
                    onClick: () => {
                        // If there's a callback for the notification click, execute it
                        if (task.onNotificationClick && typeof task.onNotificationClick === 'function') {
                            task.onNotificationClick(result);
                        }
                    }
                }
            );

            // Remove the task after a delay (keeps it visible for a short time)
            setTimeout(() => {
                setBackgroundTasks(prev => prev.filter(t => t.id !== taskId));
            }, 3000);
        }
    };

    // Handle task error
    const failTask = (taskId, error) => {
        // Find the task first
        const task = backgroundTasks.find(t => t.id === taskId);

        if (task) {
            // Update the task status
            updateTask(taskId, {
                status: 'failed',
                error: error?.message || 'An error occurred',
                completedTime: new Date()
            });

            // Show error notification
            toast.error(
                <div>
                    <strong>{task.title} failed</strong>
                    <p>{error?.message || 'An error occurred'}</p>
                </div>,
                { autoClose: 5000 }
            );

            // Remove the task after a delay
            setTimeout(() => {
                setBackgroundTasks(prev => prev.filter(t => t.id !== taskId));
            }, 3000);
        }
    };

    // Generate image in background
    const generateImageInBackground = async (generateFn, taskInfo) => {
        // Add task to background
        const taskId = addBackgroundTask({
            type: 'image-generation',
            title: taskInfo.title || 'Generating image',
            description: taskInfo.description || 'Please wait while your image is being generated',
            onNotificationClick: taskInfo.onNotificationClick
        });

        try {
            // Call the provided generation function
            const result = await generateFn();

            // If successful, complete the task
            if (result.success) {
                completeTask(taskId, result);
            } else {
                failTask(taskId, new Error(result.error || 'Failed to generate image'));
            }

            return result;
        } catch (error) {
            // Handle any errors
            failTask(taskId, error);
            throw error;
        }
    };

    // Value object to be provided by the context
    const value = {
        backgroundTasks,
        aiStatus,
        addBackgroundTask,
        updateTask,
        completeTask,
        failTask,
        generateImageInBackground
    };

    return (
        <ImageGenerationContext.Provider value={value}>
            {children}
        </ImageGenerationContext.Provider>
    );
};

export default ImageGenerationContext;