// Audio Worklet Scheduler
// Sample-accurate scheduling using AudioWorklet for precise timing

// This code runs in the AudioWorklet scope (separate thread)
class SchedulerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Scheduling state
    this.isPlaying = false;
    this.currentTime = 0;
    this.bpm = 120;
    this.swingPercent = 0;
    this.timeSignature = [4, 4];
    this.currentBar = 0;
    this.currentBeat = 0;
    this.currentStep = 0;
    this.stepsPerBeat = 4; // 16th note resolution
    this.metronomeEnabled = false;
    this.countInBars = 0;
    this.isCountingIn = false;
    
    // Timing calculations
    this.samplesPerStep = 0;
    this.sampleCounter = 0;
    this.lastStepTime = 0;
    
    // Scheduled events queue
    this.scheduledEvents = [];
    this.metronomeEvents = [];
    
    // Metronome settings
    this.metronomeVolume = 0.5;
    this.accentVolume = 0.8;
    
    this.updateTiming();
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    // Send ready signal
    this.port.postMessage({ type: 'ready' });
  }
  
  /**
   * Main audio processing loop
   */
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const bufferLength = output[0].length;
    
    if (this.isPlaying) {
      for (let i = 0; i < bufferLength; i++) {
        this.processSample(i);
      }
    }
    
    // Keep processor alive
    return true;
  }
  
  /**
   * Process a single sample
   */
  processSample(sampleIndex) {
    this.sampleCounter++;
    this.currentTime = this.sampleCounter / sampleRate;
    
    // Check if we've hit a step boundary
    if (this.sampleCounter >= this.samplesPerStep + this.lastStepTime) {
      this.onStepTick();
      this.lastStepTime = this.sampleCounter;
    }
    
    // Process scheduled events
    this.processScheduledEvents();
    
    // Generate metronome audio if enabled
    if (this.metronomeEnabled) {
      this.generateMetronome(sampleIndex);
    }
  }
  
  /**
   * Handle step tick (16th note resolution)
   */
  onStepTick() {
    // Update position
    this.currentStep++;
    
    if (this.currentStep >= this.stepsPerBeat) {
      this.currentStep = 0;
      this.currentBeat++;
      
      if (this.currentBeat >= this.timeSignature[0]) {
        this.currentBeat = 0;
        this.currentBar++;
        
        // Handle count-in completion
        if (this.isCountingIn && this.currentBar >= this.countInBars) {
          this.isCountingIn = false;
          this.currentBar = 0;
          this.port.postMessage({
            type: 'countInComplete'
          });
        }
      }
    }
    
    // Send position update
    this.port.postMessage({
      type: 'positionUpdate',
      position: {
        bar: this.currentBar,
        beat: this.currentBeat,
        step: this.currentStep,
        time: this.currentTime
      }
    });
    
    // Schedule metronome clicks
    if (this.metronomeEnabled && this.currentStep === 0) {
      this.scheduleMetronomeClick();
    }
    
    // Trigger scheduled events for this step
    this.triggerStepEvents();
  }
  
  /**
   * Schedule a metronome click
   */
  scheduleMetronomeClick() {
    const isAccent = this.currentBeat === 0; // Accent on beat 1
    const volume = isAccent ? this.accentVolume : this.metronomeVolume;
    const frequency = isAccent ? 1000 : 800; // Higher pitch for accent
    
    this.metronomeEvents.push({
      time: this.currentTime,
      frequency,
      volume,
      duration: 0.05 // 50ms click
    });
  }
  
  /**
   * Generate metronome audio
   */
  generateMetronome(sampleIndex) {
    // Simple sine wave metronome clicks
    for (let i = this.metronomeEvents.length - 1; i >= 0; i--) {
      const event = this.metronomeEvents[i];
      const elapsed = this.currentTime - event.time;
      
      if (elapsed >= event.duration) {
        this.metronomeEvents.splice(i, 1);
        continue;
      }
      
      if (elapsed >= 0) {
        const envelope = Math.exp(-elapsed * 20); // Quick decay
        const sample = Math.sin(2 * Math.PI * event.frequency * elapsed) * event.volume * envelope;
        
        // Output to all channels
        // Note: This is a simplified version - real implementation would use proper audio output
        // In actual usage, metronome would be mixed in the main thread
      }
    }
  }
  
  /**
   * Schedule an event (pad hit, note, etc.)
   */
  scheduleEvent(event) {
    // Calculate exact sample time for the event
    const targetStep = event.step || 0;
    const targetBar = event.bar || this.currentBar;
    const targetBeat = event.beat || 0;
    
    // Calculate absolute step position
    const absoluteStep = (targetBar * this.timeSignature[0] * this.stepsPerBeat) + 
                         (targetBeat * this.stepsPerBeat) + 
                         targetStep;
    
    // Apply swing timing
    let swingOffset = 0;
    if (this.swingPercent > 0 && (targetStep % 2) === 1) {
      // Apply swing to off-beats (steps 1, 3, 5, 7, etc.)
      const swingRatio = 1 + (this.swingPercent / 100) * 0.3; // Max 30% swing
      swingOffset = (this.samplesPerStep * (swingRatio - 1));
    }
    
    const scheduledTime = (absoluteStep * this.samplesPerStep) + swingOffset;
    
    this.scheduledEvents.push({
      ...event,
      scheduledTime,
      absoluteStep
    });
    
    // Sort events by scheduled time
    this.scheduledEvents.sort((a, b) => a.scheduledTime - b.scheduledTime);
  }
  
  /**
   * Process scheduled events that should trigger now
   */
  processScheduledEvents() {
    for (let i = this.scheduledEvents.length - 1; i >= 0; i--) {
      const event = this.scheduledEvents[i];
      
      if (this.sampleCounter >= event.scheduledTime) {
        // Trigger the event
        this.port.postMessage({
          type: 'triggerEvent',
          event: {
            ...event,
            actualTime: this.currentTime,
            latency: this.sampleCounter - event.scheduledTime
          }
        });
        
        // Remove from queue
        this.scheduledEvents.splice(i, 1);
      }
    }
  }
  
  /**
   * Trigger events scheduled for the current step
   */
  triggerStepEvents() {
    // This would typically query pattern data and schedule pad hits
    // For now, just send step information
    this.port.postMessage({
      type: 'stepTrigger',
      step: this.currentStep,
      beat: this.currentBeat,
      bar: this.currentBar,
      time: this.currentTime
    });
  }
  
  /**
   * Update timing calculations when BPM or time signature changes
   */
  updateTiming() {
    // Calculate samples per step (16th note)
    const beatsPerMinute = this.bpm;
    const beatsPerSecond = beatsPerMinute / 60;
    const stepsPerSecond = beatsPerSecond * this.stepsPerBeat;
    this.samplesPerStep = Math.floor(sampleRate / stepsPerSecond);
    
    console.log('Timing updated:', {
      bpm: this.bpm,
      samplesPerStep: this.samplesPerStep,
      stepsPerSecond: stepsPerSecond.toFixed(2)
    });
  }
  
  /**
   * Handle messages from main thread
   */
  handleMessage(message) {
    switch (message.type) {
      case 'start':
        this.start(message.data);
        break;
        
      case 'stop':
        this.stop();
        break;
        
      case 'pause':
        this.pause();
        break;
        
      case 'setBPM':
        this.setBPM(message.bpm);
        break;
        
      case 'setSwing':
        this.setSwing(message.swingPercent);
        break;
        
      case 'setTimeSignature':
        this.setTimeSignature(message.timeSignature);
        break;
        
      case 'setMetronome':
        this.setMetronome(message.enabled);
        break;
        
      case 'scheduleEvent':
        this.scheduleEvent(message.event);
        break;
        
      case 'clearEvents':
        this.scheduledEvents = [];
        break;
        
      case 'setPosition':
        this.setPosition(message.position);
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  }
  
  /**
   * Start playback
   */
  start(options = {}) {
    this.isPlaying = true;
    this.isCountingIn = options.countIn || false;
    this.countInBars = options.countInBars || 0;
    
    if (this.isCountingIn) {
      this.currentBar = -this.countInBars;
      this.currentBeat = 0;
      this.currentStep = 0;
    }
    
    this.sampleCounter = 0;
    this.lastStepTime = 0;
    
    this.port.postMessage({
      type: 'started',
      countingIn: this.isCountingIn
    });
  }
  
  /**
   * Stop playback
   */
  stop() {
    this.isPlaying = false;
    this.isCountingIn = false;
    this.currentBar = 0;
    this.currentBeat = 0;
    this.currentStep = 0;
    this.sampleCounter = 0;
    this.lastStepTime = 0;
    this.scheduledEvents = [];
    this.metronomeEvents = [];
    
    this.port.postMessage({ type: 'stopped' });
  }
  
  /**
   * Pause playback
   */
  pause() {
    this.isPlaying = false;
    this.port.postMessage({ type: 'paused' });
  }
  
  /**
   * Set BPM
   */
  setBPM(bpm) {
    this.bpm = Math.max(60, Math.min(200, bpm));
    this.updateTiming();
  }
  
  /**
   * Set swing percentage
   */
  setSwing(swingPercent) {
    this.swingPercent = Math.max(0, Math.min(60, swingPercent));
  }
  
  /**
   * Set time signature
   */
  setTimeSignature(timeSignature) {
    this.timeSignature = timeSignature;
  }
  
  /**
   * Enable/disable metronome
   */
  setMetronome(enabled) {
    this.metronomeEnabled = enabled;
    if (!enabled) {
      this.metronomeEvents = [];
    }
  }
  
  /**
   * Set playback position
   */
  setPosition(position) {
    this.currentBar = position.bar || 0;
    this.currentBeat = position.beat || 0;
    this.currentStep = position.step || 0;
    
    // Recalculate sample counter
    const totalSteps = (this.currentBar * this.timeSignature[0] * this.stepsPerBeat) +
                      (this.currentBeat * this.stepsPerBeat) +
                      this.currentStep;
    
    this.sampleCounter = totalSteps * this.samplesPerStep;
    this.lastStepTime = this.sampleCounter;
  }
}

// Register the processor
registerProcessor('scheduler-processor', SchedulerProcessor);