/**
 * Trip Renderer - 抹茶山旅遊 PWA 模板渲染引擎
 * 載入 trip-data.json 並動態填充 DOM
 */
class TripRenderer {
  constructor(data) {
    this.data = data;
  }

  renderAll() {
    this.renderHero();
    this.renderWeatherTabs();
    this.renderItinerary();
    this.renderHotels();
    this.renderGuide();
    this.renderBudget();
    this.renderCalculatorMembers();
    this.renderHiking();
    this.renderChecklist();
    this.renderEmergency();
    this.renderNavigation();
    this.renderFooter();
    console.log('[TripRenderer] All sections rendered');
  }

  renderHero() {
    const h = this.data.hero;
    if (!h) return;
    const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    setHtml('hero-title', h.title);
    setHtml('hero-subtitle', h.subtitle);
    setHtml('hero-date', h.dateDisplay);
    setHtml('hero-info', h.infoHtml);
  }

  renderWeatherTabs() {
    const w = this.data.weather;
    if (!w || !w.tabs) return;
    const container = document.getElementById('weather-tabs');
    if (!container) return;
    container.innerHTML = w.tabs.map((tab, i) => `
      <button class="weather-tab ${i === 0 ? 'active' : ''}" onclick="showWeatherTab('${tab.id}')">
        <span class="weather-tab-icon">${tab.icon}</span>
        <span>${tab.label}</span>
      </button>
    `).join('');
  }

  renderItinerary() {
    const it = this.data.itinerary;
    if (!it || !it.days) return;

    const tabsContainer = document.getElementById('itinerary-tabs');
    const daysContainer = document.getElementById('itinerary-days');
    if (!tabsContainer || !daysContainer) return;

    // Render day tabs
    tabsContainer.innerHTML = `<div class="day-tabs">${it.days.map((day, i) => `
      <button class="day-tab ${i === 0 ? 'active' : ''}" onclick="showDay(${day.day})">
        <div class="day-tab-label">${day.label}</div>
        <div class="day-tab-date">${day.displayDate}</div>
      </button>
    `).join('')}</div>`;

    // Render day content
    daysContainer.innerHTML = it.days.map((day, i) => {
      let content = '';

      // Alert card
      if (day.alert && day.alert.html) {
        content += `<div class="info-card bg-matcha-gradient mb-1">
          <div class="info-card-content text-center" style="font-size: 0.9rem;">
            ${day.alert.icon || ''} ${day.alert.html}
          </div>
        </div>`;
      }

      if (day.hasTeams) {
        // Teams intro
        if (day.teamsIntroHtml) {
          content += `<div class="info-card bg-matcha-gradient mb-1">
            <div class="info-card-content text-center" style="font-size: 0.9rem;">
              ${day.teamsIntroHtml}
            </div>
          </div>`;
        }

        // Each team
        if (day.teams) {
          day.teams.forEach(team => {
            content += `<div class="subsection-title">${team.icon} ${team.name}行程</div>`;
            content += this._renderSchedule(team.schedule);
          });
        }

        // Combined
        if (day.combined) {
          content += `<div class="subsection-title">${day.combined.titleHtml}</div>`;
          content += this._renderSchedule(day.combined.schedule);
        }

        // Info cards
        if (day.infoCards) {
          day.infoCards.forEach(card => {
            content += `<div class="info-card" style="margin-top: 1rem;">
              <div class="info-card-header">
                <span class="info-card-title">${card.titleHtml}</span>
                ${card.badge ? `<span class="info-card-badge">${card.badge}</span>` : ''}
              </div>
              <div class="info-card-content" style="font-size: 0.85rem;">
                ${card.contentHtml}
              </div>
            </div>`;
          });
        }
      } else {
        // Simple schedule
        content += this._renderSchedule(day.schedule);
      }

      return `<div class="day-content ${i === 0 ? 'active' : ''}">${content}</div>`;
    }).join('');

    // Warning box at the end
    if (it.warningHtml) {
      daysContainer.innerHTML += `<div class="warning-box">
        <div class="warning-box-title">⚠️ 重要提醒</div>
        <div class="warning-box-content">${it.warningHtml}</div>
      </div>`;
    }
  }

