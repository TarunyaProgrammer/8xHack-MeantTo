/**
 * Native builds read the library directly, so there is nothing to pick here.
 * The web build overrides this with a real file dialog.
 */
export const CAN_PICK_FILE = false;

export async function pickFile(): Promise<string | null> {
  return null;
}
