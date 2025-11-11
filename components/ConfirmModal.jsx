'use client'
import { useState, useEffect } from "react";

import useModalScrollLock from "./ModalScrollLock";

function ConfirmModal({ isOpen, onClose, onConfirm, action, message, title, buttonAction }) {
    const [visible, setVisible] = useState(isOpen);
    const [animate, setAnimate] = useState(false);

    useModalScrollLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setAnimate(true));
            })
        } else {
            setAnimate(false);
            const timeout = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [isOpen])

  if (!visible) return null;

  return (
    <div
        className={`${
            animate ? 'opacity-100' : 'opacity-0'
        } fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300`}
    >
      <div className="bg-white text-black rounded-2xl shadow-xl w-96">
        <div className="w-full pl-4 pt-2 pb-2 flex border-b">
          <h2 className="text-lg font-semibold">{title ? title : `Confirm ${action}`}</h2>
        </div>
        <p className="p-4">{message}</p>
        <div className="flex justify-end gap-3 pr-4 pb-4">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3 py-2 text-sm text-white rounded-lg ${buttonAction ? 'bg-primary hover:bg-secondary' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {buttonAction ? buttonAction : action}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;