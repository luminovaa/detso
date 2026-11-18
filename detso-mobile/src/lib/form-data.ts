export interface ReactNativeUploadFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Appends a local image URI to FormData with a unique filename and derived MIME type.
 */
export function appendFormDataFile(
  formData: FormData,
  field: string,
  uri: string,
  filenamePrefix: string,
): void {
  const cleanUri = uri.split("?")[0];
  const rawExt = cleanUri.split(".").pop()?.toLowerCase() || "jpg";
  const ext = rawExt === "jpeg" ? "jpg" : rawExt;
  const type = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  const filePart: ReactNativeUploadFile = {
    uri,
    name: `${filenamePrefix}-${Date.now()}.${ext}`,
    type,
  };
  formData.append(field, filePart as unknown as Blob);
}
