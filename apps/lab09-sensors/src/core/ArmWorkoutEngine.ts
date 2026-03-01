import type { AccelSample, WorkoutState } from "./types";
import { MotionService } from "./MotionService";
import { TtsService } from "./TtsService";
import { HapticsService } from "./HapticsService";

export class ArmWorkoutEngine {
    private listeners = new Set<(s: WorkoutState) => void>();
    private motion = new MotionService();
    private tts = new TtsService();
    private haptics = new HapticsService();

    private lastUpTime = 0;
    private lastRepTime = 0;
    private peak = 0;
    private valley = 0;
    private phase: "WAIT_UP" | "WAIT_DOWN" = "WAIT_UP";

    state: WorkoutState = {
        status: "IDLE",
        repDisplay: 0,
        stats: {
            repsTotal: 0,
            repsOk: 0,
            repsBad: 0,
            score: 0,
            avgRepMs: 0,
        },
    };

    onChange(cb: (s: WorkoutState) => void) {
        this.listeners.add(cb);
        cb(this.clone());
        return () => this.listeners.delete(cb);
    }

    private emit() {
        const snap = this.clone();
        this.listeners.forEach((cb) => cb(snap));
    }

    private clone(): WorkoutState {
        return JSON.parse(JSON.stringify(this.state));
    }

    async start() {
        if (this.state.status === "RUNNING") return;

        this.state = {
            status: "RUNNING",
            repDisplay: 0,
            stats: {
                repsTotal: 0,
                repsOk: 0,
                repsBad: 0,
                score: 0,
                avgRepMs: 0,
            },
        };
        this.phase = "WAIT_UP";
        this.lastRepTime = Date.now();
        this.peak = 0;
        this.valley = 0;

        this.emit();
        await this.tts.speak("เริ่มกายบริหารแขน ยกขึ้นจนสุดแล้วลดลง");
        await this.motion.start((s) => this.process(s));
    }

    async stop() {
        this.state.status = "STOPPED";
        await this.motion.stop();
        this.emit();
        await this.tts.speak("หยุดการออกกำลังกาย");
    }

    async reset() {
        await this.stop();
        this.state.status = "IDLE";
        this.state.repDisplay = 0;
        this.state.stats = {
            repsTotal: 0,
            repsOk: 0,
            repsBad: 0,
            score: 0,
            avgRepMs: 0,
        };
        this.emit();
    }

    private async process(sample: AccelSample) {
        if (this.state.status !== "RUNNING") return;

        const y = sample.ay;
        const side = Math.abs(sample.ax) + Math.abs(sample.az);

        const UP_TH = 1.5;   // Slightly lower than before since we don't have gravity
        const DOWN_TH = -1.2;
        const MIN_ROM = 2.5;
        const MIN_MS = 800;
        const MAX_MS = 4000;

        if (this.phase === "WAIT_UP") {
            this.peak = Math.max(this.peak, y);
            // Ignore small jitter
            if (y > UP_TH) {
                this.phase = "WAIT_DOWN";
                this.lastUpTime = sample.t;
            }
        } else {
            this.valley = Math.min(this.valley, y);

            if (y < DOWN_TH) {
                const now = sample.t;
                const repMs = now - this.lastRepTime;

                // Noise filter: ignore repetitions that happen way too fast (debounce)
                if (repMs < 400) return;

                this.lastRepTime = now;
                this.state.stats.repsTotal++;
                const rom = this.peak - this.valley;

                let ok = true;
                let msg = "เยี่ยมมาก!";

                if (rom < MIN_ROM) {
                    ok = false;
                    msg = "ยกแขนต่ำเกินไป";
                } else if (repMs < MIN_MS) {
                    ok = false;
                    msg = "เร็วเกินไปครับ";
                } else if (repMs > MAX_MS) {
                    ok = false;
                    msg = "ช้าเกินไปหน่อย";
                } else if (side > 4) { // Tightened for linear acceleration
                    ok = false;
                    msg = "กรุณายกแนวตั้ง";
                }

                if (ok) {
                    this.state.repDisplay++;
                    this.state.stats.repsOk++;
                    this.state.stats.score += 10;
                    this.state.stats.avgRepMs = this.state.stats.avgRepMs === 0
                        ? repMs
                        : Math.round((this.state.stats.avgRepMs + repMs) / 2);

                    await this.haptics.success();
                } else {
                    this.state.stats.repsBad++;
                    await this.haptics.warning();
                    await this.tts.speak(msg);
                }

                this.state.stats.lastMessage = msg;
                this.phase = "WAIT_UP";
                this.peak = 0;
                this.valley = 0;
                this.emit();
            }
        }
    }
}
