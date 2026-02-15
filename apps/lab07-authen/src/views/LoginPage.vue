<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="login-container">
        <!-- Email/Password Login Section -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Email Login</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input type="email" v-model="email" placeholder="email@example.com"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Password</ion-label>
              <ion-input type="password" v-model="password" placeholder="Password"></ion-input>
            </ion-item>
            <ion-button expand="block" @click="loginWithEmail" class="ion-margin-top">
              Login with Email
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Google Login Section -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Social Login</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button expand="block" color="danger" @click="loginWithGoogle">
              <ion-icon slot="start" :icon="logoGoogle"></ion-icon>
              Login with Google
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Phone Login Section -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Phone Login</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="!otpSent">
              <ion-item>
                <ion-label position="stacked">Phone Number (E.164)</ion-label>
                <ion-input type="tel" v-model="phoneNumber" placeholder="+66812345678"></ion-input>
              </ion-item>
              <ion-button expand="block" @click="startPhoneLogin" class="ion-margin-top">
                Send OTP
              </ion-button>
            </div>

            <div v-else>
              <ion-item>
                <ion-label position="stacked">OTP Code</ion-label>
                <ion-input type="text" v-model="otpCode" placeholder="123456"></ion-input>
              </ion-item>
              <ion-button expand="block" @click="confirmPhoneCode" class="ion-margin-top">
                Verify OTP
              </ion-button>
              <ion-button expand="block" fill="clear" @click="otpSent = false">
                Back
              </ion-button>
            </div>
            
            <!-- ReCAPTCHA Container for Web Phone Login -->
            <div id="recaptcha-container"></div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonInput, IonButton, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonIcon,
  toastController
} from '@ionic/vue';
import { logoGoogle } from 'ionicons/icons';
import { authService } from '@/auth/auth-service';
import { useRouter } from 'vue-router';

const router = useRouter();

// Email Login State
const email = ref('');
const password = ref('');

// Phone Login State
const phoneNumber = ref('');
const otpCode = ref('');
const otpSent = ref(false);
const verificationId = ref('');

const showToast = async (message: string, color: string = 'danger') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color
  });
  await toast.present();
};

const handleLoginSuccess = () => {
  router.push('/tabs/tab1');
};

const loginWithEmail = async () => {
  try {
    if (!email.value || !password.value) {
      return showToast('Please enter email and password');
    }
    await authService.loginWithEmailPassword({ 
      email: email.value, 
      password: password.value 
    });
    handleLoginSuccess();
  } catch (error: any) {
    showToast(error.message);
  }
};

const loginWithGoogle = async () => {
  try {
    await authService.loginWithGoogle();
    handleLoginSuccess();
  } catch (error: any) {
    showToast(error.message);
  }
};

const startPhoneLogin = async () => {
  try {
    if (!phoneNumber.value) {
      return showToast('Please enter phone number');
    }
    const result = await authService.startPhoneLogin({ 
      phoneNumberE164: phoneNumber.value 
    });
    verificationId.value = result.verificationId;
    otpSent.value = true;
    showToast('OTP sent successfully', 'success');
  } catch (error: any) {
    showToast(error.message);
  }
};

const confirmPhoneCode = async () => {
  try {
    if (!otpCode.value) {
      return showToast('Please enter OTP code');
    }
    await authService.confirmPhoneCode({
      verificationId: verificationId.value,
      verificationCode: otpCode.value
    });
    handleLoginSuccess();
  } catch (error: any) {
    showToast(error.message);
  }
};
</script>

<style scoped>
.login-container {
  max-width: 500px;
  margin: 0 auto;
}
#recaptcha-container {
  margin-top: 10px;
}
</style>
