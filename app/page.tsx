
import {
  Sparkles,
  ArrowRight,
  Zap,
  PlayCircle,
  Activity,
  TrendingUp,
  FileJson,
  Check,
  PenTool,
  Server,
  Search,
  Cpu,
  Bot,
  ScanLine,
  UploadCloud,
  History,
  X,
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden bg-bg-dark">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-grid pointer-events-none z-0"></div>

      {/* Background Blobs */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Navigation */}
      <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 nav-island">
        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full pl-6 pr-2 py-2 flex items-center justify-between gap-12 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#E74C3C] rotate-45 rounded-sm"></div>
              <Sparkles className="relative text-white w-3 h-3" />
            </div>
            <span className="font-serif font-bold text-lg tracking-tight">
              Scoutlytics
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">
              Platform
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Live Data
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Developers
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#"
              className="text-xs font-medium text-gray-300 hover:text-white px-4 py-2 transition-colors hidden sm:block"
            >
              Log in
            </a>
            <a
              href="/analyze"
              className="bg-white text-black px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-40 pb-20 px-6">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[70vh]">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E74C3C] animate-pulse"></span>
              V2.1 NOW LIVE
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight font-serif">
              Stop <span className="text-gray-600 italic">guessing.</span>
              <br />
              Start <span className="text-[#E74C3C]">fixing.</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-lg leading-relaxed font-light">
              The gap between AEO insight and implementation is costing you
              traffic. We bridge it in{" "}
              <span className="text-white font-medium">90 seconds</span> with
              deployment-ready code.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="/analyze"
                className="bg-[#E74C3C] text-white px-8 py-4 rounded-lg text-sm font-semibold tracking-wide hover:bg-[#c0392b] transition-all hover:translate-y-[-2px] shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Run Analysis
              </a>
              <a
                href="#demo"
                className="group px-8 py-4 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <span>View Live Demo</span>
                <PlayCircle className="w-4 h-4 group-hover:text-[#E74C3C] transition-colors" />
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 font-mono pt-8">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gray-800 border border-black"></div>
                <div className="w-6 h-6 rounded-full bg-gray-700 border border-black"></div>
                <div className="w-6 h-6 rounded-full bg-gray-600 border border-black"></div>
              </div>
              <span>Trusted by 2,000+ growth teams</span>
            </div>
          </div>

          {/* Right Column: Visual */}
          <div className="relative lg:h-[600px] w-full flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E74C3C]/20 to-transparent blur-3xl rounded-full opacity-40"></div>

            <div className="relative w-full max-w-md perspective-1000">
              {/* Floating Card Behind */}
              <div className="absolute top-0 right-0 w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-6 transform translate-x-4 -translate-y-4 rotate-3 opacity-60 scale-95 z-0">
                <div className="flex gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-2 font-mono text-[10px] text-gray-600">
                  <div className="w-3/4 h-2 bg-gray-800 rounded"></div>
                  <div className="w-1/2 h-2 bg-gray-800 rounded"></div>
                  <div className="w-full h-2 bg-gray-800 rounded"></div>
                  <div className="w-2/3 h-2 bg-gray-800 rounded"></div>
                </div>
              </div>

              {/* Main Floating Card */}
              <div className="relative bg-[#111] border border-white/10 rounded-xl p-6 shadow-2xl z-10 glow-red transform transition-transform duration-500 hover:scale-[1.02]">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-red-500/10 text-[#E74C3C]">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">
                        Optimization Score
                      </div>
                      <div className="text-white font-mono font-bold">
                        92/100
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                    <TrendingUp className="w-3 h-3" /> +45%
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-800">
                        <FileJson className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white font-medium">
                          Schema Markup
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Generated automatically
                        </div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#E74C3C] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-800">
                        <PenTool className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white font-medium">
                          Content Rewrite
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Optimized for You.com
                        </div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#E74C3C] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-800">
                        <Server className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white font-medium">
                          Authority Check
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Perplexity Verified
                        </div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#E74C3C] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Processing time</span>
                  <span className="text-white font-mono">1.2s</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence Sources */}
        <section className="py-12 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-sm font-medium text-gray-500 whitespace-nowrap">
              INTELLIGENCE SOURCES
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-white rounded-full p-1">
                  <div className="w-full h-full bg-black rounded-full"></div>
                </div>
                <span className="font-bold text-white text-lg">You.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-white" />
                <span className="font-bold text-white text-lg">Google SGE</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-white" />
                <span className="font-bold text-white text-lg">Perplexity</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-white" />
                <span className="font-bold text-white text-lg">Bing Chat</span>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="py-32 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl mb-4 font-serif">
                The Automated Workflow
              </h2>
              <p className="text-gray-400 max-w-md">
                Replace your manual audit process with an intelligent engine
                that runs 24/7.
              </p>
            </div>
            <a
              href="#"
              className="text-[#E74C3C] border-b border-[#E74C3C] hover:text-white hover:border-white transition-colors pb-1 text-sm font-medium flex items-center gap-2"
            >
              See documentation <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group relative p-8 rounded-2xl bg-[#0F0F0F] border border-white/10 hover:border-[#E74C3C]/50 transition-all duration-300">
              <div className="absolute top-8 right-8 text-6xl font-serif text-white/5 group-hover:text-[#E74C3C]/10 transition-colors">
                01
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ScanLine className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-white">
                Deep Analysis
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                We scan your domain against 50+ AEO ranking factors, identifying
                exactly why competitors appear in AI answers instead of you.
              </p>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-1/3"></div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative p-8 rounded-2xl bg-[#0F0F0F] border border-white/10 hover:border-[#E74C3C]/50 transition-all duration-300">
              <div className="absolute top-8 right-8 text-6xl font-serif text-white/5 group-hover:text-[#E74C3C]/10 transition-colors">
                02
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#E74C3C]/10 text-[#E74C3C] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-white">
                Asset Generation
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Our engine automatically generates the JSON-LD schema, HTML
                structure, and content rewrites needed to capture the citation.
              </p>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#E74C3C] w-2/3"></div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative p-8 rounded-2xl bg-[#0F0F0F] border border-white/10 hover:border-[#E74C3C]/50 transition-all duration-300">
              <div className="absolute top-8 right-8 text-6xl font-serif text-white/5 group-hover:text-[#E74C3C]/10 transition-colors">
                03
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-white">
                Instant Deployment
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Push the changes directly to your CMS or hand off the generated
                brief to your dev team. Zero friction integration.
              </p>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Evolution Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#E74C3C]/5 to-transparent rounded-full blur-3xl -z-10"></div>

          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif mb-6">
                Evolution of Optimization
              </h2>
              <p className="text-gray-400 text-lg">
                The old way was built for 10 blue links. We build for the single
                answer.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Old Way */}
              <div className="p-8 rounded-2xl bg-[#0a0a0a] border border-white/5 text-gray-500 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-800"></div>
                <h3 className="text-xl font-medium mb-8 flex items-center gap-3">
                  <History className="w-5 h-5" />
                  Traditional SEO
                </h3>

                <div className="space-y-4 opacity-70 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3">
                    <X className="w-5 h-5 text-red-900" />
                    <span>Manual audit spreadsheets</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <X className="w-5 h-5 text-red-900" />
                    <span>Keyword stuffing focus</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <X className="w-5 h-5 text-red-900" />
                    <span>Weeks to implement changes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <X className="w-5 h-5 text-red-900" />
                    <span>Guesswork based on blogs</span>
                  </div>
                </div>
              </div>

              {/* New Way */}
              <div className="p-8 rounded-2xl bg-[#0F0F0F] border border-[#E74C3C]/30 relative overflow-hidden shadow-2xl shadow-red-900/10">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#E74C3C]"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#E74C3C]/10 rounded-full blur-2xl"></div>

                <h3 className="text-xl font-medium mb-8 flex items-center gap-3 text-white">
                  <Sparkles className="w-5 h-5 text-[#E74C3C]" />
                  Scoutlytics Engine
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 rounded-full bg-[#E74C3C] flex items-center justify-center text-xs">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Automated API Analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 rounded-full bg-[#E74C3C] flex items-center justify-center text-xs">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Entity &amp; Semantic Focus</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 rounded-full bg-[#E74C3C] flex items-center justify-center text-xs">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Seconds to generated code</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 rounded-full bg-[#E74C3C] flex items-center justify-center text-xs">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Data-backed Reverse Engineering</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Demo Section */}
        <section id="demo" className="py-24 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#E74C3C] font-mono text-xs uppercase tracking-widest">
              Live Simulation
            </span>
            <h2 className="text-4xl mt-2 font-serif">
              Try the engine right now
            </h2>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0c0c0c]">
            <div className="bg-[#1a1a1a] px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-gray-500 font-mono">
                scoutlytics-cli — v2.1.0
              </div>
              <div className="w-10"></div>
            </div>

            <div className="p-8 font-mono text-sm h-[400px] overflow-y-auto relative">
              <div className="text-gray-500 mb-4">
                // Enter your domain to start analysis
              </div>

              <div className="flex items-center gap-2 mb-6">
                <span className="text-[#E74C3C]">➜</span>
                <span className="text-blue-400">~</span>
                <input
                  type="text"
                  placeholder="yoursite.com"
                  className="bg-transparent border-none outline-none text-white w-full placeholder-gray-700 focus:ring-0"
                />
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-green-500">✔</span>
                  <span className="text-gray-300">Resolving DNS...</span>
                  <span className="text-gray-600">Done (0.1s)</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-500">✔</span>
                  <span className="text-gray-300">
                    Querying Perplexity API...
                  </span>
                  <span className="text-gray-600">Done (0.4s)</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-500">✔</span>
                  <span className="text-gray-300">
                    Analyzing Competitor Schema...
                  </span>
                  <span className="text-gray-600">Done (0.8s)</span>
                </div>
                <br />
                <div className="p-4 border border-white/10 bg-white/5 rounded">
                  <div className="text-[#E74C3C] font-bold mb-2">
                    CRITICAL GAP FOUND
                  </div>
                  <div className="text-gray-400">
                    Your site is missing{" "}
                    <span className="text-white">FAQPage Schema</span> which is
                    present on 3/3 top cited competitors.
                  </div>
                  <button className="mt-4 bg-[#E74C3C] hover:bg-red-600 text-white px-4 py-2 rounded text-xs transition-colors">
                    Generate Fix Code
                  </button>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 text-xs text-gray-600 animate-pulse">
                Waiting for input... <span className="cursor-blink">|</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#E74C3C]/10 to-transparent pointer-events-none"></div>
          <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
            <h2 className="text-5xl md:text-7xl font-serif mb-8 text-white">
              Dominance is a choice.
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Stop letting competitors answer questions about your brand. Take
              control of the conversation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/analyze" className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-200 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)] inline-block text-center">
                Get Started Free
              </a>
              <button className="w-full sm:w-auto px-8 py-4 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors text-lg">
                Talk to Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#020202] border-t border-white/5 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-[#E74C3C] flex items-center justify-center rounded-sm">
                <Sparkles className="text-white w-3 h-3" />
              </div>
              <span className="text-xl font-serif font-bold text-white">
                Scoutlytics
              </span>
            </div>
            <p className="text-gray-500 text-sm max-w-sm">
              The standard for Answer Engine Optimization. Helping brands secure
              their citations in the age of AI search.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-medium">Product</h4>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              Features
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              Integrations
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              Pricing
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              Changelog
            </a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-medium">Resources</h4>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              Documentation
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              API Reference
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              Community
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              Help Center
            </a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-medium">Company</h4>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              About
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              Careers
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              Legal
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-[#E74C3C] text-sm transition-colors"
            >
              Contact
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5 text-xs text-gray-600">
          <div>© 2024 Scoutlytics. All rights reserved.</div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
