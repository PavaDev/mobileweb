<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Lab08 โดย ปวริศ กุลแก้ว</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding content">

      <!-- Upload Section -->
      <div class="card">
        <h2>📸 เลือกรูปภาพ</h2>

        <input
          ref="fileEl"
          type="file"
          accept="image/*"
          hidden
          @change="onFileChange"
        />

        <ion-button expand="block" @click="fileEl?.click()">
          เลือกไฟล์จากเครื่อง
        </ion-button>

        <ion-button expand="block" fill="outline" @click="onTakePhoto">
          ถ่ายภาพ
        </ion-button>
      </div>

      <!-- Preview -->
      <div v-if="previewUrl" class="card">
        <h2>🖼️ Preview</h2>
        <!-- ใช้ img แทน ion-img เพื่อความนิ่ง -->
        <img :src="previewUrl" class="preview-img" />
      </div>

      <!-- Analyze -->
      <div class="card">
        <ion-button
          expand="block"
          color="success"
          :disabled="!img || loading"
          @click="onAnalyze"
        >
          🔍 วิเคราะห์ภาพ
        </ion-button>

        <div class="loading" v-if="loading">
          <ion-spinner />
          <p>กำลังวิเคราะห์...</p>
        </div>
      </div>

      <!-- Result -->
      <div v-if="result" class="card result-card">
        <h2>📊 ผลลัพธ์</h2>

        <div class="result-box">
          <pre>{{ formattedResult }}</pre>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar
} from "@ionic/vue";

import { PhotoService } from "../core/photo.service";
import { GeminiVisionService } from "../core/gemini.service";

import type { Base64Image, ImageAnalysisResult } from "../core/ai.interface";

const fileEl = ref<HTMLInputElement | null>(null);
const img = ref<Base64Image | null>(null);
const previewUrl = ref("");
const result = ref<ImageAnalysisResult | null>(null);
const loading = ref(false);

// upload file
async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  img.value = await PhotoService.fromFile(file);
  previewUrl.value = URL.createObjectURL(file);
  result.value = null;
}

// take photo
async function onTakePhoto() {
  loading.value = true;
  try {
    const b64 = await PhotoService.fromCamera();
    img.value = b64;
    previewUrl.value = `data:${b64.mimeType};base64,${b64.base64}`;
    result.value = null;
  } catch (err) {
    console.error("Camera error:", err);
  } finally {
    loading.value = false;
  }
}

// analyze
async function onAnalyze() {
  if (!img.value) return;

  loading.value = true;
  try {
    result.value = await GeminiVisionService.analyze(img.value);
  } catch (err) {
    console.error("Analyze error:", err);
  } finally {
    loading.value = false;
  }
}

// format result
const formattedResult = computed(() => {
  return result.value ? JSON.stringify(result.value, null, 2) : "";
});
</script>

<style scoped>
/* layout fix */
.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* card */
.card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* title */
.card h2 {
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 600;
}

/* preview image */
.preview-img {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
}

/* loading */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

/* result */
.result-card {
  background: #0f172a;
  color: #e2e8f0;
}

.result-box {
  background: #020617;
  padding: 12px;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 13px;
}
</style>