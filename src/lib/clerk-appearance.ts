import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#1C9CF0",
    colorDanger: "#F4212E",
    colorSuccess: "#22C543",
    colorWarning: "#F36B16",
    colorNeutral: "#72767A",
    colorBackground: "#0A0A0A",
    colorInputBackground: "#22303C",
    colorText: "#E7E9EA",
    colorTextSecondary: "#72767A",
    colorTextOnPrimaryBackground: "#FFFFFF",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
  elements: {
    card: "bg-[#0f1012] border border-white/[0.06] shadow-2xl backdrop-blur-xl rounded-2xl",
    headerTitle: "text-foreground font-bold tracking-tight",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton:
      "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl",
    formButtonPrimary:
      "bg-[#1C9CF0] hover:bg-[#1C9CF0]/90 rounded-xl font-semibold shadow-lg shadow-[#1C9CF0]/10 transition-all",
    formFieldInput:
      "bg-[#22303C] border-white/10 rounded-xl focus:border-[#1C9CF0]/50 focus:ring-[#1C9CF0]/20",
    formFieldLabel: "text-muted-foreground text-sm font-medium",
    footerActionLink: "text-[#1C9CF0] hover:text-[#1C9CF0]/80 font-medium",
    identityPreviewEditButton: "text-[#1C9CF0]",
    userButtonPopoverCard:
      "bg-[#0f1012] border border-white/[0.06] shadow-2xl rounded-2xl",
    userButtonPopoverActionButton: "hover:bg-white/[0.04] rounded-xl",
    modalBackdrop: "bg-black/60 backdrop-blur-sm",
    modalContent: "rounded-2xl",
  },
};
