import Link from 'next/link'
import { Zap, Target, TrendingUp, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-400" />
            <span className="font-bold text-lg gradient-text">Roadmap RPG</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-indigo-900/20 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 text-sm text-purple-300 mb-6">
            <Zap className="h-4 w-4" />
            AI-Powered Personal Growth System
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Level Up Your{' '}
            <span className="gradient-text">Real Life</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Transform your goals into epic quests. Our AI generates personalized weekly roadmaps,
            daily tasks, and XP rewards — turning self-improvement into an RPG you can't put down.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
            >
              Start Your Journey — Free
            </Link>
            <Link
              href="/login"
              className="glass hover:bg-white/10 text-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Goals Achieved', value: '12,400+' },
            { label: 'Tasks Completed', value: '890K+' },
            { label: 'XP Earned', value: '47M+' },
            { label: 'Active Heroes', value: '3,200+' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-black gradient-text">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Your Life, Gamified</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to stay on track, leveled up, and motivated.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: 'AI Roadmaps',
                desc: 'Gemini AI generates a custom weekly plan based on your goal, schedule, and skill level.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
              },
              {
                icon: Target,
                title: 'XP & Levels',
                desc: 'Complete tasks to earn XP across Body, Skills, Mindset, and Career categories.',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
              {
                icon: TrendingUp,
                title: 'Streak Tracking',
                desc: 'Build momentum with daily streaks. Miss a day and the streak resets — stay consistent.',
                color: 'text-green-400',
                bg: 'bg-green-500/10',
              },
              {
                icon: Shield,
                title: 'Fully Editable',
                desc: 'Regenerate your plan anytime or mark tasks complete as you progress through the weeks.',
                color: 'text-pink-400',
                bg: 'bg-pink-500/10',
              },
            ].map(f => (
              <div key={f.title} className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group">
                <div className={`${f.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 gradient-border">
          <h2 className="text-4xl font-black mb-4">Ready to Begin Your Quest?</h2>
          <p className="text-muted-foreground mb-8">
            Create your free account and let AI build your first personalized roadmap in seconds.
          </p>
          <Link
            href="/register"
            className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-purple-500/30"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-purple-400" />
          <span className="font-semibold text-foreground">Roadmap RPG</span>
        </div>
        <p>© {new Date().getFullYear()} Roadmap RPG. All rights reserved.</p>
      </footer>
    </div>
  )
}
