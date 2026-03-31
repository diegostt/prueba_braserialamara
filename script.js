// ===========================
// SCROLL-DRIVEN VIDEO (Apple-style)
// ===========================

(function () {
  const heroSection = document.getElementById('inicio');
  if (!heroSection) return;

  const imgStart = document.getElementById('hero-img-start');
  const imgEnd = document.getElementById('hero-img-end');
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  const scrollIndicator = document.getElementById('scroll-indicator');

  const P1 = 0.08;
  const P2 = 0.12;
  const P3 = 0.85;
  const P4 = 0.92;

  const video = document.createElement('video');
  video.src = 'assets/video_transicion.mp4';
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.load();

  let videoReady = false;
  let rafId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (videoReady) drawFrame();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function drawFrame() {
    if (!videoReady || !video.videoWidth) return;
    const vw = video.videoWidth, vh = video.videoHeight;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / vw, ch / vh);
    const dw = vw * scale, dh = vh * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(video, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  video.addEventListener('loadeddata', () => {
    videoReady = true;
    video.currentTime = 0;
  });
  video.addEventListener('seeked', drawFrame);

  function alpha(el, v) { el.style.opacity = v; }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function onScroll() {
    const sectionTop = -heroSection.getBoundingClientRect().top;
    const sectionHeight = heroSection.offsetHeight - window.innerHeight;
    const p = clamp01(sectionTop / sectionHeight);

    if (p <= P1) {
      alpha(imgStart, 1);
      alpha(canvas, 0);
      alpha(imgEnd, 0);
    } else if (p <= P2) {
      const t = (p - P1) / (P2 - P1);
      alpha(imgStart, 1 - t);
      alpha(canvas, t);
      alpha(imgEnd, 0);
      if (videoReady) {
        if (video.currentTime !== 0) video.currentTime = 0;
        drawFrame();
      }
    } else if (p <= P3) {
      alpha(imgStart, 0);
      alpha(canvas, 1);
      alpha(imgEnd, 0);
      if (videoReady && video.duration) {
        const targetTime = ((p - P2) / (P3 - P2)) * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 0.033) {
          video.currentTime = targetTime;
        }
      }
    } else if (p <= P4) {
      const t = (p - P3) / (P4 - P3);
      alpha(imgStart, 0);
      alpha(canvas, 1 - t);
      alpha(imgEnd, t);
      if (videoReady && video.duration) {
        const endTime = video.duration;
        if (video.currentTime !== endTime) video.currentTime = endTime;
        drawFrame();
      }
    } else {
      alpha(imgStart, 0);
      alpha(canvas, 0);
      alpha(imgEnd, 1);
    }

    if (scrollIndicator) {
      scrollIndicator.style.opacity = p > 0.04 ? 0 : 1;
    }
  }

  window.addEventListener('scroll', () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(onScroll);
  }, { passive: true });

  onScroll();
})();


// ===========================
// NAVBAR
// ===========================

(function () {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  if (!navbar || !toggle || !links) return;

  if (document.getElementById('inicio')) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    links.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      links.classList.remove('open');
    });
  });
})();


// ===========================


// ===========================
// CART & ORDER LOGIC
// ===========================
let cart = JSON.parse(localStorage.getItem('braseriamara_cart')) || [];

function saveCart() {
  localStorage.setItem('braseriamara_cart', JSON.stringify(cart));
}

// Format: "12,50 €" -> 12.50
function parsePrice(priceStr) {
  return parseFloat(priceStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
}

function formatPrice(num) {
  return num.toFixed(2).replace('.', ',') + ' €';
}

function showAddFeedback(btn, name) {
  if (btn) {
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '✓';
    btn.style.background = '#2ecc71';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.style.background = '';
      btn.style.color = '';
    }, 1000);
  }
  const toast = document.createElement('div');
  toast.textContent = name + " añadido al pedido.";
  toast.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(50px);
    background: var(--accent); color: #1e1b18; padding: 12px 24px; border-radius: 30px;
    font-weight: 600; font-size: 0.9rem; opacity: 0; transition: all 0.3s var(--ease);
    z-index: 9999; box-shadow: 0 5px 15px rgba(0,0,0,0.3); pointer-events: none;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function addItemToCart(name, price, tapPrice, racionPrice, variant) {
  const existing = cart.find(c => c.name === name && c.variant === variant);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, qty: 1, tapPrice: tapPrice || null, racionPrice: racionPrice || null, variant: variant || null });
  }
  saveCart();
  if (document.getElementById('selected-items')) renderCartUI();
}

