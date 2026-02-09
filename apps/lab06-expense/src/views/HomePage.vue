<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Expense Tracker</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- SEARCH -->
      <ion-searchbar
        placeholder="ค้นหา..."
        v-model="searchText"
      />

      <!-- FILTER -->
      <ion-select placeholder="กรองหมวดหมู่" v-model="selectedCategory">
        <ion-select-option value="">ทั้งหมด</ion-select-option>
        <ion-select-option
          v-for="cat in categories"
          :key="cat"
          :value="cat"
        >
          {{ cat }}
        </ion-select-option>
      </ion-select>

      <!-- LIST -->
      <ion-card
        v-for="item in filteredExpenses"
        :key="item.id"
        class="expense-card"
      >
        <ion-card-content>
          <div class="row">
            <div>
              <h2>{{ item.title }}</h2>
              <p class="category">{{ item.category }}</p>
              <p class="time">{{ formatDate(item.createdAt) }}</p>
            </div>

            <ion-badge :color="item.type === 'income' ? 'success' : 'danger'">
              {{ item.type === 'income' ? '+' : '-' }} {{ item.amount }}
            </ion-badge>
          </div>

          <div class="actions">
            <ion-button size="small" fill="outline" @click="openEditModal(item)">
              แก้ไข
            </ion-button>

            <ion-button
              size="small"
              color="danger"
              fill="outline"
              @click="confirmDelete(item)"
            >
              ลบ
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- CHART -->
      <div class="chart-wrapper">
        <canvas ref="chartRef"></canvas>
      </div>

    </ion-content>

    <!-- ADD BUTTON -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="showModal = true">+</ion-fab-button>
    </ion-fab>

    <!-- ADD / EDIT MODAL -->
    <ion-modal :is-open="showModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>
            {{ editingItem ? "แก้ไขรายการ" : "เพิ่มรายการ" }}
          </ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">ปิด</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">

        <ion-input
          label="ชื่อรายการ"
          v-model="title"
          :class="{ invalid: errors.title }"
        />

        <ion-input
          label="จำนวนเงิน"
          type="number"
          v-model.number="amount"
          :class="{ invalid: errors.amount }"
        />

        <ion-text color="danger" v-if="errors.title">
          กรุณากรอกชื่อรายการ
        </ion-text>

        <ion-text color="danger" v-if="errors.amount">
          จำนวนเงินต้องมากกว่า 0
        </ion-text>

        <ion-select label="ประเภท" v-model="type">
          <ion-select-option value="income">รายรับ</ion-select-option>
          <ion-select-option value="expense">รายจ่าย</ion-select-option>
        </ion-select>

        <ion-input label="หมวดหมู่" v-model="category" />
        <ion-textarea label="หมายเหตุ" v-model="note" />

        <ion-button expand="block" @click="saveExpense">
          บันทึก
        </ion-button>

      </ion-content>
    </ion-modal>

    <!-- DELETE ALERT -->
    <ion-alert
      :is-open="showDeleteAlert"
      header="ยืนยันการลบ"
      message="ลบรายการนี้ใช่หรือไม่?"
      @didDismiss="showDeleteAlert = false"
      :buttons="[
        { text: 'ยกเลิก', role: 'cancel' },
        {
          text: 'ลบ',
          role: 'destructive',
          handler: () => deleteItem(selectedItem?.id)
        }
      ]"
    />

    <!-- EXPIRED ALERT -->
    <ion-alert
      :is-open="showExpiredAlert"
      header="หมดเวลาใช้งาน"
      message="ช่วงทดลองใช้ฟรีสิ้นสุดแล้ว กรุณาติดต่อผู้พัฒนา"
      :buttons="['ตกลง']"
    />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonBadge, IonButton,
  IonFab, IonFabButton, IonModal, IonAlert,
  IonInput, IonSelect, IonSelectOption,
  IonTextarea, IonText, IonButtons, IonSearchbar
} from "@ionic/vue";

import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore";

import { auth, db } from "@/firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { Chart } from "chart.js/auto";

/* ---------------- STATE ---------------- */

const expenses = ref<any[]>([]);
const editingItem = ref<any>(null);
const selectedItem = ref<any>(null);

const showModal = ref(false);
const showDeleteAlert = ref(false);
const showExpiredAlert = ref(false);

const title = ref("");
const amount = ref<number | null>(null);
const type = ref("expense");
const category = ref("");
const note = ref("");

const searchText = ref("");
const selectedCategory = ref("");

const errors = ref({ title: false, amount: false });

let uid: string | null = null;

/* ---------------- AUTH ---------------- */

signInAnonymously(auth);

