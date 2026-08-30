export const CAN_PICK_FILE = true;

/**
 * Opens the browser's own file dialog and returns a data URL.
 *
 * A data URL rather than an object URL: the image later goes through
 * expo-image-manipulator, and a revoked or expired blob handle is a class of
 * bug that only shows up once the user has waited through a generation.
 */
export async function pickFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    // Safari will not open the dialog for a detached input.
    input.style.display = 'none';
    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 0);
  });
}