  _renderSchedule(schedule) {
    if (!schedule || !schedule.length) return '';
    return schedule.map(item => `
      <div class="schedule-item">
        <span class="schedule-time">${item.time}</span>
        <div class="schedule-event">
          <div class="schedule-title">${item.titleHtml}</div>
          ${item.noteHtml ? `<div class="schedule-note">${item.noteHtml}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  renderHotels() {
    const hotels = this.data.hotels;
    if (!hotels) return;
    const container = document.getElementById('hotel-content');
    if (!container) return;

    container.innerHTML = hotels.map(hotel => {
      let html = `<div class="info-card">
        <div class="info-card-header">
          <span class="info-card-title">${hotel.name}</span>
          <span class="info-card-badge">${hotel.nightLabel}</span>
        </div>
        <div class="info-card-content">
          📞 <a href="tel:${hotel.phone.replace(/-/g, '')}">${hotel.phone}</a><br>
          🕐 Check-in ${hotel.checkIn} / Check-out ${hotel.checkOut}<br>`;

      if (hotel.roomType) {
        html += `🛏️ ${hotel.roomType}<br>`;
      }

      html += `💰 <strong>${hotel.price}</strong>${hotel.priceNote ? `（${hotel.priceNote}）` : ''}<br>`;
      html += `📋 訂單編號：${hotel.bookingId}<br>`;

      if (hotel.features && hotel.features.length) {
        html += hotel.features.map(f => `${f}<br>`).join('');
      }

      if (hotel.cancelPolicy) {
        html += `⚠️ <span style="color: var(--danger);">${hotel.cancelPolicy}</span>`;
      }

      if (hotel.extraInfo) {
        html += `<br>⭐ Google ${hotel.extraInfo.rating}★（${hotel.extraInfo.reviewCount} 則評論）`;
      }

      html += `</div>`;

      // Room allocation
      if (hotel.roomAllocation) {
        html += `<div class="info-card" style="margin-top: 0.75rem; background: var(--cream-dark);">
          <div class="info-card-content" style="font-size: 0.85rem;">
            <strong>房型分配</strong><br>
            ${hotel.roomAllocation.map(r => `🛏️ ${r.type}：${r.guests.join('、')}（${r.price}）`).join('<br>')}
          </div>
        </div>`;
      }

      // Navigation button
      if (hotel.mapQuery) {
        html += `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.mapQuery)}" target="_blank" rel="noopener noreferrer" class="nav-btn">📍 開啟 Google Maps 導航</a>`;
      }

      html += `</div>`;
      return html;
    }).join('');
  }

  renderGuide() {
    const guide = this.data.guide;
    if (!guide) return;
    const container = document.getElementById('guide-content');
    if (!container) return;

    // Tabs
    let html = `<div class="day-tabs">${guide.tabs.map((tab, i) => `
      <button class="day-tab ${i === 0 ? 'active' : ''}" onclick="showGuideTab(${i + 1})">
        <div class="day-tab-label">${tab.icon || ''}</div>
        <div class="day-tab-date">${tab.label || ''}</div>
      </button>
    `).join('')}</div>`;

    // Food tab
    html += `<div class="day-content active">`;
    if (guide.food) {
      // Reservations
      if (guide.food.reservations && guide.food.reservations.length) {
        html += `<div class="info-card bg-matcha-gradient">
          <div class="info-card-header">
            <span class="info-card-title">📝 已訂位餐廳</span>
          </div>
          <div class="info-card-content">
            ${guide.food.reservations.map((r, idx) => `<div${idx < guide.food.reservations.length - 1 ? ' style="margin-bottom: 0.5rem;"' : ''}>
              <strong>${r.name}</strong> ${r.date || ''} ${r.time || ''} ${r.guests || r.people || ''}人
              ${r.specialHtml ? `<br>${r.specialHtml}` : ''}
              ${r.mapQuery ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.mapQuery)}" target="_blank" rel="noopener noreferrer" class="nav-btn nav-btn-small">📍 導航</a>` : ''}
            </div>`).join('')}
          </div>
        </div>`;
      }

      // Restaurant groups
      if (guide.food.restaurantGroups) {
        guide.food.restaurantGroups.forEach(group => {
          html += `<div class="subsection-title">${group.title}</div>`;
          html += this._renderPlaceList(group.items);
        });
      }
    }
    html += `</div>`;

    // Spots tab
    html += `<div class="day-content">`;
    if (guide.spots) {
      if (guide.spots.recommended && guide.spots.recommended.length) {
        html += `<div class="subsection-title">✨ 額外推薦（可彈性加入）</div>`;
        html += this._renderPlaceList(guide.spots.recommended, 'spot');
      }
      if (guide.spots.rainyDay && guide.spots.rainyDay.length) {
        html += `<div class="subsection-title">🌧️ 雨天備案</div>`;
        html += this._renderPlaceList(guide.spots.rainyDay, 'spot');
      }
    }
    html += `</div>`;

    // Gifts tab
    html += `<div class="day-content">`;
    if (guide.gifts) {
      if (guide.gifts.topPicks && guide.gifts.topPicks.length) {
        html += `<div class="subsection-title">🏆 必買 Top 3</div>`;
        html += this._renderPlaceList(guide.gifts.topPicks, 'gift');
      }
      if (guide.gifts.buyLocations && guide.gifts.buyLocations.length) {
        html += `<div class="subsection-title">🛒 購買地點</div>`;
        html += this._renderPlaceList(guide.gifts.buyLocations, 'gift');
      }
      if (guide.gifts.warningsHtml) {
        html += `<div class="warning-box" style="margin-top: 0.75rem;">
          <div class="warning-box-title">💡 攜帶提醒</div>
          <div class="warning-box-content">${guide.gifts.warningsHtml}</div>
        </div>`;
      }
    }
    html += `</div>`;

    container.innerHTML = html;
  }

  _renderPlaceList(items, rankClass) {
    if (!items || !items.length) return '';
    return items.map(item => {
      const rankCls = rankClass ? `place-rank ${rankClass}` : 'place-rank';
      return `<div class="place-item">
        <span class="${rankCls}">${item.rank}</span>
        <div class="place-info">
          <div class="place-name">${item.name}</div>
          <div class="place-tag">${item.tag || item.tagsHtml || ''}</div>
        </div>
        ${item.rating ? `<span class="place-rating">${item.rating}</span>` : ''}
        ${item.mapQuery ? `<div class="place-nav">
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}" target="_blank" rel="noopener noreferrer" title="導航">📍</a>
        </div>` : ''}
      </div>`;
    }).join('');
  }

