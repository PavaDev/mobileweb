<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding">
      <div v-if="user" class="profile-container">
        <ion-card>
          <ion-card-content class="ion-text-center">
            <ion-avatar v-if="user.photoUrl" class="profile-avatar">
              <img :src="user.photoUrl" alt="User Photo" />
            </ion-avatar>
            <h2>{{ user.displayName || 'User' }}</h2>
            <p>{{ user.email || 'No email' }}</p>
            <p>{{ user.phoneNumber || 'No phone number' }}</p>
            <p><small>UID: {{ user.uid }}</small></p>
            
            <ion-button expand="block" color="danger" @click="logout" class="ion-margin-top">
              Logout
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
      <div v-else class="ion-text-center">
        <ion-spinner></ion-spinner>
        <p>Loading user profile...</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonCard, IonCardContent, IonAvatar, IonButton, IonSpinner 
} from '@ionic/vue';
import { authService } from '@/auth/auth-service';
import type { AuthUser } from '@/auth/auth-interface';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref<AuthUser | null>(null);

onMounted(async () => {
  user.value = await authService.getCurrentUser();
});

const logout = async () => {
  await authService.logout();
  router.push('/login');
};
</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.profile-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
}
</style>
