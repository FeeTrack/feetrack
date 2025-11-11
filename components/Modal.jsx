'use client'
import { useState, useEffect, forwardRef } from "react"

import useModalScrollLock from "./ModalScrollLock"

const Modal = forwardRef(function Modal({ open, onClose, title, children }, ref) {
    const [visible, setVisible] = useState(open);
    const [animate, setAnimate] = useState(false);

    useModalScrollLock(open);

    useEffect(() => {
        if (open) {
            setVisible(true);
            // Delay the "fade in" so it starts at opacity-0
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setAnimate(true));
            });
        } else {
            setAnimate(false);
            const timeout = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [open]);

    if (!visible) return null;

    return (
        <div
            className={`${
                animate ? 'opacity-100' : 'opacity-0'
            } fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 px-4`}
        >
            <div className="bg-white text-black rounded-2xl overflow-hidden shadow-lg z-10 w-full max-w-4xl max-h-[85vh] max-md:min-h-[80vh] md:h-[600px] flex flex-col">
                <div className="flex justify-between items-center px-4 py-2 border-b">
                    <h2 className="font-semibold text-lg">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-700 hover:bg-gray-200 font-black rounded-full px-2 py-1 transition-all duration-200"
                    >
                        ✕
                    </button>
                </div>
                <div ref={ref} className="flex-1 overflow-y-auto px-4 py-2 text-sm">
                    {children}
                </div>
            </div>
        </div>
    );
});

Modal.displayName = "Modal";

export default Modal;