// Modal to choose Tapa or Ración
function showVariantModal(name, tapPrice, racionPrice, btn, onChoose) {
  const existing = document.getElementById('variant-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'variant-modal-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 9998;
    display: flex; align-items: center; justify-content: center;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: #1e1b18; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px; padding: 32px 28px; max-width: 320px; width: 90%;
    text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  `;
  modal.innerHTML = `
    <h3 style="font-family:var(--font-display);font-size:1.2rem;margin-bottom:6px;color:#f0ece4;">${name}</h3>
    <p style="color:#9a9590;margin-bottom:24px;font-size:0.85rem;">¿Lo quieres de tapa o ración?</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button id="vm-tapa" style="flex:1;padding:14px 10px;background:transparent;border:1px solid var(--accent);border-radius:10px;color:var(--accent);font-weight:600;font-size:0.9rem;cursor:pointer;transition:all 0.2s;">
        Tapa<br><span style="font-size:0.8rem;font-weight:400;color:#9a9590;">${formatPrice(tapPrice)}</span>
      </button>
      <button id="vm-racion" style="flex:1;padding:14px 10px;background:var(--accent);border:1px solid var(--accent);border-radius:10px;color:#1e1b18;font-weight:700;font-size:0.9rem;cursor:pointer;transition:all 0.2s;">
        Ración<br><span style="font-size:0.8rem;font-weight:600;color:rgba(0,0,0,0.55);">${formatPrice(racionPrice)}</span>
      </button>
    </div>
    <button id="vm-cancel" style="margin-top:16px;background:transparent;border:none;color:#5a5550;font-size:0.8rem;cursor:pointer;padding:8px;">Cancelar</button>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.querySelector('#vm-tapa').onclick = () => {
    overlay.remove();
    if (onChoose) { onChoose('tapa', tapPrice); }
    else { addItemToCart(name, tapPrice, tapPrice, racionPrice, 'tapa'); showAddFeedback(btn, name); }
  };
  overlay.querySelector('#vm-racion').onclick = () => {
    overlay.remove();
    if (onChoose) { onChoose('racion', racionPrice); }
    else { addItemToCart(name, racionPrice, tapPrice, racionPrice, 'racion'); showAddFeedback(btn, name); }
  };
  overlay.querySelector('#vm-cancel').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// When clicking "+" in carta.html
window.addToCart = function(btn) {
  const itemDiv = btn.closest('.menu-item');
  const name = itemDiv.querySelector('.item-name').childNodes[0].textContent.trim();

  const priceSpans = Array.from(itemDiv.querySelectorAll('.item-prices span'))
                          .map(s => s.textContent.trim())
                          .filter(t => t.length > 0);

  if (priceSpans.length >= 2) {
    const tapPrice = parsePrice(priceSpans[0]);
    const racionPrice = parsePrice(priceSpans[priceSpans.length - 1]);
    showVariantModal(name, tapPrice, racionPrice, btn);
  } else {
    const priceVal = priceSpans.length > 0 ? parsePrice(priceSpans[0]) : 0;
    addItemToCart(name, priceVal, null, null, null);
    showAddFeedback(btn, name);
  }
};

// -- Order Selector Component (index.html) --
const orderTrigger = document.getElementById('order-trigger');
const orderPopover = document.getElementById('order-popover');
const orderSearch = document.getElementById('order-search');
const orderList = document.getElementById('order-list');
const selectedItemsContainer = document.getElementById('selected-items');
const orderTotalPriceEl = document.getElementById('order-total-price');
const hiddenPedidoInput = document.getElementById('pedido');

let fullMenuData = null;

async function fetchMenuData() {
  if (fullMenuData) return;
  // Scrape carta.html silently to power the search dropdown
  try {
    const res = await fetch('carta.html');
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    
    fullMenuData = [];
    doc.querySelectorAll('.menu-category-card').forEach(cat => {
      const catName = cat.querySelector('h3').textContent.trim();
      const items = Array.from(cat.querySelectorAll('.menu-item')).map(itemDiv => {
        const name = itemDiv.querySelector('.item-name').childNodes[0].textContent.trim();
        const priceSpans = Array.from(itemDiv.querySelectorAll('.item-prices span'))
                                .map(s => s.textContent.trim())
                                .filter(t => t.length > 0);
        const hasBoth = priceSpans.length >= 2;
        const tapPrice  = hasBoth ? parsePrice(priceSpans[0]) : null;
        const racionPrice = hasBoth ? parsePrice(priceSpans[priceSpans.length - 1]) : (priceSpans.length > 0 ? parsePrice(priceSpans[0]) : 0);
        return { name, priceVal: racionPrice, tapPrice, racionPrice, hasBoth, category: catName };
      });
      if (items.length > 0) fullMenuData.push({ category: catName, items });
    });
  } catch (err) {
    console.error("Error fetching menu data", err);
    fullMenuData = [];
  }
}

function renderMenuList(searchTerm = "") {
  if (!orderList || !fullMenuData) return;
  orderList.innerHTML = '';
  const term = searchTerm.toLowerCase();
  
  let hasResults = false;
  fullMenuData.forEach(cat => {
    const matchingItems = cat.items.filter(item => item.name.toLowerCase().includes(term));
    if (matchingItems.length === 0) return;
    
    hasResults = true;
    const catHeader = document.createElement('div');
    catHeader.className = 'order-list-category';
    catHeader.textContent = cat.category;
    orderList.appendChild(catHeader);
    
    matchingItems.forEach(item => {
      const el = document.createElement('div');
      el.className = 'order-list-item';
      
      const nameEl = document.createElement('span');
      nameEl.textContent = item.name;

      const priceEl = document.createElement('span');
      priceEl.className = 'item-price';
      priceEl.textContent = item.hasBoth
        ? formatPrice(item.tapPrice) + ' / ' + formatPrice(item.racionPrice)
        : formatPrice(item.priceVal);

      el.appendChild(nameEl);
      el.appendChild(priceEl);

      el.addEventListener('click', () => {
        document.querySelector('.order-selector-container').classList.remove('open');
        if (item.hasBoth) {
          showVariantModal(item.name, item.tapPrice, item.racionPrice, null);
        } else {
          const existing = cart.find(c => c.name === item.name && !c.variant);
          if (existing) existing.qty++;
          else cart.push({ name: item.name, price: item.priceVal, qty: 1, tapPrice: null, racionPrice: null, variant: null });
          saveCart();
          renderCartUI();
        }
      });

      orderList.appendChild(el);
    });
  });
  
  if (!hasResults && term) {
    orderList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No se encontraron platos.</div>';
  }
}

function renderCartUI() {
  if (!selectedItemsContainer) return;

  selectedItemsContainer.innerHTML = '';
  let total = 0;
  let orderStringParts = [];

  cart.forEach((item, index) => {
    total += item.price * item.qty;
    const variantLabel = item.variant ? (item.variant === 'tapa' ? ' (Tapa)' : ' (Ración)') : '';
    orderStringParts.push(`${item.qty}x ${item.name}${variantLabel}`);

    const chip = document.createElement('div');
    chip.className = 'selected-item-chip';

    const info = document.createElement('div');
    const variantBadge = item.variant
      ? `<em style="font-size:0.72rem;font-weight:600;text-transform:uppercase;color:var(--accent);font-style:normal;margin-left:6px;">${item.variant === 'tapa' ? 'Tapa' : 'Ración'}</em>`
      : '';
    info.innerHTML = `<strong>${item.name}</strong>${variantBadge} <span style="color:var(--text-secondary);margin-left:8px;">${formatPrice(item.price)}</span>`;

    const actions = document.createElement('div');
    actions.className = 'selected-item-actions';

    // Modificar button for dual-price items
    if (item.tapPrice && item.racionPrice) {
      const modBtn = document.createElement('button');
      modBtn.type = 'button';
      modBtn.textContent = 'Modificar';
      modBtn.style.cssText = `
        font-size:0.72rem;font-weight:600;color:var(--accent);
        background:transparent;border:1px solid var(--accent);
        border-radius:20px;padding:3px 10px;cursor:pointer;
        transition:all 0.2s;white-space:nowrap;margin-right:8px;
      `;
      modBtn.onclick = () => {
        showVariantModal(item.name, item.tapPrice, item.racionPrice, null, (newVariant, newPrice) => {
          item.variant = newVariant;
          item.price = newPrice;
          saveCart();
          renderCartUI();
        });
      };
      actions.appendChild(modBtn);
    }

    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'qty-btn';
    minusBtn.textContent = '-';
    minusBtn.onclick = () => {
      if (item.qty > 1) item.qty--; else cart.splice(index, 1);
      saveCart(); renderCartUI();
    };

    const qtyVal = document.createElement('span');
    qtyVal.className = 'qty-val';
    qtyVal.textContent = item.qty;

    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'qty-btn';
    plusBtn.textContent = '+';
    plusBtn.onclick = () => {
      item.qty++;
      saveCart(); renderCartUI();
    };

    actions.appendChild(minusBtn);
    actions.appendChild(qtyVal);
    actions.appendChild(plusBtn);

    chip.appendChild(info);
    chip.appendChild(actions);
    selectedItemsContainer.appendChild(chip);
  });

  orderTotalPriceEl.textContent = formatPrice(total);
  hiddenPedidoInput.value = orderStringParts.join('\n');
  
  const textEl = document.getElementById('order-trigger-text');
  if (textEl) {
    if (cart.length > 0) {
      const summaryString = cart.map(item => {
        const v = item.variant ? (item.variant === 'tapa' ? ' (T)' : ' (R)') : '';
        return `x${item.qty} ${item.name}${v}`;
      }).join(' + ');
      textEl.textContent = summaryString;
      textEl.classList.add('has-items');
    } else {
      textEl.textContent = 'Crea tu pedido...';
      textEl.classList.remove('has-items');
    }
  }
}

if (orderTrigger) {
  orderTrigger.addEventListener('click', async (e) => {
    e.stopPropagation();
    const container = document.querySelector('.order-selector-container');
    const wasOpen = container.classList.contains('open');
    document.querySelectorAll('.custom-select-wrapper, .order-selector-container').forEach(w => w.classList.remove('open'));
    if (!wasOpen) {
      container.classList.add('open');
      await fetchMenuData();
      renderMenuList(orderSearch.value);
      orderSearch.focus();
    }
  });
  
  orderSearch.addEventListener('input', (e) => {
    renderMenuList(e.target.value);
  });
  
  orderPopover.addEventListener('click', e => e.stopPropagation());
  
  // Render initial cart
  renderCartUI();
}

document.addEventListener('click', () => {
  if (document.querySelector('.order-selector-container')) {
    document.querySelector('.order-selector-container').classList.remove('open');
  }
});


// ===========================
// CUSTOM VISUAL SELECT COMPONENT
// ===========================
function initCustomSelects() {
  // Only target selects inside our form so we don't break Flatpickr's internal selects
  document.querySelectorAll('#order-form select').forEach(setupCustomSelect);
}

function updateCustomSelect(select) {
  const wrapper = select.nextElementSibling;
  if (wrapper && wrapper.classList.contains('custom-select-wrapper')) {
    wrapper.remove();
  }
  setupCustomSelect(select);
}

function setupCustomSelect(select) {
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select-wrapper';

  const trigger = document.createElement('div');
  trigger.className = 'custom-select-trigger';
  
  const span = document.createElement('span');
  span.className = 'custom-select-trigger-text';
  span.textContent = select.options[select.selectedIndex]?.text || '';
  
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'custom-select-icon');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.innerHTML = '<path d="M6 9l6 6 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';

  trigger.appendChild(span);
  trigger.appendChild(icon);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'custom-select-options';

  Array.from(select.options).forEach((option, index) => {
    if (option.disabled && index === 0) return; // Skip placeholder
    const customOption = document.createElement('div');
    customOption.className = 'custom-option';
    if (option.selected) customOption.classList.add('selected');
    customOption.textContent = option.text;
    customOption.dataset.value = option.value;

    customOption.addEventListener('click', () => {
      select.value = option.value;
      span.textContent = option.text;
      
      optionsContainer.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
      customOption.classList.add('selected');
      
      wrapper.classList.remove('open');
      
      // Dispatch change event on native select
      select.dispatchEvent(new Event('change'));
    });
    
    optionsContainer.appendChild(customOption);
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(optionsContainer);
  select.parentNode.insertBefore(wrapper, select.nextSibling);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = wrapper.classList.contains('open');
    document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
    if (!wasOpen) wrapper.classList.add('open');
  });
}

document.addEventListener('click', () => {
  document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
});

document.addEventListener('DOMContentLoaded', initCustomSelects);


// ===========================
// RESERVATION FORM — Schedule-aware
// ===========================

(function () {
  const form = document.getElementById('order-form');
  const success = document.getElementById('form-success');
  const diaInput = document.getElementById('dia');
  const horaSelect = document.getElementById('hora');
  const hint = document.getElementById('horario-hint');

  if (!form || !diaInput || !horaSelect) return;

  // Schedule: 0=Sunday, 1=Monday, ..., 6=Saturday
  // null = closed
  const schedule = {
    0: [{ from: '12:00', to: '16:30' }, { from: '20:00', to: '23:00' }], // Domingo
    1: null, // Lunes — cerrado
    2: null, // Martes — cerrado
    3: [{ from: '12:00', to: '16:30' }, { from: '20:00', to: '23:00' }], // Miércoles
    4: [{ from: '12:00', to: '16:30' }, { from: '20:00', to: '23:00' }], // Jueves
    5: [{ from: '12:00', to: '16:30' }, { from: '20:00', to: '23:30' }], // Viernes
    6: [{ from: '12:00', to: '16:30' }, { from: '20:00', to: '23:30' }], // Sábado
  };

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Generate time slots in 30-min intervals (excluding last 60 mins before closing)
  function generateTimeSlots(ranges) {
    const slots = [];
    ranges.forEach(range => {
      const [fh, fm] = range.from.split(':').map(Number);
      const [th, tm] = range.to.split(':').map(Number);
      
      const startMins = fh * 60 + fm;
      const endMins = th * 60 + tm;
      
      // Stop taking reservations 60 minutes before closing time
      const lastBookingMins = endMins - 60;
      
      let currentMins = startMins;
      
      while (currentMins <= lastBookingMins) {
        const h = Math.floor(currentMins / 60);
        const m = currentMins % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        currentMins += 30;
      }
    });
    return slots;
  }

  // Initialize Flatpickr
  const fp = flatpickr(diaInput, {
    locale: "es",
    minDate: "today",
    disableMobile: true,
    disable: [
      function(date) {
        // Disable Mondays (1) and Tuesdays (2)
        return (date.getDay() === 1 || date.getDay() === 2);
      }
    ],
    onChange: function(selectedDates, dateStr, instance) {
      if (selectedDates.length === 0) return;
      
      const selectedDate = selectedDates[0];
      const dayOfWeek = selectedDate.getDay();
      const dayName = dayNames[dayOfWeek];
      const ranges = schedule[dayOfWeek];

      // Clear previous options
      horaSelect.innerHTML = '';

      if (!ranges) {
        horaSelect.innerHTML = '<option value="" disabled selected>Cerrado este día</option>';
        if (hint) {
          hint.textContent = `${dayName}: Cerrado. Por favor, elige otro día.`;
          hint.style.color = '#c0392b';
        }
        updateCustomSelect(horaSelect);
        return;
      }

      // Show schedule hint
      const rangeText = ranges.map(r => `${r.from}–${r.to}`).join(' y ');
      if (hint) {
        hint.textContent = `${dayName}: ${rangeText}`;
        hint.style.color = '';
      }

      // Generate and populate slots
      const slots = generateTimeSlots(ranges);
      horaSelect.innerHTML = '<option value="" disabled selected>Selecciona hora</option>';
      slots.forEach(slot => {
        const opt = document.createElement('option');
        opt.value = slot;
        opt.textContent = slot;
        horaSelect.appendChild(opt);
      });
      
      // Refresh custom visual select 
      updateCustomSelect(horaSelect);
    }
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!diaInput.value) {
      alert('Por favor, selecciona una fecha.');
      return;
    }

    const selectedDate = fp.selectedDates[0];
    const dayOfWeek = selectedDate.getDay();
    if (!schedule[dayOfWeek]) {
      alert('Lo sentimos, ese día estamos cerrados. Por favor elige otro día.');
      return;
    }

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => { data[key] = value; });
    
    // Change button to loading state
    const submitBtn = document.getElementById('submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span style="opacity:0.7">Enviando reserva...</span>';
    submitBtn.style.pointerEvents = 'none';

    // Build order summary
    const orderLines = cart.map(item => {
      const v = item.variant ? (item.variant === 'tapa' ? ' (Tapa)' : ' (Ración)') : '';
      return `x${item.qty} ${item.name}${v}`;
    }).join(' + ') || 'Sin pedido';

    // Format ISO date (e.g., 2026-03-31T20:30:00.000Z)
    const [horas, minutos] = (data.hora || '12:00').split(':');
    const reservationDate = new Date(selectedDate);
    reservationDate.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    const fechaIso = reservationDate.toISOString();

    const orderTotal = document.getElementById('order-total-price').textContent;

    try {
      const WEBHOOK_URL = 'https://hook.eu2.make.com/bhk3tc5y8los2pnoxv69h0hgduqppp0o';
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: data.nombre,
          fechaIso: fechaIso,
          hora: data.hora,
          personas: data.personas,
          tipo: data.tipo === 'aqui' ? 'Comer Aquí' : 'Para Llevar',
          pedido: orderLines,
          total: orderTotal
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar la reserva');
      }
    } catch (err) {
      console.error(err);
      alert('Hubo un problema confirmando tu reserva. Por favor intenta de nuevo.');
      submitBtn.innerHTML = originalBtnText;
      submitBtn.style.pointerEvents = 'auto';
      return;
    }

    // Restore button
    submitBtn.innerHTML = originalBtnText;
    submitBtn.style.pointerEvents = 'auto';
    
    // Format order summary for modal HTML
    const orderLinesHtml = cart.map(item => {
      const v = item.variant ? (item.variant === 'tapa' ? ' (T)' : ' (R)') : '';
      return `${item.qty}x ${item.name}${v}`;
    }).join(', ') || 'Sin pedido';

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;
      display:flex;align-items:center;justify-content:center;padding:24px;
      opacity:0;transition:opacity 0.35s ease;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background:#1a1714;border:1px solid rgba(255,255,255,0.1);
      border-radius:22px;padding:40px 32px;max-width:380px;width:100%;
      text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.6);
      transform:scale(0.85) translateY(30px);transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease;
      opacity:0;
    `;

    card.innerHTML = `
      <div style="width:64px;height:64px;border-radius:50%;background:var(--accent);color:#1a1714;
        font-size:2rem;font-weight:700;display:flex;align-items:center;justify-content:center;
        margin:0 auto 20px;animation:popIn 0.5s cubic-bezier(0.34,1.56,0.64,1);">✓</div>
      <h3 style="font-family:var(--font-display);font-size:1.4rem;color:var(--accent);margin-bottom:8px;">¡Reserva confirmada!</h3>
      <div style="width:40px;height:2px;background:var(--accent);margin:0 auto 16px;border-radius:2px;"></div>
      <p style="font-size:0.95rem;color:#9a9590;margin-bottom:16px;">Te esperamos en <strong style="color:#f0ece4;">Brasería La Mara</strong></p>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:20px;text-align:left;">
        <p style="font-size:0.82rem;color:#9a9590;margin-bottom:4px;display:flex;align-items:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <strong style="color:#f0ece4;">${data.nombre || ''}</strong>
        </p>
        <p style="font-size:0.82rem;color:#9a9590;margin-bottom:4px;display:flex;align-items:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          ${data.dia || ''} a las ${data.hora || ''}
        </p>
        <p style="font-size:0.82rem;color:#9a9590;margin-bottom:4px;display:flex;align-items:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          ${data.personas || ''} persona(s) · ${data.tipo === 'aqui' ? 'Comer aquí' : 'Para llevar'}
        </p>
        <p style="font-size:0.82rem;color:#9a9590;display:flex;align-items:flex-start;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;margin-top:2px;flex-shrink:0;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <span>${orderLinesHtml}</span>
        </p>
      </div>
      <button id="modal-close-btn" style="
        padding:12px 32px;background:var(--accent);color:#1a1714;
        border:none;border-radius:30px;font-weight:700;font-size:0.9rem;
        cursor:pointer;transition:transform 0.2s;
      ">Cerrar</button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      card.style.opacity = '1';
      card.style.transform = 'scale(1) translateY(0)';
    });

    // Close handler
    const closeModal = () => {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9) translateY(20px)';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 350);
    };

    card.querySelector('#modal-close-btn').onclick = closeModal;
    overlay.onclick = (ev) => { if (ev.target === overlay) closeModal(); };

    // Reset form and cart behind the modal
    cart = [];
    saveCart();
    form.reset();
    fp.clear();
    horaSelect.innerHTML = '<option value="" disabled selected>Selecciona primero un día</option>';
    if (hint) { hint.textContent = ''; }
    updateCustomSelect(horaSelect);
    updateCustomSelect(document.getElementById('personas'));
    if (selectedItemsContainer) selectedItemsContainer.innerHTML = '';
    if (orderTotalPriceEl) orderTotalPriceEl.textContent = '0,00 €';
    if (hiddenPedidoInput) hiddenPedidoInput.value = '';
    const textEl = document.getElementById('order-trigger-text');
    if (textEl) { textEl.textContent = 'Crea tu pedido...'; textEl.classList.remove('has-items'); }
  });
})();


// ===========================
// SCROLL REVEAL
// ===========================

(function () {
  const reveals = document.querySelectorAll(
    '.reservation-section, .cta-banner, .menu-page-hero, .menu-section, .footer'
  );

  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -30px 0px'
  });

  reveals.forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
})();
