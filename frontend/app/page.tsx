"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Hammer,
  HandHeart,
  HeartPulse,
  Mail,
  MapPin,
  Menu,
  Phone,
  Quote,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/landing/logo"
import { Illustration } from "@/components/landing/illustration"
import { Reveal } from "@/components/landing/reveal"
import { CountUp } from "@/components/landing/count-up"
import { KafalaSplit } from "@/components/landing/kafala-split"

/**
 * The association's public face.
 *
 * Everything below the sponsorship section is copy the association will want to
 * own; the figures in IMPACT and the details in CONTACT are placeholders until
 * they are replaced with the real ones. Image slots are marked and fall back to
 * a drawn placeholder, so the page never looks broken while photos are pending.
 */
const ORG_NAME = "جمعية المنصور لكفالة اليتيم"
const ORG_TAGLINE = "AMASO"

const NAV = [
  { href: "#about", label: "من نحن" },
  { href: "#kafala", label: "الكفالة الشاملة" },
  { href: "#programs", label: "برامجنا" },
  { href: "#impact", label: "أثرنا" },
  { href: "#join", label: "كن كفيلاً" },
  { href: "#contact", label: "اتصل بنا" },
]

const PROGRAMS = [
  {
    icon: ShoppingBasket,
    title: "المعونة الشهرية",
    body: "سلة غذائية ولوازم أساسية تصل الأسرة كل شهر، تُسجَّل باسمها وتُتابَع أولاً بأول.",
    tint: "from-teal-500 to-emerald-600",
  },
  {
    icon: BookOpen,
    title: "التعليم والتمدرس",
    body: "رسوم ولوازم ودعم مدرسي، مع متابعة نقط كل تلميذ أسدساً بأسدس وتكريم المتفوقين.",
    tint: "from-cyan-500 to-blue-600",
  },
  {
    icon: HeartPulse,
    title: "الصحة",
    body: "أدوية ومصاريف علاج وتغطية صحية للأم والأبناء عند الحاجة.",
    tint: "from-rose-500 to-pink-600",
  },
  {
    icon: Hammer,
    title: "المشاريع المدرّة للدخل",
    body: "مشروع صغير يجعل الأسرة تقف على قدميها، لأن الهدف أن تستغني لا أن تعتاد.",
    tint: "from-amber-500 to-orange-600",
  },
  {
    icon: Users,
    title: "التكوين المهني",
    body: "تكوين للأم وللأبناء الكبار يفتح باب عمل قار بدل مساعدة مؤقتة.",
    tint: "from-violet-500 to-purple-600",
  },
  {
    icon: Sparkles,
    title: "التربية والترفيه",
    body: "أنشطة ورحلات ومخيمات، لأن الطفل الذي فقد أباه لم يفقد حقه في أن يكون طفلاً.",
    tint: "from-fuchsia-500 to-pink-600",
  },
]

/** Replace with the association's real figures. */
const IMPACT = [
  { value: 142, label: "أسرة مكفولة", suffix: "" },
  { value: 361, label: "يتيم ويتيمة", suffix: "" },
  { value: 24, label: "سنة من العطاء", suffix: "" },
  { value: 96, label: "نسبة التمدرس", suffix: "%" },
]

const STEPS = [
  {
    number: "١",
    title: "اختر شكل الكفالة",
    body: "كفالة شاملة لأسرة كاملة، أو مساهمة شهرية في كفالة مشتركة، أو تبرع لبرنامج بعينه.",
  },
  {
    number: "٢",
    title: "تعرَّف على أسرتك",
    body: "نعرّفك بالأسرة التي تكفلها: عدد الأيتام، أعمارهم، ومستواهم الدراسي.",
  },
  {
    number: "٣",
    title: "تابع أثر كفالتك",
    body: "كشف دوري يبيّن ما قدّمته وأين صُرف، وتقرير عن حال الأسرة ونتائج أبنائها الدراسية.",
  },
]

