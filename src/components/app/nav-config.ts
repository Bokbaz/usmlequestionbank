import {
  BarChart3,
  BookOpen,
  Brain,
  ClipboardList,
  Gem,
  LayoutDashboard,
  Layers3,
  NotebookPen,
  PlusSquare,
  Settings,
  Shield,
  Trophy,
  Zap,
} from "lucide-react";

export const NAV_GROUPS = [
  {
    label: "Study",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/qbank", label: "Create test", icon: PlusSquare },
      { href: "/tests", label: "Previous tests", icon: ClipboardList },
      { href: "/argo", label: "ARGO", icon: Brain, pro: true },
      { href: "/library", label: "Library", icon: BookOpen },
    ],
  },
  {
    label: "Review",
    items: [
      { href: "/performance", label: "Performance", icon: BarChart3 },
      { href: "/nuggets", label: "Nuggets", icon: Gem },
      { href: "/flashcards", label: "Flashcards", icon: Layers3 },
      { href: "/notebook", label: "Notebook", icon: NotebookPen },
    ],
  },
  {
    label: "Compete",
    items: [
      { href: "/daily", label: "Daily Challenge", icon: Zap },
      { href: "/daily/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
] as const;

export const ADMIN_ITEM = { href: "/admin", label: "Admin", icon: Shield };
export const SETTINGS_ITEM = { href: "/settings", label: "Settings", icon: Settings };
