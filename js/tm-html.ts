/** ® → <sup class="rg-tm"> (HTML string). */
export function tmHtml(s: string): string {
  return s.replace(/®/g, '<sup class="rg-tm">®</sup>');
}
