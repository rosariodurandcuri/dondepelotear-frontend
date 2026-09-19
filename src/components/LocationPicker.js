/**
 * SELECTOR DE UBICACIÓN — Departamento → Provincia → Distrito (selección progresiva)
 * -----------------------------------------------------------------------------------
 * Se usa en el buscador, en los filtros y en el formulario del propietario.
 *
 *   render:  ${LocationPicker({ department: 'Lima' }, { prefix: 'search' })}
 *   eventos: bindLocationPicker(root, (location) => { ... })
 *   leer:    readLocationPicker(root)
 */
import { html } from '../utils/dom.js';
import { getDepartments, getProvinces, getDistricts } from '../config/locations.js';

function options(list, selected, placeholder) {
  return html`<option value="">${placeholder}</option>${list.map((item) => html`<option value="${item.name}" ${item.name === selected ? 'selected' : ''}>${item.name}</option>`)}`;
}

export function LocationPicker(values = {}, { prefix = 'loc', showLabels = true, size = '' } = {}) {
  const { department = '', province = '', district = '' } = values;
  const provinces = department ? getProvinces(department) : [];
  const districts = department && province ? getDistricts(department, province) : [];
  const cls = `form-control ${size}`;
  const label = (id, text) => (showLabels ? html`<label class="form-label" for="${prefix}-${id}">${text}</label>` : '');
  return html`
    <div class="location-picker" data-location-picker="${prefix}">
      <div class="form-group">
        ${label('department', 'Departamento')}
        <select class="${cls}" id="${prefix}-department" name="department" data-loc="department" aria-label="Departamento">
          ${options(getDepartments(), department, 'Todo el Perú')}
        </select>
      </div>
      <div class="form-group">
        ${label('province', 'Provincia')}
        <select class="${cls}" id="${prefix}-province" name="province" data-loc="province" aria-label="Provincia" ${department ? '' : 'disabled'}>
          ${options(provinces, province, department ? 'Toda la región' : 'Elige departamento')}
        </select>
      </div>
      <div class="form-group">
        ${label('district', 'Distrito')}
        <select class="${cls}" id="${prefix}-district" name="district" data-loc="district" aria-label="Distrito" ${province ? '' : 'disabled'}>
          ${options(districts, district, province ? 'Toda la provincia' : 'Elige provincia')}
        </select>
      </div>
    </div>`;
}

export function readLocationPicker(root) {
  const picker = root.matches?.('[data-location-picker]') ? root : root.querySelector('[data-location-picker]');
  if (!picker) return { department: '', province: '', district: '' };
  return {
    department: picker.querySelector('[data-loc="department"]').value,
    province: picker.querySelector('[data-loc="province"]').value,
    district: picker.querySelector('[data-loc="district"]').value,
  };
}

/** Actualiza los selects desde fuera (por ejemplo, cuando el usuario escribe "San Miguel" en el buscador) */
export function setLocationPicker(root, values = {}) {
  const picker = root.matches?.('[data-location-picker]') ? root : root.querySelector('[data-location-picker]');
  if (!picker) return;
  const dep = picker.querySelector('[data-loc="department"]');
  const prov = picker.querySelector('[data-loc="province"]');
  const dist = picker.querySelector('[data-loc="district"]');
  dep.value = values.department || '';
  fill(prov, values.department ? getProvinces(values.department) : [], values.province || '', values.department ? 'Toda la región' : 'Elige departamento');
  prov.disabled = !values.department;
  fill(dist, values.department && values.province ? getDistricts(values.department, values.province) : [], values.district || '', values.province ? 'Toda la provincia' : 'Elige provincia');
  dist.disabled = !values.province;
}

function fill(select, list, selected, placeholder) {
  select.innerHTML = String(options(list, selected, placeholder));
}

export function bindLocationPicker(root, onChange = () => {}) {
  const picker = root.matches?.('[data-location-picker]') ? root : root.querySelector('[data-location-picker]');
  if (!picker) return;
  const dep = picker.querySelector('[data-loc="department"]');
  const prov = picker.querySelector('[data-loc="province"]');
  const dist = picker.querySelector('[data-loc="district"]');

  dep.addEventListener('change', () => {
    setLocationPicker(picker, { department: dep.value });
    onChange(readLocationPicker(picker));
  });
  prov.addEventListener('change', () => {
    setLocationPicker(picker, { department: dep.value, province: prov.value });
    onChange(readLocationPicker(picker));
  });
  dist.addEventListener('change', () => onChange(readLocationPicker(picker)));
}