export default function HomePage() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // Signed-in staff are shown a way back to the dashboard rather than being
  // redirected to it: this is the association's public page, and the people
  // who maintain it have every reason to want to look at it too.
  //
  // Read after mount. localStorage does not exist while this renders on the
  // server, so deciding during render would mismatch the hydrated markup.
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    setSignedIn(Boolean(localStorage.getItem("user")))
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#fdfcfa] text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      {/* ---------------------------------------------------------------- nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85"
            : "border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3.5">
          <Link href="#top" className="flex items-center gap-3">
            <Logo className="h-11 w-11" size={88} priority plate={false} />
            <span className="leading-tight">
              <span className="block text-base font-bold text-slate-900 dark:text-white">{ORG_NAME}</span>
              <span className="block text-xs font-semibold tracking-[0.2em] text-teal-700 dark:text-teal-400" dir="ltr">
                {ORG_TAGLINE}
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-400"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="hidden text-slate-600 hover:text-teal-700 sm:inline-flex dark:text-slate-300"
              onClick={() => router.push(signedIn ? "/dashboard" : "/login")}
            >
              {signedIn ? "لوحة التحكم" : "دخول الأعضاء"}
            </Button>
            <a
              href="#join"
              className="hidden rounded-full bg-gradient-to-l from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-transform hover:scale-[1.03] sm:inline-block"
            >
              كن كفيلاً
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-slate-600 lg:hidden dark:text-slate-300"
              aria-label="القائمة"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-950">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-teal-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={() => router.push(signedIn ? "/dashboard" : "/login")}
              className="mt-1 block w-full rounded-lg px-3 py-2.5 text-right text-sm font-medium text-slate-700 hover:bg-teal-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {signedIn ? "لوحة التحكم" : "دخول الأعضاء"}
            </button>
            <a
              href="#join"
              onClick={() => setMenuOpen(false)}
              className="mt-2 block rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 px-3 py-3 text-center text-sm font-semibold text-white"
            >
              كن كفيلاً
            </a>
          </div>
        )}
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section id="top" className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        {/* drifting colour, kept behind everything and out of the a11y tree */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="blob absolute -top-24 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-teal-300/25 blur-3xl dark:bg-teal-800/20" />
          <div className="blob blob-delayed absolute top-40 left-[-12%] h-[28rem] w-[28rem] rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-800/15" />
          <div className="blob blob-slow absolute bottom-[-8rem] right-1/3 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-900/20" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
                </span>
                كفالة اليتيم — منذ أول يوم
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                <span className="block leading-[1.4]">لا نُعطي اليتيم مساعدة.</span>
                <span className="mt-2 block bg-gradient-to-l from-teal-600 via-cyan-600 to-teal-700 bg-clip-text leading-[1.4] text-transparent">
                  نُعطيه أسرةً تقف معه.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                نرافق الأرامل وأبناءهنّ في كفالة اليتيم: معونة شهرية، ومقعد في المدرسة،
                وعلاج عند الحاجة، ومشروع يجعل الأسرة تستغني يوماً ما. كل درهم مُسجَّل، وكل كفيل يعرف أين ذهب.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#join"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-amber-500 to-orange-500 px-7 py-3.5 font-semibold text-white shadow-xl shadow-orange-500/25 transition-all hover:shadow-2xl hover:shadow-orange-500/30"
                >
                  اكفل أسرة اليوم
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </a>
                <a
                  href="#kafala"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-7 py-3.5 font-semibold text-slate-700 backdrop-blur transition-colors hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                >
                  كيف تُصرف الكفالة؟
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-slate-200 pt-8 dark:border-slate-800">
                {IMPACT.slice(0, 3).map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="text-3xl font-bold text-teal-700 dark:text-teal-400">
                      <CountUp value={stat.value} suffix={stat.suffix} />
                    </dd>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* IMAGE SLOT — replace <Illustration /> with an <Image /> of the same
              aspect ratio when a photograph of the association's work exists */}
          <Reveal delay={200}>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-lg">
              <div className="absolute inset-0 rotate-3 rounded-[2.5rem] bg-gradient-to-br from-teal-500/15 to-amber-500/15" />
              <div className="relative h-full overflow-hidden rounded-[2.5rem] border border-teal-200/60 shadow-xl shadow-teal-900/5 dark:border-slate-700">
                <Illustration variant="family" className="h-full w-full" />
              </div>

              <div className="absolute -bottom-4 right-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="text-sm leading-tight">
                  <span className="block font-semibold text-slate-800 dark:text-slate-100">شفافية كاملة</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">كشف لكل كفيل</span>
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- about */}
      <section id="about" className="border-y border-slate-200/70 bg-white py-24 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2">
          <Reveal>
            {/* IMAGE SLOT — replace <Illustration /> with an <Image /> when a
                photograph exists; the quote below it stays either way */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-lg shadow-slate-900/5 dark:border-slate-700">
              <Illustration variant="learning" className="aspect-[4/3] w-full" />
              <div className="flex items-center gap-4 bg-gradient-to-l from-teal-700 to-cyan-800 p-6 text-white">
                <Quote className="h-8 w-8 shrink-0 text-amber-300" />
                <p className="text-lg font-medium leading-relaxed">
                  «أنا وكافل اليتيم في الجنة هكذا»
                  <span className="mt-1 block text-sm font-normal text-teal-100">حديث شريف</span>
                </p>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-wider text-amber-600">من نحن</span>
              <h2 className="mt-3 text-3xl font-bold leading-[1.4] tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                جمعية تعمل مع الأسرة، لا نيابةً عنها
              </h2>
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  {ORG_NAME} جمعية تُعنى بكفالة اليتيم ورعاية أسرته. نبدأ من الأم — لأنها من يبقى — فنُثبّت بيتها،
                  ونُبقي أبناءها في المدرسة، ونعالجهم حين يمرضون.
                </p>
                <p>
                  ولا نكتفي بالمساعدة الشهرية: نُموّل مشاريع صغيرة ونُكوّن الأمهات والأبناء الكبار، حتى يأتي اليوم
                  الذي لا تحتاج فيه الأسرة إلينا. ذلك هو النجاح عندنا.
                </p>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, title: "كل درهم مُسجَّل", body: "نظام محاسبي يتتبّع كل مبلغ من دخوله إلى صرفه." },
                  { icon: HandHeart, title: "الأسرة أولاً", body: "المساعدة تُقيَّد باسم الأسرة، لا تُوزَّع جزافاً." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-700 dark:bg-slate-800/40"
                  >
                    <item.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    <h3 className="mt-3 font-semibold text-slate-800 dark:text-slate-100">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.body}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ kafala */}
      <section id="kafala" className="py-24">
        <div className="mx-auto max-w-7xl px-5">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-amber-600">الكفالة الشاملة</span>
            <h2 className="mt-3 text-3xl font-bold leading-[1.4] tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              ‎800 درهم. وتعرف أين ذهب كل جزء منها.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              الكفالة الشاملة تُقسَّم على سبعة بنود بنسب ثابتة لا تتغيّر. مرّر على كل بند لتعرف ما يشمله.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-14">
            <KafalaSplit />
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- programs */}
      <section
        id="programs"
        className="border-y border-slate-200/70 bg-white py-24 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mx-auto max-w-7xl px-5">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-amber-600">برامجنا</span>
            <h2 className="mt-3 text-3xl font-bold leading-[1.4] tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              ستة مسارات تُغطّي حياة الأسرة
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map((program, index) => (
              <Reveal key={program.title} delay={index * 70}>
                <article className="group h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-2xl hover:shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-800">
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${program.tint} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    <program.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">{program.title}</h3>
                  <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">{program.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ impact */}
      <section id="impact" className="relative overflow-hidden py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="blob blob-slow absolute left-1/4 top-0 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-900/20" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-amber-600">أثرنا</span>
            <h2 className="mt-3 text-3xl font-bold leading-[1.4] tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              أرقام وراء كل واحد منها اسم
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {IMPACT.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 80}>
                <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 text-center backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
                  <p className="text-5xl font-bold tracking-tight text-transparent">
                    <span className="bg-gradient-to-br from-teal-600 to-cyan-700 bg-clip-text">
                      <CountUp value={stat.value} suffix={stat.suffix} />
                    </span>
                  </p>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- join */}
      <section id="join" className="py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 shadow-2xl">
            <div className="grid gap-12 p-10 lg:grid-cols-[1fr_1.1fr] lg:p-16">
              <Reveal>
                <span className="text-sm font-semibold uppercase tracking-wider text-amber-400">كن كفيلاً</span>
                <h2 className="mt-3 text-3xl font-bold leading-[1.4] text-white sm:text-4xl">
                  ثلاث خطوات، وتبدأ أسرة جديدة في التنفّس
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-slate-300">
                  لست مطالباً بكفالة كاملة لتبدأ. شارك بما تستطيع، وسنُخبرك تحديداً أين ذهب.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-amber-500 to-orange-500 px-7 py-3.5 font-semibold text-white shadow-xl shadow-orange-500/25 transition-transform hover:scale-[1.03]"
                  >
                    تواصل معنا
                    <ArrowLeft className="h-4 w-4" />
                  </a>
                </div>
              </Reveal>

              <div className="space-y-4">
                {STEPS.map((step, index) => (
                  <Reveal key={step.number} delay={index * 100}>
                    <div className="flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-bold text-white">
                        {step.number}
                      </span>
                      <div>
                        <h3 className="font-bold text-white">{step.title}</h3>
                        <p className="mt-1 leading-relaxed text-slate-300">{step.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- contact */}
      <section
        id="contact"
        className="border-t border-slate-200/70 bg-white py-24 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mx-auto max-w-7xl px-5">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-amber-600">اتصل بنا</span>
            <h2 className="mt-3 text-3xl font-bold leading-[1.4] tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              بابنا مفتوح — للكفيل، وللأسرة، ولمن أراد أن يعرف
            </h2>
          </Reveal>

          {/* CONTACT DETAILS — replace with the association's real ones */}
          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
            {[
              { icon: Phone, label: "الهاتف", value: "05 00 00 00 00", href: "tel:+2120500000000" },
              { icon: Mail, label: "البريد الإلكتروني", value: "contact@amaso.ma", href: "mailto:contact@amaso.ma" },
              { icon: MapPin, label: "العنوان", value: "المغرب", href: undefined },
            ].map((item) => (
              <Reveal key={item.label}>
                <a
                  href={item.href}
                  className="flex h-full flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-8 text-center transition-all hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/40"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
                    <item.icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100" dir="ltr">
                    {item.value}
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 text-center sm:flex-row sm:justify-between sm:text-right">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10" size={80} />
            <span className="leading-tight">
              <span className="block font-bold text-white">{ORG_NAME}</span>
              <span className="block text-xs tracking-[0.2em]" dir="ltr">{ORG_TAGLINE}</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#about" className="transition-colors hover:text-white">من نحن</a>
            <a href="#join" className="transition-colors hover:text-white">كن كفيلاً</a>
            <button
              onClick={() => router.push(signedIn ? "/dashboard" : "/login")}
              className="transition-colors hover:text-white"
            >
              {signedIn ? "لوحة التحكم" : "دخول الأعضاء"}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-slate-800 px-5 pt-6 text-center text-xs">
          © {new Date().getFullYear()} {ORG_NAME}. جميع الحقوق محفوظة.
        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        /* Section anchors clear the fixed header. */
        section[id] {
          scroll-margin-top: 5rem;
        }
        .blob {
          animation: drift 18s ease-in-out infinite;
        }
        .blob-delayed {
          animation-delay: -6s;
        }
        .blob-slow {
          animation-duration: 26s;
          animation-delay: -12s;
        }
        @keyframes drift {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-30px, 24px) scale(1.06);
          }
          66% {
            transform: translate(22px, -18px) scale(0.96);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
          .blob {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
