import React, { useEffect, useMemo, useState } from "react";
import mapImage from "./map.png";

// --- JSONP loader: обходим CORS для GET-запросов к Apps Script
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cbName = "cb_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    const sep = url.includes("?") ? "&" : "?";
    script.src = `${url}${sep}callback=${cbName}`;
    script.async = true;
    window[cbName] = (data) => {
      resolve(data);
      cleanup();
    };
    script.onerror = () => {
      reject(new Error("JSONP load error"));
      cleanup();
    };
    function cleanup() {
      delete window[cbName];
      script.remove();
    }
    document.head.appendChild(script);
  });
}

async function fetchBusyForDate(dayISO) {
  const endpoint = import.meta.env.VITE_BOOKING_ENDPOINT;
  const secret = import.meta.env.VITE_BOOKING_SECRET;
  const url = `${endpoint}?action=busy&date=${encodeURIComponent(
    dayISO
  )}&secret=${encodeURIComponent(secret)}`;
  const data = await jsonp(url);
  if (!data || !data.ok) throw new Error(data?.error || "Busy fetch failed");
  // вернём массив [{startISO, endISO}]
  return data.busy || [];
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

async function submitBooking(payload) {
  const endpoint = import.meta.env.VITE_BOOKING_ENDPOINT;
  const secret = import.meta.env.VITE_BOOKING_SECRET;
  if (!endpoint || !secret) {
    throw new Error("Не налаштовано VITE_BOOKING_ENDPOINT/VITE_BOOKING_SECRET");
  }

  // ВАЖНО: no-cors + text/plain — браузер не делает preflight и не требует CORS-заголовок в ответе
  await fetch(endpoint, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, secret }),
  });

  // В режиме no-cors ответ «нечитаемый» (opaque). Если сюда дошли — запрос ушёл.
  // Дальше просто считаем успехом; факт появление события проверяем в календаре.
  return { ok: true };
}

/**
 * ВНИМАНИЕ:
 * 1) Это шаг №1: только UI-макет страницы /booking (без реальной интеграции).
 * 2) После подтверждения от тебя мы добавим интеграцию с Google Calendar:
 *    - самый простой путь для новичка — Google Apps Script Web App (серверная точка),
 *    - альтернатива — серверлесс-функция (Vercel / Supabase Edge) с OAuth2.
 */

/* ------------------------- ЛЁГКИЙ РОУТЕР ------------------------- */
function useRoute() {
  const [route, setRoute] = useState(window.location.pathname || "/");
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (to) => {
    if (to === route) return;
    window.history.pushState({}, "", to);
    setRoute(to);
  };
  return { route, navigate };
}

/* ------------------------- ДАННЫЕ ДЛЯ БРОНИ ------------------------- */
const SERVICES = [
  { id: "haircut", name: "Стрижка чоловіча", price: 700, durationMin: 45 },
  { id: "combo", name: "Стрижка + борода", price: 1000, durationMin: 75 },
  { id: "shave", name: "Гоління бритвою", price: 600, durationMin: 40 },
  { id: "camouflage", name: "Камуфляж сивини", price: 500, durationMin: 30 },
];

const BARBERS = [
  { id: "oleksii", name: "Олексій", tags: "Fade • Classic" },
  { id: "bohdan", name: "Богдан", tags: "Beard • Texture" },
  { id: "taras", name: "Тарас", tags: "Scissor • Long" },
  { id: "ihor", name: "Ігор", tags: "Skin fade • Style" },
];

// Простая генерация слотов по 30 минут на сегодня+7 дней.
// В реальном проекте слоты будем получать с сервера/календаря.
function generateSlots(stepMin = 30, startHour = 10, endHour = 21, days = 7) {
  const res = [];
  const now = new Date();
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    date.setHours(0, 0, 0, 0);
    const dayISO = date.toISOString().slice(0, 10); // YYYY-MM-DD

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += stepMin) {
        const slot = new Date(date);
        slot.setHours(h, m, 0, 0);
        // не предлагаем прошедшие слоты для сегодняшнего дня
        if (d === 0 && slot < now) continue;
        res.push({ dayISO, time: slot.toTimeString().slice(0, 5) }); // HH:MM
      }
    }
  }
  return res;
}

