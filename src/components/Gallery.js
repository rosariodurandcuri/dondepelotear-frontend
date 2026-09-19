/**
 * GALERÍA DE FOTOS — imagen principal + miniaturas.
 */
import { html, raw } from '../utils/dom.js';
import { PLACEHOLDER_IMAGE } from '../utils/images.js';

export function Gallery(images = [], name = '') {
  const list = images.length ? images : [PLACEHOLDER_IMAGE];
  const fallback = `onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'"`;
  return html`
    <div class="gallery ${list.length > 1 ? '' : 'gallery-single'}" data-gallery>
      <div class="gallery-main"><img src="${list[0]}" alt="${name}" data-gallery-main ${raw(fallback)} /></div>
      ${list.length > 1 ? html`
        <div class="gallery-thumbs">
          ${list.slice(0, 4).map((src, i) => html`<img src="${src}" alt="${name} foto ${i + 1}" class="${i === 0 ? 'active' : ''}" data-gallery-thumb="${src}" ${raw(fallback)} />`)}
        </div>` : ''}
    </div>`;
}

export function bindGallery(root) {
  const main = root.querySelector('[data-gallery-main]');
  root.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      main.src = thumb.dataset.galleryThumb;
      root.querySelectorAll('[data-gallery-thumb]').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}
