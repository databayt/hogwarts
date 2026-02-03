// Define our blocks data structure
export const features = [
  {
    id: "starter",
    title: "Starter Kit",
    description: "Routing, Layouts, Loading UI and API routes.",
    icon: (
      <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current">
        <path d="m12.807 10.906l5.865-8.505C19.787.802 21.214 0 22.974 0q2.148.001 3.719 1.526c1.047 1.021 1.568 2.234 1.568 3.651c0 1.042-.276 1.969-.833 2.771l-5.286 7.693l6.469 8.203c.646.818.969 1.776.969 2.865c0 1.448-.505 2.693-1.526 3.734Q26.531 31.998 24.361 32q-2.382 0-3.63-1.547l-7.922-9.891v5.453q0 2.335-.813 3.63c-.979 1.568-2.401 2.354-4.281 2.354c-1.708 0-3.036-.583-3.974-1.734q-1.319-1.596-1.318-4.229V5.817c0-1.656.448-3.031 1.339-4.109C4.694.573 5.986 0 7.637 0c1.573 0 2.88.573 3.927 1.708c.583.635.953 1.271 1.109 1.922c.094.401.141 1.141.141 2.24v5.036z" />
      </svg>
    ),
  },
  {
    id: "onboarding",
    title: "Onboarding",
    description: "Onboarding using Server Actions and Zod.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
        <path d="M13 4a1 1 0 0 1 .993.883L14 5a1 1 0 0 0 1.993.117L16 5a1 1 0 0 1 1-1h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2a1 1 0 0 1-.993-.883L16 19a1 1 0 0 0-1.993-.117L14 19a1 1 0 0 1-1 1H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zm2 9a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0v-1a1 1 0 0 0-1-1m0-5a1 1 0 0 0-.993.883L14 9v1a1 1 0 0 0 1.993.117L16 10V9a1 1 0 0 0-1-1" />
      </svg>
    ),
  },
  {
    id: "notification",
    title: "Notification",
    description: "Notifications using Pusher and web sockets.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="45"
        height="45"
        viewBox="0 0 32 32"
        className="h-7 w-7"
      >
        <path
          fill="currentColor"
          d="M28.707 19.293L26 16.586V13a10.014 10.014 0 0 0-9-9.95V1h-2v2.05A10.014 10.014 0 0 0 6 13v3.586l-2.707 2.707A1 1 0 0 0 3 20v3a1 1 0 0 0 1 1h7v1a5 5 0 0 0 10 0v-1h7a1 1 0 0 0 1-1v-3a1 1 0 0 0-.293-.707M19 25a3 3 0 0 1-6 0v-1h6Z"
        />
      </svg>
    ),
  },
  {
    id: "auth",
    title: "Authentication",
    description: "Authentication using Auth.js and middlewares.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="h-7 w-7 fill-current"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
  },
  {
    id: "mdx",
    title: "Markdown-x",
    description: "Content using Contentlayer and MDX.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="h-10 w-10"
      >
        <path
          fill="#000"
          d="m14 10l-4 3.5L6 10H4v12h4v-6l2 2l2-2v6h4V10zm12 6v-6h-4v6h-4l6 8l6-8z"
          strokeWidth="1"
          stroke="#000"
        />
      </svg>
    ),
  },
  {
    id: "subscription",
    title: "Subscriptions",
    description: "Free and paid subscriptions using Stripe.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
      </svg>
    ),
  },
  {
    id: "math",
    title: "Math",
    description: "Automate calculations and formula processing.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="h-10 w-10"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          d="M3 8h10M5 8v8m6-8v6.03A1.97 1.97 0 0 0 12.97 16H13"
        />
      </svg>
    ),
  },
  {
    id: "flow",
    title: "Flow",
    description: "Automate workflow and process management.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="256"
        height="256"
        viewBox="0 0 256 256"
        className="h-8 w-8"
      >
        <path
          fill="currentColor"
          d="M256 128a8 8 0 0 1-8 8h-39.58a80 80 0 0 1-158.84 0H8a8 8 0 0 1 0-16h39.58a80 80 0 0 1 158.84 0H248a8 8 0 0 1 8 8"
        />
      </svg>
    ),
  },
  {
    id: "docs",
    title: "Docs",
    description: "Generate and manage documentation.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="h-8 w-8"
      >
        <g fill="none" fillRule="evenodd">
          <path d="m10.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
          <path
            fill="currentColor"
            d="M1.255 3.667A1.01 1.01 0 0 1 2.022 2H14.5a4.5 4.5 0 1 1 0 9H2.022a1.01 1.01 0 0 1-.767-1.667l.754-.88a3 3 0 0 0 0-3.905l-.754-.88ZM1 16.5A4.5 4.5 0 0 1 5.5 12h12.478a1.01 1.01 0 0 1 .767 1.667l-.755.88a3 3 0 0 0 0 3.905l.755.88A1.01 1.01 0 0 1 17.978 21H5.5A4.5 4.5 0 0 1 1 16.5"
          />
        </g>
      </svg>
    ),
  },
  {
    id: "report",
    title: "Report",
    description: "Autom generate comprehensive reports.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="h-8 w-8 fill-current"
      >
        <path
          fill="currentColor"
          d="M10 17q.425 0 .713-.288T11 16t-.288-.712T10 15t-.712.288T9 16t.288.713T10 17m0-4q.425 0 .713-.288T11 12V8q0-.425-.288-.712T10 7t-.712.288T9 8v4q0 .425.288.713T10 13m-2.925 8q-.4 0-.762-.15t-.638-.425l-4.1-4.1q-.275-.275-.425-.638T1 14.926v-5.85q0-.4.15-.762t.425-.638l4.1-4.1q.275-.275.638-.425T7.075 3h5.85q.4 0 .763.15t.637.425l4.1 4.1q.275.275.425.638t.15.762v5.85q0 .4-.15.763t-.425.637l-4.1 4.1q-.275.275-.638.425t-.762.15z"
        />
      </svg>
    ),
  },
  {
    id: "pdf",
    title: "PDF",
    description: "Automate PDF processing, extraction, and manipulation.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        className="h-7 w-7 fill-current"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.8 14.34c1.81-1.25 3.02-3.16 3.91-5.5c.9-2.33 1.86-4.33 1.44-6.63c-.06-.36-.57-.73-.83-.7c-1.02.06-.95 1.21-.85 1.9c.24 1.71 1.56 3.7 2.84 5.56c1.27 1.87 2.32 2.16 3.78 2.26c.5.03 1.25-.14 1.37-.58c.77-2.8-9.02-.54-12.28 2.08c-.4.33-.86 1-.6 1.46c.2.36.87.4 1.23.15h0Z"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    id: "chatbot",
    title: "Chatbot",
    description: "Handle automated customer interactions and support.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="h-7 w-7"
      >
        <path
          fill="currentColor"
          d="M21 10.975V8a2 2 0 0 0-2-2h-6V4.688c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5a2 2 0 0 0-2 2v2.998l-.072.005A1 1 0 0 0 2 12v2a1 1 0 0 0 1 1v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a1 1 0 0 0 1-1v-1.938a1 1 0 0 0-.072-.455c-.202-.488-.635-.605-.928-.632M7 12c0-1.104.672-2 1.5-2s1.5.896 1.5 2s-.672 2-1.5 2S7 13.104 7 12m8.998 6c-1.001-.003-7.997 0-7.998 0v-2s7.001-.002 8.002 0zm-.498-4c-.828 0-1.5-.896-1.5-2s.672-2 1.5-2s1.5.896 1.5 2s-.672 2-1.5 2"
        />
      </svg>
    ),
  },
  {
    id: "invoice",
    title: "Invoice",
    description: "Automate invoice generation and payment processing.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="h-7 w-7"
      >
        <path
          fill="currentColor"
          d="m21 22l-3-2l-3 2l-3-2l-3 2l-3-2l-3 2V3h18z"
        />
      </svg>
    ),
  },
  {
    id: "salary",
    title: "Salary",
    description: "Automate payroll calculations and salary management.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="h-9 w-9"
      >
        <path
          fill="currentColor"
          d="M9.997 15.48q-.668 0-1.14-.475t-.472-1.143t.475-1.14t1.144-.472t1.14.476t.472 1.143t-.476 1.14t-1.143.472M6.375 7.75h7.25L14.9 5.161q.212-.403-.018-.782T14.192 4H5.808q-.46 0-.69.379t-.018.783zM6.631 20h6.738q1.93 0 3.28-1.351Q18 17.298 18 15.363q0-.808-.277-1.574t-.8-1.395L13.881 8.75H6.119l-3.042 3.644q-.523.629-.8 1.395Q2 14.554 2 15.363q0 1.935 1.351 3.286T6.631 20"
        />
      </svg>
    ),
  },
  {
    id: "timesheet",
    title: "Timesheet",
    description: "Automate time tracking and attendance management.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="h-6 w-6"
      >
        <path
          fill="currentColor"
          d="M10 0c5.523 0 10 4.477 10 10s-4.477 10-10 10S0 15.523 0 10S4.477 0 10 0m-.93 5.581a.7.7 0 0 0-.698.698v5.581c0 .386.312.698.698.698h5.581a.698.698 0 1 0 0-1.395H9.767V6.279a.7.7 0 0 0-.697-.698"
        />
      </svg>
    ),
  },
  {
    id: "leads",
    title: "Leads",
    description: "Automate lead tracking and customer relation.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="h-8 w-8"
      >
        <g fill="none">
          <path d="M0 0h24v24H0z" />
          <path
            fill="currentColor"
            d="M10.5 2a8.5 8.5 0 0 1 6.676 13.762l3.652 3.652a1 1 0 0 1-1.414 1.414l-3.652-3.652A8.5 8.5 0 1 1 10.5 2m0 2a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13m0 1a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11"
          />
        </g>
      </svg>
    ),
  },
  {
    id: "proposal",
    title: "Proposal",
    description: "Auto generate proposal and document.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 15 15"
        className="h-6 w-6"
      >
        <path
          fill="currentColor"
          d="M2.5 0A1.5 1.5 0 0 0 1 1.5v12A1.5 1.5 0 0 0 2.5 15h10a1.5 1.5 0 0 0 1.5-1.5V3.293L10.707 0z"
        />
      </svg>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Automate data visualization and monitoring.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="h-8 w-8"
      >
        <path
          fill="currentColor"
          d="M12 3a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm8 0a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1zM3 14a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
        />
      </svg>
    ),
  },
  {
    id: "logbook",
    title: "Logbook",
    description: "Automate activity logging and record keeping.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="h-8 w-8"
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M18.75 16.714a1 1 0 0 1-.014.143a.75.75 0 0 1-.736.893H4a1.25 1.25 0 1 0 0 2.5h14a.75.75 0 0 1 0 1.5H4A2.75 2.75 0 0 1 1.25 19V5A2.75 2.75 0 0 1 4 2.25h13.4c.746 0 1.35.604 1.35 1.35zM7 6.25a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
]
