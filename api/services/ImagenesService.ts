import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

export class ImageService {
  private static readonly IMAGES_DIR = `${FileSystem.documentDirectory}images/productos/`;

  static async initImageDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.IMAGES_DIR, { intermediates: true });
    }
  }

  static async saveImage(imageUri: string): Promise<string> {
    await this.initImageDirectory();
    
    const fileName = `${uuidv4()}.jpg`;
    const newPath = `${this.IMAGES_DIR}${fileName}`;
    
    await FileSystem.copyAsync({
      from: imageUri,
      to: newPath,
    });
    
    return fileName; // Retornamos solo el nombre, no la ruta completa
  }

  static async getImageUri(fileName: string): Promise<string> {
    if (!fileName) return '';
    return `${this.IMAGES_DIR}${fileName}`;
  }

  static async deleteImage(fileName: string): Promise<boolean> {
    if (!fileName) return true;
    
    try {
      const filePath = `${this.IMAGES_DIR}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  static async imageExists(fileName: string): Promise<boolean> {
    if (!fileName) return false;
    
    const filePath = `${this.IMAGES_DIR}${fileName}`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
  }
}