  renderBudget() {
    const budget = this.data.budget;
    if (!budget) return;
    const container = document.getElementById('budget-content');
    if (!container) return;

    let html = '';

    // Note card
    if (budget.noteHtml) {
      html += `<div class="info-card bg-matcha-gradient mb-1">
        <div class="info-card-content" style="font-size: 0.85rem; text-align: center;">
          ${budget.noteHtml}
        </div>
      </div>`;
    }

    // Budget groups
    if (budget.groups) {
      budget.groups.forEach(group => {
        html += `<div class="budget-section">
          <div class="budget-title">${group.title}</div>
          <div class="budget-items">
            ${group.items.map(item => `<div class="budget-row">
              <span>${item.item || item.label || item.type || ''}</span>
              <span class="budget-amount">${item.amount || ''}</span>
            </div>`).join('')}
          </div>
        </div>`;
      });
    }

    // Total card
    if (budget.total) {
      const totalEntries = Array.isArray(budget.total.items)
        ? budget.total.items.map(item => ({ label: item.label || '', value: item.value || '' }))
        : Object.entries(budget.total).map(([label, value]) => ({ label, value }));

      html += `<div class="budget-total">
        <div class="budget-total-title">📊 人均總計</div>
        <div class="budget-total-grid">
          ${totalEntries.map(item => `<div class="budget-total-item">
            <span class="budget-total-label">${item.label}</span>
            <span class="budget-total-value">${item.value}</span>
          </div>`).join('')}
        </div>
      </div>`;
    }

    // Warning
    if (budget.noteWarningHtml) {
      html += `<div class="warning-box" style="margin-top: 0.75rem;">
        <div class="warning-box-title">💡 分帳說明</div>
        <div class="warning-box-content">${budget.noteWarningHtml}</div>
      </div>`;
    }

    container.innerHTML = html;
  }

