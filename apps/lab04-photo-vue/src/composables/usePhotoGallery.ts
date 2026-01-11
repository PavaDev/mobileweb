import { ref, watch, onMounted } from 'vue'
import { Camera, CameraResultType, CameraSource, type Photo } from '@capacitor/camera'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'
import { isPlatform } from '@ionic/vue'

export interface UserPhoto {
  filepath: string
  webviewPath?: string
}

export const usePhotoGallery = () => {
  const photos = ref<UserPhoto[]>([])
  const PHOTO_STORAGE = 'photos'

  /* -------------------- ADD PHOTO -------------------- */

  const addNewToGallery = async () => {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 90,
    })

    const fileName = `${Date.now()}.jpeg`
    const savedPhoto = await savePicture(photo, fileName)

    photos.value = [savedPhoto, ...photos.value]
  }

  /* -------------------- SAVE PHOTO -------------------- */

  const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> => {
    // ✅ HYBRID (Android / iOS)
    if (isPlatform('hybrid')) {
      const file = await Filesystem.readFile({
        path: photo.path!,
      })

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: file.data,
        directory: Directory.Data,
      })

      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      }
    }

    // 🌐 WEB (dev only)
    return {
      filepath: fileName,
      webviewPath: photo.webPath,
    }
  }

  /* -------------------- LOAD CACHE -------------------- */

  const loadSaved = async () => {
    const { value } = await Preferences.get({ key: PHOTO_STORAGE })
    const savedPhotos: UserPhoto[] = value ? JSON.parse(value) : []

    // ✅ HYBRID: file:// → http://localhost
    if (isPlatform('hybrid')) {
      photos.value = savedPhotos.map(photo => ({
        ...photo,
        webviewPath: Capacitor.convertFileSrc(photo.filepath),
      }))
      return
    }

    // 🌐 WEB
    for (const photo of savedPhotos) {
      const file = await Filesystem.readFile({
        path: photo.filepath,
        directory: Directory.Data,
      })

      photo.webviewPath = `data:image/jpeg;base64,${file.data}`
    }

    photos.value = savedPhotos
  }

  /* -------------------- CACHE -------------------- */

  watch(
    () => photos.value,
    () => {
      Preferences.set({
        key: PHOTO_STORAGE,
        value: JSON.stringify(photos.value),
      })
    },
    { deep: true }
  )

  onMounted(loadSaved)

  return {
    photos,
    addNewToGallery,
  }
}
