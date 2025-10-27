import { create } from "zustand";
import type { ModalType, ModalAdditionalData } from "../types";

interface ModalStore {
  type: ModalType | null;
  isOpen: boolean;
  additionalData: ModalAdditionalData;
  onOpen: (type: ModalType, data?: ModalAdditionalData) => void;
  onClose: () => void;
}

const useModalStore = create<ModalStore>((set) => ({
  type: null,
  isOpen: false,
  additionalData: {},
  onOpen: (type, data) => {
    set({ isOpen: true, type, additionalData: { ...data } });
  },
  onClose: () => set({ type: null, isOpen: false, additionalData: {} }),
}));

export default useModalStore;
