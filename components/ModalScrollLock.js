import { useLayoutEffect } from "react";

export default function useModalScrollLock( isOpen ) {
  useLayoutEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.classList.add("overflow-hidden");
    } else {
      document.documentElement.style.overflow = "";
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);
}