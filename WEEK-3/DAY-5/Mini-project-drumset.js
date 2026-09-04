// ==================== DRUMSET PROJECT ====================
// DOM Events & Web Audio API Implementation

// Initialize Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Drum configuration array
const drumsArray = [
    { key: 'A', name: 'Kick', class: 'kick' },
    { key: 'S', name: 'Snare', class: 'snare' },
    { key: 'D', name: 'Hi-Hat Closed', class: 'hihat-closed' },
    { key: 'F', name: 'Tom High', class: 'tom-high' },
    { key: 'G', name: 'Tom Mid', class: 'tom-mid' },
    { key: 'H', name: 'Tom Low', class: 'tom-low' },
    { key: 'J', name: 'Cymbal Crash', class: 'cymbal' },
    { key: 'K', name: 'Hi-Hat Open', class: 'hihat-open' },
    { key: 'L', name: 'Clap', class: 'clap' }
];

// Drum configuration object for quick lookup
const drums = {
    A: { name: 'Kick' },
    S: { name: 'Snare' },
    D: { name: 'Hi-Hat Closed' },
    F: { name: 'Tom High' },
    G: { name: 'Tom Mid' },
    H: { name: 'Tom Low' },
    J: { name: 'Cymbal Crash' },
    K: { name: 'Hi-Hat Open' },
    L: { name: 'Clap' }
};

/**
 * Generate drum sounds using Web Audio API
 * @param {string} type - The type of drum to play
 */
function playSynthSound(type) {
    const now = audioContext.currentTime;
    
    switch(type) {
        case 'A': // Kick Drum
            playKick();
            break;
        case 'S': // Snare
            playSnare();
            break;
        case 'D': // Hi-Hat Closed
            playHiHatClosed();
            break;
        case 'F': // Tom High
            playTom(800);
            break;
        case 'G': // Tom Mid
            playTom(600);
            break;
        case 'H': // Tom Low
            playTom(400);
            break;
        case 'J': // Cymbal Crash
            playCymbal();
            break;
        case 'K': // Hi-Hat Open
            playHiHatOpen();
            break;
        case 'L': // Clap
            playClap();
            break;
    }
}

/**
 * Play Kick drum sound
 */
function playKick() {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
}

/**
 * Play Snare drum sound
 */
function playSnare() {
    const now = audioContext.currentTime;
    const noise = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const gain = audioContext.createGain();
    noise.buffer = buffer;
    noise.connect(gain);
    gain.connect(audioContext.destination);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noise.start(now);
}

/**
 * Play Hi-Hat Closed sound
 */
function playHiHatClosed() {
    const now = audioContext.currentTime;
    const noise = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const gain = audioContext.createGain();
    noise.buffer = buffer;
    noise.connect(gain);
    gain.connect(audioContext.destination);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    noise.start(now);
}

/**
 * Play Hi-Hat Open sound
 */
function playHiHatOpen() {
    const now = audioContext.currentTime;
    const noise = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const gain = audioContext.createGain();
    noise.buffer = buffer;
    noise.connect(gain);
    gain.connect(audioContext.destination);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    noise.start(now);
}

/**
 * Play Tom drum sound
 * @param {number} frequency - Frequency of the tom
 */
function playTom(frequency) {
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.start(now);
    osc.stop(now + 0.15);
}

/**
 * Play Cymbal Crash sound
 */
function playCymbal() {
    const now = audioContext.currentTime;
    const noise = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const gain = audioContext.createGain();
    noise.buffer = buffer;
    noise.connect(gain);
    gain.connect(audioContext.destination);
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    noise.start(now);
}

/**
 * Play Clap sound
 */
function playClap() {
    const now = audioContext.currentTime;
    const noise = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.15, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const gain = audioContext.createGain();
    noise.buffer = buffer;
    noise.connect(gain);
    gain.connect(audioContext.destination);
    
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.start(now);
}

/**
 * Play drum sound and provide visual feedback
 * @param {string} key - The drum key (A-L)
 */
function playDrum(key) {
    // Play the synthesized drum sound
    playSynthSound(key);
    
    // Visual feedback
    const button = document.querySelector(`[data-key="${key}"]`);
    if (button) {
        button.classList.add('active');
        setTimeout(() => {
            button.classList.remove('active');
        }, 100);
    }
}

/**
 * Initialize drum buttons by creating them dynamically
 * Creates buttons from the drumsArray configuration
 */
function initializeDrumButtons() {
    const drumset = document.getElementById('drumset');
    
    if (!drumset) {
        console.error('Drumset element not found!');
        return;
    }
    
    drumsArray.forEach(drum => {
        // Create button element
        const button = document.createElement('button');
        button.className = `drum ${drum.class}`;
        button.dataset.key = drum.key;
        button.innerHTML = `
            <div class="drum-key">${drum.key}</div>
            <div class="drum-name">${drum.name}</div>
        `;

        // Add click event listener
        button.addEventListener('click', () => {
            playDrum(drum.key);
        });

        // Append button to drumset
        drumset.appendChild(button);
    });
}

/**
 * Handle keyboard events
 * Listen for A-L keys and play corresponding drums
 */
document.addEventListener('keydown', (event) => {
    const key = event.key.toUpperCase();
    
    // Check if key is a valid drum key
    if (drums[key]) {
        event.preventDefault();
        playDrum(key);
    }
});

/**
 * Handle keyboard release for visual feedback
 */
document.addEventListener('keyup', (event) => {
    const key = event.key.toUpperCase();
    
    if (drums[key]) {
        const button = document.querySelector(`[data-key="${key}"]`);
        if (button) {
            button.classList.remove('active');
        }
    }
});

/**
 * Initialize on page load
 * Sets up drum buttons and logs initialization message
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeDrumButtons();
    console.log('🥁 Drumset initialized! Use A-L keys or click on drums.');
    console.log('Available drums:', drumsArray.map(d => `${d.key}: ${d.name}`).join(', '));
});

// ==================== USAGE ====================
// This drumset uses Web Audio API to generate drum sounds synthetically
// No audio files needed!
// 
// How it works:
// 1. The Web Audio API creates oscillators and noise buffers
// 2. Each drum type has its own sound synthesis function
// 3. Sounds are played when buttons are clicked or keys A-L are pressed
//
// To customize sounds:
// - Edit the playSynthSound() function parameters
// - Adjust frequencies, durations, and gain levels
// - Add new drum sounds with their own synthesis functions

