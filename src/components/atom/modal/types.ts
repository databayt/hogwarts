export interface ModalState {
    open: boolean;
    id: string | null;
  }
  
  export interface ModalContextProps {
    modal: ModalState;
    openModal: (id?: string | null) => void;
    closeModal: () => void;
    handleCloseModal: () => void;
  }