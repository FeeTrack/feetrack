import { MAX_PHOTO_BYTES } from '@/utils/constants/students';

const WIDTH = 300;
const HEIGHT = 400; // 3:4, passport-style

const toBlob = (canvas, quality) => new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));

// Crops the photo to 3:4, resizes it to 300x400 and re-encodes it as JPEG,
// lowering quality until it fits under MAX_PHOTO_BYTES. Phone photos of 2-5 MB
// usually end up around 30-60 KB.
export async function compressStudentPhoto(file) {
    let bitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error('This image format is not supported. Please use a JPG or PNG photo.');
    }

    const targetRatio = WIDTH / HEIGHT;
    let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
    if (sw / sh > targetRatio) {
        sw = sh * targetRatio;
        sx = (bitmap.width - sw) / 2;
    } else {
        sh = sw / targetRatio;
        sy = (bitmap.height - sh) * 0.3; // keep more of the top, where the face usually is
    }

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT);
    bitmap.close?.();

    for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
        const blob = await toBlob(canvas, quality);
        if (blob && blob.size <= MAX_PHOTO_BYTES) {
            return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        }
    }

    throw new Error('Could not reduce the photo below 100 KB. Please try a different photo.');
}