  renderCalculatorMembers() {
    const members = this.data.calculator && this.data.calculator.members;
    if (!members || !members.length) return;

    // Populate payer select
    const payerSelect = document.getElementById('expensePayer');
    if (payerSelect) {
      payerSelect.innerHTML = members.map(m => `<option value="${m}">${m}</option>`).join('');
    }

    // Populate split checkboxes
    const splitContainer = document.getElementById('split-checkboxes');
    if (splitContainer) {
      splitContainer.innerHTML = members.map(m =>
        `<label class="split-checkbox"><input type="checkbox" value="${m}" checked> ${m}</label>`
      ).join('');
    }
  }

  renderHiking() {
    const hiking = this.data.hiking;
    if (!hiking) return;
    const container = document.getElementById('hike-guide-content');
    if (!container) return;

    // Tabs
    let html = `<div class="day-tabs">${hiking.tabs.map((tab, i) => `
      <button class="day-tab ${i === 0 ? 'active' : ''}" onclick="showHikeTab(${i + 1})">
        <div class="day-tab-label">${tab.icon || ''}</div>
        <div class="day-tab-date">${tab.label || ''}</div>
      </button>
    `).join('')}</div>`;

    // Route tab
    html += `<div class="day-content active">`;
    if (hiking.route) {
      const r = hiking.route;
      // Summary card
      if (r.summary) {
        const summaryContent = typeof r.summary === 'string'
          ? r.summary
          : `📍 ${r.summary.path || ''}<br><strong>${r.summary.distance || ''}</strong> ・ 爬升 <strong>${r.summary.elevation || ''}</strong> ・ <strong>${r.summary.duration || ''}</strong>`;
        const mapQuery = r.mapQuery || '五峰旗停車場';
        html += `<div class="info-card">
          <div class="info-card-content text-center">
            ${summaryContent}
          </div>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}" target="_blank" rel="noopener noreferrer" class="nav-btn" style="display: block; text-align: center;">📍 導航至登山口</a>
        </div>`;
      }

      // Checkpoint table
      if (r.checkpoints && r.checkpoints.length) {
        html += `<table class="checkpoint-table">
          <thead><tr><th>時間</th><th>地點</th><th>撤退時間</th><th>💧</th></tr></thead>
          <tbody>
            ${r.checkpoints.map(cp => `<tr>
              <td>${cp.time}</td>
              <td>${cp.location}</td>
              <td>${(cp.retreat || cp.retreatTime) ? `<span class="retreat-warning">${cp.retreat || cp.retreatTime}</span>` : '--'}</td>
              <td>${cp.water || (cp.hasWater ? '✅' : '❌')}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
      }

      // Essential gear
      if (r.essentialGear && r.essentialGear.length) {
        html += `<h4 style="margin: 1rem 0 0.75rem; color: var(--matcha-dark);">✅ 必備裝備</h4>`;
        html += `<div class="checklist">${r.essentialGear.map(gear =>
          `<label class="checklist-item" onclick="toggleCheck(this, event)">
            <input type="checkbox">
            <span class="checklist-box">✓</span>
            <span>${gear}</span>
          </label>`
        ).join('')}</div>`;
      }

      // Route warning
      if (r.warningHtml) {
        html += `<div class="warning-box">
          <div class="warning-box-title">⚠️ 路況提醒</div>
          <div class="warning-box-content">${r.warningHtml}</div>
        </div>`;
      }
    }
    html += `</div>`;

    // Safety tab (raw HTML)
    html += `<div class="day-content">${hiking.safetyHtml || ''}</div>`;

    // Ecology tab (raw HTML)
    html += `<div class="day-content">${hiking.ecologyHtml || ''}</div>`;

    container.innerHTML = html;
  }

