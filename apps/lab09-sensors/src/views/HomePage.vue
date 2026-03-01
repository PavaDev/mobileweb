<template>
  <ion-page class="premium-theme">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>ARM WORKOUT</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding content-center">
      <div class="workout-container">
        <!-- Status Badge -->
        <div class="status-badge" :class="state?.status.toLowerCase()">
          {{ state?.status }}
        </div>

        <!-- Main Counter -->
        <div class="counter-orb">
          <div class="orb-inner">
            <span class="rep-number">{{ state?.repDisplay ?? 0 }}</span>
            <span class="rep-label">REPS</span>
          </div>
          <div class="orb-ring" :class="{ 'pulsing': state?.status === 'RUNNING' }"></div>
        </div>

        <!-- Dynamic Message -->
        <div class="message-area" :class="{ 'has-msg': !!state?.stats.lastMessage }">
          <p>{{ state?.stats.lastMessage || 'เตรียมพร้อมเริ่มท่าทาง' }}</p>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ state?.stats.score ?? 0 }}</span>
            <span class="stat-label">SCORE</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ state?.stats.repsOk ?? 0 }}/{{ state?.stats.repsTotal ?? 0 }}</span>
            <span class="stat-label">SUCCESS</span>
          </div>
          <div class="stat-card">
              <span class="stat-value">{{ state?.stats.avgRepMs ? (state.stats.avgRepMs / 1000).toFixed(1) : '0.0' }}s</span>
            <span class="stat-label">AVG SPEED</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls">
          <ion-button 
            v-if="state?.status !== 'RUNNING' && state?.status !== 'STOPPED'" 
            expand="block" 
            class="btn-start"
            @click="start"
          >
            START WORKOUT
          </ion-button>
          
          <ion-button 
            v-if="state?.status === 'RUNNING'" 
            expand="block" 
            color="danger" 
            class="btn-stop"
            @click="stop"
          >
            STOP
          </ion-button>

          <div v-if="state?.status === 'STOPPED'" class="stopped-controls">
            <ion-button 
              expand="block" 
              class="btn-resume"
              @click="start"
            >
              RESUME
            </ion-button>
            <ion-button 
              expand="block" 
              color="light"
              fill="outline"
              class="btn-reset-large"
              @click="reset"
            >
              RESET WORKOUT
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border">
      <div class="footer-credit">
        663380019-2 นายปวริศ กุลแก้ว
      </div>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ArmWorkoutEngine } from "../core/ArmWorkoutEngine";
import type { WorkoutState } from "../core/types";

const state = ref<WorkoutState | null>(null);
const engine = new ArmWorkoutEngine();

onMounted(() => {
  engine.onChange((s) => (state.value = s));
});

async function start() {
  await engine.start();
}

async function stop() {
  await engine.stop();
}

async function reset() {
  await engine.reset();
}
</script>

<style scoped>
.premium-theme {
    --ion-background-color: #0f172a;
    --ion-text-color: #f8fafc;
}

ion-toolbar {
    --background: transparent;
    --color: #f8fafc;
    --border-width: 0;
    text-align: center;
    font-weight: 800;
    letter-spacing: 2px;
}

.content-center {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.workout-container {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
}

.status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.status-badge.idle { background: #475569; color: #f8fafc; }
.status-badge.running { background: #22c55e; color: #000; box-shadow: 0 0 15px rgba(34, 197, 94, 0.4); }
.status-badge.stopped { background: #ef4444; color: #f8fafc; }

.counter-orb {
    position: relative;
    width: 220px;
    height: 220px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.orb-inner {
    width: 180px;
    height: 180px;
    background: radial-gradient(circle at 30% 30%, #1e293b, #0f172a);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 2;
    box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.5);
}

.rep-number {
    font-size: 5rem;
    font-weight: 900;
    line-height: 1;
    background: linear-gradient(135deg, #60a5fa, #c084fc);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.rep-label {
    font-size: 0.875rem;
    color: #94a3b8;
    font-weight: 600;
    margin-top: -5px;
}

.orb-ring {
    position: absolute;
    width: 200px;
    height: 200px;
    border: 2px solid rgba(96, 165, 250, 0.2);
    border-radius: 50%;
    z-index: 1;
}

.orb-ring.pulsing {
    animation: pulse-ring 2s infinite ease-out;
    border-color: #60a5fa;
}

@keyframes pulse-ring {
    0% { transform: scale(0.9); opacity: 0.8; }
    100% { transform: scale(1.1); opacity: 0; }
}

.message-area {
    min-height: 3rem;
    text-align: center;
}

.message-area p {
    font-size: 1.1rem;
    font-weight: 600;
    color: #94a3b8;
    transition: all 0.3s ease;
}

.message-area.has-msg p {
    color: #60a5fa;
    transform: scale(1.05);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    width: 100%;
}

.stat-card {
    background: rgba(30, 41, 59, 0.5);
    padding: 1rem;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.05);
}

.stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f8fafc;
}

.stat-label {
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 4px;
}

.controls {
    width: 100%;
    margin-top: 1rem;
}

.btn-start {
    --background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    --border-radius: 16px;
    --box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    font-weight: 700;
    height: 56px;
}

.btn-stop {
    --border-radius: 16px;
    font-weight: 700;
    height: 56px;
}

.stopped-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
}

.btn-resume {
    --background: linear-gradient(135deg, #22c55e, #16a34a);
    --border-radius: 16px;
    --box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
    font-weight: 700;
    height: 56px;
}

.btn-reset-large {
    --border-radius: 16px;
    font-weight: 700;
    height: 56px;
    --border-width: 2px;
}

.footer-credit {
    padding: 20px;
    text-align: center;
    color: #475569;
    font-size: 0.875rem;
    font-weight: 500;
}
</style>
