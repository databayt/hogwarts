/**
 * Form Block Bridges
 *
 * Bridge hooks to integrate Form Block with existing context systems.
 * These enable gradual migration without breaking existing functionality.
 *
 * **Available Bridges**:
 * - `useHostBridge` - For onboarding flows (HostValidationContext)
 * - `useApplyBridge` - For admission applications (ApplicationContext)
 * - `useModalBridge` - For CRUD modals (useModal context)
 *
 * @example
 * ```tsx
 * import { useHostBridge, useApplyBridge, useModalBridge } from "@/components/form"
 *
 * // In onboarding step
 * const { syncValidation, setNavigation } = useHostBridge()
 *
 * // In apply step
 * useApplyBridge("personal")
 *
 * // In CRUD modal
 * const { isOpen, mode, close } = useModalBridge()
 * ```
 */

export { useHostBridge } from "./use-host-bridge"
export { useApplyBridge } from "./use-apply-bridge"
export { useModalBridge, type ModalMode } from "./use-modal-bridge"
