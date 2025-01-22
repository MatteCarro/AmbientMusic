class AmbientMelodyGenerator {
    constructor() {
        this.isPlaying = false;
        this.isBeatPlaying = false;

        Tone.Transport.bpm.value = 75;

        this.masterVolume = new Tone.Volume(-12).toDestination();
        this.drumBus = new Tone.Volume(-6).connect(this.masterVolume);

        const synthSettings = {
            oscillator: {
                type: "sine8",
                partials: [1, 0.8, 0.6, 0.4, 0.3].map(p => p * 0.6),
                spread: this.getRandomValue(20, 40),
                count: 8
            },
            envelope: {
                attack: this.getRandomValue(2, 4),
                decay: this.getRandomValue(8, 12),
                sustain: 0.6,
                release: this.getRandomValue(6, 8)
            },
            volume: -16
        };

        this.synth1 = new Tone.PolySynth(Tone.Synth, {
            ...synthSettings,
            voice: Tone.Synth
        }).connect(this.masterVolume);

        const synth2Settings = {
            oscillator: {
                type: "fatsine4",
                partials: [1, 0.6, 0.4, 0.2].map(p => p * 0.5),
                spread: this.getRandomValue(30, 50),
                count: 4
            },
            envelope: {
                attack: this.getRandomValue(3, 5),
                decay: this.getRandomValue(10, 14),
                sustain: 0.5,
                release: this.getRandomValue(8, 10)
            },
            volume: -20
        };

        this.synth2 = new Tone.PolySynth(Tone.Synth, {
            ...synth2Settings,
            voice: Tone.Synth
        }).connect(this.masterVolume);

        this.reverb = new Tone.Reverb({
            decay: this.getRandomValue(10, 14),
            wet: this.getRandomValue(0.5, 0.7),
            preDelay: 0.1
        }).connect(this.masterVolume);

        this.delay = new Tone.FeedbackDelay({
            delayTime: this.getRandomValue(0.4, 0.6),
            feedback: this.getRandomValue(0.3, 0.5),
            wet: this.getRandomValue(0.3, 0.4)
        }).connect(this.masterVolume);

        this.chorus = new Tone.Chorus({
            frequency: this.getRandomValue(0.5, 1.5),
            delayTime: this.getRandomValue(3, 4.5),
            depth: this.getRandomValue(0.6, 0.8),
            wet: 0.3
        }).start();

        this.filter = new Tone.Filter({
            frequency: this.getRandomValue(800, 1200),
            type: "lowpass",
            rolloff: -24,
            Q: 0.5
        }).connect(this.masterVolume);

        this.filterLfo = new Tone.LFO({
            frequency: this.getRandomValue(0.05, 0.1),
            min: 600,
            max: 1000
        }).connect(this.filter.frequency);
        this.filterLfo.start();

        this.synth1.chain(this.chorus, this.filter, this.delay, this.reverb);
        this.synth2.chain(this.chorus, this.filter, this.delay, this.reverb);

        this.kickDrum = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 6,
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.001,
                decay: 0.4,
                sustain: 0.01,
                release: 1.4
            },
            volume: -6
        }).connect(this.drumBus);

        this.noiseDrum = new Tone.NoiseSynth({
            noise: { type: "pink" },
            envelope: {
                attack: 0.001,
                decay: 0.3,
                sustain: 0,
                release: 0.1
            },
            volume: -12
        }).connect(this.drumBus);

        this.hihat = new Tone.MetalSynth({
            frequency: 200,
            envelope: {
                attack: 0.001,
                decay: 0.1,
                release: 0.01
            },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5,
            volume: -20
        }).connect(this.drumBus);

        this.beatPattern = new Tone.Loop(time => {
            this.kickDrum.triggerAttackRelease("C1", "16n", time);

            if (Math.random() > 0.6) {
                this.kickDrum.triggerAttackRelease("C1", "16n", time + Tone.Time("8n"));
            }

            if (this.isBeatPlaying) {
                for (let i = 0; i < 4; i++) {
                    if (Math.random() > 0.3) {
                        this.hihat.triggerAttackRelease("32n", time + Tone.Time("16n") * i);
                    }
                }

                if (Math.random() > 0.85) {
                    this.noiseDrum.triggerAttackRelease("16n", time + Tone.Time("2n"));
                }
            }
        }, "2n");

        this.currentNotes = [];
        this.sequence = null;
    }

    getRandomValue(min, max) {
        return min + Math.random() * (max - min);
    }

    generateMelody() {
        const baseScale = ["E", "F#", "G#", "A", "B", "C#", "D#"];
        const octaves = [2, 3, 4];
        
        let fullScale = [];
        octaves.forEach(octave => {
            baseScale.forEach(note => {
                fullScale.push(note + octave);
            });
        });
        
        let selectedNotes = [];
        
        selectedNotes.push("E2", "E3");
        
        const middleNotes = fullScale.filter(note => note.endsWith("3"));
        for (let i = 0; i < 2; i++) {
            const randomNote = middleNotes[Math.floor(Math.random() * middleNotes.length)];
            if (!selectedNotes.includes(randomNote)) {
                selectedNotes.push(randomNote);
            }
        }
        
        const highNotes = fullScale.filter(note => note.endsWith("4"));
        const randomNote = highNotes[Math.floor(Math.random() * highNotes.length)];
        if (!selectedNotes.includes(randomNote)) {
            selectedNotes.push(randomNote);
        }
        
        this.currentNotes = selectedNotes;

        if (this.sequence) {
            this.sequence.dispose();
        }

        const rhythm = ["2n.", "1m", "2m", "1m."].filter(() => Math.random() > 0.3);
        
        this.sequence = new Tone.Sequence((time, note) => {
            if (Math.random() > 0.15) {
                const duration = rhythm[Math.floor(Math.random() * rhythm.length)];
                this.synth1.triggerAttackRelease(note, duration, time);

                if (Math.random() > 0.5) {
                    const delay = this.getRandomValue(0.5, 2);
                    const secondDuration = rhythm[Math.floor(Math.random() * rhythm.length)];
                    
                    const octaveShift = Math.random() > 0.7 ? 12 : 0;
                    const transposedNote = Tone.Frequency(note).transpose(octaveShift).toNote();
                    
                    this.synth2.triggerAttackRelease(transposedNote, secondDuration, time + delay);
                }
            }
        }, this.currentNotes, "2n");
    }

    togglePlayback() {
        Tone.start();

        if (!this.isPlaying) {
            if (!this.currentNotes.length) {
                this.generateMelody();
            }

            if (Tone.Transport.state !== "started") {
                Tone.Transport.start();
            }

            this.sequence.start(0);
            this.isPlaying = true;
        } else {
            this.sequence.stop();
            this.isPlaying = false;

            if (!this.isBeatPlaying) {
                Tone.Transport.stop();
            }
        }
    }

    toggleBeat() {
        Tone.start();

        if (!this.isBeatPlaying) {
            if (Tone.Transport.state !== "started") {
                Tone.Transport.start();
            }
            this.beatPattern.start(0);
            this.isBeatPlaying = true;
        } else {
            this.beatPattern.stop();
            this.isBeatPlaying = false;

            if (!this.isPlaying) {
                Tone.Transport.stop();
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const generator = new AmbientMelodyGenerator();
    const playPauseBtn = document.getElementById('playPauseBtn');
    const beatBtn = document.getElementById('beatBtn');

    playPauseBtn.addEventListener('click', () => {
        generator.togglePlayback();
        playPauseBtn.querySelector('.play-icon').classList.toggle('hidden');
        playPauseBtn.querySelector('.pause-icon').classList.toggle('hidden');
    });

    document.getElementById('generateBtn').addEventListener('click', () => {
        generator.generateMelody();
        if (!generator.isPlaying) {
            generator.togglePlayback();
            playPauseBtn.querySelector('.play-icon').classList.add('hidden');
            playPauseBtn.querySelector('.pause-icon').classList.remove('hidden');
        }
    });

    beatBtn.addEventListener('click', () => {
        generator.toggleBeat();
        beatBtn.classList.toggle('active');
    });
});
