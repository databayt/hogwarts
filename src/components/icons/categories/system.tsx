/**
 * System Icons
 *
 * Core UI icons for buttons, navigation, and interface elements.
 * Migrated from src/components/atom/icons.tsx
 */

import type { IconProps } from "../types"

// Core System Icons
export const LogoIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 1.75a2.63 2.63 0 0 0-1.32.355l-6.61 3.8l-.002.002A2.65 2.65 0 0 0 2.75 8.198v7.603a2.64 2.64 0 0 0 1.318 2.292l.003.002l6.608 3.799h.002a2.63 2.63 0 0 0 2.639 0h.001l6.608-3.8h.003A2.65 2.65 0 0 0 21.25 15.8V8.2a2.65 2.65 0 0 0-1.318-2.292l-6.61-3.8l-.002-.002A2.63 2.63 0 0 0 12 1.75"
    />
  </svg>
)

export const PatreonIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M7.462 3.1c2.615-1.268 6.226-1.446 9.063-.503c2.568.853 4.471 3.175 4.475 5.81c.004 3.061-1.942 5.492-4.896 6.243c-1.693.43-2.338.75-2.942 1.582c-.238.328-.45.745-.796 1.533l-.22.5C11 20.866 9.99 22.027 7.91 22c-2.232-.03-3.603-1.742-4.313-4.48c-.458-1.768-.617-3.808-.594-5.876c.044-3.993 1.42-7.072 4.46-8.545z"
    />
  </svg>
)

export const CoffeeIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -6 24 24" {...props}>
    <path
      fill="currentColor"
      d="M0 0h17a3 3 0 0 1 0 6h-1.252A8 8 0 0 1 0 4zm16 4h1a1 1 0 0 0 0-2h-1z"
    />
  </svg>
)

export const OnboardingIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M13 4a1 1 0 0 1 .993.883L14 5a1 1 0 0 0 1.993.117L16 5a1 1 0 0 1 1-1h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2a1 1 0 0 1-.993-.883L16 19a1 1 0 0 0-1.993-.117L14 19a1 1 0 0 1-1 1H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zm2 9a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0v-1a1 1 0 0 0-1-1m0-5a1 1 0 0 0-.993.883L14 9v1a1 1 0 0 0 1.993.117L16 10V9a1 1 0 0 0-1-1"
    />
  </svg>
)

export const NotificationIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
    <path
      fill="currentColor"
      d="M28.707 19.293L26 16.586V13a10.014 10.014 0 0 0-9-9.95V1h-2v2.05A10.014 10.014 0 0 0 6 13v3.586l-2.707 2.707A1 1 0 0 0 3 20v3a1 1 0 0 0 1 1h7v1a5 5 0 0 0 10 0v-1h7a1 1 0 0 0 1-1v-3a1 1 0 0 0-.293-.707M19 25a3 3 0 0 1-6 0v-1h6Z"
    />
  </svg>
)

export const AuthenticationIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    {...props}
  >
    <path
      fill="currentColor"
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
    ></path>
  </svg>
)

export const SubscriptionIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
    />
  </svg>
)

export const DashboardIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 3a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm8 0a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1zM3 14a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
    />
  </svg>
)

export const InvoiceIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="m21 22l-3-2l-3 2l-3-2l-3 2l-3-2l-3 2V3h18z" />
  </svg>
)

export const SalaryIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M9.997 15.48q-.668 0-1.14-.475t-.472-1.143t.475-1.14t1.144-.472t1.14.476t.472 1.143t-.476 1.14t-1.143.472M6.375 7.75h7.25L14.9 5.161q.212-.403-.018-.782T14.192 4H5.808q-.46 0-.69.379t-.018.783zM6.631 20h6.738q1.93 0 3.28-1.351Q18 17.298 18 15.363q0-.808-.277-1.574t-.8-1.395L13.881 8.75H6.119l-3.042 3.644q-.523.629-.8 1.395Q2 14.554 2 15.363q0 1.935 1.351 3.286T6.631 20"
    />
  </svg>
)

export const TimesheetIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" {...props}>
    <path
      fill="currentColor"
      d="M10 0c5.523 0 10 4.477 10 10s-4.477 10-10 10S0 15.523 0 10S4.477 0 10 0m-.93 5.581a.7.7 0 0 0-.698.698v5.581c0 .386.312.698.698.698h5.581a.698.698 0 1 0 0-1.395H9.767V6.279a.7.7 0 0 0-.697-.698"
    />
  </svg>
)

export const TrashIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" {...props}>
    <path
      fill="currentColor"
      d="M8.5 4h3a1.5 1.5 0 0 0-3 0m-1 0a2.5 2.5 0 0 1 5 0h5a.5.5 0 0 1 0 1h-1.054l-1.194 10.344A3 3 0 0 1 12.272 18H7.728a3 3 0 0 1-2.98-2.656L3.554 5H2.5a.5.5 0 0 1 0-1zM5.741 15.23A2 2 0 0 0 7.728 17h4.544a2 2 0 0 0 1.987-1.77L15.439 5H4.561zM8.5 7.5A.5.5 0 0 1 9 8v6a.5.5 0 0 1-1 0V8a.5.5 0 0 1 .5-.5M12 8a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"
    />
  </svg>
)