  renderChecklist() {
    const cl = this.data.checklist;
    if (!cl) return;
    const container = document.getElementById('checklist-content');
    if (!container) return;

    let html = '';

    // Countdown
    html += `<div class="info-card bg-warm-gradient">
      <div class="info-card-content" style="text-align: center; font-size: 1rem; font-weight: 600;" id="countdown-display">
        ⏱️ 距出發還有：<strong>-- 天</strong><br>
        <span style="font-size: 0.85rem; font-weight: 400;">載入中...</span>
      </div>
    </div>`;

    // Completed items
    if (cl.completed && cl.completed.length) {
      html += `<div class="subsection-title">✅ 已完成</div>`;
      html += `<div class="checklist">${cl.completed.map(item => {
        const label = typeof item === 'string' ? item : (item.label || item.text || '');
        return `<label class="checklist-item checked">
          <input type="checkbox" checked>
          <span class="checklist-box">✓</span>
          <span>${label}</span>
        </label>`;
      }).join('')}</div>`;
    }

    // Pending items
    if (cl.pending && cl.pending.length) {
      html += `<div class="subsection-title">📋 待完成</div>`;
      html += `<div class="checklist">${cl.pending.map(item => {
        const label = typeof item === 'string' ? item : (item.label || item.text || '');
        return `<label class="checklist-item" onclick="toggleCheck(this, event)">
          <input type="checkbox">
          <span class="checklist-box">✓</span>
          <span>${label}</span>
        </label>`;
      }).join('')}</div>`;
    }

    // Weather warning
    const warnings = cl.warningsHtml;
    if (warnings) {
      const warningContent = typeof warnings === 'string'
        ? warnings
        : `${(warnings.items || []).map(x => x).join('<br>')}`;
      const warningTitle = (typeof warnings === 'object' && warnings.title) || '❄️ 冬季登山提醒';
      html += `<div class="warning-box" style="margin-top: 1rem;">
        <div class="warning-box-title">${warningTitle}</div>
        <div class="warning-box-content">${warningContent}</div>
      </div>`;
    }

    // Rainy plan
    const rainyPlan = cl.rainyPlanHtml;
    if (rainyPlan) {
      let rainyContent;
      if (typeof rainyPlan === 'string') {
        rainyContent = rainyPlan;
      } else {
        const conditions = (rainyPlan.conditions || []).map(c => `• ${c}`).join('<br>');
        const alternatives = (rainyPlan.alternatives || []).join('<br>');
        rainyContent = `若出發前 3 天預報顯示：<br>${conditions}<br><br>${alternatives}`;
      }
      html += `<div class="info-card" style="margin-top: 0.75rem;">
        <div class="info-card-header">
          <span class="info-card-title">${(typeof rainyPlan === 'object' && rainyPlan.title) || '🌧️ 雨天備案啟動條件'}</span>
        </div>
        <div class="info-card-content" style="font-size: 0.85rem;">
          ${rainyContent}
        </div>
      </div>`;
    }

    container.innerHTML = html;
  }

