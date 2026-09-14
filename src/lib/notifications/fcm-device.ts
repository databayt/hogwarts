// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * How FCM device tokens are tagged in `NotificationSubscription.entityType`.
 *
 * Tokens registered before platforms were tagged carry the bare `fcm_device`;
 * newer ones name their platform so a new Android token only retires older
 * Android tokens. Readers must accept every variant.
 */
export const FCM_DEVICE = "fcm_device"

export const FCM_DEVICE_ENTITY_TYPES = [
  FCM_DEVICE,
  `${FCM_DEVICE}:android`,
  `${FCM_DEVICE}:ios`,
] as const

export function fcmEntityType(platform: unknown): string {
  return platform === "android" || platform === "ios"
    ? `${FCM_DEVICE}:${platform}`
    : FCM_DEVICE
}
