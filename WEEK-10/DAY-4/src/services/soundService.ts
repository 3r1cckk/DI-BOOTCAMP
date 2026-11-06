/**
 * Web Audio API synthesizer for clean, zero-dependency browser chimes and alert sounds.
 */

let audioCtx: AudioContext | null = null;
let activeAlarmTimer: number | null = null;
let activeOscillators: OscillatorNode[] = [];

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const soundService = {
  /**
   * Pleasant two-tone reminder chime (E5 -> A5)
   */
  playReminderChime(volume = 0.6) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      gainNode.connect(ctx.destination);

      // First tone (E5: 659.25 Hz)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.connect(gainNode);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Second tone (A5: 880.00 Hz)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.15);
      osc2.connect(gainNode);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.8);
    } catch {
      // Audio autoplay policy may block before user interaction
    }
  },

  /**
   * High-priority alert pulse (three quick warning pulses for imminent deadlines)
   */
  playUrgentAlert(volume = 0.7) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freqs = [784, 880, 1046.5]; // G5, A5, C6

      freqs.forEach((freq, idx) => {
        const toneTime = now + idx * 0.14;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, toneTime);
        gain.gain.linearRampToValueAtTime(volume * 0.5, toneTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, toneTime + 0.2);
        gain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, toneTime);
        osc.connect(gain);
        osc.start(toneTime);
        osc.stop(toneTime + 0.2);
      });
    } catch {
      // Ignore audio error
    }
  },

  /**
   * Urgent Danger Sound (Klaxon / Emergency Siren Alarm)
   * Cycles rapid high-low emergency alert tones to ensure the student notices immediately.
   */
  startDangerAlarm(volume = 0.85) {
    this.stopDangerAlarm();

    const triggerBurst = () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // 4 rapid cycles of two-tone alarm (880Hz / 587Hz) with sawtooth harmonic presence
        const cycles = 4;
        const stepDuration = 0.16;

        for (let i = 0; i < cycles; i++) {
          const t1 = now + i * (stepDuration * 2);
          const t2 = t1 + stepDuration;

          // High tone (880 Hz - A5)
          const gain1 = ctx.createGain();
          gain1.gain.setValueAtTime(0, t1);
          gain1.gain.linearRampToValueAtTime(volume * 0.6, t1 + 0.02);
          gain1.gain.setValueAtTime(volume * 0.6, t1 + stepDuration - 0.02);
          gain1.gain.linearRampToValueAtTime(0.001, t1 + stepDuration);
          gain1.connect(ctx.destination);

          const osc1 = ctx.createOscillator();
          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(880, t1);
          osc1.connect(gain1);
          osc1.start(t1);
          osc1.stop(t1 + stepDuration);
          activeOscillators.push(osc1);

          // Low tone (587.3 Hz - D5)
          const gain2 = ctx.createGain();
          gain2.gain.setValueAtTime(0, t2);
          gain2.gain.linearRampToValueAtTime(volume * 0.55, t2 + 0.02);
          gain2.gain.setValueAtTime(volume * 0.55, t2 + stepDuration - 0.02);
          gain2.gain.linearRampToValueAtTime(0.001, t2 + stepDuration);
          gain2.connect(ctx.destination);

          const osc2 = ctx.createOscillator();
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(587.3, t2);
          osc2.connect(gain2);
          osc2.start(t2);
          osc2.stop(t2 + stepDuration);
          activeOscillators.push(osc2);
        }
      } catch {
        // audio policy fallback
      }
    };

    // Play immediately
    triggerBurst();

    // Repeat every 1.8 seconds until silenced
    activeAlarmTimer = window.setInterval(() => {
      triggerBurst();
    }, 1800);
  },

  /**
   * Immediately stops any playing danger alarm siren
   */
  stopDangerAlarm() {
    if (activeAlarmTimer !== null) {
      clearInterval(activeAlarmTimer);
      activeAlarmTimer = null;
    }
    activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    activeOscillators = [];
  },

  /**
   * Joyful ascending celebration fanfare when an assignment is submitted
   */
  playSubmissionFanfare(volume = 0.6) {
    this.stopDangerAlarm(); // silence any active alarms
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // C5, E5, G5, C6 major triad arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        const toneTime = now + idx * 0.11;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, toneTime);
        gain.gain.linearRampToValueAtTime(volume * 0.45, toneTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, toneTime + (idx === 3 ? 0.7 : 0.25));
        gain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, toneTime);
        osc.connect(gain);
        osc.start(toneTime);
        osc.stop(toneTime + (idx === 3 ? 0.7 : 0.25));
      });
    } catch {
      // Ignore
    }
  }
};