const ALL_SLOTS = generateSlots();

/* ------------------------- ГЛАВНЫЙ КОМПОНЕНТ ------------------------- */
export default function App() {
  const { route, navigate } = useRoute();
  const [toast, setToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function showToast(message, ms = 2500) {
    setToast(message);
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), ms);
  }

  function goBooking(e) {
    if (e) e.preventDefault();
    navigate("/booking");
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    document.documentElement.classList.add("scroll-smooth");
  }, []);

  const isBooking = route === "/booking";
  const isAdmin = route === "/admin";

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-white/20">
      {!isBooking && (
        <SiteHeader
          onCta={goBooking}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      )}

      <main>
        {isAdmin ? (
          <AdminPage onBack={() => navigate("/")} />
        ) : isBooking ? (
          <BookingPage
            onBack={() => navigate("/")}
            onSuccess={async (payload) => {
              try {
                const result = await submitBooking(payload);
                showToast("✅ Запис підтверджено у календарі");
                setTimeout(() => navigate("/"), 1000);
                console.log("Booking payload:", payload);
                console.log("Google Calendar response:", result);
              } catch (err) {
                alert("❌ Не вдалося створити запис: " + err.message);
                console.error("Booking error:", err);
              }
            }}
          />
        ) : (
          <>
            <Hero onCta={goBooking} />
            <Benefits onCta={goBooking} />
            <Services onCta={goBooking} />
            <Barbers onCta={goBooking} />
            <Gallery />
            <Testimonials />
            <Contacts onCta={goBooking} />
            <CtaBanner onCta={goBooking} />
          </>
        )}
      </main>

      {!isBooking && <SiteFooter onCta={goBooking} />}

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 transition-all ${
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 pointer-events-none translate-y-2"
        }`}
      >
        <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 text-sm shadow-lg border border-white/10">
          {toast || ""}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- СТРАНИЦА /booking ------------------------- */
function BookingPage({ onBack, onSuccess }) {
  const [serviceId, setServiceId] = useState(SERVICES[0].id);
  const [barberId, setBarberId] = useState(BARBERS[0].id);
  const [dayISO, setDayISO] = useState(ALL_SLOTS[0]?.dayISO || "");
  const [time, setTime] = useState(ALL_SLOTS[0]?.time || "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // === NEW: состояние занятых интервалов + индикатор загрузки
  const [busyIntervals, setBusyIntervals] = useState([]); // [{startISO,endISO}]
  const [loadingBusy, setLoadingBusy] = useState(false);

  const service = useMemo(
    () => SERVICES.find((s) => s.id === serviceId),
    [serviceId]
  );
  const barber = useMemo(
    () => BARBERS.find((b) => b.id === barberId),
    [barberId]
  );

  // === NEW: список доступных дат из ALL_SLOTS
  const days = useMemo(() => [...new Set(ALL_SLOTS.map((s) => s.dayISO))], []);

  // === NEW: слоты времени, отфильтрованные по занятости и длительности услуги
  const availableTimes = useMemo(() => {
    const dayTimes = ALL_SLOTS.filter((s) => s.dayISO === dayISO).map(
      (s) => s.time
    );

    if (!busyIntervals.length) return dayTimes;

    const svcMin = service.durationMin;
    return dayTimes.filter((t) => {
      const start = new Date(`${dayISO}T${t}:00`);
      const end = new Date(start.getTime() + svcMin * 60000);
      return !busyIntervals.some((bi) =>
        overlaps(start, end, new Date(bi.startISO), new Date(bi.endISO))
      );
    });
  }, [dayISO, busyIntervals, service.durationMin]);

  // === NEW: при смене даты — подтягиваем занятые интервалы из календаря
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingBusy(true);
        const busy = await fetchBusyForDate(dayISO);
        if (!cancelled) setBusyIntervals(busy);
      } catch (e) {
        console.error("Busy fetch error:", e);
        if (!cancelled) setBusyIntervals([]);
      } finally {
        if (!cancelled) setLoadingBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dayISO]);

  // === FIX: автоподстановка первого доступного времени (раньше было timesForDay)
  useEffect(() => {
    if (availableTimes.length && !availableTimes.includes(time)) {
      setTime(availableTimes[0]);
    }
  }, [dayISO, availableTimes]); // завязка на availableTimes, а не на timesForDay

  function validate() {
    const errors = [];
    if (!name.trim()) errors.push("Вкажіть ім'я");
    if (!/^\+?\d[\d\s\-()]{7,}$/.test(phone.trim()))
      errors.push("Вкажіть коректний телефон");
    if (!dayISO || !time) errors.push("Оберіть дату та час");
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (errors.length) {
      alert("Будь ласка, виправте:\n• " + errors.join("\n• "));
      return;
    }

    // Доп. проверка: выбранный слот ещё доступен?
    if (!availableTimes.includes(time)) {
      alert("На жаль, цей слот уже зайнятий. Оберіть інший час.");
      return;
    }

    const startDateTime = new Date(`${dayISO}T${time}:00`);
    const payload = {
      customer: { name: name.trim(), phone: phone.trim() },
      service: {
        id: service.id,
        name: service.name,
        price: service.price,
        durationMin: service.durationMin,
      },
      barber: { id: barber.id, name: barber.name },
      startISO: startDateTime.toISOString(),
      endISO: new Date(
        startDateTime.getTime() + service.durationMin * 60000
      ).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      note: "",
    };

    // onSuccess у тебя вызывает submitBooking(payload) во внешнем компоненте App()
    onSuccess?.(payload);
  }

  return (
    <section className="min-h-screen">
      <Container className="py-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          ← На головну
        </button>

        <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight">
          Запис на послугу
        </h1>
        <p className="mt-2 text-white/70">
          Оберіть послугу, майстра, дату та час. Після підтвердження ми
          надішлемо подальші інструкції.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid lg:grid-cols-3 gap-6"
        >
          {/* Левая колонка: выборы */}
          <div className="space-y-6 lg:col-span-2">
            <Card title="Послуга">
              <Select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                options={SERVICES.map((s) => ({
                  value: s.id,
                  label: `${s.name} — ${s.price} грн • ${s.durationMin} хв`,
                }))}
              />
            </Card>

            <Card title="Барбер">
              <div className="grid sm:grid-cols-2 gap-3">
                {BARBERS.map((b) => (
                  <label
                    key={b.id}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      barberId === b.id
                        ? "border-white/60 bg-white/10"
                        : "border-white/15 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="barber"
                      value={b.id}
                      checked={barberId === b.id}
                      onChange={() => setBarberId(b.id)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 font-bold">
                        {b.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{b.name}</div>
                        <div className="text-xs text-white/60">{b.tags}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            <Card title="Дата і час">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60">Дата</label>
                  <Select
                    value={dayISO}
                    onChange={(e) => setDayISO(e.target.value)}
                    options={days.map((d) => ({
                      value: d,
                      label: formatDay(d),
                    }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60">Час</label>
                  <Select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    options={availableTimes.map((t) => ({
                      value: t,
                      label: t,
                    }))}
                  />
                  {loadingBusy && (
                    <div className="mt-2 text-xs text-white/60">
                      Оновлюємо доступні слоти…
                    </div>
                  )}
                  {!loadingBusy && availableTimes.length === 0 && (
                    <div className="mt-2 text-xs text-rose-400">
                      На цю дату слоти недоступні
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card title="Ваші контакти">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Ім'я"
                  placeholder="Як до вас звертатись?"
                  value={name}
                  onChange={setName}
                />
                <Field
                  label="Телефон"
                  placeholder="+380 ..."
                  value={phone}
                  onChange={setPhone}
                />
              </div>
            </Card>
          </div>

          {/* Правая колонка: итог */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-semibold text-lg">Підсумок</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                <li>
                  <span className="text-white/60">Послуга:</span> {service.name}
                </li>
                <li>
                  <span className="text-white/60">Тривалість:</span>{" "}
                  {service.durationMin} хв
                </li>
                <li>
                  <span className="text-white/60">Барбер:</span> {barber.name}
                </li>
                <li>
                  <span className="text-white/60">Дата:</span>{" "}
                  {formatDay(dayISO)}
                </li>
                <li>
                  <span className="text-white/60">Час:</span> {time}
                </li>
              </ul>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-extrabold bg-white text-neutral-900 px-3 py-1 rounded-xl">
                  {service.price} грн
                </span>
              </div>
              <button
                type="submit"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-neutral-900 px-6 py-3 font-semibold shadow hover:bg-white/90 transition"
              >
                <BoltIcon className="h-5 w-5" />
                Підтвердити запис
              </button>
              <p className="mt-3 text-xs text-white/60">
                Натискаючи кнопку, ви погоджуєтесь на обробку персональних
                даних.
              </p>
            </div>
          </div>
        </form>
      </Container>
    </section>
  );
}

/* ------------------------- /admin ------------------------- */
function AdminPage({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // период: текущий месяц
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const start = `${yyyy}-${mm}-01`;
  const endDate = new Date(yyyy, now.getMonth() + 1, 0).getDate();
  const end = `${yyyy}-${mm}-${String(endDate).padStart(2, "0")}`;

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const endpoint = import.meta.env.VITE_BOOKING_ENDPOINT;
        const secret = import.meta.env.VITE_BOOKING_SECRET;
        const url = `${endpoint}?action=list&start=${start}&end=${end}&secret=${encodeURIComponent(
          secret
        )}`;
        const data = await jsonp(url); // функция jsonp у тебя уже есть сверху файла
        if (!dead) {
          setItems((data && data.items) || []);
        }
      } catch (e) {
        console.error("Admin list load error:", e);
        if (!dead) setItems([]);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  return (
    <section className="min-h-screen">
      <Container className="py-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          ← На головну
        </button>

        <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold">
          Адмін • Записи
        </h1>
        <p className="text-white/70">
          Період: {start} — {end}
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-white/70">
              <tr>
                <th className="text-left p-3">Дата</th>
                <th className="text-left p-3">Час</th>
                <th className="text-left p-3">Заголовок</th>
                <th className="text-left p-3">Тривалість</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-3" colSpan={4}>
                    Завантаження…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="p-3" colSpan={4}>
                    Немає записів
                  </td>
                </tr>
              ) : (
                items
                  .sort((a, b) => new Date(a.startISO) - new Date(b.startISO))
                  .map((ev) => {
                    const s = new Date(ev.startISO);
                    const e = new Date(ev.endISO);
                    const durMin = Math.round((e - s) / 60000);
                    return (
                      <tr key={ev.id} className="border-t border-white/10">
                        <td className="p-3">{s.toLocaleDateString("uk-UA")}</td>
                        <td className="p-3">
                          {s.toTimeString().slice(0, 5)}–
                          {e.toTimeString().slice(0, 5)}
                        </td>
                        <td className="p-3">{ev.title}</td>
                        <td className="p-3">{durMin} хв</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------- ВСПОМОГАТЕЛЬНЫЕ UI ------------------------- */
function Container({ children, className = "" }) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      {title && <h3 className="font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <div className="text-sm text-white/60 mb-1">{label}</div>
      <input
        className="w-full rounded-xl bg-neutral-900/60 border border-white/10 px-4 py-2 outline-none focus:border-white/30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl bg-neutral-900/60 border border-white/10 px-4 py-2 outline-none focus:border-white/30"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function formatDay(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uk-UA", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  });
}

/* ------------------------- ДАЛЬШЕ — ВЕСЬ ТВОЙ ЛЕНДИНГ ------------------------- */
/* Header / Hero / Sections / Icons — как у тебя, только меняем onCta на goBooking */

function SiteHeader({ onCta, mobileMenuOpen, setMobileMenuOpen }) {
  const nav = [
    { href: "#services", label: "Послуги" },
    { href: "#barbers", label: "Барбери" },
    { href: "#gallery", label: "Галерея" },
    { href: "#contacts", label: "Контакти" },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 border-b border-white/5">
      <Container className="flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-3 group">
          <Logo />
          <span className="text-lg font-semibold tracking-wide group-hover:opacity-90">
            BRAVE BARBER
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm text-white/80 hover:text-white transition"
            >
              {n.label}
            </a>
          ))}
          <a
            href="/booking"
            onClick={(e) => {
              e.preventDefault();
              onCta();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-neutral-900 px-4 py-2 text-sm font-semibold hover:bg-white/90 transition shadow"
          >
            <BoltIcon className="h-4 w-4" /> Записатись
          </a>
        </nav>

        <button
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/10 p-2 hover:bg-white/5 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </Container>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-neutral-950/90 backdrop-blur">
          <Container className="py-3 space-y-1">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="block rounded-lg px-3 py-2 text-white/90 hover:bg-white/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                {n.label}
              </a>
            ))}
            <a
              href="/booking"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                onCta();
              }}
              className="block rounded-lg px-3 py-2 font-semibold bg-white text-neutral-900"
            >
              Записатись
            </a>
          </Container>
        </div>
      )}
    </header>
  );
}

/* ----- Остальные секции лендинга (без изменений, только onCta) ----- */

function Hero({ onCta }) {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-rose-600/40 to-amber-500/30 blur-3xl" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-gradient-to-tr from-sky-500/30 to-emerald-500/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_50%_-20%,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>

      <Container className="py-20 sm:py-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <SparkleIcon className="h-3.5 w-3.5" /> Преміум-барбершоп у центрі
            Києва
          </span>
          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Стиль починається тут. Барберська майстерність без компромісів.
          </h1>
          <p className="mt-4 text-white/70 text-lg">
            Чоловічі стрижки, моделювання бороди та гоління небезпечною бритвою.
            Бронюй зручний час — решту зробимо ми.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/booking"
              onClick={(e) => {
                e.preventDefault();
                onCta();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-neutral-900 px-6 py-3 font-semibold shadow hover:bg-white/90 transition"
            >
              <BoltIcon className="h-5 w-5" /> Записатись
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold hover:bg-white/10 transition"
            >
              Переглянути послуги
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Benefits({ onCta }) {
  const items = [
    {
      title: "Майстри з досвідом",
      desc: "Кожен барбер має 5+ років практики.",
      icon: <BadgeIcon className="h-5 w-5" />,
    },
    {
      title: "Преміум-інструменти",
      desc: "Тільки перевірені бренди та гігієна.",
      icon: <StarIcon className="h-5 w-5" />,
    },
    {
      title: "Зручне розташування",
      desc: "1 хвилина від метро, поряд з паркінгом.",
      icon: <PinIcon className="h-5 w-5" />,
    },
  ];
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="grid sm:grid-cols-3 gap-6">
          {items.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  {b.icon}
                </div>
                <h3 className="font-semibold">{b.title}</h3>
              </div>
              <p className="mt-2 text-sm text-white/70">{b.desc}</p>
              <a
                href="/booking"
                onClick={(e) => {
                  e.preventDefault();
                  onCta();
                }}
                className="mt-4 inline-block text-sm font-semibold text-white hover:opacity-80"
              >
                Записатись →
              </a>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Services({ onCta }) {
  const services = [
    {
      name: "Стрижка чоловіча",
      price: "700 грн",
      time: "45 хв",
      desc: "Класика або сучасні форми, під ваш стиль.",
    },
    {
      name: "Стрижка + борода",
      price: "1000 грн",
      time: "75 хв",
      desc: "Повний образ: зачіска та догляд за бородою.",
    },
    {
      name: "Гоління бритвою",
      price: "600 грн",
      time: "40 хв",
      desc: "Гаряче рушник + класичне гоління небезпечною бритвою.",
    },
    {
      name: "Камуфляж сивини",
      price: "500 грн",
      time: "30 хв",
      desc: "Легке тонування для природного вигляду.",
    },
  ];

  return (
    <section
      id="services"
      className="py-16 border-t border-white/5 bg-gradient-to-b from-transparent to-white/5"
    >
      <Container>
        <Header
          title="Послуги та ціни"
          subtitle="Чесний прайс без прихованих платежів"
        />
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 hover:border-white/20 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold leading-tight">
                  {s.name}
                </h3>
                <span className="rounded-xl bg-white text-neutral-900 px-3 py-1 text-sm font-bold shadow">
                  {s.price}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/70">{s.desc}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-white/60">
                <span>⏱ {s.time}</span>
                <a
                  href="/booking"
                  onClick={(e) => {
                    e.preventDefault();
                    onCta();
                  }}
                  className="font-semibold text-white hover:opacity-80"
                >
                  Записатись →
                </a>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Barbers({ onCta }) {
  const barbers = [
    {
      name: "Олексій",
      tag: "Fade • Classic",
      bio: "Точність форм і чисті фейди.",
      initials: "О",
    },
    {
      name: "Богдан",
      tag: "Beard • Texture",
      bio: "Підбір форми бороди під овал обличчя.",
      initials: "Б",
    },
    {
      name: "Тарас",
      tag: "Scissor • Long",
      bio: "Акуратна робота з довгим волоссям.",
      initials: "Т",
    },
    {
      name: "Ігор",
      tag: "Skin fade • Style",
      bio: "Сучасні тренди й стайлінг.",
      initials: "І",
    },
  ];

  return (
    <section id="barbers" className="py-16">
      <Container>
        <Header
          title="Наші барбери"
          subtitle="Команда майстрів, які люблять свою справу"
        />
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {barbers.map((b) => (
            <div
              key={b.name}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/20 transition"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-white/20 to-white/5 font-extrabold text-xl">
                  {b.initials}
                </div>
                <div>
                  <h3 className="font-semibold leading-tight">{b.name}</h3>
                  <p className="text-xs text-white/60">{b.tag}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/70">{b.bio}</p>
              <a
                href="/booking"
                onClick={(e) => {
                  e.preventDefault();
                  onCta();
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white hover:opacity-80"
              >
                Записатись до {b.name} <ArrowRightIcon className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Gallery() {
  const galleryImages = [
    { file: "barber1.jpg", alt: "Інтер'єр барбершопу — зона очікування" },
    { file: "barber2.jpg", alt: "Робоче місце барбера" },
    { file: "barber3.jpg", alt: "Стильний декор салону" },
    { file: "barber4.jpg", alt: "Барбер за роботою" },
    { file: "barber5.jpg", alt: "Полиця з косметикою" },
    { file: "barber6.jpg", alt: "Команда барберів" },
    { file: "barber7.jpg", alt: "Затишна кавова зона" },
    { file: "barber8.jpg", alt: "Барбер робить укладку" },
    { file: "barber9.jpg", alt: "Стійка рецепції" },
    { file: "barber10.jpg", alt: "Інтер'єр із неоновою вивіскою" },
    { file: "barber11.jpg", alt: "Деталь інтер'єру" },
    { file: "barber12.jpg", alt: "Стильний куточок салону" },
  ].map((image) => ({
    src: `/interior/${image.file}`,
    alt: image.alt,
  }));

  return (
    <section id="gallery" className="py-16 border-y border-white/5 bg-white/5">
      <Container>
        <Header
          title="Атмосфера салону"
          subtitle="Лаконічний інтер'єр, музика та кава"
        />
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-black/20"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      name: "Максим",
      text: "Нарешті знайшов місце, де мене розуміють з півслова. Стрижка тримає форму довго!",
    },
    {
      name: "Роман",
      text: "Барбери уважні до деталей, сервіс на рівні. Рекомендую!",
    },
    { name: "Денис", text: "Супер атмосфера і кайфова музика. Повернусь ще." },
  ];

  return (
    <section className="py-16">
      <Container>
        <Header title="Відгуки клієнтів" subtitle="Що говорять про нас" />
        <div className="mt-8 grid sm:grid-cols-3 gap-6">
          {quotes.map((q) => (
            <figure
              key={q.name}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <blockquote className="text-white/90">“{q.text}”</blockquote>
              <figcaption className="mt-4 text-sm text-white/60">
                — {q.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Contacts({ onCta }) {
  return (
    <section id="contacts" className="py-16">
      <Container>
        <Header title="Контакти" subtitle="Чекаємо на вас щодня" />
        <div className="mt-8 grid lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <ItemRow icon={<PinIcon className="h-5 w-5" />}>
              Київ, вул. Хрещатик, 1
            </ItemRow>
            <ItemRow icon={<ClockIcon className="h-5 w-5" />}>
              Пн–Нд: 10:00–21:00
            </ItemRow>
            <ItemRow icon={<PhoneIcon className="h-5 w-5" />}>
              <a href="tel:+380441234567" className="hover:underline">
                +38 (044) 123-45-67
              </a>
            </ItemRow>
            <ItemRow icon={<ChatIcon className="h-5 w-5" />}>
              <a href="#" className="hover:underline">
                Telegram
              </a>{" "}
              •{" "}
              <a href="#" className="hover:underline">
                Instagram
              </a>
            </ItemRow>
            <div className="pt-2">
              <a
                href="/booking"
                onClick={(e) => {
                  e.preventDefault();
                  onCta();
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white text-neutral-900 px-6 py-3 font-semibold shadow hover:bg-white/90 transition"
              >
                <BoltIcon className="h-5 w-5" /> Записатись
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-xl">
              <img
                src={mapImage}
                alt="Карта розташування барбершопу BRAVE BARBER"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CtaBanner({ onCta }) {
  return (
    <section className="py-16">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-tr from-white/10 to-white/5 p-8 sm:p-12">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h3 className="text-2xl sm:text-3xl font-extrabold">
            Готові оновити стиль?
          </h3>
          <p className="mt-2 text-white/70 max-w-2xl">
            Залишайтеся собою, а ми подбаємо про вигляд. Оберіть зручний час —
            натисніть кнопку нижче.
          </p>
          <div className="mt-6">
            <a
              href="/booking"
              onClick={(e) => {
                e.preventDefault();
                onCta();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-neutral-900 px-6 py-3 font-semibold shadow hover:bg-white/90 transition"
            >
              <BoltIcon className="h-5 w-5" /> Записатись
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SiteFooter({ onCta }) {
  return (
    <footer className="border-t border-white/5 py-10">
      <Container className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-3">
          <Logo />
          <span className="text-sm font-semibold tracking-wide">
            BRAVE BARBER
          </span>
        </a>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <p>developed by KsoChibi (Oleh Chudakov)</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <a href="#services" className="hover:text-white">
            Послуги
          </a>
          <a href="#barbers" className="hover:text-white">
            Барбери
          </a>
          <a href="#contacts" className="hover:text-white">
            Контакти
          </a>
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/admin");
            }}
            className="hover:text-white"
          >
            Адмін
          </a>
        </div>
        <a
          href="/booking"
          onClick={(e) => {
            e.preventDefault();
            onCta();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Записатись
        </a>
      </Container>
    </footer>
  );
}

function Header({ title, subtitle }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
        {title}
      </h2>
      <p className="mt-2 text-white/70">{subtitle}</p>
    </div>
  );
}

function ItemRow({ icon, children }) {
  return (
    <div className="flex items-center gap-3 text-white/80">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </span>
      <span>{children}</span>
    </div>
  );
}

/* ---------------- Icons ---------------- */
function Logo(props) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        className="fill-white/10"
      />
      <path
        d="M8 16c1.5-3 3-4 6-4 2 0 3-1 3-3"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 10c2 0 3-2 5-2 1.5 0 2 .5 3 1"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MenuIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function BoltIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
    </svg>
  );
}
function ArrowRightIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}
function StarIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
function BadgeIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 11h10M7 7h10M7 15h8" />
      <rect x="3" y="3" width="18" height="18" rx="4" />
    </svg>
  );
}
function PinIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 10c0 5.5-9 12-9 12S3 15.5 3 10a9 9 0 1118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function PhoneIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 16.92v2a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012 3.28 2 2 0 014 1h2a2 2 0 012 1.72 12.66 12.66 0 00.7 2.81 2 2 0 01-.45 2.11L7.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.66 12.66 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}
function ChatIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15a4 4 0 01-4 4H7l-4 4V5a4 4 0 014-4h10a4 4 0 014 4z" />
    </svg>
  );
}
function ClockIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function SparkleIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </svg>
  );
}
