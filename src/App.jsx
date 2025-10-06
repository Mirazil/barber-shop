import React, { useEffect, useState } from "react";

// УВАГА: Це лише UI-макет лендінгу.
// Усі кнопки "Записатись" наразі показують підказку і НЕ переходять за посиланням.
// Пізніше ми підключимо реальну сторінку /booking та інтеграцію з Google Calendar.

export default function App() {
  const [toast, setToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function showToast(message = "Сторінка запису буде доступна незабаром") {
    setToast(message);
    window.clearTimeout(showToast._tid);
    showToast._tid = window.setTimeout(() => setToast(null), 2500);
  }

  function handleBookingClick(e) {
    e.preventDefault();
    showToast();
  }

  useEffect(() => {
    // Невелика анімація появи при завантаженні
    document.documentElement.classList.add("scroll-smooth");
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-white/20">
      <SiteHeader
        onCta={handleBookingClick}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main>
        <Hero onCta={handleBookingClick} />
        <Benefits onCta={handleBookingClick} />
        <Services onCta={handleBookingClick} />
        <Barbers onCta={handleBookingClick} />
        <Gallery />
        <Testimonials />
        <Contacts onCta={handleBookingClick} />
        <CtaBanner onCta={handleBookingClick} />
      </main>

      <SiteFooter onCta={handleBookingClick} />

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

function Container({ children, className = "" }) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

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
            onClick={onCta}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-neutral-900 px-4 py-2 text-sm font-semibold hover:bg-white/90 transition shadow"
          >
            <BoltIcon className="h-4 w-4" /> Записатись
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/10 p-2 hover:bg-white/5 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </Container>

      {/* Mobile menu */}
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
                onCta(e);
                setMobileMenuOpen(false);
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

function Hero({ onCta }) {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Background */}
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
              onClick={onCta}
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
                onClick={onCta}
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
                  onClick={onCta}
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
                onClick={onCta}
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
  // Проста декоративна галерея з градієнтними плитками (без зображень)
  return (
    <section id="gallery" className="py-16 border-y border-white/5 bg-white/5">
      <Container>
        <Header
          title="Атмосфера салону"
          subtitle="Лаконічний інтер'єр, музика та кава"
        />
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/10"
            />
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
                onClick={onCta}
                className="inline-flex items-center gap-2 rounded-2xl bg-white text-neutral-900 px-6 py-3 font-semibold shadow hover:bg-white/90 transition"
              >
                <BoltIcon className="h-5 w-5" /> Записатись
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            {/* Заглушка під карту */}
            <div className="aspect-[16/10] w-full rounded-xl bg-gradient-to-br from-white/15 to-white/5 grid place-items-center text-white/60 text-sm">
              Карта з'явиться пізніше
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
              onClick={onCta}
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
          <a href="#services" className="hover:text-white">
            Послуги
          </a>
          <a href="#barbers" className="hover:text-white">
            Барбери
          </a>
          <a href="#contacts" className="hover:text-white">
            Контакти
          </a>
        </div>
        <a
          href="/booking"
          onClick={onCta}
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

/* ---------------- Icons (прості SVG без залежностей) ---------------- */
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
