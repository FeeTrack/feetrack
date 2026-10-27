'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, Trash2, User } from 'lucide-react';
import { compressStudentPhoto } from '@/utils/students/compressPhoto';

// Passport-size photo picker. The photo is compressed in the browser (3:4, under 100 KB)
// and handed to the parent via onChange({ file, removed }); the parent adds it to the form data.
export default function PhotoUpload({ initialUrl, onChange, onBusyChange }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(initialUrl || null);
  const [processing, setProcessing] = useState(false);

  const setBusy = (busy) => {
    setProcessing(busy);
    onBusyChange?.(busy);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setBusy(true);
    try {
      const compressed = await compressStudentPhoto(file);
      setPreview(URL.createObjectURL(compressed));
      onChange({ file: compressed, removed: false });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange({ file: null, removed: true });
  };

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-32 h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Photo" className="w-full h-full object-cover" />
        ) : (
          <User className="w-12 h-12 text-gray-300" />
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer disabled:opacity-60"
        >
          <Camera className="w-3.5 h-3.5" /> {processing ? 'Processing...' : preview ? 'Change' : 'Upload Photo'}
        </button>
        {preview && (
          <button type="button" onClick={handleRemove} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-500 text-center">Optional · auto-resized under 100 KB</p>
    </div>
  );
}