  renderEmergency() {
    const em = this.data.emergency;
    if (!em) return;
    const section = document.getElementById('section-emergency');
    if (!section) return;
    const content = section.querySelector('.section-content');
    if (!content) return;

    const officialContactsHtml = (em.officialContacts || []).map(c => {
      const phoneClean = String(c.phone).replace(/[^0-9+\-]/g, '');
      const style = (c.isDanger || c.isUrgent) ? ' style="color: var(--danger); font-size: 1.1rem;"' : '';
      return `<div class="contact-item">
        <span class="contact-name">${c.name}</span>
        <a href="tel:${phoneClean}" class="contact-phone"${style}>${c.phone}</a>
      </div>`;
    }).join('');

    content.innerHTML = `
      <div class="emergency-card">
        <div class="emergency-title">👤 留守人</div>
        <div class="emergency-content" id="guardian-contact">
          <span style="color: #888;">🔐 登入後顯示...</span>
        </div>
      </div>

      <h4 style="margin: 0.75rem 0; color: var(--matcha-dark);">👥 隊員聯絡</h4>
      <div class="contact-grid" id="team-contacts">
        <div style="grid-column: 1/-1; text-align: center; color: #888; padding: 1rem;">
          🔐 登入後顯示聯絡資訊...
        </div>
      </div>

      <h4 style="margin: 1rem 0 0.75rem; color: var(--matcha-dark);">📞 緊急電話</h4>
      <div class="contact-grid">${officialContactsHtml}</div>

      ${em.safetyReportHtml ? `
        <div class="info-card" style="margin-top: 1rem;">
          <div class="info-card-header">
            <span class="info-card-title">📍 安全回報時間</span>
          </div>
          <div class="info-card-content">${em.safetyReportHtml}</div>
        </div>
      ` : ''}
    `;
  }

  renderNavigation() {
    const nav = this.data.navigation;
    if (!nav) return;

    // Render dock
    if (nav.dock) {
      const dock = document.getElementById('matcha-dock');
      if (dock) {
        dock.innerHTML = nav.dock.map(item => {
          if (item.action === 'scrollTop') {
            return `<a href="#" class="matcha-dock-item" onclick="window.scrollTo({top: 0, behavior: 'smooth'}); return false;">
              <span class="matcha-dock-icon">${item.icon}</span>
              <span>${item.label}</span>
            </a>`;
          } else if (item.action === 'scrollToSection') {
            return `<a href="#${item.target}" class="matcha-dock-item" onclick="scrollToSection(event, '${item.target}')">
              <span class="matcha-dock-icon">${item.icon}</span>
              <span>${item.label}</span>
            </a>`;
          } else if (item.action === 'toggleMenu') {
            return `<div class="matcha-dock-item" onclick="toggleMenu()">
              <span class="matcha-dock-icon">${item.icon}</span>
              <span>${item.label}</span>
            </div>`;
          }
          return '';
        }).join('');
      }
    }

    // Render menu grid
    if (nav.menu) {
      const menuGrid = document.getElementById('menu-grid');
      if (menuGrid) {
        menuGrid.innerHTML = nav.menu.map(item => {
          let onclick = '';
          if (item.action === 'scrollToSection') {
            onclick = `scrollToSection(event, '${item.target}')`;
          } else if (item.action === 'navigateToTab') {
            onclick = `navigateToTab('${item.target}', ${item.tabIndex})`;
          }
          return `<a class="menu-item" onclick="${onclick}">
            <span class="menu-item-icon">${item.icon}</span>
            <span class="menu-item-label">${item.label}</span>
          </a>`;
        }).join('');
      }
    }
  }

  renderFooter() {
    const f = this.data.footer;
    if (!f) return;
    const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    setHtml('footer-wish', f.wish);
    setHtml('footer-copyright', f.copyright);
  }
}

// === Auto-load trip data ===
(async function initTripRenderer() {
  if (window._tripRendererInitialized) return;
  window._tripRendererInitialized = true;

  try {
    const response = await fetch('./trip-data.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Failed to load trip-data.json: ${response.status}`);
    const data = await response.json();

    // Set global data
    window.TRIP_DATA = data;

    // Render when DOM is ready
    const doRender = () => {
      const renderer = new TripRenderer(data);
      renderer.renderAll();
      window.tripRenderer = renderer;

      // Dispatch event AFTER rendering so DOM containers (like countdown-display) exist
      window.dispatchEvent(new CustomEvent('trip-data-loaded', { detail: data }));

      console.log('[TripRenderer] trip-data.json loaded, tripId:', data.tripId);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', doRender);
    } else {
      doRender();
    }
  } catch (error) {
    console.error('[TripRenderer] Failed to initialize:', error);
  }
})();
