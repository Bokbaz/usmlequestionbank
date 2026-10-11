import type { Appearance } from "@stripe/stripe-js";

export type CheckoutTheme = "light" | "dark";

export function checkoutAppearance(theme: CheckoutTheme): Appearance {
  const dark = theme === "dark";
  return {
    theme: dark ? "night" : "stripe",
    variables: {
      // Stripe's iframes cannot inherit the page's CSS variables. These are
      // the hex equivalents of the design tokens in globals.css.
      colorBackground: dark ? "#101a1d" : "#fcfefe",
      colorText: dark ? "#eceff0" : "#0a181d",
      colorTextSecondary: dark ? "#acb6b9" : "#48595e",
      colorPrimary: dark ? "#58d4d0" : "#005b61",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSizeBase: "15px",
      borderRadius: "4px",
    },
  };
}
