import '@testing-library/jest-dom/vitest';

// jsdom has no showModal/close: a minimal stand-in (set or remove `open`; close fires a `close` event), so the
// app's own Dialog logic (focus wrap, Esc, restore) is what the tests exercise (spec 14).
if (typeof HTMLDialogElement !== 'undefined') {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void; close?: () => void };
  if (!proto.showModal) {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (!proto.close) {
    proto.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}