onAuthStateChanged(auth, user => {
  if (!user) return;
  uid = user.uid;

  const q = query(
    collection(db, "users", uid, "expenses"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, snapshot => {
    expenses.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }, err => {
    // rule timeout / permission denied
    if (err.code === "permission-denied") {
      showExpiredAlert.value = true;
    }
  });
});

/* ---------------- VALIDATION ---------------- */

const validateForm = () => {
  const cleanTitle = title.value.trim();

  errors.value.title = cleanTitle.length === 0;
  errors.value.amount =
    amount.value === null ||
    isNaN(amount.value) ||
    amount.value <= 0;

  return !errors.value.title && !errors.value.amount;
};

/* ---------------- SAVE ---------------- */

const saveExpense = async () => {
  if (!validateForm() || !uid) return;

  const payload = {
    title: title.value.trim(),
    amount: amount.value,
    type: type.value,
    category: category.value.trim(),
    note: note.value.trim()
  };

  try {
    if (editingItem.value) {
      await updateDoc(
        doc(db, "users", uid, "expenses", editingItem.value.id),
        payload
      );
    } else {
      await addDoc(
        collection(db, "users", uid, "expenses"),
        { ...payload, createdAt: serverTimestamp() }
      );
    }

    closeModal();
  } catch (err: any) {
    if (err.code === "permission-denied") {
      showExpiredAlert.value = true;
    }
  }
};

/* ---------------- EDIT ---------------- */

const openEditModal = (item: any) => {
  editingItem.value = item;
  title.value = item.title;
  amount.value = item.amount;
  type.value = item.type;
  category.value = item.category;
  note.value = item.note;
  showModal.value = true;
};

const closeModal = () => {
  editingItem.value = null;
  title.value = "";
  amount.value = null;
  type.value = "expense";
  category.value = "";
  note.value = "";
  showModal.value = false;
};

/* ---------------- DELETE ---------------- */

const confirmDelete = (item: any) => {
  selectedItem.value = item;
  showDeleteAlert.value = true;
};

const deleteItem = async (id?: string) => {
  if (!id || !uid) return;

  try {
    await deleteDoc(doc(db, "users", uid, "expenses", id));
  } catch (err: any) {
    if (err.code === "permission-denied") {
      showExpiredAlert.value = true;
    }
  }

  showDeleteAlert.value = false;
  selectedItem.value = null;
};

/* ---------------- FILTER ---------------- */

const filteredExpenses = computed(() => {
  return expenses.value.filter(e => {
    const s = e.title?.toLowerCase().includes(searchText.value.toLowerCase());
    const c = !selectedCategory.value || e.category === selectedCategory.value;
    return s && c;
  });
});

const categories = computed(() => {
  return [...new Set(expenses.value.map(e => e.category).filter(Boolean))];
});

/* ---------------- DATE ---------------- */

const formatDate = (ts: any) => {
  if (!ts) return "";
  return ts.toDate().toLocaleString("th-TH");
};

/* ---------------- CHART ---------------- */

const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const renderChart = async () => {
  await nextTick();

  const income = expenses.value
    .filter(e => e.type === "income")
    .reduce((s, e) => s + Number(e.amount), 0);

  const expense = expenses.value
    .filter(e => e.type === "expense")
    .reduce((s, e) => s + Number(e.amount), 0);

  if (chart) chart.destroy();

  chart = new Chart(chartRef.value!, {
    type: "pie",
    data: {
      labels: ["รายรับ", "รายจ่าย"],
      datasets: [{
        data: [income, expense],
        backgroundColor: ["#16a34a", "#dc2626"],
        borderWidth: 0
      }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { family: "Kanit", size: 14 }
          }
        }
      },
      animation: { duration: 800 }
    }
  });
};

watch(() => expenses.value, renderChart, { deep: true });
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap');

* {
  font-family: "Kanit", sans-serif;
}

/* ---------- PAGE ---------- */

ion-content {
  --background: #f5f7fb;
}

/* ---------- CARD ---------- */

.expense-card {
  border-radius: 16px;
  margin-bottom: 14px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.expense-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
}

/* ---------- ROW ---------- */

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.row h2 {
  font-size: 16px;
  margin: 0;
  font-weight: 600;
}

/* ---------- TEXT ---------- */

.category {
  font-size: 12px;
  opacity: 0.7;
  margin: 2px 0;
}

.time {
  font-size: 11px;
  opacity: 0.55;
}

/* ---------- BADGE ---------- */

ion-badge {
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 10px;
  font-weight: 500;
}

/* ---------- ACTION BUTTONS ---------- */

.actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

/* ---------- INVALID INPUT ---------- */

.invalid {
  --highlight-color-focused: var(--ion-color-danger);
}

/* ---------- CHART ---------- */

.chart-wrapper {
  max-width: 420px;
  margin: 24px auto 12px auto;
  padding: 16px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 14px rgba(0,0,0,0.06);
}

/* ---------- MODAL ---------- */

ion-modal {
  --border-radius: 20px;
}

/* ---------- SEARCH + FILTER ---------- */

ion-searchbar,
ion-select {
  margin-bottom: 10px;
  border-radius: 14px;
}

/* ---------- SCROLL SMOOTH ---------- */

ion-content {
  scroll-behavior: smooth;
}
</style>

