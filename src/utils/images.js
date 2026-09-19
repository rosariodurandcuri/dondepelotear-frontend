/**
 * UTILIDADES DE IMÁGENES
 * ----------------------
 * En el MVP las fotos que sube el propietario se guardan como texto (data URL)
 * dentro de localStorage. Para que no ocupen demasiado, se reducen a un ancho
 * máximo antes de guardarlas. En producción se subirían a un servicio de
 * almacenamiento (S3, Cloudinary, Supabase Storage, etc.) y se guardaría la URL.
 */
export const PLACEHOLDER_IMAGE = 'assets/placeholder-field.svg';

export function fileToResizedDataURL(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no válido'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
