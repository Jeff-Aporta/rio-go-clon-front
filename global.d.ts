import type { CSSProperties, DetailedHTMLProps, HTMLAttributes, ReactNode, Ref } from "react";

/** Atributos genéricos para custom elements (Shoelace / Iconify). */
type CEProps = Omit<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>, "ref" | "style"> & {
  children?: ReactNode;
  class?: string;
  style?: CSSProperties & Record<string, string | number | undefined>;
  slot?: string;
  ref?: Ref<HTMLElement | null>;
  [attr: string]: unknown;
};

declare global {
  interface Window {
    __STOREFRONT_CONFIG__?: import("./js/types").FrontConfig;
    __STOREFRONT_API__?: string;
    __RIOGO_API__?: string;
    __RIOGO_DIST__?: boolean;
  }

  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": CEProps & { icon?: string; width?: string | number; height?: string | number };
      "sl-badge": CEProps & { variant?: string; pill?: boolean };
      "sl-button": CEProps & {
        variant?: string;
        size?: string;
        loading?: boolean | "" | undefined;
        disabled?: boolean;
      };
      "sl-carousel": CEProps & {
        navigation?: boolean;
        pagination?: boolean;
        loop?: boolean;
        autoplay?: boolean;
        "autoplay-interval"?: number | string;
        "mouse-dragging"?: boolean;
        "slides-per-page"?: number | string;
      };
      "sl-carousel-item": CEProps;
      "sl-drawer": CEProps & { label?: string; open?: boolean };
      "sl-dialog": CEProps & {
        label?: string;
        open?: boolean;
        "no-header"?: boolean;
      };
      "sl-input": CEProps & {
        label?: string;
        type?: string;
        value?: string;
        placeholder?: string;
        clearable?: boolean;
        required?: boolean;
      };
      "sl-option": CEProps & { value?: string };
      "sl-radio-button": CEProps & { value?: string };
      "sl-radio-group": CEProps & { label?: string; value?: string };
      "sl-select": CEProps & {
        label?: string;
        value?: string;
        placeholder?: string;
        clearable?: boolean;
      };
      "sl-spinner": CEProps;
      "sl-textarea": CEProps & {
        label?: string;
        value?: string;
        rows?: number;
        required?: boolean;
      };
    }
  }
}

export {};
