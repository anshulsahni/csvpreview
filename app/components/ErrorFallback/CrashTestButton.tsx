// Manual test helper for the error screen and Sentry reporting.
// It is commented out so it never ships. See ERROR_HANDLING.md in this folder for
// how to turn it on, and turn it off again before you commit.

export {};

// "use client";
//
// import { useState } from "react";
// import { styled } from "@linaria/react";
//
// // Throws during render, so `app/error.tsx` catches it and shows ErrorFallback.
// // The message has fake user data on purpose: Sentry must show "[redacted]".
// export default function CrashTestButton() {
//   const [crashed, setCrashed] = useState(false);
//
//   if (crashed) {
//     throw new Error("Crash test: jane@example.com,120000");
//   }
//
//   return (
//     <FloatingButton type="button" onClick={() => setCrashed(true)}>
//       Crash this page
//     </FloatingButton>
//   );
// }
//
// const FloatingButton = styled.button`
//   position: fixed;
//   bottom: 1rem;
//   left: 1rem;
//   z-index: 50;
//   padding: 0.5rem 0.9rem;
//   border: none;
//   border-radius: 8px;
//   background: var(--danger);
//   color: var(--danger-foreground);
//   font: inherit;
//   font-weight: 600;
//   cursor: pointer;
//
//   &:hover {
//     background: var(--danger-hover);
//   }
// `;
