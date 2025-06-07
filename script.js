// Pomodoro Timer JavaScript
class PomodoroTimer {
    constructor() {
        // Timer state
        this.isRunning = false;
        this.currentSession = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.timeLeft = 0;
        this.totalTime = 0;
        this.completedSessions = 0;
        this.interval = null;
        this.sessionCount = 0; // Track sessions for long break

        // Settings with defaults
        this.settings = {
            workDuration: 25,
            breakDuration: 5,
            longBreakDuration: 15,
            soundEnabled: true,
            autoStartBreaks: false
        };

        // DOM elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.sessionLabel = document.getElementById('sessionLabel');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.progressBar = document.querySelector('.progress-bar');
        this.timerContent = document.querySelector('.timer-content');
        this.playIcon = this.playPauseBtn.querySelector('.btn-icon');

        // Settings inputs
        this.workDurationInput = document.getElementById('workDuration');
        this.breakDurationInput = document.getElementById('breakDuration');
        this.longBreakDurationInput = document.getElementById('longBreakDuration');
        this.soundEnabledInput = document.getElementById('soundEnabled');
        this.autoStartBreaksInput = document.getElementById('autoStartBreaks');

        // Initialize
        this.loadSettings();
        this.initializeTimer();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.updateDisplay();
    }

    // Initialize timer with work session
    initializeTimer() {
        this.currentSession = 'work';
        this.totalTime = this.settings.workDuration * 60;
        this.timeLeft = this.totalTime;
        this.updateSessionLabel();
        this.updateProgressBar();
    }

