import * as ImagePicker from 'expo-image-picker';

/**
 * Custom React Hook facilitating seamless interactions with the device camera or local local media library.
 * Handles unified permission requests and standardized image selection behaviors.
 *
 * @returns An object exposing the `pickImage` functional trigger.
 */
export const useImagePicker = () => {
    const requestPermission = async (
        useCamera: boolean,
    ): Promise<boolean> => {
        const getStatus = useCamera
            ? ImagePicker.getCameraPermissionsAsync
            : ImagePicker.getMediaLibraryPermissionsAsync;

        const requestStatus = useCamera
            ? ImagePicker.requestCameraPermissionsAsync
            : ImagePicker.requestMediaLibraryPermissionsAsync;

        const current = await getStatus();
        if (current.granted) return true;

        const requested = await requestStatus();
        return requested.granted;
    };

    const pickImage = async (
        useCamera = false,
    ): Promise<ImagePicker.ImagePickerAsset | null> => {
        try {
            const granted = await requestPermission(useCamera);
            if (!granted) {
                console.warn('Permission not granted');
                return null;
            }

            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                // Capture at moderately high fidelity; heavy compression is delegated downstream
                quality: 0.9,
                // Delegate base64 conversion to the ImageManipulator pipeline exclusively
                base64: false,
            };

            const result = useCamera
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);

            if (result.canceled) return null;

            return result.assets[0] ?? null;
        } catch (error) {
            console.error('pickImage error:', error);
            return null;
        }
    };

    return { pickImage };
};