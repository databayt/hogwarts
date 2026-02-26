// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface ModalState {
  open: boolean
  id: string | null
}

export interface ModalContextProps {
  modal: ModalState
  openModal: (id?: string | null) => void
  closeModal: () => void
  handleCloseModal: () => void
}