    // Setup event listeners
    setupEventListeners() {
        // Control buttons
        this.playPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.settingsBtn.addEventListener('click', () => this.openSettings());

        // Settings modal
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });

        // Update settings display when inputs change
        [this.workDurationInput, this.breakDurationInput, this.longBreakDurationInput].forEach(input => {
            input.addEventListener('input', () => {
                if (input.value < 1) input.value = 1;
                if (input === this.workDurationInput && input.value > 60) input.value = 60;
                if (input === this.breakDurationInput && input.value > 30) input.value = 30;
                if (input === this.longBreakDurationInput && input.value > 60) input.value = 60;
            });
        });
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT') return;

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.toggleTimer();
                    break;
                case 'r':
                    e.preventDefault();
                    this.resetTimer();
                    break;
                case 's':
                    e.preventDefault();
                    this.openSettings();
                    break;
                case 'escape':
                    e.preventDefault();
                    this.closeSettings();
                    break;
            }
        });
    }

    // Toggle timer start/pause
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    // Start timer
    startTimer() {
        this.isRunning = true;
        this.playIcon.textContent = '⏸';
        this.timerContent.classList.add('pulsing');

        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgressBar();

            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }

    // Pause timer
    pauseTimer() {
        this.isRunning = false;
        this.playIcon.textContent = '▶';
        this.timerContent.classList.remove('pulsing');
        clearInterval(this.interval);
    }

    // Reset timer
    resetTimer() {
        this.pauseTimer();
        this.initializeTimer();
        this.updateDisplay();
    }

    // Complete current session
    completeSession() {
        this.pauseTimer();
        this.playNotificationSound();

        if (this.currentSession === 'work') {
            this.completedSessions++;
            this.sessionCount++;
            this.updateSessionDisplay();
            
            // Determine next session type
            if (this.sessionCount % 4 === 0) {
                this.startLongBreak();
            } else {
                this.startShortBreak();
            }
        } else {
            // Break completed, start work session
            this.startWorkSession();
        }

        this.saveState();
        
        // Auto-start if enabled
        if (this.settings.autoStartBreaks || this.currentSession === 'work') {
            setTimeout(() => {
                if (this.settings.autoStartBreaks) {
                    this.startTimer();
                }
            }, 1000);
        }
    }

    // Start work session
    startWorkSession() {
        this.currentSession = 'work';
        this.totalTime = this.settings.workDuration * 60;
        this.timeLeft = this.totalTime;
        this.updateSessionLabel();
        this.updateProgressBar();
        this.updateDisplay();
    }

    // Start short break
    startShortBreak() {
        this.currentSession = 'shortBreak';
        this.totalTime = this.settings.breakDuration * 60;
        this.timeLeft = this.totalTime;
        this.updateSessionLabel();
        this.updateProgressBar();
        this.updateDisplay();
    }

    // Start long break
    startLongBreak() {
        this.currentSession = 'longBreak';
        this.totalTime = this.settings.longBreakDuration * 60;
        this.timeLeft = this.totalTime;
        this.updateSessionLabel();
        this.updateProgressBar();
        this.updateDisplay();
    }

    // Update time display
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update page title
        document.title = `${this.timeDisplay.textContent} - Timer`;
    }

    // Update session label
    updateSessionLabel() {
        this.updateSessionDisplay();
    }

    // Update session display with simplified format
    updateSessionDisplay() {
        this.sessionLabel.textContent = `Today ${this.completedSessions}/10`;
    }

    // Update progress bar
    updateProgressBar() {
        const progress = (this.totalTime - this.timeLeft) / this.totalTime;
        const circumference = 2 * Math.PI * 120; // radius = 120
        const strokeDashoffset = circumference - (progress * circumference);
        
        this.progressBar.style.strokeDashoffset = strokeDashoffset;
        
        // Change color for breaks
        if (this.currentSession !== 'work') {
            this.progressBar.classList.add('break');
        } else {
            this.progressBar.classList.remove('break');
        }
    }



    // Play notification sound
    playNotificationSound() {
        if (!this.settings.soundEnabled) return;

        try {
            // Create audio context and play notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.warn('Could not play notification sound:', error);
        }
    }

    // Settings management
    openSettings() {
        this.loadSettingsToForm();
        this.settingsModal.classList.add('open');
    }

    closeSettings() {
        this.settingsModal.classList.remove('open');
    }

    loadSettingsToForm() {
        this.workDurationInput.value = this.settings.workDuration;
        this.breakDurationInput.value = this.settings.breakDuration;
        this.longBreakDurationInput.value = this.settings.longBreakDuration;
        this.soundEnabledInput.checked = this.settings.soundEnabled;
        this.autoStartBreaksInput.checked = this.settings.autoStartBreaks;
    }

    saveSettings() {
        // Update settings object
        this.settings.workDuration = parseInt(this.workDurationInput.value);
        this.settings.breakDuration = parseInt(this.breakDurationInput.value);
        this.settings.longBreakDuration = parseInt(this.longBreakDurationInput.value);
        this.settings.soundEnabled = this.soundEnabledInput.checked;
        this.settings.autoStartBreaks = this.autoStartBreaksInput.checked;

        // Save to localStorage
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));

        // Reset timer if not running to apply new durations
        if (!this.isRunning) {
            this.initializeTimer();
            this.updateDisplay();
        }

        this.closeSettings();
    }

    // Load settings from localStorage
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('pomodoroSettings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }

            // Load completed sessions
            const savedSessions = localStorage.getItem('pomodoroCompletedSessions');
            if (savedSessions) {
                this.completedSessions = parseInt(savedSessions);
                this.updateSessionDisplay();
            }

            // Load session count for long break tracking
            const savedSessionCount = localStorage.getItem('pomodoroSessionCount');
            if (savedSessionCount) {
                this.sessionCount = parseInt(savedSessionCount);
            }
        } catch (error) {
            console.warn('Could not load settings from localStorage:', error);
        }
    }

    // Save current state
    saveState() {
        try {
            localStorage.setItem('pomodoroCompletedSessions', this.completedSessions.toString());
            localStorage.setItem('pomodoroSessionCount', this.sessionCount.toString());
        } catch (error) {
            console.warn('Could not save state to localStorage:', error);
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.pomodoroTimer = new PomodoroTimer();
}); 