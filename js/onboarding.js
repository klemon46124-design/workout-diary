// ============ ОНБОРДИНГ — ПЕРВЫЙ ЗАПУСК ============
// Этот файл управляет экраном первого входа для новых пользователей
// Подключается через тег <script> в index.html

window.showOnboarding = function() {
  // Если онбординг уже пройден — не показываем
  if (state.onboardingDone) return;

  const overlay = document.createElement('div');
  overlay.id = 'onboarding-overlay';
  overlay.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;
    background:var(--hdr);z-index:300;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    padding:24px;overflow-y:auto;
  `;

  overlay.innerHTML = `
    <div style="width:100%;max-width:340px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:48px;margin-bottom:12px">💪</div>
        <h1 style="color:#fff;font-size:22px;font-weight:700;margin-bottom:6px">Добро пожаловать!</h1>
        <p style="color:#aaaacc;font-size:13px;line-height:1.5">Настроим дневник под тебя — это займёт 1 минуту</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px">

        <div>
          <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px">Как тебя зовут?</label>
          <input id="ob-name" class="login-input" type="text" placeholder="Имя" autocomplete="name">
        </div>

        <div>
          <label style="color:#aaa;font-size:12px;display:block;margin-bottom:6px">Цель по весу (кг)</label>
          <input id="ob-goal-weight" class="login-input" type="number" inputmode="decimal" placeholder="например 90">
        </div>

        <div style="background:rgba(255,255,255,.06);border-radius:10px;padding:14px">
          <div style="color:#fff;font-size:13px;font-weight:600;margin-bottom:10px">Стартовые веса на базовых</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="color:#aaa;font-size:12px;flex:1">Присед</span>
              <input id="ob-squat" class="login-input" type="number" inputmode="decimal" placeholder="кг" style="width:80px;padding:8px;text-align:center">
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="color:#aaa;font-size:12px;flex:1">Становая тяга</span>
              <input id="ob-deadlift" class="login-input" type="number" inputmode="decimal" placeholder="кг" style="width:80px;padding:8px;text-align:center">
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="color:#aaa;font-size:12px;flex:1">Жим лёжа</span>
              <input id="ob-bench" class="login-input" type="number" inputmode="decimal" placeholder="кг" style="width:80px;padding:8px;text-align:center">
            </div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,.06);border-radius:10px;padding:14px">
          <div style="color:#fff;font-size:13px;font-weight:600;margin-bottom:8px">Тренировочная программа</div>
          <div style="color:#aaa;font-size:12px;line-height:1.5">Фулбади 3 раза в неделю — Пн/Ср/Пт<br>5×5 на базовых + вспомогательные</div>
        </div>

        <div id="ob-err" style="color:#ff6b6b;font-size:12px;text-align:center;min-height:16px"></div>

        <button class="login-btn login-btn-main" onclick="completeOnboarding()" style="margin-top:4px">
          Начать тренировки →
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
};

window.completeOnboarding = function() {
  const name = document.getElementById('ob-name')?.value?.trim();
  const goalWeight = parseFloat(document.getElementById('ob-goal-weight')?.value);
  const squat = parseFloat(document.getElementById('ob-squat')?.value) || 60;
  const deadlift = parseFloat(document.getElementById('ob-deadlift')?.value) || 80;
  const bench = parseFloat(document.getElementById('ob-bench')?.value) || 60;

  if (!name) {
    document.getElementById('ob-err').textContent = 'Введи своё имя';
    return;
  }

  // Сохраняем профиль пользователя
  state.profile = {
    name,
    goalWeight: goalWeight || 90,
    startWeights: { squat, deadlift, bench },
  };
  state.onboardingDone = true;

  // Обновляем плановые веса под пользователя
  updatePlanForUser(squat, deadlift, bench);

  // Убираем оверлей
  document.getElementById('onboarding-overlay')?.remove();

  scheduleSave();
  updateSummary();
  renderTabs();
  renderDiary();
};

function updatePlanForUser(squat, deadlift, bench) {
  // Обновляем PLAN под стартовые веса пользователя
  // Прогрессия: +2.5 кг каждую тренировку
  window.PLAN = [
    ['1', squat+' кг', deadlift+' кг', bench+' кг', ''],
    ['2', squat+' кг', (deadlift+2.5)+' кг', bench+' кг', ''],
    ['3', (squat+2.5)+' кг', (deadlift+5)+' кг', (bench+2.5)+' кг', ''],
    ['4', (squat+5)+' кг', (deadlift+7.5)+' кг', (bench+5)+' кг', 'pr'],
    ['5+', (squat+7.5)+' кг', (deadlift+10)+' кг', (bench+7.5)+' кг', 'pr'],
  ];
}
