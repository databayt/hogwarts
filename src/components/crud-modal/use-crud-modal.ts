'use client';

import { useCallback, useState } from 'react';

export type CrudMode = 'create' | 'edit' | 'view' | 'delete';

export interface CrudModalState<T = any> {
  /** Whether the modal is open */
  open: boolean;
  /** Current CRUD mode */
  mode: CrudMode | null;
  /** Data being edited/viewed */
  data: T | null;
  /** Loading state */
  loading: boolean;
}

export interface UseCrudModalOptions<T = any> {
  /** Callback when modal opens */
  onOpen?: (mode: CrudMode, data?: T) => void;
  /** Callback when modal closes */
  onClose?: () => void;
  /** Callback on successful operation */
  onSuccess?: (mode: CrudMode, data?: T) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseCrudModalReturn<T = any> {
  /** Current modal state */
  state: CrudModalState<T>;
  /** Open modal for creating */
  openCreate: () => void;
  /** Open modal for editing */
  openEdit: (data: T) => void;
  /** Open modal for viewing */
  openView: (data: T) => void;
  /** Open modal for deleting */
  openDelete: (data: T) => void;
  /** Close the modal */
  close: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Handle successful operation */
  handleSuccess: (data?: T) => void;
  /** Handle error */
  handleError: (error: Error) => void;
  /** Check if in create mode */
  isCreate: boolean;
  /** Check if in edit mode */
  isEdit: boolean;
  /** Check if in view mode */
  isView: boolean;
  /** Check if in delete mode */
  isDelete: boolean;
}

/**
 * Hook for managing CRUD modal state
 */
export function useCrudModal<T = any>(
  options: UseCrudModalOptions<T> = {}
): UseCrudModalReturn<T> {
  const [state, setState] = useState<CrudModalState<T>>({
    open: false,
    mode: null,
    data: null,
    loading: false
  });

  const openModal = useCallback((mode: CrudMode, data?: T) => {
    setState({
      open: true,
      mode,
      data: data || null,
      loading: false
    });
    options.onOpen?.(mode, data);
  }, [options]);

  const openCreate = useCallback(() => {
    openModal('create');
  }, [openModal]);

  const openEdit = useCallback((data: T) => {
    openModal('edit', data);
  }, [openModal]);

  const openView = useCallback((data: T) => {
    openModal('view', data);
  }, [openModal]);

  const openDelete = useCallback((data: T) => {
    openModal('delete', data);
  }, [openModal]);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
    // Reset state after animation
    setTimeout(() => {
      setState({
        open: false,
        mode: null,
        data: null,
        loading: false
      });
    }, 200);
    options.onClose?.();
  }, [options]);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const handleSuccess = useCallback((data?: T) => {
    if (state.mode) {
      options.onSuccess?.(state.mode, data || state.data || undefined);
    }
    close();
  }, [state.mode, state.data, options, close]);

  const handleError = useCallback((error: Error) => {
    options.onError?.(error);
    setLoading(false);
  }, [options, setLoading]);

  return {
    state,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
    setLoading,
    handleSuccess,
    handleError,
    isCreate: state.mode === 'create',
    isEdit: state.mode === 'edit',
    isView: state.mode === 'view',
    isDelete: state.mode === 'delete'
  };
}