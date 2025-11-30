import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Custom render function for testing React components
 * Can be extended with providers (e.g., QueryClientProvider, ThemeProvider)
 */
const customRender = (ui: ReactElement, options?: RenderOptions) => {
  return render(ui, { ...options });
};

export * from "@testing-library/react";
export { customRender as render };
