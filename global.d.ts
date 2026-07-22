import type { CSSProperties, DetailedHTMLProps, HTMLAttributes, ReactNode, Ref } from "react";

/** Atributos genéricos para custom elements (Web Awesome / Iconify). */
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
      "wa-badge": CEProps & { variant?: string; pill?: boolean };
      "wa-button": CEProps & {
        variant?: string;
        size?: string;
        loading?: boolean | "" | undefined;
        disabled?: boolean;
      };
      "wa-carousel": CEProps & {
        navigation?: boolean;
        pagination?: boolean;
        loop?: boolean;
        autoplay?: boolean;
        "autoplay-interval"?: number | string;
        "mouse-dragging"?: boolean;
        "slides-per-page"?: number | string;
      };
      "wa-carousel-item": CEProps;
      "wa-drawer": CEProps & { label?: string; open?: boolean };
      "wa-dialog": CEProps & {
        label?: string;
        open?: boolean;
        "no-header"?: boolean;
      };
      "wa-input": CEProps & {
        label?: string;
        type?: string;
        value?: string;
        placeholder?: string;
        "with-clear"?: boolean;
        size?: string;
        required?: boolean;
      };
      "wa-option": CEProps & { value?: string };
      "wa-radio-button": CEProps & { value?: string };
      "wa-radio-group": CEProps & { label?: string; value?: string };
      "wa-select": CEProps & {
        label?: string;
        value?: string;
        placeholder?: string;
        "with-clear"?: boolean;
        size?: string;
      };
      "wa-spinner": CEProps;
      "wa-textarea": CEProps & {
        label?: string;
        value?: string;
        rows?: number;
        required?: boolean;
      };
    }
  }
}

export {};
